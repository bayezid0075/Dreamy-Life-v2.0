from django.urls import path
from . import views

urlpatterns = [
    # Vendor and Product Management (Protected)
    path('products/', views.ProductListCreateView.as_view(), name='product-list-create'),
    path('products/<int:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('vendors/', views.VendorListCreateView.as_view(), name='vendor-list-create'),
    path('vendors/<int:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),
    
    # Public Shop APIs (AllowAny)
    path('shop/products/', views.PublicShopProductsView.as_view(), name='public-shop-products'),
    path('shop/products/<int:pk>/', views.PublicShopProductDetailView.as_view(), name='public-shop-product-detail'),
    path('shop/categories/', views.PublicShopCategoriesView.as_view(), name='public-shop-categories'),
    path('shop/brands/', views.PublicShopBrandsView.as_view(), name='public-shop-brands'),
    path('shop/vendors/', views.PublicShopVendorsView.as_view(), name='public-shop-vendors'),
    
    # Order APIs (Authenticated)
    path('orders/', views.OrderCreateView.as_view(), name='order-create'),
    path('orders/list/', views.OrderListView.as_view(), name='order-list'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
]