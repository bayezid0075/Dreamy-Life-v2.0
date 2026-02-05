from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import (
    Wallet,
    WalletTransaction,
    Funds,
    FundsTransaction,
    Points,
    PointsTransaction,
    WithdrawalRequest,
)
from .serializers import (
    WalletSerializer, WalletTransactionSerializer,
    FundsSerializer, FundsTransactionSerializer,
    PointsSerializer, PointsTransactionSerializer,
    WithdrawalRequestSerializer, WithdrawalCreateSerializer,
)
from django.db.models import Sum
from django.db import transaction
from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone

try:
    from users.superadmin_views import IsSuperadmin
    from users.account_restriction import check_area_allowed
except Exception:
    IsSuperadmin = None
    def check_area_allowed(user, area):
        return None, False

# Wallet Views
class WalletView(APIView):
    """Get wallet balance and transactions for authenticated user"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
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
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
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
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
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


def _calc_fee(amount: Decimal) -> Decimal:
    # 5% charge
    return (amount * Decimal("0.05")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class WithdrawalCreateView(APIView):
    """
    Create a withdrawal request.
    Rules:
    - Minimum withdrawal amount: ৳300
    - Fee: 5% of amount
    - Wallet balance is reduced immediately by (amount + fee)
    - Status starts as pending
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "withdrawals")
        if is_forbidden:
            return forbidden
        serializer = WithdrawalCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount: Decimal = serializer.validated_data["amount"]
        method = serializer.validated_data["method"]
        receiver_phone = serializer.validated_data["receiver_phone"]

        if amount < Decimal("300"):
            return Response(
                {"detail": "Minimum withdrawal amount is ৳300."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fee = _calc_fee(amount)
        total_debit = (amount + fee).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        with transaction.atomic():
            wallet, _ = Wallet.objects.select_for_update().get_or_create(user=request.user)
            if wallet.balance < total_debit:
                return Response(
                    {"detail": "Insufficient wallet balance for this withdrawal (amount + 5% fee)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            wallet.balance = (wallet.balance - total_debit).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            wallet.save(update_fields=["balance"])

            WalletTransaction.objects.create(
                wallet=wallet,
                amount=total_debit,
                transaction_type="debit",
                description=f"Withdrawal request: amount ৳{amount} + fee ৳{fee} via {method} ({receiver_phone})",
            )

            wr = WithdrawalRequest.objects.create(
                user=request.user,
                amount=amount,
                fee=fee,
                total_debit=total_debit,
                method=method,
                receiver_phone=receiver_phone,
                status="pending",
            )

        return Response(WithdrawalRequestSerializer(wr).data, status=status.HTTP_201_CREATED)


class WithdrawalHistoryView(APIView):
    """List withdrawal history for the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "withdrawals")
        if is_forbidden:
            return forbidden
        qs = WithdrawalRequest.objects.filter(user=request.user).order_by("-created_at")
        return Response(WithdrawalRequestSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class SuperadminWithdrawalListView(APIView):
    """List all withdrawal requests (superadmin only)."""

    permission_classes = [permissions.IsAuthenticated, IsSuperadmin] if IsSuperadmin else [permissions.IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get("status")
        qs = WithdrawalRequest.objects.select_related("user", "decided_by", "finished_by").order_by("-created_at")
        if status_filter:
            qs = qs.filter(status=status_filter)
        return Response(WithdrawalRequestSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class SuperadminWithdrawalActionView(APIView):
    """
    Update withdrawal status (superadmin only).
    Actions:
    - accept: pending -> accepted
    - reject: pending/accepted -> rejected (refund amount+fee)
    - finish: accepted -> finished
    """

    permission_classes = [permissions.IsAuthenticated, IsSuperadmin] if IsSuperadmin else [permissions.IsAdminUser]

    def patch(self, request, pk: int):
        action = request.data.get("action")
        note = request.data.get("admin_note", "") or ""

        if action not in {"accept", "reject", "finish"}:
            return Response({"detail": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            wr = WithdrawalRequest.objects.select_for_update().select_related("user").get(pk=pk)

            if action == "accept":
                if wr.status != "pending":
                    return Response({"detail": "Only pending withdrawals can be accepted."}, status=status.HTTP_400_BAD_REQUEST)
                wr.status = "accepted"
                wr.decided_by = request.user
                wr.decided_at = timezone.now()
                wr.admin_note = note
                wr.save(update_fields=["status", "decided_by", "decided_at", "admin_note", "updated_at"])

            elif action == "reject":
                if wr.status not in {"pending", "accepted"}:
                    return Response({"detail": "Only pending/accepted withdrawals can be rejected."}, status=status.HTTP_400_BAD_REQUEST)

                wallet, _ = Wallet.objects.select_for_update().get_or_create(user=wr.user)
                wallet.balance = (wallet.balance + wr.total_debit).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                wallet.save(update_fields=["balance"])
                WalletTransaction.objects.create(
                    wallet=wallet,
                    amount=wr.total_debit,
                    transaction_type="credit",
                    description=f"Withdrawal rejected refund: ৳{wr.total_debit}",
                )

                wr.status = "rejected"
                wr.decided_by = request.user
                wr.decided_at = timezone.now()
                wr.admin_note = note
                wr.save(update_fields=["status", "decided_by", "decided_at", "admin_note", "updated_at"])

            elif action == "finish":
                if wr.status != "accepted":
                    return Response({"detail": "Only accepted withdrawals can be finished."}, status=status.HTTP_400_BAD_REQUEST)
                wr.status = "finished"
                wr.finished_by = request.user
                wr.finished_at = timezone.now()
                wr.admin_note = note or wr.admin_note
                wr.save(update_fields=["status", "finished_by", "finished_at", "admin_note", "updated_at"])

        return Response(WithdrawalRequestSerializer(wr).data, status=status.HTTP_200_OK)
