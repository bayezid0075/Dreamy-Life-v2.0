from django.db import models
from django.conf import settings
from django.utils import timezone


class Notification(models.Model):
    SOURCE_CHOICES = [
        ("system", "System"),
        ("admin", "Admin"),
        ("order", "Order"),
        ("referral", "Referral"),
        ("wallet", "Wallet"),
        ("membership", "Membership"),
        ("transaction", "Transaction"),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    image = models.URLField(max_length=500, blank=True, null=True)
    link = models.URLField(max_length=500, blank=True, null=True)
    source = models.CharField(max_length=32, choices=SOURCE_CHOICES, default="system")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]