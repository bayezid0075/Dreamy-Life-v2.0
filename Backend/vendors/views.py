from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q, Prefetch
from django.utils import timezone
from decimal import Decimal
import secrets
from .models import Product, Vendor, Category, Brand, Order, OrderItem
from .serializers import (
    ProductSerializer, ProductCreateSerializer, VendorSerializer,
    PublicProductSerializer, PublicVendorSerializer,
    OrderSerializer, OrderCreateSerializer
)


class IsAdminUser(permissions.BasePermission):
    """Permission class to check if user is admin (staff or superuser)"""
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.is_superuser)


class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ProductCreateSerializer
        return ProductSerializer

    def get_queryset(self):
        """Regular users see only their products, admins see all"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin can see all products
            return Product.objects.all().select_related('vendor', 'vendor__user')
        else:
            # Regular user sees only their own products
            try:
                vendor = user.vendor
                return Product.objects.filter(vendor=vendor).select_related('vendor', 'vendor__user')
            except Vendor.DoesNotExist:
                return Product.objects.none()

    def perform_create(self, serializer):
        """Only allow creating products for own vendor"""
        user = self.request.user
        try:
            vendor = user.vendor
            serializer.save(vendor=vendor)
        except Vendor.DoesNotExist:
            raise PermissionDenied("You must have a vendor profile to create products")


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Regular users can only access their own products, admins can access all"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Product.objects.all().select_related('vendor', 'vendor__user')
        else:
            try:
                vendor = user.vendor
                return Product.objects.filter(vendor=vendor).select_related('vendor', 'vendor__user')
            except Vendor.DoesNotExist:
                return Product.objects.none()

    def perform_update(self, serializer):
        serializer.save()


class VendorListCreateView(generics.ListCreateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Regular users see only their vendor, admins see all vendors"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            # Admin can see all vendors
            return Vendor.objects.all().select_related('user').prefetch_related('products')
        else:
            # Regular user sees only their own vendor
            return Vendor.objects.filter(user=user).select_related('user').prefetch_related('products')

    def perform_create(self, serializer):
        """Users can only create their own vendor"""
        user = self.request.user
        
        # Check if user already has a vendor
        if Vendor.objects.filter(user=user).exists():
            raise ValidationError({"detail": "You already have a vendor profile"})
        
        serializer.save(user=user)


class VendorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Regular users can only access their own vendor, admins can access all"""
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Vendor.objects.all().select_related('user').prefetch_related('products')
        else:
            return Vendor.objects.filter(user=user).select_related('user').prefetch_related('products')

    def perform_update(self, serializer):
        """Regular users can only update their own vendor"""
        user = self.request.user
        vendor = self.get_object()
        
        # Check if user owns this vendor or is admin
        if not (user.is_staff or user.is_superuser) and vendor.user != user:
            raise PermissionDenied("You can only edit your own vendor profile")
        
        serializer.save()

    def perform_destroy(self, instance):
        """Regular users can only delete their own vendor"""
        user = self.request.user
        
        # Check if user owns this vendor or is admin
        if not (user.is_staff or user.is_superuser) and instance.user != user:
            raise PermissionDenied("You can only delete your own vendor profile")
        
        instance.delete()


