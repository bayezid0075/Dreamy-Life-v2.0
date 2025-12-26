from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from django.conf import settings
from .models import Membership, MembershipPurchase
from .serializers import MembershipSerializer
from .services import purchase_membership, distribute_commission
from .payment_service import create_payment, verify_payment
from django.db import transaction

class MembershipListView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        plans = Membership.objects.all()
        return Response(MembershipSerializer(plans, many=True).data)

class MembershipPurchaseAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
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


class CreatePaymentAPI(APIView):
    """Create payment with SohojPay gateway"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        membership_id = request.data.get("membership_id")
        
        if not membership_id:
            return Response({"error": "membership_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            membership = Membership.objects.get(id=membership_id)
        except Membership.DoesNotExist:
            return Response({"error": "Membership not found"}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({"error": "Invalid membership_id format"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Validate user has required fields
        if not user.email:
            return Response({"error": "User email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.username:
            return Response({"error": "User username is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get frontend URL from request or use default
        request_scheme = request.scheme or 'http'
        request_host = request.get_host()
        base_url = f"{request_scheme}://{request_host}"
        
        # For development, you might want to use localhost:3000
        # In production, use your actual frontend domain
        frontend_url = getattr(settings, 'FRONTEND_URL', None)
        if not frontend_url:
            # Try to detect frontend URL from request
            if '3000' in request_host or 'localhost' in request_host:
                frontend_url = f"{request_scheme}://localhost:3000"
            else:
                frontend_url = f"{request_scheme}://{request_host.replace(':8000', ':3000')}"
        
        success_url = f"{frontend_url}/memberships/payment/success"
        cancel_url = f"{frontend_url}/memberships/payment/cancel"
        webhook_url = f"{base_url}/api/memberships/payment/webhook/"
        
        # Prepare payment data - ensure all fields are valid
        cus_name = (user.username or "Customer")[:50]
        cus_email = user.email[:50]
        cus_phone = (user.phone_number[:50] if user.phone_number else None)
        
        # Create minimal metadata to stay within 150 char limit
        metadata = {
            "uid": str(user.id),  # Shorter key
            "mid": str(membership_id)  # Shorter key
        }
        
        # Only add phone if there's room
        import json
        metadata_str = json.dumps(metadata, separators=(',', ':'))
        if cus_phone and len(metadata_str) + len(cus_phone) + 10 < 150:
            metadata["phone"] = cus_phone
        
        # Format amount - ensure it's a string with 2 decimal places
        from decimal import Decimal
        amount_value = Decimal(str(membership.price))
        amount_str = f"{amount_value:.2f}"
        
        # Validate URLs are not too long
        if len(success_url) > 100:
            return Response({
                "error": f"Success URL too long ({len(success_url)} chars, max 100)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(cancel_url) > 100:
            return Response({
                "error": f"Cancel URL too long ({len(cancel_url)} chars, max 100)"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Log the payment request details for debugging
        print(f"=== Payment Creation Request ===")
        print(f"User: {user.username} ({user.email})")
        print(f"Membership: {membership.name} - {amount_str}")
        print(f"Success URL: {success_url}")
        print(f"Cancel URL: {cancel_url}")
        print(f"Webhook URL: {webhook_url}")
        print(f"Metadata: {metadata}")
        
        # Create payment
        try:
            payment_response = create_payment(
                cus_name=cus_name,
                cus_email=cus_email,
                cus_phone=cus_phone,
                amount=amount_str,
                success_url=success_url,
                cancel_url=cancel_url,
                webhook_url=webhook_url,
                metadata=metadata
            )
            
            print(f"=== Payment Gateway Response ===")
            print(f"Response: {payment_response}")
            
            # Check if response indicates success (status can be 1, True, or "success")
            if payment_response.get("status") == 1 or payment_response.get("status") is True:
                payment_url = payment_response.get("payment_url")
                if payment_url:
                    return Response({
                        "payment_url": payment_url,
                        "message": payment_response.get("message", "Payment link created")
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        "error": "Payment URL not received from gateway",
                        "gateway_response": payment_response
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                error_message = payment_response.get("message", "Failed to create payment")
                # Log the full response for debugging
                print(f"Payment creation failed: {payment_response}")
                return Response({
                    "error": error_message,
                    "gateway_response": payment_response
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Exception in payment creation: {error_trace}")
            return Response({
                "error": f"Payment creation error: {str(e)}",
                "traceback": error_trace if settings.DEBUG else None
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentAPI(APIView):
    """Verify payment transaction"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        transaction_id = request.data.get("transaction_id")
        
        if not transaction_id:
            return Response({"error": "transaction_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify payment with gateway
        verify_response = verify_payment(transaction_id)
        
        if verify_response.get("status") == "COMPLETED":
            # Extract metadata - support both old and new key formats
            metadata = verify_response.get("metadata", {})
            user_id = metadata.get("uid") or metadata.get("user_id")
            membership_id = metadata.get("mid") or metadata.get("membership_id")
            
            if not user_id or not membership_id:
                return Response({
                    "error": "Invalid payment metadata",
                    "metadata_received": metadata
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                from users.models import User
                user = User.objects.get(id=user_id)
                membership = Membership.objects.get(id=membership_id)
                
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
                    "transaction_id": transaction_id
                }, status=status.HTTP_200_OK)
                
            except (User.DoesNotExist, Membership.DoesNotExist) as e:
                return Response({
                    "error": "User or membership not found"
                }, status=status.HTTP_404_NOT_FOUND)
        
        elif verify_response.get("status") == "PENDING":
            return Response({
                "status": "pending",
                "message": "Payment is pending"
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                "error": verify_response.get("message", "Payment verification failed")
            }, status=status.HTTP_400_BAD_REQUEST)


class PaymentWebhookAPI(APIView):
    """Handle payment webhook from SohojPay"""
    permission_classes = [permissions.AllowAny]  # Webhook should be accessible without auth
    
    def post(self, request):
        # Webhook data from SohojPay
        transaction_id = request.data.get("transaction_id")
        payment_status = request.data.get("status")
        
        if not transaction_id:
            return Response({"error": "transaction_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify payment
        verify_response = verify_payment(transaction_id)
        
        if verify_response.get("status") == "COMPLETED":
            metadata = verify_response.get("metadata", {})
            user_id = metadata.get("uid") or metadata.get("user_id")
            membership_id = metadata.get("mid") or metadata.get("membership_id")
            
            if user_id and membership_id:
                try:
                    from users.models import User
                    user = User.objects.get(id=user_id)
                    membership = Membership.objects.get(id=membership_id)
                    
                    # Check if purchase already exists
                    existing_purchase = MembershipPurchase.objects.filter(
                        user=user,
                        membership=membership,
                        is_active=True
                    ).first()
                    
                    if not existing_purchase:
                        with transaction.atomic():
                            purchase = MembershipPurchase.objects.create(
                                user=user,
                                membership=membership,
                                is_active=True
                            )
                            
                            # Distribute commissions
                            distribute_commission(user, membership)
                    
                    return Response({"status": "success"}, status=status.HTTP_200_OK)
                except Exception as e:
                    return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"status": "received"}, status=status.HTTP_200_OK)