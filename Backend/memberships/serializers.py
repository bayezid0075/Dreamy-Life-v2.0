from rest_framework import serializers
from .models import Membership, MembershipCommission

class MembershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Membership
        fields = "__all__"

class CommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipCommission
        fields = "__all__"