from users.serializers import RegisterSerializer


def register_user(data):
    """
    Central registration business flow.
    Keeps validation in serializer while moving orchestration outside views.
    """
    serializer = RegisterSerializer(data=data)
    serializer.is_valid(raise_exception=True)
    return serializer.save()

