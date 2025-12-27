from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import Product, Vendor
from .serializers import ProductSerializer, ProductCreateSerializer, VendorSerializer


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
