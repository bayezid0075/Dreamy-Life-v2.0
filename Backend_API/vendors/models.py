from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

def vendor_banner_upload_to(instance, filename):
    return f"vendor_banners/user_{instance.user.id}/{filename}"

def product_image_upload_to(instance, filename):
    return f"product_images/vendor_{instance.vendor.user.id}/{filename}"

class VendorApplication(models.Model):
    """
    User submits application to become vendor.
    If payment_status True (and verified) -> Vendor will be auto-created.
    VVIP users: payment_status auto True.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="vendor_applications")
    shop_name = models.CharField(max_length=200)
    address = models.TextField()
    payment_status = models.BooleanField(default=False)  # client-provided; server must verify
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Application(user={self.user}, paid={self.payment_status})"


class Vendor(models.Model):
    """Active vendor profile (one per user)."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="vendor_profile")
    shop_name = models.CharField(max_length=200)
    address = models.TextField()
    banner_image = models.ImageField(upload_to=vendor_banner_upload_to, null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.shop_name} ({self.user})"


class Category(models.Model):
    name = models.CharField(max_length=120, unique=True)
    def __str__(self): return self.name

class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")
    name = models.CharField(max_length=120)
    class Meta:
        unique_together = ("category", "name")
    def __str__(self): return f"{self.category.name} > {self.name}"

class Brand(models.Model):
    name = models.CharField(max_length=120, unique=True)
    def __str__(self): return self.name

class Product(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name="products")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=120, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    sub_category = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to=product_image_upload_to, null=True, blank=True)
    tags = models.CharField(max_length=300, blank=True, help_text="comma separated tags")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    vat = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.sku})"
