"""
Marketplace payments: no upfront reservation.
- When admin approves a job: debit poster's **Funds** for job budget + 5% platform fee.
- When job owner approves a submission: credit worker **Wallet** only (budget already collected at approval).
"""
from decimal import Decimal, ROUND_HALF_UP

from wallets.models import Wallet, WalletTransaction, Funds, FundsTransaction

# Fee charged on top of job budget when admin approves (5%)
JOB_APPROVAL_FEE_RATE = Decimal("0.05")


def approval_charge_total(total_budget: Decimal) -> Decimal:
    """Total debited from poster's funds when admin approves: budget + 5%."""
    return (total_budget * (Decimal("1") + JOB_APPROVAL_FEE_RATE)).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def charge_poster_on_admin_job_approve(
    user_id: int, total_budget: Decimal, job_id: int
) -> tuple[bool, str]:
    """
    Debit poster's Funds for full job budget plus 5% fee. Call inside atomic() with funds row locked.
    """
    charge = approval_charge_total(total_budget)
    Funds.objects.get_or_create(
        user_id=user_id,
        defaults={"balance": Decimal("0"), "reserved_balance": Decimal("0")},
    )
    funds = Funds.objects.select_for_update().filter(user_id=user_id).first()
    if not funds:
        return False, "Funds account not found"
    if funds.balance < charge:
        return (
            False,
            f"Insufficient funds. Approval requires ৳{charge} (job budget + 5% fee). "
            f"Current balance: ৳{funds.balance.quantize(Decimal('0.01'))}.",
        )
    funds.balance = (funds.balance - charge).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    funds.save(update_fields=["balance"])
    FundsTransaction.objects.create(
        funds=funds,
        amount=charge,
        transaction_type="debit",
        description=f"Marketplace job #{job_id} approved (job budget + 5% fee)",
    )
    return True, ""


def credit_worker_for_submission(
    worker_user_id: int,
    amount: Decimal,
    job_id: int,
    submission_id: int,
    description: str,
) -> tuple[bool, str]:
    """Credit worker wallet for an approved submission. Poster was already charged at job approval."""
    if amount <= 0:
        return False, "Invalid amount"
    Wallet.objects.get_or_create(
        user_id=worker_user_id,
        defaults={"balance": Decimal("0"), "reserved_balance": Decimal("0")},
    )
    worker_wallet = Wallet.objects.select_for_update().get(user_id=worker_user_id)
    worker_wallet.balance = (worker_wallet.balance + amount).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    worker_wallet.save(update_fields=["balance"])
    WalletTransaction.objects.create(
        wallet=worker_wallet,
        amount=amount,
        transaction_type="credit",
        description=description
        or f"Marketplace job #{job_id} submission #{submission_id} approved",
    )
    return True, ""
