from django.urls import path
from .views import MembershipListView, MembershipPurchaseAPI

urlpatterns = [
    path("", MembershipListView.as_view(), name="membership-list"),
    path('purchase/', MembershipPurchaseAPI.as_view(), name='purchase-membership'),
]