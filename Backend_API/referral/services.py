from users.models import User, UserInfo
from memberships.models import MembershipCommission
from wallets.models import Wallet, WalletTransaction
from notifications.models import Notification
from django.db import transaction
from decimal import Decimal

# Precomputed table model (not shown above) can be implemented; here we follow a simple traversal using UserInfo.referred_by chain.
def get_uplines(user_id, max_level=10):
    uplines = []
    try:
        user_info = UserInfo.objects.get(user__id=user_id)
    except UserInfo.DoesNotExist:
        return uplines
    current = user_info.user.referred_by
    level = 1
    while current and level <= max_level:
        uplines.append({"user": current, "level": level})
        try:
            current_info = UserInfo.objects.get(user=current)
            current = current_info.user.referred_by
        except UserInfo.DoesNotExist:
            break
        level += 1
    return uplines

def get_downlines(user_id, max_depth=10):
    # BFS up to depth
    from collections import deque
    q = deque()
    res = []
    q.append((user_id, 0))
    while q:
        uid, depth = q.popleft()
        if depth >= max_depth: continue
        children = UserInfo.objects.filter(user__referred_by__id=uid)
        for c in children:
            res.append({"user_id": c.user.id, "username": c.user.username, "level": depth+1})
            q.append((c.user.id, depth+1))
    return res

def distribute_commission(buyer_id, membership):
    """Distribute commission for a membership purchase"""
    buyer = User.objects.get(id=buyer_id)
    uplines = get_uplines(buyer_id, max_level=10)
    for up in uplines:
        user_obj = up["user"]
        lvl = up["level"]
        try:
            rule = MembershipCommission.objects.get(membership=membership, level=lvl)
        except MembershipCommission.DoesNotExist:
            continue
        amount = rule.commission
        # atomic wallet credit
        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=user_obj)
            wallet.balance = wallet.balance + Decimal(amount)
            wallet.save()
            WalletTransaction.objects.create(
                wallet=wallet,
                transaction_type="credit",
                amount=amount,
                description=f"Referral commission from {buyer.username} (L{lvl})"
            )
        Notification.objects.create(
            user=user_obj,
            title="Referral commission received",
            message=f"You earned {amount} from {buyer.username} at level {lvl}"
        )

def populate_referral_levels_for_user(user_id, parent_id):
    # This function can be used to populate precomputed levels if needed
    pass