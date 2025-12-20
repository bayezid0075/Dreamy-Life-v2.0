from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Wallet, WalletTransaction, Funds, FundsTransaction, Points, PointsTransaction
from .serializers import (
    WalletSerializer, WalletTransactionSerializer,
    FundsSerializer, FundsTransactionSerializer,
    PointsSerializer, PointsTransactionSerializer
)
from django.db.models import Sum

# Wallet Views
class WalletView(APIView):
    """Get wallet balance and transactions for authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        wallet, created = Wallet.objects.get_or_create(user=user)
        
        # Get all transactions ordered by date
        transactions = WalletTransaction.objects.filter(wallet=wallet).order_by('-created_at')
        
        # Calculate income (credits) and expense (debits)
        income = WalletTransaction.objects.filter(
            wallet=wallet,
            transaction_type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        expense = WalletTransaction.objects.filter(
            wallet=wallet,
            transaction_type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Serialize wallet
        serializer = WalletSerializer(wallet)
        data = serializer.data
        
        # Explicitly serialize transactions to ensure they're included
        data['transactions'] = WalletTransactionSerializer(transactions, many=True).data
        
        # Add calculated fields
        data['income'] = str(income)
        data['expense'] = str(expense)
        
        return Response(data, status=status.HTTP_200_OK)

# Funds Views
class FundsView(APIView):
    """Get funds balance and transactions for authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        funds, created = Funds.objects.get_or_create(user=user)
        
        # Get all transactions ordered by date
        transactions = FundsTransaction.objects.filter(funds=funds).order_by('-created_at')
        
        # Calculate income (credits) and expense (debits)
        income = FundsTransaction.objects.filter(
            funds=funds,
            transaction_type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        expense = FundsTransaction.objects.filter(
            funds=funds,
            transaction_type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Serialize funds
        serializer = FundsSerializer(funds)
        data = serializer.data
        
        # Explicitly serialize transactions to ensure they're included
        data['transactions'] = FundsTransactionSerializer(transactions, many=True).data
        
        # Add calculated fields
        data['income'] = str(income)
        data['expense'] = str(expense)
        
        return Response(data, status=status.HTTP_200_OK)

# Points Views
class PointsView(APIView):
    """Get points balance and transactions for authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        points, created = Points.objects.get_or_create(user=user)
        
        # Get all transactions ordered by date
        transactions = PointsTransaction.objects.filter(points=points).order_by('-created_at')
        
        # Calculate income (credits) and expense (debits)
        income = PointsTransaction.objects.filter(
            points=points,
            transaction_type='credit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        expense = PointsTransaction.objects.filter(
            points=points,
            transaction_type='debit'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Serialize points
        serializer = PointsSerializer(points)
        data = serializer.data
        
        # Explicitly serialize transactions to ensure they're included
        data['transactions'] = PointsTransactionSerializer(transactions, many=True).data
        
        # Add calculated fields
        data['income'] = str(income)
        data['expense'] = str(expense)
        
        return Response(data, status=status.HTTP_200_OK)
