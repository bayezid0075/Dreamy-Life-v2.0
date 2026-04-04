from notifications.models import Notification
from referral.services import get_uplines
from users.models import User


def notify_uplines_on_register_sync(user_id: int):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return

    uplines = get_uplines(user_id, max_level=10)
    for up in uplines:
        Notification.objects.create(
            user=up["user"],
            title="New referral registered",
            message=f"{user.username} registered using your code (L{up['level']}).",
            source="referral",
        )


def notify_uplines_on_register_async(user_id: int):
    """
    Prefer Celery task; fallback to sync execution if worker is unavailable.
    """
    try:
        from referral.tasks import task_notify_uplines_on_register

        task_notify_uplines_on_register.delay(user_id)
    except Exception:
        notify_uplines_on_register_sync(user_id)

