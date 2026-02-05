from django.urls import path
from .views import WalletView, FundsView, PointsView, WithdrawalCreateView, WithdrawalHistoryView

urlpatterns = [
    path("", WalletView.as_view(), name="wallet"),
    path("funds/", FundsView.as_view(), name="funds"),
    path("points/", PointsView.as_view(), name="points"),
    path("withdrawals/", WithdrawalCreateView.as_view(), name="withdrawal-create"),
    path("withdrawals/history/", WithdrawalHistoryView.as_view(), name="withdrawal-history"),
]
