from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MembershipPurchase
from users.models import UserInfo


@receiver(post_save, sender=MembershipPurchase)
def set_user_verified_on_membership_purchase(sender, instance, created, **kwargs):
    if created:
        user_info, created = UserInfo.objects.get_or_create(user=instance.user)
        user_info.is_verified = True
        user_info.member_status = instance.membership.name
        user_info.save()