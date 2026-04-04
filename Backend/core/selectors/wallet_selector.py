from django.db.models import Sum

from users.models import User
from wallets.models import Wallet, WalletTransaction


def get_wallet_for_user(user: User) -> Wallet:
    wallet, _ = Wallet.objects.get_or_create(user=user)
    return wallet


def get_user_balance(user: User):
    wallet = get_wallet_for_user(user)
    return {
        "balance": wallet.balance,
        "reserved_balance": wallet.reserved_balance,
        "available_balance": wallet.available_balance,
    }


def get_wallet_transaction_sum(user: User):
    wallet = get_wallet_for_user(user)
    return wallet.transactions.aggregate(total=Sum("amount"))


def get_recent_wallet_transactions(user: User, limit: int = 20):
    wallet = get_wallet_for_user(user)
    return WalletTransaction.objects.filter(wallet=wallet).order_by("-created_at")[:limit]

