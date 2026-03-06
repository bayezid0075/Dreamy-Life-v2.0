from rest_framework import serializers
from .models import BannerSlide
from django.conf import settings


class BannerSlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BannerSlide
        fields = ["id", "title", "image", "image_url", "link", "order", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        base = getattr(settings, "BACKEND_URL", "").rstrip("/")
        return f"{base}{obj.image.url}" if base else obj.image.url


class BannerSlidePublicSerializer(serializers.ModelSerializer):
    """Minimal fields for public slider (no admin-only fields)."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = BannerSlide
        fields = ["id", "title", "image_url", "link"]

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        base = getattr(settings, "BACKEND_URL", "").rstrip("/")
        return f"{base}{obj.image.url}" if base else obj.image.url
