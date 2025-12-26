from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import MembershipPurchase
from users.models import UserInfo


@receiver(post_save, sender=MembershipPurchase)
def set_user_verified_on_membership_purchase(sender, instance, created, **kwargs):
    """
    When a user purchases a membership:
    - Set is_verified = True
    - Update member_status to the purchased membership name (Basic, Standard, Smart, or VVIP)
    """
    if created:
        user_info, created = UserInfo.objects.get_or_create(user=instance.user)
        # Verify user and update membership status when they purchase a membership
        user_info.is_verified = True
        user_info.member_status = instance.membership.name
        user_info.save()