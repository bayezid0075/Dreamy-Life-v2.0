from django.urls import path
from .views import (
    MembershipListView, 
    MembershipPurchaseAPI,
    CreatePaymentAPI,
    VerifyPaymentAPI,
    PaymentWebhookAPI
)

urlpatterns = [
    path("", MembershipListView.as_view(), name="membership-list"),
    path('purchase/', MembershipPurchaseAPI.as_view(), name='purchase-membership'),
    path('payment/create/', CreatePaymentAPI.as_view(), name='create-payment'),
    path('payment/verify/', VerifyPaymentAPI.as_view(), name='verify-payment'),
    path('payment/webhook/', PaymentWebhookAPI.as_view(), name='payment-webhook'),
]