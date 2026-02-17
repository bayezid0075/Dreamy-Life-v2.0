from rest_framework import serializers
from .models import (
    Wallet, WalletTransaction,
    Funds, FundsTransaction,
    Points, PointsTransaction,
    WithdrawalRequest,
)

# Wallet Serializers
class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'transaction_type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)
    available_balance = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'reserved_balance', 'available_balance', 'transactions']
        read_only_fields = ['id', 'balance', 'reserved_balance', 'transactions']

    def get_available_balance(self, obj):
        return obj.balance - obj.reserved_balance

# Funds Serializers
class FundsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundsTransaction
        fields = ['id', 'amount', 'transaction_type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class FundsSerializer(serializers.ModelSerializer):
    transactions = FundsTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Funds
        fields = ['id', 'balance', 'transactions']
        read_only_fields = ['id', 'balance', 'transactions']

# Points Serializers
class PointsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointsTransaction
        fields = ['id', 'amount', 'transaction_type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class PointsSerializer(serializers.ModelSerializer):
    transactions = PointsTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Points
        fields = ['id', 'balance', 'transactions']
        read_only_fields = ['id', 'balance', 'transactions']


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    decided_by_email = serializers.CharField(source="decided_by.email", read_only=True)
    finished_by_email = serializers.CharField(source="finished_by.email", read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            "id",
            "user",
            "user_username",
            "user_email",
            "amount",
            "fee",
            "total_debit",
            "method",
            "receiver_phone",
            "status",
            "created_at",
            "updated_at",
            "decided_by",
            "decided_by_email",
            "decided_at",
            "finished_by",
            "finished_by_email",
            "finished_at",
            "admin_note",
        ]
        read_only_fields = fields


class WithdrawalCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    method = serializers.ChoiceField(choices=WithdrawalRequest.METHOD_CHOICES)
    receiver_phone = serializers.CharField(max_length=30)
