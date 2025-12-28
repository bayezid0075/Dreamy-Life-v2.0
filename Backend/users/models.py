from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, username, phone_number, password=None, referred_by=None, **extra):
        if not email:
            raise ValueError("Email required")
        if not username:
            raise ValueError("Username required")
        user = self.model(email=email, username=username, phone_number=phone_number, referred_by=referred_by, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, phone_number, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, username, phone_number, password, **extra)

class User(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    referred_by = models.ForeignKey("self", null=True, blank=True, on_delete=models.SET_NULL, related_name="downlines")
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone_number"]

    objects = UserManager()

    def __str__(self):
        return self.username

import random, string

class UserInfo(models.Model):
    MEMBER_CHOICES = [("user","user"),("Basic","Basic"),("Standard","Standard"),("Smart","Smart"),("VVIP","VVIP")]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="info")
    own_refercode = models.CharField(max_length=8, unique=True, editable=False)

    level = models.IntegerField(default=0)  # level depth in referral chain
    member_status = models.CharField(max_length=20, choices=MEMBER_CHOICES, default="user")

    # profile fields
    profile_picture = models.TextField(null=True, blank=True)  # Changed to TextField to support data URLs
    is_verified = models.BooleanField(default=False)
    address = models.TextField(null=True, blank=True)
    nid_or_brid = models.CharField(max_length=100, null=True, blank=True)
    profession = models.CharField(max_length=150, null=True, blank=True)
    blood_group = models.CharField(max_length=5, null=True, blank=True)
    gender = models.CharField(max_length=10, null=True, blank=True)
    marital_status = models.CharField(max_length=20, null=True, blank=True)
    father_name = models.CharField(max_length=150, null=True, blank=True)
    mother_name = models.CharField(max_length=150, null=True, blank=True)
    working_place = models.CharField(max_length=200, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.own_refercode:
            while True:
                code = ''.join(random.choices(string.digits, k=8))
                if not UserInfo.objects.filter(own_refercode=code).exists():
                    self.own_refercode = code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.own_refercode}"

class PasswordResetToken(models.Model):
    """Model to store password reset tokens"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'used']),
        ]
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
    
    def is_valid(self):
        """Check if token is valid (not used and not expired)"""
        return not self.used and timezone.now() < self.expires_at