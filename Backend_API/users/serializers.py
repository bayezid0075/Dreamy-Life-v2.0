from rest_framework import serializers
from .models import User, UserInfo

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

        UserInfo.objects.create(user=user, level=level)

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

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInfo
        fields = "__all__"