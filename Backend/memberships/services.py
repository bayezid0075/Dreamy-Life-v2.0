from decimal import Decimal
from users.models import User, UserInfo
from wallets.models import Wallet, WalletTransaction
from .models import Membership, MembershipCommission, MembershipPurchase
from django.db import transaction


def set_user_verified_and_member_status(user: User, membership: Membership) -> None:
    """
    After successful membership purchase: set user as verified and update member_status.
    Supports upgrade: buying a new membership sets member_status to the new tier.
    """
    valid_statuses = [c[0] for c in UserInfo.MEMBER_CHOICES if c[0] != "user"]
    new_status = membership.name if membership.name in valid_statuses else "user"
    user_info, _ = UserInfo.objects.get_or_create(user=user, defaults={"member_status": "user"})
    user_info.is_verified = True
    user_info.member_status = new_status
    user_info.save(update_fields=["is_verified", "member_status"])

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
    Creates a MembershipPurchase record, distributes commissions, and marks user verified with member_status.
    Upgrade: buying a new membership updates member_status to the new tier.
    """
    membership = Membership.objects.get(id=membership_id)
    purchase = MembershipPurchase.objects.create(
        user=user,
        membership=membership,
        is_active=True,
    )
    distribute_commission(user, membership)
    set_user_verified_and_member_status(user, membership)
    return purchase