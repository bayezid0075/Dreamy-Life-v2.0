from rest_framework import serializers
from .models import MobileRecharge


class MobileRechargeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MobileRecharge
        fields = [
            "id",
            "operator",
            "number_type",
            "mobile_number",
            "amount",
            "refid",
            "status",
            "trxid",
            "api_status",
            "api_recharge_status",
            "api_message",
            "created_at",
        ]
        read_only_fields = fields


class MobileRechargeCreateSerializer(serializers.Serializer):
    operator = serializers.CharField(max_length=10)
    number_type = serializers.CharField(max_length=10)
    mobile_number = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=1)

    def validate_operator(self, value):
        allowed = ("3", "4", "5", "6", "7", "8", "9")
        if value not in allowed:
            raise serializers.ValidationError(
                f"Invalid operator. Use one of: {', '.join(allowed)} (Grameenphone 3/7, Banglalink 4/9, Robi 8, Airtel 6, TeleTalk 5)"
            )
        return value

    def validate_number_type(self, value):
        allowed = ("1", "2", "3", "4")
        if value not in allowed:
            raise serializers.ValidationError(
                "Invalid number type. Use 1=Prepaid, 2=Postpaid, 3=Skitto, 4=PowerLoad"
            )
        return value

    def validate_mobile_number(self, value):
        s = (value or "").strip().replace(" ", "")
        if len(s) < 10 or len(s) > 11:
            raise serializers.ValidationError("Enter a valid 11-digit mobile number (e.g. 01700000000)")
        if not s.isdigit():
            raise serializers.ValidationError("Mobile number must contain digits only.")
        return s
