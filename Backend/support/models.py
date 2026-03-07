from django.db import models
from django.conf import settings
from django.utils import timezone


class SupportConversation(models.Model):
    """One thread per user or guest (by email)."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_conversations",
        null=True,
        blank=True,
    )
    guest_email = models.EmailField(blank=True, default="")
    guest_name = models.CharField(max_length=150, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=[("open", "Open"), ("closed", "Closed")],
        default="open",
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        if self.user_id:
            return f"Support #{self.id} – {self.user.email}"
        return f"Support #{self.id} – {self.guest_email or 'Guest'}"


class SupportMessage(models.Model):
    SENDER_USER = "user"
    SENDER_GUEST = "guest"
    SENDER_ADMIN = "admin"
    SENDER_CHOICES = [
        (SENDER_USER, "User"),
        (SENDER_GUEST, "Guest"),
        (SENDER_ADMIN, "Admin"),
    ]
    conversation = models.ForeignKey(
        SupportConversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender_type = models.CharField(max_length=10, choices=SENDER_CHOICES)
    body = models.TextField()
    # When sender_type is admin, who replied
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="support_replies",
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Msg #{self.id} ({self.sender_type})"
