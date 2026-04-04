from typing import Optional

from users.models import User, UserInfo


def get_user_by_id(user_id: int) -> Optional[User]:
    return User.objects.filter(id=user_id).first()


def get_user_by_identifier(identifier: str) -> Optional[User]:
    return User.objects.filter(email=identifier).first() or User.objects.filter(
        phone_number=identifier
    ).first()


def get_user_info(user: User) -> Optional[UserInfo]:
    return UserInfo.objects.filter(user=user).first()

