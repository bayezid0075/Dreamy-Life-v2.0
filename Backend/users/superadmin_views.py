"""
Superadmin panel: access by allowlist email only.
Provides overview stats, user control, and SSE live stream.
"""
import json
import time
from django.conf import settings
from django.http import StreamingHttpResponse
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken

from .models import (
    User,
    UserInfo,
    AccountRestrictionConfig,
    RESTRICTABLE_AREAS,
    MEMBER_STATUS_KEYS,
    DEFAULT_MEMBER_STATUS_ALLOWED,
    DEFAULT_UNVERIFIED_RESTRICTED,
)
from .admin_serializers import AdminUserSerializer, AdminUserCreateSerializer, AdminUserInfoSerializer
from .admin_views import AdminUserDetailView


def get_superadmin_emails():
    return getattr(settings, "SUPERADMIN_ALLOWED_EMAILS", []) or []


class IsSuperadmin(permissions.BasePermission):
    """Only allow access if request.user.email is in SUPERADMIN_ALLOWED_EMAILS."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed = get_superadmin_emails()
        if not allowed:
            return False
        return request.user.email.lower() in allowed


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def superadmin_access(request):
    """
    Check if the current user is allowed to access the superadmin panel.
    Returns { "allowed": true/false, "email": "..." }.
    """
    allowed_emails = get_superadmin_emails()
    if not allowed_emails:
        return Response({"allowed": False, "email": request.user.email, "reason": "No superadmin emails configured"})
    allowed = request.user.email.lower() in allowed_emails
    return Response({
        "allowed": allowed,
        "email": request.user.email,
        "reason": None if allowed else "Your email is not authorized to access the superadmin panel.",
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated, IsSuperadmin])
def superadmin_overview(request):
    """Overview stats for superadmin dashboard."""
    from django.db.models import Sum, Count
    from memberships.models import MembershipPurchase
    from vendors.models import Vendor, Product
    from wallets.models import Wallet

    total_wallet_balance = Wallet.objects.aggregate(total=Sum("balance"))["total"] or 0
    recent_users = list(
        User.objects.order_by("-created_at")
        .values("id", "username", "email", "created_at", "is_active")[:10]
    )

    stats = {
        "total_users": User.objects.count(),
        "active_users": User.objects.filter(is_active=True).count(),
        "staff_users": User.objects.filter(is_staff=True).count(),
        "total_vendors": Vendor.objects.count(),
        "total_products": Product.objects.count(),
        "total_memberships": MembershipPurchase.objects.filter(is_active=True).count(),
        "total_wallet_balance": str(total_wallet_balance),
        "recent_users": recent_users,
    }
    return Response(stats)


class SuperadminUserPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SuperadminUserListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperadmin]

    def get(self, request):
        from django.db.models import Q
        from .admin_views import AdminUserListCreateView

        queryset = User.objects.all().select_related("info", "referred_by")
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search)
                | Q(email__icontains=search)
                | Q(phone_number__icontains=search)
            )
        is_active = request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")
        is_staff = request.query_params.get("is_staff")
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == "true")
        member_status = request.query_params.get("member_status")
        if member_status:
            queryset = queryset.filter(info__member_status=member_status)
        ordering = request.query_params.get("ordering", "-created_at")
        queryset = queryset.order_by(ordering)

        paginator = SuperadminUserPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = AdminUserSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = AdminUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        ser = AdminUserSerializer(user)
        return Response(ser.data, status=status.HTTP_201_CREATED)


class SuperadminUserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperadmin]

    def get_object(self, pk):
        from rest_framework.generics import get_object_or_404
        return get_object_or_404(User.objects.select_related("info", "referred_by"), pk=pk)

    def get(self, request, pk):
        user = self.get_object(pk)
        serializer = AdminUserSerializer(user)
        return Response(serializer.data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        data = request.data.copy()
        info_data = data.pop("info", None)
        serializer = AdminUserSerializer(user, data=data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if info_data:
            user_info, _ = UserInfo.objects.get_or_create(user=user)
            info_serializer = AdminUserInfoSerializer(user_info, data=info_data, partial=True)
            if info_serializer.is_valid():
                info_serializer.save()
        return Response(AdminUserSerializer(self.get_object(pk)).data)

    def delete(self, request, pk):
        user = self.get_object(pk)
        if user.id == request.user.id:
            return Response(
                {"detail": "You cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET", "PUT"])
@permission_classes([permissions.IsAuthenticated, IsSuperadmin])
def superadmin_restriction_config(request):
    """
    Get or update restriction config: account status (hold, ban, inactive), unverified areas,
    and allowed areas per member status.
    GET: { config: { hold, ban, inactive, unverified_restricted_areas, member_status_allowed_areas }, restrictable_areas, member_status_keys }
    PUT: body { config: { ... } }
    """
    if request.method == "GET":
        config = AccountRestrictionConfig.get_config()
        return Response({
            "config": config,
            "restrictable_areas": RESTRICTABLE_AREAS,
            "member_status_keys": MEMBER_STATUS_KEYS,
        })
    # PUT
    new_config = request.data.get("config")
    if not isinstance(new_config, dict):
        return Response(
            {"detail": "Expected body.config object"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    obj, _ = AccountRestrictionConfig.objects.get_or_create(
        pk=1,
        defaults={"config": {
            "hold": ["wallet", "withdrawals"],
            "ban": list(RESTRICTABLE_AREAS),
            "inactive": list(RESTRICTABLE_AREAS),
            "unverified_restricted_areas": list(DEFAULT_UNVERIFIED_RESTRICTED),
            "member_status_allowed_areas": dict(DEFAULT_MEMBER_STATUS_ALLOWED),
        }},
    )
    for key in ("hold", "ban", "inactive"):
        if key in new_config and isinstance(new_config[key], list):
            obj.config[key] = [a for a in new_config[key] if a in RESTRICTABLE_AREAS or a == "all"]
    if "unverified_restricted_areas" in new_config and isinstance(new_config["unverified_restricted_areas"], list):
        obj.config["unverified_restricted_areas"] = [
            a for a in new_config["unverified_restricted_areas"] if a in RESTRICTABLE_AREAS
        ]
    if "member_status_allowed_areas" in new_config and isinstance(new_config["member_status_allowed_areas"], dict):
        obj.config["member_status_allowed_areas"] = {}
        for ms in MEMBER_STATUS_KEYS:
            raw = new_config["member_status_allowed_areas"].get(ms)
            obj.config["member_status_allowed_areas"][ms] = (
                [a for a in raw if a in RESTRICTABLE_AREAS] if isinstance(raw, list) else list(obj.config.get("member_status_allowed_areas", {}).get(ms, DEFAULT_MEMBER_STATUS_ALLOWED.get(ms, [])))
            )
    obj.save()
    return Response({"config": AccountRestrictionConfig.get_config()})


# --------------------- SUPERADMIN VENDORS & ORDERS ---------------------
class SuperadminVendorListView(APIView):
    """Superadmin: list all vendors with overview stats."""
    permission_classes = [permissions.IsAuthenticated, IsSuperadmin]

    def get(self, request):
        from vendors.models import Vendor, Order
        from vendors.serializers import VendorSerializer
        vendors = Vendor.objects.select_related("user").prefetch_related("products").order_by("-created_at")
        serializer = VendorSerializer(vendors, many=True)
        data = list(serializer.data)
        for i, vendor in enumerate(vendors):
            data[i]["orders_count"] = Order.objects.filter(items__product__vendor=vendor).distinct().count()
        return Response(data)


class SuperadminVendorDetailView(APIView):
    """Superadmin: get vendor detail with stats, PATCH vendor_status (active, hold, ban)."""
    permission_classes = [permissions.IsAuthenticated, IsSuperadmin]

    def get_object(self, pk):
        from vendors.models import Vendor
        from rest_framework.generics import get_object_or_404
        return get_object_or_404(Vendor.objects.select_related("user").prefetch_related("products"), pk=pk)

    def get(self, request, pk):
        from vendors.serializers import VendorSerializer
        from vendors.models import Order
        vendor = self.get_object(pk)
        serializer = VendorSerializer(vendor)
        data = dict(serializer.data)
        data["orders_count"] = Order.objects.filter(items__product__vendor=vendor).distinct().count()
        return Response(data)

    def patch(self, request, pk):
        from vendors.serializers import VendorSerializer
        vendor = self.get_object(pk)
        new_status = request.data.get("vendor_status")
        if new_status not in ("active", "hold", "ban"):
            return Response(
                {"detail": "Invalid vendor_status. Use active, hold, or ban."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        vendor.vendor_status = new_status
        vendor.save(update_fields=["vendor_status"])
        return Response(VendorSerializer(vendor).data)


class SuperadminOrderListView(APIView):
    """Superadmin: list all orders (all vendors)."""
    permission_classes = [permissions.IsAuthenticated, IsSuperadmin]

    def get(self, request):
        from vendors.models import Order
        from vendors.serializers import OrderSerializer
        orders = Order.objects.select_related("user").prefetch_related(
            "items", "items__product", "items__product__vendor"
        ).order_by("-created_at")
        serializer = OrderSerializer(orders, many=True, context={"request": request})
        return Response(serializer.data)


class SuperadminOrderDetailView(APIView):
    """Superadmin: get order detail, PATCH order_status (full control)."""
    permission_classes = [permissions.IsAuthenticated, IsSuperadmin]

    def get_object(self, pk):
        from vendors.models import Order
        from rest_framework.generics import get_object_or_404
        return get_object_or_404(
            Order.objects.select_related("user").prefetch_related(
                "items", "items__product", "items__product__vendor"
            ),
            pk=pk,
        )

    def get(self, request, pk):
        from vendors.serializers import OrderSerializer
        order = self.get_object(pk)
        return Response(OrderSerializer(order, context={"request": request}).data)

    def patch(self, request, pk):
        from vendors.models import Order
        from vendors.serializers import OrderSerializer
        order = self.get_object(pk)
        new_status = request.data.get("order_status")
        if new_status not in dict(Order.ORDER_STATUS_CHOICES):
            return Response(
                {"detail": "Invalid order_status"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order.order_status = new_status
        order.save(update_fields=["order_status", "updated_at"])
        return Response(OrderSerializer(order, context={"request": request}).data)


def _get_user_from_token(token_raw):
    """Validate JWT and return User or None."""
    try:
        token = AccessToken(token_raw)
        user_id = token.get("user_id")
        return User.objects.filter(pk=user_id).first()
    except (InvalidToken, Exception):
        return None


def _sse_event(event_type, data):
    payload = json.dumps(data) if not isinstance(data, str) else data
    return f"event: {event_type}\ndata: {payload}\n\n"


def superadmin_stream(request):
    """
    SSE stream for live superadmin updates.
    Auth: ?token=ACCESS_TOKEN (JWT). Must be superadmin email.
    Runs for a bounded time (e.g. 1 hour) then ends so the connection can shut down cleanly.
    Frontend should reconnect on close/error.
    """
    token_raw = request.GET.get("token")
    if not token_raw:
        return Response({"detail": "Missing token"}, status=status.HTTP_401_UNAUTHORIZED)

    user = _get_user_from_token(token_raw)
    if not user:
        return Response({"detail": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)

    allowed = get_superadmin_emails()
    if not allowed or user.email.lower() not in allowed:
        return Response({"detail": "Not authorized for superadmin"}, status=status.HTTP_403_FORBIDDEN)

    # Bounded iterations so the stream eventually ends and connection can shut down (avoids "took too long to shut down").
    # 1200 * 3s = 1 hour; frontend can reconnect when EventSource closes.
    MAX_ITERATIONS = 1200
    INTERVAL_SECONDS = 3

    def stream():
        from django.db.models import Sum
        from memberships.models import MembershipPurchase
        from vendors.models import Vendor, Product
        from wallets.models import Wallet

        for _ in range(MAX_ITERATIONS):
            try:
                total_wallet = Wallet.objects.aggregate(total=Sum("balance"))["total"] or 0
                recent_users_qs = (
                    User.objects.order_by("-created_at")
                    .values("id", "username", "email", "created_at", "is_active")[:10]
                )
                recent_users = [
                    {
                        **row,
                        "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    }
                    for row in recent_users_qs
                ]
                overview = {
                    "total_users": User.objects.count(),
                    "active_users": User.objects.filter(is_active=True).count(),
                    "staff_users": User.objects.filter(is_staff=True).count(),
                    "total_vendors": Vendor.objects.count(),
                    "total_products": Product.objects.count(),
                    "total_memberships": MembershipPurchase.objects.filter(is_active=True).count(),
                    "total_wallet_balance": str(total_wallet),
                    "recent_users": recent_users,
                }
                yield _sse_event("overview", overview)
            except GeneratorExit:
                return
            except (BrokenPipeError, ConnectionResetError, OSError):
                # Client disconnected
                return
            except Exception:
                pass
            time.sleep(INTERVAL_SECONDS)

    response = StreamingHttpResponse(
        stream(),
        content_type="text/event-stream",
    )
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated, IsSuperadmin])
def superadmin_push_notification(request):
    """
    Push a notification to all (active) users. Body: title, message, image (optional URL), link (optional URL).
    """
    title = request.data.get("title") or ""
    message = request.data.get("message") or ""
    image = (request.data.get("image") or "").strip() or None
    link = (request.data.get("link") or "").strip() or None
    if not title.strip():
        return Response(
            {"detail": "title is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    from notifications.models import Notification

    users = User.objects.filter(is_active=True)
    created = 0
    for user in users:
        Notification.objects.create(
            user=user,
            title=title.strip(),
            message=message.strip(),
            image=image,
            link=link,
            source="admin",
        )
        created += 1
    return Response({"detail": f"Notification sent to {created} users.", "count": created})
