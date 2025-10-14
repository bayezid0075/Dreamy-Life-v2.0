from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError
from .models import Vendor, Product, Category, SubCategory, Brand
from .serializers import (
    VendorSerializer, ProductSerializer,
    CategorySerializer, SubCategorySerializer, BrandSerializer
)

# Vendor CRUD
class VendorListCreateView(generics.ListCreateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        member_status = getattr(user, 'member_status', 'Normal')
        payment_status = self.request.data.get('payment_status', False)

        if member_status != 'VVIP' and not payment_status:
            raise ValidationError({"error": "Non-VVIP users must pay 700 taka to create vendor."})

        serializer.save(user=user, payment_status=payment_status)


class VendorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


# Product CRUD
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        vendor = Vendor.objects.filter(user=self.request.user).first()
        if not vendor:
            raise ValidationError({"error": "You must be a vendor to add products."})
        serializer.save(vendor=vendor)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]


# Category / SubCategory / Brand CRUD
class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer


class SubCategoryListCreateView(generics.ListCreateAPIView):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer


class SubCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer


class BrandListCreateView(generics.ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
