from django.urls import path
from . import views

urlpatterns = [
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('vendors/', views.VendorListCreateView.as_view(), name='vendor-list-create'),
    path('vendors/<int:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),
]