from django.db import models
from django.utils import timezone
from django.conf import settings


class MobileRecharge(models.Model):
    """Mobile recharge request: user pays from wallet, we call third-party API."""

    STATUS_PENDING = "pending"
    STATUS_RECEIVED = "received"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_RECEIVED, "Received"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mobile_recharges",
    )
    operator = models.CharField(max_length=10)  # 3,4,5,6,7,8,9 per API
    number_type = models.CharField(max_length=10)  # 1=Prepaid, 2=Postpaid, 3=Skitto, 4=PowerLoad
    mobile_number = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    refid = models.CharField(max_length=64, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    trxid = models.CharField(max_length=128, blank=True)
    api_status = models.CharField(max_length=32, blank=True)
    api_recharge_status = models.CharField(max_length=32, blank=True)
    api_message = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.mobile_number} ৳{self.amount} ({self.refid})"
