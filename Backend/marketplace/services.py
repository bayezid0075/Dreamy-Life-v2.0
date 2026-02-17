"""
Marketplace wallet and payment logic. All operations use select_for_update and atomic transactions.
"""
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone

from wallets.models import Wallet, WalletTransaction
from .models import Job, JobSubmission


def get_available_balance(wallet: Wallet) -> Decimal:
    return (wallet.balance - wallet.reserved_balance).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def reserve_budget_for_job(user_id: int, total_budget: Decimal, job_id: int) -> tuple[bool, str]:
    """
    Reserve total_budget from user's wallet for a job. Call inside atomic block with wallet selected for update.
    Returns (success, error_message).
    """
    wallet = Wallet.objects.select_for_update().filter(user_id=user_id).first()
    if not wallet:
        return False, "Wallet not found"
    available = get_available_balance(wallet)
    if available < total_budget:
        return False, "Insufficient wallet balance. Add funds or reduce job budget."
    wallet.reserved_balance = (
        wallet.reserved_balance + total_budget
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    wallet.save(update_fields=["reserved_balance"])
    return True, ""


def release_reserved_on_job_reject(user_id: int, total_budget: Decimal) -> None:
    """Release reserved amount when admin rejects a job. No balance change."""
    wallet = Wallet.objects.select_for_update().filter(user_id=user_id).first()
    if not wallet:
        return
    wallet.reserved_balance = (
        wallet.reserved_balance - total_budget
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if wallet.reserved_balance < 0:
        wallet.reserved_balance = Decimal("0")
    wallet.save(update_fields=["reserved_balance"])


def release_payment_to_worker(
    owner_user_id: int,
    worker_user_id: int,
    amount: Decimal,
    job_id: int,
    submission_id: int,
    description: str,
) -> tuple[bool, str]:
    """
    Transfer amount from owner's wallet (from reserved) to worker's wallet. Atomic.
    - Owner: balance -= amount, reserved_balance -= amount, create debit transaction.
    - Worker: balance += amount, create credit transaction.
    Returns (success, error_message).
    """
    if amount <= 0:
        return False, "Invalid amount"
    with transaction.atomic():
        owner_wallet = (
            Wallet.objects.select_for_update().filter(user_id=owner_user_id).first()
        )
        worker_wallet = (
            Wallet.objects.select_for_update().filter(user_id=worker_user_id).first()
        )
        if not owner_wallet:
            return False, "Job owner wallet not found"
        if not worker_wallet:
            return False, "Worker wallet not found"
        if owner_wallet.reserved_balance < amount:
            return False, "Insufficient reserved balance"
        owner_wallet.balance = (
            owner_wallet.balance - amount
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        owner_wallet.reserved_balance = (
            owner_wallet.reserved_balance - amount
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        if owner_wallet.reserved_balance < 0:
            owner_wallet.reserved_balance = Decimal("0")
        owner_wallet.save(update_fields=["balance", "reserved_balance"])
        WalletTransaction.objects.create(
            wallet=owner_wallet,
            amount=amount,
            transaction_type="debit",
            description=description or f"Marketplace job #{job_id} payment to worker",
        )
        worker_wallet.balance = (
            worker_wallet.balance + amount
        ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        worker_wallet.save(update_fields=["balance"])
        WalletTransaction.objects.create(
            wallet=worker_wallet,
            amount=amount,
            transaction_type="credit",
            description=description or f"Marketplace job #{job_id} submission #{submission_id} approved",
        )
    return True, ""
