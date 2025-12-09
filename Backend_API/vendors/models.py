from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL

class Vendor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    shop_name = models.CharField(max_length=200)
    address = models.CharField(max_length=255)
    banner_image = models.ImageField(upload_to='vendor_banners/')
    member_status = models.CharField(max_length=50, default='Normal')
    payment_status = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.shop_name


class Category(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name


class SubCategory(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="subcategories")
    name = models.CharField(max_length=100)
    def __str__(self):
        return f"{self.category.name} - {self.name}"


class Brand(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name


# --------------------- PRODUCT MODEL ------------------------
class Product(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products')

    title = models.CharField(max_length=200)
    description = models.TextField()
    sku = models.CharField(max_length=100, unique=True)

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    sub_categories = models.ManyToManyField(SubCategory, blank=True)

    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True)

    tags = models.JSONField(default=list, blank=True)   # ["hoodie","winter","fashion"]

    price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    reseller_mrp_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_charge_inside_dhaka = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    delivery_charge_outside_dhaka = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    vat = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# --------------------- PRODUCT MULTIPLE IMAGES ------------------------
class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="product_images/")

    def __str__(self):
        return f"{self.product.title} Image"
