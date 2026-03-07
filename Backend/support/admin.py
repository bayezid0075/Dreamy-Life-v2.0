from django.contrib import admin
from .models import SupportConversation, SupportMessage


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 0
    readonly_fields = ["conversation", "sender_type", "body", "admin_user", "created_at"]
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return True


@admin.register(SupportConversation)
class SupportConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "guest_email", "guest_name", "status", "created_at", "updated_at"]
    list_filter = ["status"]
    search_fields = ["guest_email", "guest_name", "user__email"]
    inlines = [SupportMessageInline]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "conversation", "sender_type", "body_preview", "admin_user", "created_at"]
    list_filter = ["sender_type"]
    search_fields = ["body"]

    def body_preview(self, obj):
        return (obj.body or "")[:60] + ("..." if len(obj.body or "") > 60 else "")

    body_preview.short_description = "Body"
