from rest_framework import serializers
from .models import VendorApplication, Vendor, Product, Category, SubCategory, Brand


class VendorApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorApplication
        fields = '__all__'
        read_only_fields = ['user', 'is_approved', 'created_at']


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = '__all__'
        read_only_fields = ['user', 'created_at']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['vendor', 'created_at']