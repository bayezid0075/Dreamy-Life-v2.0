from celery import shared_task
from .services import get_uplines, distribute_commission
from users.models import User
from notifications.models import Notification
from memberships.models import Membership

@shared_task
def task_notify_uplines_on_register(user_id):
    uplines = get_uplines(user_id, max_level=10)
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return
    for up in uplines:
        Notification.objects.create(
            user=up["user"],
            title="New referral registered",
            message=f"{user.username} registered using your code (L{up['level']})."
        )

@shared_task
def task_process_membership_purchase(user_id, membership_id):
    membership = Membership.objects.get(id=membership_id)
    distribute_commission(user_id, membership)