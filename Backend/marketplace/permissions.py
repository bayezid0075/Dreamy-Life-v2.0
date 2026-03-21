from django.conf import settings
from rest_framework import permissions


def _get_superadmin_emails():
    return getattr(settings, "SUPERADMIN_ALLOWED_EMAILS", []) or []


class IsAdminOrSuperadmin(permissions.BasePermission):
    """Allow staff/superuser or email in SUPERADMIN_ALLOWED_EMAILS (for job approve panel)."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        allowed = _get_superadmin_emails()
        email = (request.user.email or "").strip().lower()
        return bool(allowed) and bool(email) and email in allowed


class IsJobOwner(permissions.BasePermission):
    """Only job owner can edit or review submissions."""

    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "user"):
            return obj.user_id == request.user.id
        if hasattr(obj, "job"):
            return obj.job.user_id == request.user.id
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """Admin can do anything; others read-only for list/detail."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and (request.user.is_staff or request.user.is_superuser)
