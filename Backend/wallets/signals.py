"""
Create a notification for the user whenever a Wallet, Funds, or Points transaction is created.
All such notifications use source="transaction" so they appear in the transaction category.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import WalletTransaction, FundsTransaction, PointsTransaction

try:
    from notifications.models import Notification
except ImportError:
    Notification = None


def _notify_transaction(user, account_label: str, transaction_type: str, amount: str, description: str, link: str | None = None):
    """Create a transaction notification for the user."""
    if not user or not Notification:
        return
    credit = transaction_type.lower() == "credit"
    sign = "+" if credit else "-"
    title = f"{account_label} {transaction_type.capitalize()}"
    message = f"{sign}৳{amount} — {description}" if description else f"{sign}৳{amount}"
    Notification.objects.create(
        user=user,
        title=title,
        message=message[:500],
        source="transaction",
        link=link,
    )


@receiver(post_save, sender=WalletTransaction)
def notify_wallet_transaction(sender, instance, created, **kwargs):
    if not created:
        return
    user = instance.wallet.user
    _notify_transaction(
        user=user,
        account_label="Wallet",
        transaction_type=instance.transaction_type,
        amount=str(instance.amount),
        description=instance.description or "",
        link="/wallet",
    )


@receiver(post_save, sender=FundsTransaction)
def notify_funds_transaction(sender, instance, created, **kwargs):
    if not created:
        return
    user = instance.funds.user
    _notify_transaction(
        user=user,
        account_label="Funds",
        transaction_type=instance.transaction_type,
        amount=str(instance.amount),
        description=instance.description or "",
        link="/wallet",
    )


@receiver(post_save, sender=PointsTransaction)
def notify_points_transaction(sender, instance, created, **kwargs):
    if not created:
        return
    user = instance.points.user
    _notify_transaction(
        user=user,
        account_label="Points",
        transaction_type=instance.transaction_type,
        amount=str(instance.amount),
        description=instance.description or "",
        link="/wallet",
    )
