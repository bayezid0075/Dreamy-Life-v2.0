from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .models import Membership, MembershipPurchase
from .serializers import MembershipSerializer
from .services import purchase_membership, distribute_commission
from .uddoktapay_service import (
    create_charge as uddoktapay_create_charge,
    verify_payment as uddoktapay_verify_payment,
)
from django.db import transaction

class MembershipListView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        plans = Membership.objects.all()
        return Response(MembershipSerializer(plans, many=True).data)

class MembershipPurchaseAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from users.account_restriction import check_area_allowed
        forbidden, is_forbidden = check_area_allowed(request.user, "membership")
        if is_forbidden:
            return forbidden
        membership_id = request.data.get("membership_id")

        if not membership_id:
            return Response({"error": "membership_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            purchase = purchase_membership(request.user, membership_id)
        except Membership.DoesNotExist:
            return Response({"error": "Membership not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "message": f"{purchase.membership.name} purchased successfully!",
            "membership": purchase.membership.name
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class CreatePaymentAPI(APIView):
    """Create payment with UddoktaPay gateway."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        from users.account_restriction import check_area_allowed
        forbidden, is_forbidden = check_area_allowed(request.user, "membership")
        if is_forbidden:
            return forbidden
        raw_id = request.data.get("membership_id")
        if raw_id is None or raw_id == "":
            return Response({"error": "membership_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            membership_id = int(raw_id)
        except (TypeError, ValueError):
            return Response({"error": "Invalid membership_id format"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            membership = Membership.objects.get(id=membership_id)
        except Membership.DoesNotExist:
            return Response({"error": "Membership not found"}, status=status.HTTP_404_NOT_FOUND)
        
        api_key = getattr(settings, "UDDOKTAPAY_API_KEY", None)
        if not api_key:
            return Response(
                {"error": "Payment gateway is not configured (UDDOKTAPAY_API_KEY missing)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        
        user = request.user
        if not user.email:
            return Response({"error": "User email is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not user.username:
            return Response({"error": "User username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        request_scheme = request.scheme or 'http'
        request_host = request.get_host()
        base_url = f"{request_scheme}://{request_host}"
        frontend_url = getattr(settings, 'FRONTEND_URL', None)
        if not frontend_url:
            if '3000' in request_host or 'localhost' in request_host:
                frontend_url = f"{request_scheme}://localhost:3000"
            else:
                frontend_url = f"{request_scheme}://{request_host.replace(':8000', ':3000')}"
        # UddoktaPay often rejects localhost redirect URLs; use public base if set (e.g. ngrok)
        redirect_base = getattr(settings, 'UDDOKTAPAY_REDIRECT_BASE_URL', None) or ""
        redirect_base = (redirect_base or "").strip().rstrip("/")
        if redirect_base:
            success_url = f"{redirect_base}/memberships/payment/success"
            cancel_url = f"{redirect_base}/memberships/payment/cancel"
        else:
            success_url = f"{frontend_url}/memberships/payment/success"
            cancel_url = f"{frontend_url}/memberships/payment/cancel"
        uddoktapay_webhook_url = f"{base_url}/api/memberships/payment/webhook/uddoktapay/"
        
        cus_name = (user.username or "Customer")[:50]
        cus_email = user.email[:50]
        from decimal import Decimal
        amount_value = Decimal(str(membership.price))
        amount_str = f"{amount_value:.2f}"
        metadata_ud = {"user_id": str(user.id), "membership_id": str(membership_id)}
        
        if len(success_url) > 100 or len(cancel_url) > 100:
            return Response({
                "error": "Success or cancel URL too long (max 100 chars)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        payment_response = uddoktapay_create_charge(
            full_name=cus_name,
            email=cus_email,
            amount=amount_str,
            metadata=metadata_ud,
            redirect_url=success_url,
            cancel_url=cancel_url,
            webhook_url=uddoktapay_webhook_url,
            return_type="GET",
        )
        if payment_response.get("status") is True and payment_response.get("payment_url"):
            return Response({
                "payment_url": payment_response["payment_url"],
                "message": payment_response.get("message", "Payment link created"),
            }, status=status.HTTP_200_OK)
        err_msg = payment_response.get("message", "Failed to create payment")
        logger.warning(
            "UddoktaPay create_charge failed: %s; response: %s",
            err_msg,
            payment_response,
        )
        return Response({
            "error": err_msg,
            "gateway_response": payment_response,
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class VerifyPaymentAPI(APIView):
    """Verify payment via UddoktaPay (invoice_id)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        invoice_id = request.data.get("invoice_id")
        if not invoice_id:
            return Response(
                {"error": "invoice_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        verify_response = uddoktapay_verify_payment(invoice_id)
        if verify_response.get("status") != "COMPLETED":
            return Response({
                "status": verify_response.get("status", "error"),
                "message": verify_response.get("message", "Payment not completed"),
            }, status=status.HTTP_200_OK)
        metadata = verify_response.get("metadata") or {}
        user_id = metadata.get("user_id")
        membership_id = metadata.get("membership_id")
        if user_id and membership_id:
            try:
                from users.models import User
                user = User.objects.get(id=int(user_id))
                membership = Membership.objects.get(id=int(membership_id))
                
                # Check if purchase already exists
                existing_purchase = MembershipPurchase.objects.filter(
                    user=user,
                    membership=membership,
                    is_active=True
                ).first()
                
                if existing_purchase:
                    return Response({
                        "status": "success",
                        "message": "Membership already purchased",
                        "membership": membership.name
                    }, status=status.HTTP_200_OK)
                
                # Create membership purchase
                with transaction.atomic():
                    purchase = MembershipPurchase.objects.create(
                        user=user,
                        membership=membership,
                        is_active=True
                    )
                    
                    # Distribute commissions
                    distribute_commission(user, membership)
                
                return Response({
                    "status": "success",
                    "message": f"{membership.name} purchased successfully!",
                    "membership": membership.name,
                    "invoice_id": invoice_id,
                }, status=status.HTTP_200_OK)
            except (User.DoesNotExist, Membership.DoesNotExist):
                return Response({
                    "error": "User or membership not found"
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            "error": "Invalid payment metadata",
            "metadata_received": verify_response.get("metadata"),
        }, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name="dispatch")
class UddoktaPayWebhookAPI(APIView):
    """Handle IPN webhook from UddoktaPay (invoice_id + status)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        invoice_id = request.data.get("invoice_id")
        if not invoice_id:
            return Response({"error": "invoice_id required"}, status=status.HTTP_400_BAD_REQUEST)
        verify_response = uddoktapay_verify_payment(invoice_id)
        if verify_response.get("status") != "COMPLETED":
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        metadata = verify_response.get("metadata") or {}
        user_id = metadata.get("user_id")
        membership_id = metadata.get("membership_id")
        if not user_id or not membership_id:
            return Response({"status": "received"}, status=status.HTTP_200_OK)
        try:
            from users.models import User
            user = User.objects.get(id=int(user_id))
            membership = Membership.objects.get(id=int(membership_id))
            existing = MembershipPurchase.objects.filter(
                user=user, membership=membership, is_active=True
            ).first()
            if not existing:
                with transaction.atomic():
                    MembershipPurchase.objects.create(
                        user=user, membership=membership, is_active=True
                    )
                    distribute_commission(user, membership)
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except (User.DoesNotExist, Membership.DoesNotExist, ValueError):
            return Response({"status": "received"}, status=status.HTTP_200_OK)