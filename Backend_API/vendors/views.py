from rest_framework import generics, permissions
from .models import VendorApplication, Vendor, Product, Category, SubCategory, Brand
from .serializers import (
    VendorApplicationSerializer, VendorSerializer,
    ProductSerializer, CategorySerializer,
    SubCategorySerializer, BrandSerializer
)

# ---------------- Vendor Application ----------------
class VendorApplicationListCreateView(generics.ListCreateAPIView):
    queryset = VendorApplication.objects.all()
    serializer_class = VendorApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VendorApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VendorApplication.objects.all()
    serializer_class = VendorApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]


# ---------------- Vendor ----------------
class VendorListCreateView(generics.ListCreateAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VendorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]


# ---------------- Product ----------------
class ProductListCreateView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        vendor = self.request.user.vendor_profile
        serializer.save(vendor=vendor)


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]


# ---------------- Category ----------------
class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]


# ---------------- SubCategory ----------------
class SubCategoryListCreateView(generics.ListCreateAPIView):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAdminUser]


class SubCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAdminUser]


# ---------------- Brand ----------------
class BrandListCreateView(generics.ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAdminUser]


class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAdminUser]
