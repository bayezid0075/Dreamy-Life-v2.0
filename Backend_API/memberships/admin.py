from django.contrib import admin
from .models import Membership, MembershipCommission, MembershipPurchase

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'created_at')
    search_fields = ('name',)
    ordering = ('-created_at',)

@admin.register(MembershipCommission)
class MembershipCommissionAdmin(admin.ModelAdmin):
    list_display = ('membership', 'level', 'commission')
    search_fields = ('membership__name',)
    list_filter = ('level',)
    ordering = ('membership', 'level')

@admin.register(MembershipPurchase)
class MembershipPurchaseAdmin(admin.ModelAdmin):
    list_display = ('user', 'membership', 'purchased_at', 'is_active')
    search_fields = ('user__username', 'membership__name')
    list_filter = ('is_active', 'purchased_at')
    ordering = ('-purchased_at',)
