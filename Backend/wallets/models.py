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