from django.contrib import admin
from .models import (
    Wallet, WalletTransaction,
    Funds, FundsTransaction,
    Points, PointsTransaction
)

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')
    search_fields = ('user__username', 'user__phone_number')

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('wallet', 'transaction_type', 'amount', 'description', 'created_at')
    search_fields = ('wallet__user__username', 'description')
    list_filter = ('transaction_type', 'created_at')
    ordering = ('-created_at',)

@admin.register(Funds)
class FundsAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')
    search_fields = ('user__username', 'user__phone_number')

@admin.register(FundsTransaction)
class FundsTransactionAdmin(admin.ModelAdmin):
    list_display = ('funds', 'transaction_type', 'amount', 'description', 'created_at')
    search_fields = ('funds__user__username', 'description')
    list_filter = ('transaction_type', 'created_at')
    ordering = ('-created_at',)

@admin.register(Points)
class PointsAdmin(admin.ModelAdmin):
    list_display = ('user', 'balance')
    search_fields = ('user__username', 'user__phone_number')

@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ('points', 'transaction_type', 'amount', 'description', 'created_at')
    search_fields = ('points__user__username', 'description')
    list_filter = ('transaction_type', 'created_at')
    ordering = ('-created_at',)