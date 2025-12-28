from rest_framework import serializers
from .models import Product, ProductImage, SubCategory, Vendor, Category, Brand, Order, OrderItem


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


# --------------------- PUBLIC SHOP SERIALIZERS ------------------------
class PublicProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image"]


class PublicProductSerializer(serializers.ModelSerializer):
    """Serializer for public shop - shows all products from all vendors"""
    images = PublicProductImageSerializer(many=True, read_only=True)
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_id = serializers.IntegerField(source='vendor.id', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    sub_categories = serializers.StringRelatedField(many=True, read_only=True)
    
    # Calculate effective price (discount_price if available, else price)
    effective_price = serializers.SerializerMethodField()
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'title', 'description', 'sku', 'images',
            'vendor_id', 'vendor_name', 'category', 'category_name',
            'sub_categories', 'brand', 'brand_name', 'tags',
            'price', 'discount_price', 'effective_price', 'discount_percentage',
            'reseller_mrp_price', 'delivery_charge_inside_dhaka',
            'delivery_charge_outside_dhaka', 'vat', 'created_at'
        ]
    
    def get_effective_price(self, obj):
        """Return discount_price if available, else price"""
        return obj.discount_price if obj.discount_price else obj.price
    
    def get_discount_percentage(self, obj):
        """Calculate discount percentage"""
        if obj.discount_price and obj.price:
            discount = ((obj.price - obj.discount_price) / obj.price) * 100
            return round(discount, 2)
        return 0


class PublicVendorSerializer(serializers.ModelSerializer):
    """Serializer for public shop - shows vendor info"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'shop_name', 'address', 'banner_image',
            'member_status', 'user_username', 'products_count'
        ]
    
    def get_products_count(self, obj):
        return obj.products.count()


# --------------------- ORDER SERIALIZERS ------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_image = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'product_title', 'product_sku', 'product_image',
            'quantity', 'unit_price', 'reseller_unit_price', 'subtotal'
        ]
    
    def get_product_image(self, obj):
        """Get first product image"""
        first_image = obj.product.images.first()
        if first_image:
            return first_image.image.url
        return None


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_username',
            'customer_name', 'customer_email', 'customer_phone',
            'delivery_address', 'delivery_area',
            'subtotal', 'delivery_charge', 'vat_amount', 'total_amount',
            'reseller_price_applied', 'reseller_price_total',
            'order_status', 'payment_status',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['order_number', 'user', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    """Serializer for creating orders"""
    items = serializers.ListField(
        child=serializers.DictField(),
        required=True,
        help_text="List of order items with product_id, quantity, and optional reseller_price"
    )
    customer_name = serializers.CharField(max_length=200, required=True)
    customer_email = serializers.EmailField(required=True)
    customer_phone = serializers.CharField(max_length=20, required=True)
    delivery_address = serializers.CharField(required=True)
    delivery_area = serializers.ChoiceField(
        choices=[('inside_dhaka', 'Inside Dhaka'), ('outside_dhaka', 'Outside Dhaka')],
        required=True
    )
    apply_reseller_price = serializers.BooleanField(default=False, required=False)
    
    def validate_items(self, value):
        """Validate order items"""
        if not value or len(value) == 0:
            raise serializers.ValidationError("Order must have at least one item")
        
        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Each item must have product_id and quantity")
            if item['quantity'] < 1:
                raise serializers.ValidationError("Quantity must be at least 1")
        
        return value