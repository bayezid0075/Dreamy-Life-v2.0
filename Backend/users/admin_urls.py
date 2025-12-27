from django.urls import path
from .admin_views import (
    AdminUserListCreateView,
    AdminUserDetailView,
    admin_dashboard_stats
)

urlpatterns = [
    path('dashboard/stats/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('users/', AdminUserListCreateView.as_view(), name='admin-user-list-create'),
    path('users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]

