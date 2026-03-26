from rest_framework import serializers
from .models import Notification, DeviceToken


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "image",
            "link",
            "source",
            "is_read",
            "created_at",
        ]
        read_only_fields = fields


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ["token", "platform"]
        extra_kwargs = {
            "platform": {"required": False},
        }

    def validate_token(self, value):
        token = (value or "").strip()
        if not token:
            raise serializers.ValidationError("Token is required.")
        return token
