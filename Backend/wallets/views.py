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
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

try:
    from users.superadmin_views import IsSuperadmin
    from users.account_restriction import check_area_allowed
except Exception:
    IsSuperadmin = None
    def check_area_allowed(user, area):
        return None, False

try:
    from memberships.uddoktapay_service import (
        create_charge as uddoktapay_create_charge,
        verify_payment as uddoktapay_verify_payment,
    )
except ImportError:
    uddoktapay_create_charge = None
    uddoktapay_verify_payment = None

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


# --- Add Funds (payment gateway) ---

class AddFundsCreatePaymentView(APIView):
    """Create UddoktaPay charge for adding funds. POST { amount: number }."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        if not uddoktapay_create_charge:
            return Response(
                {"error": "Payment gateway not available"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        try:
            amount = Decimal(str(request.data.get("amount", 0)))
        except (TypeError, ValueError):
            return Response({"error": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)
        if amount < Decimal("10"):
            return Response(
                {"error": "Minimum amount is ৳10"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if amount > Decimal("500000"):
            return Response(
                {"error": "Maximum amount is ৳5,00,000"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = request.user
        if not user.email:
            return Response({"error": "User email is required"}, status=status.HTTP_400_BAD_REQUEST)
        api_key = getattr(settings, "UDDOKTAPAY_API_KEY", None)
        if not api_key:
            return Response(
                {"error": "Payment gateway is not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        request_scheme = request.scheme or "http"
        request_host = request.get_host()
        base_url = f"{request_scheme}://{request_host}"
        frontend_url = getattr(settings, "FRONTEND_URL", None) or (
            f"{request_scheme}://localhost:3333" if "3333" in request_host or "localhost" in request_host
            else f"{request_scheme}://{request_host.replace(':8888', ':3333')}"
        )
        redirect_base = (getattr(settings, "UDDOKTAPAY_REDIRECT_BASE_URL", None) or "").strip().rstrip("/")
        if redirect_base:
            success_url = f"{redirect_base}/wallet/funds/add/success"
            cancel_url = f"{redirect_base}/wallet/funds/add/cancel"
        else:
            success_url = f"{frontend_url}/wallet/funds/add/success"
            cancel_url = f"{frontend_url}/wallet/funds/add/cancel"
        webhook_url = f"{base_url}/api/wallets/funds/add/webhook/"
        metadata = {
            "user_id": str(user.id),
            "type": "add_funds",
            "amount": str(amount.quantize(Decimal("0.01"))),
        }
        amount_str = f"{amount:.2f}"
        cus_name = (getattr(user, "username", None) or "Customer")[:50]
        cus_email = (user.email or "")[:50]
        payment_response = uddoktapay_create_charge(
            full_name=cus_name,
            email=cus_email,
            amount=amount_str,
            metadata=metadata,
            redirect_url=success_url,
            cancel_url=cancel_url,
            webhook_url=webhook_url,
            return_type="GET",
        )
        if payment_response.get("status") is True and payment_response.get("payment_url"):
            return Response({
                "payment_url": payment_response["payment_url"],
                "message": payment_response.get("message", "Payment link created"),
            }, status=status.HTTP_200_OK)
        return Response(
            {"error": payment_response.get("message", "Failed to create payment")},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _credit_funds_for_add_funds_payment(user_id: int, amount: Decimal, invoice_id: str) -> bool:
    """Credit user's Funds and create transaction. Returns True if credited, False if already processed (idempotent)."""
    from users.models import User
    user = User.objects.get(id=user_id)
    funds, _ = Funds.objects.get_or_create(user=user)
    desc = f"Add funds - Invoice {invoice_id}"
    if FundsTransaction.objects.filter(funds=funds, description=desc).exists():
        return False
    with transaction.atomic():
        funds.balance = (funds.balance + amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        funds.save(update_fields=["balance"])
        FundsTransaction.objects.create(
            funds=funds,
            amount=amount,
            transaction_type="credit",
            description=desc,
        )
    return True


@method_decorator(csrf_exempt, name="dispatch")
class AddFundsVerifyView(APIView):
    """Verify add-funds payment by invoice_id and credit Funds. Called by frontend after redirect."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not uddoktapay_verify_payment:
            return Response({"error": "Payment gateway not available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        invoice_id = request.data.get("invoice_id")
        if not invoice_id:
            return Response({"error": "invoice_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        verify_response = uddoktapay_verify_payment(invoice_id)
        if verify_response.get("status") != "COMPLETED":
            return Response({
                "status": "failed",
                "message": verify_response.get("message", "Payment not completed"),
            }, status=status.HTTP_200_OK)
        metadata = verify_response.get("metadata") or {}
        if metadata.get("type") != "add_funds":
            return Response({"status": "failed", "message": "Invalid payment type"}, status=status.HTTP_200_OK)
        try:
            user_id = int(metadata.get("user_id", 0))
            amount = Decimal(str(metadata.get("amount", 0)))
        except (TypeError, ValueError):
            return Response({"status": "failed", "message": "Invalid metadata"}, status=status.HTTP_200_OK)
        if request.user.id != user_id:
            return Response({"status": "failed", "message": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        if amount <= 0:
            return Response({"status": "failed", "message": "Invalid amount"}, status=status.HTTP_200_OK)
        credited = _credit_funds_for_add_funds_payment(user_id, amount, invoice_id)
        return Response({
            "status": "success",
            "message": "Funds added successfully" if credited else "Funds were already added",
            "amount": str(amount),
        }, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class AddFundsWebhookView(APIView):
    """Webhook for UddoktaPay add-funds. Credits Funds on COMPLETED."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not uddoktapay_verify_payment:
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        invoice_id = request.data.get("invoice_id")
        if not invoice_id:
            return Response({"error": "invoice_id required"}, status=status.HTTP_400_BAD_REQUEST)
        verify_response = uddoktapay_verify_payment(invoice_id)
        if verify_response.get("status") != "COMPLETED":
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        metadata = verify_response.get("metadata") or {}
        if metadata.get("type") != "add_funds":
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        try:
            user_id = int(metadata.get("user_id", 0))
            amount = Decimal(str(metadata.get("amount", 0)))
        except (TypeError, ValueError):
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        if amount <= 0:
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        try:
            _credit_funds_for_add_funds_payment(user_id, amount, invoice_id)
        except Exception:
            pass
        return Response({"status": "success"}, status=status.HTTP_200_OK)


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
