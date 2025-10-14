from django.urls import path
from . import views

urlpatterns = [
    # Vendor Application
    path('applications/', views.VendorApplicationListCreateView.as_view(), name='vendor-application-list-create'),
    path('applications/<int:pk>/', views.VendorApplicationDetailView.as_view(), name='vendor-application-detail'),

    # Vendor CRUD
    path('vendors/', views.VendorListCreateView.as_view(), name='vendor-list-create'),
    path('vendors/<int:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),

    # Product CRUD
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),

    # Category / SubCategory / Brand
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list-create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
    path('subcategories/', views.SubCategoryListCreateView.as_view(), name='subcategory-list-create'),
    path('subcategories/<int:pk>/', views.SubCategoryDetailView.as_view(), name='subcategory-detail'),
    path('brands/', views.BrandListCreateView.as_view(), name='brand-list-create'),
    path('brands/<int:pk>/', views.BrandDetailView.as_view(), name='brand-detail'),
]