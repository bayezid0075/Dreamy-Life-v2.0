from django.contrib import admin
from .models import MobileRecharge


@admin.register(MobileRecharge)
class MobileRechargeAdmin(admin.ModelAdmin):
    list_display = ("refid", "user", "mobile_number", "operator", "amount", "status", "created_at")
    list_filter = ("status", "operator")
    search_fields = ("refid", "mobile_number", "user__email")
    readonly_fields = ("refid", "trxid", "api_status", "api_recharge_status", "api_message", "created_at")
