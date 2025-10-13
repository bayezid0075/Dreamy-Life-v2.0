from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class VendorApplication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vendor_applications')
    payment_status = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    def save(self, *args, **kwargs):
        # যদি VVIP হয় তাহলে payment_status auto True
        user_info = getattr(self.user, 'user_info', None)
        if user_info and user_info.member_status == 'VVIP':
            self.payment_status = True

        super().save(*args, **kwargs)

        # যদি পেমেন্ট True হয় তাহলে অটো ভেন্ডর তৈরি হবে
        if self.payment_status and not Vendor.objects.filter(user=self.user).exists():
            Vendor.objects.create(
                user=self.user,
                shop_name=f"{self.user.username}'s Shop",
                address="Update your address",
            )

    def __str__(self):
        return f"{self.user.username} ({'Paid' if self.payment_status else 'Unpaid'})"


class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name = models.CharField(max_length=100)
    address = models.TextField()
    banner = models.ImageField(upload_to='vendor_banners/', blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.shop_name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    tags = models.CharField(max_length=255, blank=True, help_text="Comma separated tags")
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vat = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.title
