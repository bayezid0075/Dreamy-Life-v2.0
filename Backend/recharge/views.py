from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from wallets.models import Wallet, WalletTransaction
from .models import MobileRecharge
from .serializers import MobileRechargeSerializer, MobileRechargeCreateSerializer
from .services import request_recharge, check_recharge_status, generate_refid

try:
    from users.account_restriction import check_area_allowed
except ImportError:
    def check_area_allowed(user, area):
        return None, False


def _user_is_verified(user):
    info = getattr(user, "info", None)
    return info and getattr(info, "is_verified", False)


class RechargeListView(APIView):
    """List my mobile recharges."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        qs = MobileRecharge.objects.filter(user=request.user).order_by("-created_at")
        return Response(MobileRechargeSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class RechargeCreateView(APIView):
    """
    Create mobile recharge: verified user only, amount <= wallet balance.
    Deduct wallet -> call API -> if not RECEIVED, refund.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        if not _user_is_verified(request.user):
            return Response(
                {"detail": "Only verified users can use mobile recharge. Please complete membership first."},
                status=status.HTTP_403_FORBIDDEN,
            )
        ser = MobileRechargeCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        operator = ser.validated_data["operator"]
        number_type = ser.validated_data["number_type"]
        mobile_number = ser.validated_data["mobile_number"]
        amount = ser.validated_data["amount"].quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().filter(user=request.user).first()
            if not wallet:
                return Response(
                    {"detail": "Wallet not found. Add funds first."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            available = (wallet.balance - wallet.reserved_balance).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            if available < amount:
                return Response(
                    {"detail": f"Insufficient balance. Available: ৳{available}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            refid = generate_refid()
            wallet.balance = (wallet.balance - amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            wallet.save(update_fields=["balance"])
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=amount,
                transaction_type="debit",
                description=f"Mobile recharge {mobile_number} ৳{amount} (ref: {refid})",
            )
            rec = MobileRecharge.objects.create(
                user=request.user,
                operator=operator,
                number_type=number_type,
                mobile_number=mobile_number,
                amount=amount,
                refid=refid,
                status=MobileRecharge.STATUS_PENDING,
            )

        api_resp = request_recharge(
            operator=operator,
            number_type=number_type,
            number=mobile_number,
            amount=str(int(amount)) if amount == int(amount) else str(amount),
            refid=refid,
        )
        api_status = (api_resp.get("STATUS") or "").strip().upper()
        api_recharge_status = (api_resp.get("RECHARGE_STATUS") or "").strip().upper()
        api_message = (api_resp.get("MESSAGE") or "").strip() or str(api_resp)[:500]
        trxid = (api_resp.get("TRXID") or "").strip()

        rec.api_status = api_status
        rec.api_recharge_status = api_recharge_status
        rec.api_message = api_message
        rec.trxid = trxid

        if api_status == "OK" and api_recharge_status == "RECEIVED":
            rec.status = MobileRecharge.STATUS_RECEIVED
            rec.save(update_fields=["api_status", "api_recharge_status", "api_message", "trxid", "status"])
            return Response(
                MobileRechargeSerializer(rec).data,
                status=status.HTTP_201_CREATED,
            )

        rec.status = MobileRecharge.STATUS_FAILED
        rec.save(update_fields=["api_status", "api_recharge_status", "api_message", "trxid", "status"])
        with transaction.atomic():
            wallet = Wallet.objects.select_for_update().get(user=request.user)
            wallet.balance = (wallet.balance + amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            wallet.save(update_fields=["balance"])
            WalletTransaction.objects.create(
                wallet=wallet,
                amount=amount,
                transaction_type="credit",
                description=f"Refund: mobile recharge failed – {api_message[:100]} (ref: {refid})",
            )
            rec.status = MobileRecharge.STATUS_REFUNDED
            rec.save(update_fields=["status"])

        return Response(
            {
                "detail": api_message or "Recharge request failed.",
                "recharge": MobileRechargeSerializer(rec).data,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class RechargeStatusView(APIView):
    """Check recharge status by refid (optional: call external MRCSTATUS)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, refid):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        rec = MobileRecharge.objects.filter(user=request.user, refid=refid).first()
        if not rec:
            return Response({"detail": "Recharge not found."}, status=status.HTTP_404_NOT_FOUND)
        if rec.status in (MobileRecharge.STATUS_RECEIVED, MobileRecharge.STATUS_PENDING):
            api_resp = check_recharge_status(refid)
            rec.api_recharge_status = (api_resp.get("RECHARGE_STATUS") or rec.api_recharge_status or "").strip().upper()
            rec.api_message = (api_resp.get("MESSAGE") or rec.api_message or "").strip()
            rec.trxid = rec.trxid or (api_resp.get("RECHARGE_TRXID") or "").strip()
            if rec.api_recharge_status == "SUCCESS":
                rec.status = MobileRecharge.STATUS_SUCCESS
            elif rec.api_recharge_status == "FAILED":
                rec.status = MobileRecharge.STATUS_FAILED
            rec.save(update_fields=["api_recharge_status", "api_message", "trxid", "status"])
        return Response(MobileRechargeSerializer(rec).data, status=status.HTTP_200_OK)
