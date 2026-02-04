from django.urls import path
from .superadmin_views import (
    superadmin_access,
    superadmin_overview,
    superadmin_stream,
    SuperadminUserListCreateView,
    SuperadminUserDetailView,
)

urlpatterns = [
    path("access/", superadmin_access),
    path("overview/", superadmin_overview),
    path("stream/", superadmin_stream),
    path("users/", SuperadminUserListCreateView.as_view()),
    path("users/<int:pk>/", SuperadminUserDetailView.as_view()),
]
