from django.contrib import admin
from .models import BannerSlide


@admin.register(BannerSlide)
class BannerSlideAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "order", "is_active", "created_at"]
    list_editable = ["order", "is_active"]
    list_filter = ["is_active"]
    search_fields = ["title", "link"]
