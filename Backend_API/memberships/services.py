from decimal import Decimal
from users.models import User
from wallets.models import Wallet, WalletTransaction
from .models import Membership, MembershipCommission, MembershipPurchase
from django.db import transaction

@transaction.atomic
def distribute_commission(buyer: User, membership: Membership):
    """
    Distribute commission up to 10 levels.
    Commission is defined in MembershipCommission table.
    """
    commissions = membership.commissions.order_by("level")  # Level 1..10 commission list
    current_referrer = buyer.referred_by
    level = 1

    for commission_obj in commissions:
        if not current_referrer:
            break  # No more uplines available

        commission_amount = Decimal(commission_obj.commission)

        # Create wallet if not exists
        wallet, _ = Wallet.objects.get_or_create(user=current_referrer)
        wallet.balance += commission_amount
        wallet.save(update_fields=["balance"])

        # Log transaction
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=commission_amount,
            transaction_type="credit",
            description=f"Level {level} commission from {buyer.username}'s {membership.name} purchase"
        )

        # Move to next upline
        current_referrer = current_referrer.referred_by
        level += 1


@transaction.atomic
def purchase_membership(user: User, membership_id: int):
    """
    Creates a MembershipPurchase record and distributes commissions to uplines.
    """
    membership = Membership.objects.get(id=membership_id)

    # Create purchase record
    purchase = MembershipPurchase.objects.create(
        user=user,
        membership=membership,
        is_active=True
    )

    # Distribute commissions
    distribute_commission(user, membership)

    return purchase