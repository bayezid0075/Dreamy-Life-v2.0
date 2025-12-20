from rest_framework import serializers
from .models import (
    Wallet, WalletTransaction,
    Funds, FundsTransaction,
    Points, PointsTransaction
)

# Wallet Serializers
class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ['id', 'amount', 'transaction_type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']

class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Wallet
        fields = ['id', 'balance', 'transactions']
        read_only_fields = ['id', 'balance', 'transactions']

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
