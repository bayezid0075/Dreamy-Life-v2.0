from memberships.models import Membership
from referral.services import distribute_commission


def process_membership_commission(user_id: int, membership_id: int):
    membership = Membership.objects.get(id=membership_id)
    distribute_commission(user_id, membership)

