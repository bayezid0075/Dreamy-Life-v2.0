from rest_framework import serializers
from .models import (
    VendorApplication, Vendor, Category, SubCategory, Brand, Product
)

# Vendor application serializer
class VendorApplicationSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = VendorApplication
        fields = [
            "id","user","shop_name","address","payment_status","created_at"
        ]
        read_only_fields = ["created_at"]

# Vendor serializer - shop_name and address editable on create, only banner_image on update
class VendorSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Vendor
        fields = ["id","user","shop_name","address","banner_image","created_at"]
        read_only_fields = ["id","user","created_at"]

    def update(self, instance, validated_data):
        # only banner_image allowed
        if 'banner_image' in validated_data:
            instance.banner_image = validated_data['banner_image']
            instance.save(update_fields=['banner_image'])
            return instance
        raise serializers.ValidationError({"detail":"Only 'banner_image' can be updated."})

# Category/SubCategory/Brand serializers
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id","name"]

class SubCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategory
        fields = ["id","category","name"]

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ["id","name"]

# Product serializer - vendor set in view
class ProductSerializer(serializers.ModelSerializer):
    vendor = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Product
        fields = [
            "id","vendor","title","description","sku","category","sub_category","brand",
            "image","tags","price","discount_price","vat","created_at"
        ]
        read_only_fields = ["id","vendor","created_at"]