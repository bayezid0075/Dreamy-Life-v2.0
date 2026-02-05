from django.db import models
from django.utils import timezone
from users.models import User

class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - {self.balance}"

class WalletTransaction(models.Model):
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=[("credit","Credit"),("debit","Debit")], default="credit")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.wallet.user.username} {self.transaction_type} {self.amount}"

class Funds(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="funds")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - Funds: {self.balance}"

class FundsTransaction(models.Model):
    funds = models.ForeignKey(Funds, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=[("credit","Credit"),("debit","Debit")], default="credit")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.funds.user.username} Funds {self.transaction_type} {self.amount}"

class Points(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="points")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.user.username} - Points: {self.balance}"

class PointsTransaction(models.Model):
    points = models.ForeignKey(Points, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=[("credit","Credit"),("debit","Debit")], default="credit")
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.points.user.username} Points {self.transaction_type} {self.amount}"


class WithdrawalRequest(models.Model):
    METHOD_CHOICES = [
        ("bkash", "Bkash"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("finished", "Finished"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="withdrawal_requests")
    # Amount user wants to withdraw (excluding fee). Total debit = amount + fee.
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    fee = models.DecimalField(max_digits=12, decimal_places=2)
    total_debit = models.DecimalField(max_digits=12, decimal_places=2)

    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    receiver_phone = models.CharField(max_length=30)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    decided_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="withdrawals_decided",
    )
    decided_at = models.DateTimeField(null=True, blank=True)

    finished_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="withdrawals_finished",
    )
    finished_at = models.DateTimeField(null=True, blank=True)

    admin_note = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "created_at"]),
        ]

    def __str__(self):
        return f"Withdrawal #{self.id} {self.user.email} {self.amount} ({self.status})"