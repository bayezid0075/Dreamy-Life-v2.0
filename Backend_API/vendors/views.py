from rest_framework import generics, permissions, status, serializers
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404
from .models import VendorApplication, Vendor, Product, Category, SubCategory, Brand
from .serializers import (
    VendorApplicationSerializer, VendorSerializer,
    ProductSerializer, CategorySerializer, SubCategorySerializer, BrandSerializer
)
from django.conf import settings

# ---- Mockable payment verify function ----
def verify_payment_with_provider(transaction_id: str) -> bool:
    """
    Replace this with real third-party API call.
    For testing, transaction_id == "MOCK_SUCCESS" returns True.
    """
    if not transaction_id:
        return False
    if transaction_id == "MOCK_SUCCESS":
        return True
    # TODO: do HTTP call to provider, validate status, signature, etc.
    return False

# ---------------- VendorApplication ----------------
class VendorApplicationListCreateView(generics.ListCreateAPIView):
    queryset = VendorApplication.objects.all()
    serializer_class = VendorApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return VendorApplication.objects.all()
        return VendorApplication.objects.filter(user=user)

    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user

        # if user has vendor already, prevent duplicate
        if hasattr(user, "vendor_profile"):
            raise serializers.ValidationError({"detail":"You already have a vendor profile."})

        # Determine member_status via user_info if exists
        member_status = None
        try:
            member_status = getattr(user, "user_info").member_status
        except Exception:
            member_status = None

        tx_id = self.request.data.get("transaction_id")
        incoming_payment_flag = serializer.validated_data.get("payment_status", False)

        # final payment decision
        final_payment = False
        if member_status == "VVIP":
            final_payment = True
        elif incoming_payment_flag:
            # verify via tx_id when possible
            final_payment = verify_payment_with_provider(tx_id) if tx_id else False

        app = serializer.save(user=user, payment_status=final_payment)

        # auto-create Vendor if payment ok
        if final_payment and not hasattr(user, "vendor_profile"):
            Vendor.objects.create(
                user=user,
                shop_name=app.shop_name,
                address=app.address,
                banner_image=app.banner
            )
            app.processed = True
            app.save(update_fields=["processed"])

class VendorApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VendorApplication.objects.all()
    serializer_class = VendorApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if self.request.user.is_staff or obj.user == self.request.user:
            return obj
        raise permissions.PermissionDenied("Not allowed")

# ---------------- Vendor (only banner editable) ----------------
class VendorListCreateView(generics.ListCreateAPIView):
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Vendor.objects.all() if user.is_staff else Vendor.objects.filter(user=user)

    def perform_create(self, serializer):
        # allow user to create vendor manually (same payment rules)
        user = self.request.user
        if hasattr(user, "vendor_profile"):
            raise serializers.ValidationError({"detail":"Vendor already exists"})
        # reuse the same payment logic as application - consider factoring into helper
        member_status = None
        try:
            member_status = getattr(user, "user_info").member_status
        except Exception:
            member_status = None

        tx_id = self.request.data.get("transaction_id")
        payment_flag = serializer.validated_data.get("payment_status", False)

        final_payment = True
        if member_status == "VVIP":
            final_payment = True
        elif payment_flag:
            final_payment = verify_payment_with_provider(tx_id) if tx_id else False

        vendor = serializer.save(user=user)
        if not final_payment:
            # If not paid, delete vendor and raise
            vendor.delete()
            raise serializers.ValidationError({"detail":"Payment not verified"})
        # else keep vendor (paid)
        return vendor

class VendorDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Vendor.objects.all()
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        if self.request.user.is_staff or obj.user == self.request.user:
            return obj
        raise permissions.PermissionDenied("Not allowed")

    def update(self, request, *args, **kwargs):
        # Only banner_image allowed; ensure request only contains 'banner_image' key (multipart)
        allowed_keys = {"banner_image"}
        body_keys = set(request.data.keys())
        if not body_keys.issubset(allowed_keys):
            return Response({"detail":"Only 'banner_image' can be updated."}, status=status.HTTP_400_BAD_REQUEST)
        return super().update(request, *args, **kwargs)

# ---------------- Product CRUD ----------------
class ProductListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Product.objects.all()
        vendor = getattr(user, "vendor_profile", None)
        if vendor:
            return Product.objects.filter(vendor=vendor)
        return Product.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        vendor = getattr(user, "vendor_profile", None)
        if not vendor:
            raise permissions.PermissionDenied("Only vendors can add products")
        serializer.save(vendor=vendor)

class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        # only vendor owner or admin can modify/delete
        if self.request.user.is_staff or obj.vendor.user == self.request.user:
            return obj
        raise permissions.PermissionDenied("Not allowed")

# ---------------- Category / SubCategory / Brand (admin only) ----------------
class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]

class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]

class SubCategoryListCreateView(generics.ListCreateAPIView):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAdminUser]

class SubCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SubCategory.objects.all()
    serializer_class = SubCategorySerializer
    permission_classes = [permissions.IsAdminUser]

class BrandListCreateView(generics.ListCreateAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAdminUser]

class BrandDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [permissions.IsAdminUser]
