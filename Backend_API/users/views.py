from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .serializers import RegisterSerializer, LoginSerializer, UserInfoSerializer
from .models import UserInfo, User
import threading

# Import celery task only if available
try:
    from referral.tasks import task_notify_uplines_on_register
    CELERY_AVAILABLE = True
except Exception:
    CELERY_AVAILABLE = False

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        s = RegisterSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        user = s.save()
        # Notify uplines via celery task (if available)
        if CELERY_AVAILABLE:
            def call_delay():
                try:
                    task_notify_uplines_on_register.delay(user.id)
                except Exception as e:
                    print(f"Celery task failed: {e}")
            thread = threading.Thread(target=call_delay)
            thread.start()
        return Response({
            "detail": "registered",
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "referral_code": user.info.own_refercode
        }, status=status.HTTP_201_CREATED)

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        identifier = s.validated_data["identifier"]
        user = User.objects.filter(email=identifier).first() or User.objects.filter(phone_number=identifier).first()
        if not user or not user.check_password(s.validated_data["password"]):
            return Response({"detail":"invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({"refresh": str(refresh), "access": str(refresh.access_token)})

class MyDownlinesView(APIView):
    """Return all downline users (direct & indirect up to 10 levels)"""
    def get(self, request):
        user = request.user
        # We can use precomputed table (in referral.services) or perform query
        from referral.services import get_downlines
        downlines = get_downlines(user.id)
        return Response({"downlines": downlines})