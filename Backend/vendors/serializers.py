from rest_framework import serializers
from .models import Product, ProductImage, SubCategory, Vendor, Category, Brand


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    sub_categories = serializers.PrimaryKeyRelatedField(
        queryset=SubCategory.objects.all(),
        many=True
    )

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ['vendor']


class ProductCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    sub_categories = serializers.PrimaryKeyRelatedField(
        queryset=SubCategory.objects.all(),
        many=True
    )

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ['vendor']

    def create(self, validated_data):
        images = validated_data.pop("images", [])
        sub_categories = validated_data.pop("sub_categories", [])

        product = Product.objects.create(**validated_data)
        product.sub_categories.set(sub_categories)

        # Upload multiple images
        for img in images:
            ProductImage.objects.create(product=product, image=img)

        return product


class VendorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = ["id", "user", "user_id", "user_username", "shop_name", "address", 
                  "banner_image", "member_status", "payment_status", "created_at", 
                  "products_count"]
        read_only_fields = ['user', 'created_at']
    
    def get_products_count(self, obj):
        """Get count of products for this vendor"""
        return obj.products.count()