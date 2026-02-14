from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'source', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    list_filter = ('is_read', 'source', 'created_at')
    ordering = ('-created_at',)