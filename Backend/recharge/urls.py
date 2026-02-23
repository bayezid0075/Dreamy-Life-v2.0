from django.urls import path
from .views import RechargeListView, RechargeCreateView, RechargeStatusView

urlpatterns = [
    path("", RechargeListView.as_view(), name="recharge-list"),
    path("create/", RechargeCreateView.as_view(), name="recharge-create"),
    path("status/<str:refid>/", RechargeStatusView.as_view(), name="recharge-status"),
]
