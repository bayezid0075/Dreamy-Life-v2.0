from django.db import models
from django.utils import timezone
from users.models import User  # ধরে নিচ্ছি এখানে User model এ referred_by আছে

class Membership(models.Model):
    name = models.CharField(max_length=50, unique=True)  # Basic, Standard, Smart, VVIP
    price = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name


class MembershipCommission(models.Model):
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE, related_name="commissions")
    level = models.PositiveSmallIntegerField()  # 1..10
    commission = models.DecimalField(max_digits=12, decimal_places=2)  # fixed amount per level

    class Meta:
        unique_together = ("membership", "level")

    def __str__(self):
        return f"{self.membership.name} - Level {self.level} : {self.commission}"


class MembershipPurchase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="membership_purchases")
    membership = models.ForeignKey(Membership, on_delete=models.CASCADE)
    purchased_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} purchased {self.membership.name}"