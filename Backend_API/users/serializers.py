from rest_framework import serializers
from .models import User, UserInfo

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    phone_number = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    referred_by = serializers.CharField(required=True)

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
        if not UserInfo.objects.filter(own_refercode=v).exists():
            raise serializers.ValidationError("Invalid referral code")
        return v

    def create(self, validated_data):
        referral_code = validated_data.pop("referred_by")
        referred_by_user = None
        level = 0

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
    phone = serializers.CharField(required=False)  # phone number
    email = serializers.CharField(required=False)  # email
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        phone = attrs.get('phone')
        email = attrs.get('email')
        if not phone and not email:
            raise serializers.ValidationError("Either phone or email is required")
        identifier = phone or email
        if not (User.objects.filter(email=identifier).exists() or User.objects.filter(phone_number=identifier).exists()):
            raise serializers.ValidationError("Invalid identifier")
        attrs['identifier'] = identifier
        return attrs

class UserInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserInfo
        fields = "__all__"