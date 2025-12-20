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
        if not s.is_valid():
            # Return validation errors
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
        
        identifier = s.validated_data["identifier"]
        password = s.validated_data["password"]
        
        # Try to find user by email or phone number
        user = User.objects.filter(email=identifier).first() or User.objects.filter(phone_number=identifier).first()
        
        # Check if user exists and password is correct
        # Return generic error for both cases to prevent user enumeration
        if not user or not user.check_password(password):
            return Response(
                {"detail": "Invalid credentials. Please check your email/phone and password."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens for authenticated user
        refresh = RefreshToken.for_user(user)
        return Response({
            "refresh": str(refresh), 
            "access": str(refresh.access_token)
        })

class MyDownlinesView(APIView):
    """Return all downline users (direct & indirect up to 10 levels)"""
    def get(self, request):
        user = request.user
        # We can use precomputed table (in referral.services) or perform query
        from referral.services import get_downlines
        downlines = get_downlines(user.id)
        return Response({"downlines": downlines})

class UserInfoUpdateView(APIView):
    """Get or update user info profile"""
    def get(self, request):
        """Get user info"""
        user = request.user
        user_info, created = UserInfo.objects.get_or_create(user=user)
        serializer = UserInfoSerializer(user_info)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        """Update user info profile"""
        user = request.user
        user_info, created = UserInfo.objects.get_or_create(user=user)
        
        # Filter out read-only fields from request data
        allowed_fields = [
            'profile_picture', 'address', 'nid_or_brid', 'profession',
            'blood_group', 'gender', 'marital_status', 'father_name',
            'mother_name', 'working_place', 'is_verified'
        ]
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        
        # Handle empty strings - convert to None for optional fields
        for field in ['gender', 'marital_status', 'blood_group', 'nid_or_brid', 
                     'profession', 'father_name', 'mother_name', 'working_place', 'address']:
            if field in data and data[field] == "":
                data[field] = None
        
        # Profile picture can now be a data URL (no truncation needed with TextField)
        
        serializer = UserInfoSerializer(user_info, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)