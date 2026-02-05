from django.urls import path
from .superadmin_views import (
    superadmin_access,
    superadmin_overview,
    superadmin_stream,
    superadmin_restriction_config,
    SuperadminUserListCreateView,
    SuperadminUserDetailView,
)
from wallets.views import SuperadminWithdrawalListView, SuperadminWithdrawalActionView

urlpatterns = [
    path("access/", superadmin_access),
    path("overview/", superadmin_overview),
    path("stream/", superadmin_stream),
    path("settings/restrictions/", superadmin_restriction_config),
    path("users/", SuperadminUserListCreateView.as_view()),
    path("users/<int:pk>/", SuperadminUserDetailView.as_view()),
    path("withdrawals/", SuperadminWithdrawalListView.as_view()),
    path("withdrawals/<int:pk>/", SuperadminWithdrawalActionView.as_view()),
]