# --------------------- PUBLIC SHOP VIEWS ------------------------
class PublicShopProductsView(APIView):
    """Public API to get all products from all vendors for reselling shop"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        # Get query parameters
        search = request.query_params.get('search', '')
        category_id = request.query_params.get('category', None)
        brand_id = request.query_params.get('brand', None)
        vendor_id = request.query_params.get('vendor', None)
        min_price = request.query_params.get('min_price', None)
        max_price = request.query_params.get('max_price', None)
        sort_by = request.query_params.get('sort_by', 'created_at')  # created_at, price_asc, price_desc, name
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        # Start with all products
        queryset = Product.objects.select_related(
            'vendor', 'vendor__user', 'category', 'brand'
        ).prefetch_related(
            'images', 'sub_categories'
        ).all()
        
        # Apply filters
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(sku__icontains=search) |
                Q(tags__icontains=search)
            )
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        if brand_id:
            queryset = queryset.filter(brand_id=brand_id)
        
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        if min_price:
            queryset = queryset.filter(price__gte=Decimal(min_price))
        
        if max_price:
            queryset = queryset.filter(price__lte=Decimal(max_price))
        
        # Apply sorting
        if sort_by == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort_by == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort_by == 'name':
            queryset = queryset.order_by('title')
        else:
            queryset = queryset.order_by('-created_at')
        
        # Pagination
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        products = queryset[start:end]
        
        serializer = PublicProductSerializer(products, many=True)
        
        return Response({
            'results': serializer.data,
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        })


class PublicShopProductDetailView(APIView):
    """Public API to get single product details"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, pk):
        try:
            product = Product.objects.select_related(
                'vendor', 'vendor__user', 'category', 'brand'
            ).prefetch_related(
                'images', 'sub_categories'
            ).get(pk=pk)
            
            serializer = PublicProductSerializer(product)
            return Response(serializer.data)
        except Product.DoesNotExist:
            return Response(
                {'detail': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class PublicShopCategoriesView(APIView):
    """Public API to get all categories"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        categories = Category.objects.prefetch_related('subcategories').all()
        data = []
        for cat in categories:
            data.append({
                'id': cat.id,
                'name': cat.name,
                'subcategories': [
                    {'id': sub.id, 'name': sub.name}
                    for sub in cat.subcategories.all()
                ]
            })
        return Response(data)


class PublicShopBrandsView(APIView):
    """Public API to get all brands"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        brands = Brand.objects.all()
        data = [{'id': b.id, 'name': b.name} for b in brands]
        return Response(data)


class PublicShopVendorsView(APIView):
    """Public API to get all vendors"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        vendors = Vendor.objects.select_related('user').prefetch_related('products').all()
        serializer = PublicVendorSerializer(vendors, many=True)
        return Response(serializer.data)


# --------------------- ORDER VIEWS ------------------------
class OrderCreateView(APIView):
    """Create a new order with reseller pricing"""
    permission_classes = [permissions.IsAuthenticated]
    
    def generate_order_number(self):
        """Generate unique order number"""
        while True:
            order_num = f"ORD-{timezone.now().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"
            if not Order.objects.filter(order_number=order_num).exists():
                return order_num
    
    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        apply_reseller_price = data.get('apply_reseller_price', False)
        
        # Calculate order totals
        subtotal = Decimal('0')
        delivery_charge = Decimal('0')
        vat_amount = Decimal('0')
        reseller_price_total = Decimal('0')
        
        order_items_data = []
        
        for item_data in data['items']:
            try:
                product = Product.objects.select_related('vendor', 'category').get(
                    id=item_data['product_id']
                )
            except Product.DoesNotExist:
                return Response(
                    {'detail': f"Product with id {item_data['product_id']} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            quantity = int(item_data['quantity'])
            
            # Determine unit price
            if apply_reseller_price and item_data.get('reseller_price'):
                # Use provided reseller price
                unit_price = Decimal(str(item_data['reseller_price']))
                reseller_unit_price = unit_price
            elif apply_reseller_price and product.reseller_mrp_price:
                # Use product's reseller MRP price
                unit_price = product.reseller_mrp_price
                reseller_unit_price = unit_price
            else:
                # Use regular price (discount_price if available, else price)
                unit_price = product.discount_price if product.discount_price else product.price
                reseller_unit_price = None
            
            item_subtotal = unit_price * quantity
            
            # Calculate VAT for this item
            item_vat = (item_subtotal * product.vat) / 100
            
            subtotal += item_subtotal
            vat_amount += item_vat
            
            if reseller_unit_price:
                reseller_price_total += reseller_unit_price * quantity
            
            order_items_data.append({
                'product': product,
                'quantity': quantity,
                'unit_price': product.price,  # Original price
                'reseller_unit_price': reseller_unit_price,
                'subtotal': item_subtotal
            })
        
        # Calculate delivery charge
        delivery_area = data['delivery_area']
        for item_data in data['items']:
            product = Product.objects.get(id=item_data['product_id'])
            if delivery_area == 'inside_dhaka' and product.delivery_charge_inside_dhaka:
                delivery_charge += product.delivery_charge_inside_dhaka
            elif delivery_area == 'outside_dhaka' and product.delivery_charge_outside_dhaka:
                delivery_charge += product.delivery_charge_outside_dhaka
        
        total_amount = subtotal + delivery_charge + vat_amount
        
        # Create order
        order = Order.objects.create(
            user=request.user,
            order_number=self.generate_order_number(),
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data['customer_phone'],
            delivery_address=data['delivery_address'],
            delivery_area=delivery_area,
            subtotal=subtotal,
            delivery_charge=delivery_charge,
            vat_amount=vat_amount,
            total_amount=total_amount,
            reseller_price_applied=apply_reseller_price and reseller_price_total > 0,
            reseller_price_total=reseller_price_total if apply_reseller_price else None
        )
        
        # Create order items
        for item_data in order_items_data:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                unit_price=item_data['unit_price'],
                reseller_unit_price=item_data['reseller_unit_price'],
                subtotal=item_data['subtotal']
            )
        
        # Return created order
        order_serializer = OrderSerializer(order)
        return Response(order_serializer.data, status=status.HTTP_201_CREATED)


class OrderListView(APIView):
    """Get user's orders"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items', 'items__product').order_by('-created_at')
        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)


class OrderDetailView(APIView):
    """Get single order details"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        try:
            order = Order.objects.prefetch_related('items', 'items__product').get(
                pk=pk, user=request.user
            )
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response(
                {'detail': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
