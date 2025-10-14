from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

# Vendor Model
class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    shop_name = models.CharField(max_length=200)
    address = models.CharField(max_length=255)
    banner_image = models.ImageField(upload_to='vendor_banners/')
    member_status = models.CharField(max_length=50, default='Normal')  # Example: Normal, VVIP
    payment_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.shop_name


# Category, SubCategory, Brand (Basic for linking)
class Category(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name


class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    name = models.CharField(max_length=100)
    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Brand(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name


# Product Model
class Product(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products')
    title = models.CharField(max_length=200)
    description = models.TextField()
    sku = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True)
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True)
    image = models.ImageField(upload_to='product_images/')
    tags = models.CharField(max_length=255, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    reseller_mrp_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_charge_inside_dhaka = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_charge_outside_dhaka = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    vat = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    # 🆕 New Multiple Fields
    color = models.JSONField(default=list, blank=True)     # example: ["Red", "Black", "Blue"]
    size = models.JSONField(default=list, blank=True)      # example: ["S", "M", "L", "XL"]
    variant = models.JSONField(default=list, blank=True)   # example: ["4GB+64GB", "8GB+128GB"]
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
