"""
Account status (active, hold, ban, inactive) and area restrictions.
Superadmin configures which areas are blocked per status; this module provides checks.
"""
from .models import User, AccountRestrictionConfig, RESTRICTABLE_AREAS

STATUS_MESSAGES = {
    "active": None,
    "hold": "Your account is on hold. You cannot perform this action.",
    "ban": "Your account has been banned. You cannot perform this action.",
    "inactive": "Your account is inactive. You cannot perform this action.",
}


def get_restricted_areas(user: User) -> list:
    """Return list of area slugs that are restricted for this user (based on account_status)."""
    if not user or not hasattr(user, "account_status"):
        return []
    status = getattr(user, "account_status", "active") or "active"
    if status == "active":
        return []
    config = AccountRestrictionConfig.get_config()
    return list(config.get(status, []))


def is_area_allowed(user: User, area: str) -> bool:
    """Return True if user is allowed to use the given area."""
    if not user or not user.is_authenticated:
        return False
    restricted = get_restricted_areas(user)
    if "all" in restricted:
        return False
    return area not in restricted


def get_status_message(user: User) -> str | None:
    """Return user-facing message for current account status, or None if active."""
    status = getattr(user, "account_status", "active") or "active"
    return STATUS_MESSAGES.get(status)


def get_account_status_response(user: User) -> dict:
    """Return payload for GET /api/users/account-status/."""
    status = getattr(user, "account_status", "active") or "active"
    restricted = get_restricted_areas(user)
    return {
        "account_status": status,
        "restricted_areas": restricted,
        "message": get_status_message(user),
    }


def check_area_allowed(user, area: str):
    """
    If user is not allowed to use the area, return (Response, True) to return from view.
    Otherwise return (None, False). Usage in view:
        forbidden_response, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden_response
    """
    from rest_framework.response import Response
    from rest_framework import status
    if user and user.is_authenticated and not is_area_allowed(user, area):
        msg = get_status_message(user) or "This action is not allowed for your account."
        return Response({"detail": msg}, status=status.HTTP_403_FORBIDDEN), True
    return None, False
