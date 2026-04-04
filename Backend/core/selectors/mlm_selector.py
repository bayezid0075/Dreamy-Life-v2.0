from referral.services import get_downlines, get_uplines


def get_user_uplines(user_id: int, max_level: int = 10):
    return get_uplines(user_id=user_id, max_level=max_level)


def get_user_downlines(user_id: int, max_depth: int = 10):
    return get_downlines(user_id=user_id, max_depth=max_depth)

