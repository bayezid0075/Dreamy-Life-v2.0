from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserInfo, User
from referral.services import populate_referral_levels_for_user

# @receiver(post_save, sender=UserInfo)
# def on_userinfo_created(sender, instance, created, **kwargs):
#     if created and instance.user.referred_by:
#         # populate precomputed upline levels for this user
#         populate_referral_levels_for_user(instance.user.id, instance.user.referred_by.id)