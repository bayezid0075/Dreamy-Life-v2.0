from rest_framework import serializers
from .models import SupportConversation, SupportMessage


class SupportMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportMessage
        fields = ["id", "sender_type", "body", "admin_user", "created_at"]
        read_only_fields = ["id", "created_at"]


class SupportConversationSerializer(serializers.ModelSerializer):
    messages = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    user_display_name = serializers.SerializerMethodField()
    user_refer_code = serializers.SerializerMethodField()

    class Meta:
        model = SupportConversation
        fields = [
            "id",
            "user",
            "guest_email",
            "guest_name",
            "status",
            "created_at",
            "updated_at",
            "messages",
            "last_message",
            "user_display_name",
            "user_refer_code",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_messages(self, obj):
        qs = obj.messages.order_by("created_at")
        return SupportMessageSerializer(qs, many=True).data

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if last:
            return {"body": last.body[:80], "created_at": last.created_at, "sender_type": last.sender_type}
        return None

    def get_user_display_name(self, obj):
        if not obj.user_id:
            return None
        return getattr(obj.user, "username", None) or getattr(obj.user, "email", None) or str(obj.user_id)

    def get_user_refer_code(self, obj):
        if not obj.user_id:
            return None
        try:
            info = getattr(obj.user, "info", None)
            return info.own_refercode if info else None
        except Exception:
            return None
