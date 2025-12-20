from django.urls import path
from .views import WalletView, FundsView, PointsView

urlpatterns = [
    path("", WalletView.as_view(), name="wallet"),
    path("funds/", FundsView.as_view(), name="funds"),
    path("points/", PointsView.as_view(), name="points"),
]
