from django.contrib import admin
from .models import Notification, DeviceToken

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'source', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    list_filter = ('is_read', 'source', 'created_at')
    ordering = ('-created_at',)


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ("user", "platform", "is_active", "last_seen_at", "created_at")
    search_fields = ("user__username", "user__email", "token")
    list_filter = ("platform", "is_active", "created_at")
    ordering = ("-last_seen_at",)