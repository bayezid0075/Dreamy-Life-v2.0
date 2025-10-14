from django.contrib import admin
from .models import Vendor, Category, SubCategory, Brand, Product


admin.site.register(Vendor)
admin.site.register(Category)
admin.site.register(SubCategory)
admin.site.register(Brand)
admin.site.register(Product)