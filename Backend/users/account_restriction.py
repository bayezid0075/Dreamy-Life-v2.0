"""
Account status (active, hold, ban, inactive), verification, and member-tier restrictions.
Superadmin configures: account status blocks, unverified blocks, and allowed areas per member status.
"""
from .models import User, UserInfo, AccountRestrictionConfig, RESTRICTABLE_AREAS, MEMBER_STATUS_KEYS

STATUS_MESSAGES = {
    "active": None,
    "hold": "Your account is on hold. You cannot perform this action.",
    "ban": "Your account has been banned. You cannot perform this action.",
    "inactive": "Your account is inactive. You cannot perform this action.",
}


def _get_user_info(user: User):
    """Return UserInfo for user or None."""
    if not user or not user.is_authenticated:
        return None
    try:
        return UserInfo.objects.get(user=user)
    except UserInfo.DoesNotExist:
        return None


def get_restricted_areas(user: User) -> list:
    """
    Return list of area slugs restricted for this user:
    - Account status (hold, ban, inactive) restrictions
    - Unverified restrictions (if user is not verified)
    - Member status: areas not in allowed list for user's member_status
    """
    if not user or not user.is_authenticated:
        return list(RESTRICTABLE_AREAS)
    restricted = set()
    config = AccountRestrictionConfig.get_config()
    account_status = getattr(user, "account_status", "active") or "active"
    if account_status != "active":
        restricted.update(config.get(account_status, []))
    if "all" in restricted:
        return list(RESTRICTABLE_AREAS)
    user_info = _get_user_info(user)
    if user_info and not getattr(user_info, "is_verified", False):
        restricted.update(config.get("unverified_restricted_areas", []))
    allowed_by_member = config.get("member_status_allowed_areas", {})
    member_status = getattr(user_info, "member_status", "user") if user_info else "user"
    if member_status not in allowed_by_member:
        member_status = "user"
    allowed_areas = set(allowed_by_member.get(member_status, []))
    for area in RESTRICTABLE_AREAS:
        if area not in allowed_areas:
            restricted.add(area)
    return list(restricted)


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
    user_info = _get_user_info(user)
    return {
        "account_status": status,
        "restricted_areas": restricted,
        "message": get_status_message(user),
        "is_verified": getattr(user_info, "is_verified", False) if user_info else False,
        "member_status": getattr(user_info, "member_status", "user") if user_info else "user",
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
