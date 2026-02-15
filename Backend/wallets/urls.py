from django.urls import path
from .views import (
    WalletView,
    FundsView,
    PointsView,
    WithdrawalCreateView,
    WithdrawalHistoryView,
    AddFundsCreatePaymentView,
    AddFundsVerifyView,
    AddFundsWebhookView,
)

urlpatterns = [
    path("", WalletView.as_view(), name="wallet"),
    path("funds/", FundsView.as_view(), name="funds"),
    path("points/", PointsView.as_view(), name="points"),
    path("funds/add/payment/create/", AddFundsCreatePaymentView.as_view(), name="add-funds-create"),
    path("funds/add/payment/verify/", AddFundsVerifyView.as_view(), name="add-funds-verify"),
    path("funds/add/webhook/", AddFundsWebhookView.as_view(), name="add-funds-webhook"),
    path("withdrawals/", WithdrawalCreateView.as_view(), name="withdrawal-create"),
    path("withdrawals/history/", WithdrawalHistoryView.as_view(), name="withdrawal-history"),
]
