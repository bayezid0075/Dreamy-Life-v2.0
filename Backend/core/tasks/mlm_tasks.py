from celery import shared_task

from core.services.mlm_service import process_membership_commission


@shared_task
def process_membership_commission_task(user_id: int, membership_id: int):
    process_membership_commission(user_id=user_id, membership_id=membership_id)

