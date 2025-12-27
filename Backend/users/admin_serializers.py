from rest_framework import serializers
from .models import User, UserInfo
from memberships.models import MembershipPurchase


class AdminUserInfoSerializer(serializers.ModelSerializer):
    """Admin serializer for UserInfo with all fields editable"""
    class Meta:
        model = UserInfo
        fields = "__all__"
        read_only_fields = ['id', 'user', 'own_refercode', 'level', 'created_at', 'updated_at']


class AdminUserSerializer(serializers.ModelSerializer):
    """Admin serializer for User with full control"""
    info = AdminUserInfoSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    downlines_count = serializers.SerializerMethodField()
    active_membership = serializers.SerializerMethodField()
    referred_by_username = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'phone_number', 'password',
            'is_active', 'is_staff', 'is_superuser', 'referred_by',
            'created_at', 'updated_at', 'last_login',
            'info', 'downlines_count', 'active_membership', 'referred_by_username'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_login']
    
    def get_downlines_count(self, obj):
        """Get count of direct downlines"""
        return obj.downlines.count()
    
    def get_active_membership(self, obj):
        """Get the active membership purchase for the user"""
        try:
            active_purchase = MembershipPurchase.objects.filter(
                user=obj,
                is_active=True
            ).order_by('-purchased_at').first()
            
            if active_purchase:
                return {
                    'id': active_purchase.id,
                    'name': active_purchase.membership.name,
                    'purchased_at': active_purchase.purchased_at,
                    'is_active': active_purchase.is_active
                }
        except:
            pass
        return None
    
    def get_referred_by_username(self, obj):
        """Get username of the user who referred this user"""
        if obj.referred_by:
            return obj.referred_by.username
        return None
    
    def create(self, validated_data):
        """Create user with password"""
        password = validated_data.pop('password', None)
        referred_by = validated_data.pop('referred_by', None)
        
        # Create user
        user = User.objects.create_user(
            email=validated_data.get('email'),
            username=validated_data.get('username'),
            phone_number=validated_data.get('phone_number'),
            password=password or 'defaultpassword123',  # Should be changed by user
            referred_by=referred_by,
            is_staff=validated_data.get('is_staff', False),
            is_superuser=validated_data.get('is_superuser', False),
            is_active=validated_data.get('is_active', True),
        )
        
        # Create UserInfo if it doesn't exist
        UserInfo.objects.get_or_create(user=user)
        
        return user
    
    def update(self, instance, validated_data):
        """Update user"""
        password = validated_data.pop('password', None)
        referred_by = validated_data.pop('referred_by', None)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        # Update referred_by if provided
        if referred_by is not None:
            instance.referred_by = referred_by
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update UserInfo if provided
        info_data = self.context.get('request', {}).data.get('info', {})
        if info_data:
            user_info, created = UserInfo.objects.get_or_create(user=instance)
            info_serializer = AdminUserInfoSerializer(user_info, data=info_data, partial=True)
            if info_serializer.is_valid():
                info_serializer.save()
        
        return instance


class AdminUserCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating users"""
    password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'phone_number', 'password', 'is_active', 'is_staff', 'is_superuser', 'referred_by']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        referred_by = validated_data.pop('referred_by', None)
        
        user = User.objects.create_user(
            email=validated_data.get('email'),
            username=validated_data.get('username'),
            phone_number=validated_data.get('phone_number'),
            password=password,
            referred_by=referred_by,
            is_staff=validated_data.get('is_staff', False),
            is_superuser=validated_data.get('is_superuser', False),
            is_active=validated_data.get('is_active', True),
        )
        
        # Create UserInfo
        UserInfo.objects.get_or_create(user=user)
        
        return user

