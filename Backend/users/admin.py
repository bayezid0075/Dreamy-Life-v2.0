from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserInfo

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'phone_number', 'email', 'referred_by', 'is_active', 'is_staff', 'created_at')
    search_fields = ('username', 'phone_number', 'email')
    ordering = ('-created_at',)
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('email', 'referred_by')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
        ('Additional Info', {'fields': ('phone_number', 'created_at', 'updated_at')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'phone_number', 'email', 'password1', 'password2'),
        }),
    )

@admin.register(UserInfo)
class UserInfoAdmin(admin.ModelAdmin):
    list_display = ('user', 'own_refercode', 'member_status', 'is_verified', 'level', 'created_at')
    search_fields = ('user__username', 'user__phone_number', 'own_refercode')
    list_filter = ('member_status', 'is_verified', 'level')
    ordering = ('-created_at',)
    readonly_fields = ('own_refercode',)