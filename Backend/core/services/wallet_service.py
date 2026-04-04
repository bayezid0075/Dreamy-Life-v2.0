from decimal import Decimal

from django.db import transaction

from users.models import User
from wallets.models import WalletTransaction

from core.selectors.wallet_selector import get_wallet_for_user


def create_transaction(user: User, amount, transaction_type: str, description: str = ""):
    amount_value = Decimal(str(amount))
    if amount_value <= 0:
        raise ValueError("amount must be greater than zero")

    with transaction.atomic():
        wallet = get_wallet_for_user(user)
        if transaction_type == "credit":
            wallet.balance = wallet.balance + amount_value
        elif transaction_type == "debit":
            if wallet.balance < amount_value:
                raise ValueError("insufficient wallet balance")
            wallet.balance = wallet.balance - amount_value
        else:
            raise ValueError("transaction_type must be credit or debit")

        wallet.save(update_fields=["balance"])

        return WalletTransaction.objects.create(
            wallet=wallet,
            amount=amount_value,
            transaction_type=transaction_type,
            description=description,
        )

