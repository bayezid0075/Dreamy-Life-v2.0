from rest_framework import serializers
from .models import User, UserInfo
from memberships.models import MembershipPurchase

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    phone_number = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    referred_by = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, v):
        return v

    def validate_phone_number(self, v):
        if User.objects.filter(phone_number=v).exists():
            raise serializers.ValidationError("phone number already taken")
        return v

    def validate_email(self, v):
        if User.objects.filter(email=v).exists():
            raise serializers.ValidationError("email already taken")
        return v

    def validate_referred_by(self, v):
        # Allow empty string or None (no referral)
        if not v or (isinstance(v, str) and v.strip() == ""):
            return None
        # If referral code is provided, validate it exists
        if not UserInfo.objects.filter(own_refercode=v).exists():
            raise serializers.ValidationError("Invalid referral code")
        return v

    def create(self, validated_data):
        referral_code = validated_data.pop("referred_by", None)
        referred_by_user = None
        level = 0

        if referral_code and referral_code.strip():
            parent_info = UserInfo.objects.filter(own_refercode=referral_code).first()
            if parent_info:
                referred_by_user = parent_info.user
                level = parent_info.level + 1

        user = User.objects.create_user(
            email=validated_data["email"],
            username=validated_data["username"],
            phone_number=validated_data["phone_number"],
            password=validated_data["password"],
            referred_by=referred_by_user
        )

        # Create UserInfo with default values: member_status="user" and is_verified=False
        UserInfo.objects.create(
            user=user, 
            level=level,
            member_status="user",  # Default membership status
            is_verified=False  # Not verified by default
        )

        return user

class LoginSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False, allow_blank=True)  # phone number
    email = serializers.CharField(required=False, allow_blank=True)  # email
    password = serializers.CharField(write_only=True, required=True, allow_blank=False)

    def validate_password(self, value):
        """Validate password is not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("Password is required")
        return value.strip()

    def validate(self, attrs):
        phone = attrs.get('phone', '').strip() if attrs.get('phone') else None
        email = attrs.get('email', '').strip() if attrs.get('email') else None
        
        # Handle empty strings - treat them as None
        if phone == "":
            phone = None
        if email == "":
            email = None
        
        # Update attrs with cleaned values
        if phone is None:
            attrs.pop('phone', None)
        else:
            attrs['phone'] = phone
        if email is None:
            attrs.pop('email', None)
        else:
            attrs['email'] = email
        
        # Check if at least one identifier is provided
        if not phone and not email:
            raise serializers.ValidationError({
                'non_field_errors': ['Either phone or email is required']
            })
        
        # Set identifier for use in view (don't check if it exists here for security)
        identifier = phone or email
        attrs['identifier'] = identifier
        return attrs

class UserSerializer(serializers.ModelSerializer):
    """Basic user serializer for nested use"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'phone_number', 'is_staff', 'is_superuser']

class UserInfoSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    active_membership = serializers.SerializerMethodField()
    
    class Meta:
        model = UserInfo
        fields = "__all__"
        # is_verified and member_status are read-only - they can only be updated via membership purchase signal
        read_only_fields = ['id', 'user', 'own_refercode', 'level', 'member_status', 'is_verified', 'created_at', 'updated_at']
    
    def get_active_membership(self, obj):
        """Get the active membership purchase for the user"""
        active_purchase = MembershipPurchase.objects.filter(
            user=obj.user,
            is_active=True
        ).order_by('-purchased_at').first()
        
        if active_purchase:
            return {
                'name': active_purchase.membership.name,
                'purchased_at': active_purchase.purchased_at,
                'is_active': active_purchase.is_active
            }
        return None

class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        """Validate that email exists in the system"""
        from .models import User
        if not User.objects.filter(email=value).exists():
            # Don't reveal if email exists for security
            pass
        return value

class PasswordResetVerifySerializer(serializers.Serializer):
    """Serializer for verifying reset token"""
    token = serializers.CharField(required=True, max_length=100)

class PasswordResetSerializer(serializers.Serializer):
    """Serializer for resetting password with token"""
    token = serializers.CharField(required=True, max_length=100)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match'
            })
        return attrs
    
    def validate_new_password(self, value):
        """Validate password strength"""
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long')
        return value