from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.utils import timezone
from django.core.mail import send_mail
from django.urls import reverse
from .serializers import (
    RegisterSerializer, LoginSerializer, UserInfoSerializer,
    PasswordResetRequestSerializer, PasswordResetVerifySerializer, PasswordResetSerializer
)
from .models import UserInfo, User, PasswordResetToken
import threading
import secrets
from datetime import timedelta

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
        # Note: is_verified and member_status are read-only - they can only be updated via membership purchase signal
        allowed_fields = [
            'profile_picture', 'address', 'nid_or_brid', 'profession',
            'blood_group', 'gender', 'marital_status', 'father_name',
            'mother_name', 'working_place'
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

class PasswordResetRequestView(APIView):
    """Request password reset - sends email with reset token"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Tell user that account doesn't exist
            return Response({
                'detail': 'Account not exist under the email',
                'account_exists': False
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Create reset token (expires in 1 hour)
        expires_at = timezone.now() + timedelta(hours=1)
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
        
        # Get frontend URL from settings or use default
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?token={token}"
        
        # Check if email is configured
        email_user = getattr(settings, 'EMAIL_HOST_USER', '') or ''
        email_password = getattr(settings, 'EMAIL_HOST_PASSWORD', '') or ''
        email_configured = bool(email_user.strip() and email_password.strip())
        
        # Send email if configured, otherwise log to console for development
        if email_configured:
            try:
                send_mail(
                    subject='Password Reset Request - Dreamy Life',
                    message=f'''
Hello {user.username},

You requested to reset your password. Please click the link below to reset your password:

{reset_url}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Dreamy Life Team
                    ''',
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log error
                print(f"Error sending password reset email: {e}")
                # In development, also print the reset link to console
                if settings.DEBUG:
                    print(f"\n{'='*60}")
                    print(f"PASSWORD RESET LINK (Email not configured):")
                    print(f"Email: {user.email}")
                    print(f"Reset URL: {reset_url}")
                    print(f"{'='*60}\n")
                return Response({
                    'detail': 'Failed to send email. Please check email configuration or contact support.',
                    'account_exists': True
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            # Email not configured - log to console for development
            print(f"\n{'='*60}")
            print(f"PASSWORD RESET LINK (Email not configured):")
            print(f"User: {user.username} ({user.email})")
            print(f"Reset URL: {reset_url}")
            print(f"Token: {token}")
            print(f"{'='*60}\n")
        
        return Response({
            'detail': 'Password reset link has been sent to your email.',
            'account_exists': True
        }, status=status.HTTP_200_OK)

class PasswordResetVerifyView(APIView):
    """Verify password reset token"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            if reset_token.is_valid():
                return Response({
                    'detail': 'Token is valid',
                    'valid': True
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'detail': 'Token is invalid or expired',
                    'valid': False
                }, status=status.HTTP_400_BAD_REQUEST)
        except PasswordResetToken.DoesNotExist:
            return Response({
                'detail': 'Token is invalid or expired',
                'valid': False
            }, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetView(APIView):
    """Reset password using token"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token)
            
            if not reset_token.is_valid():
                return Response({
                    'detail': 'Token is invalid or expired'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Reset password
            user = reset_token.user
            user.set_password(new_password)
            user.save()
            
            # Mark token as used
            reset_token.used = True
            reset_token.save()
            
            # Invalidate all other reset tokens for this user
            PasswordResetToken.objects.filter(
                user=user,
                used=False
            ).update(used=True)
            
            return Response({
                'detail': 'Password has been reset successfully'
            }, status=status.HTTP_200_OK)
            
        except PasswordResetToken.DoesNotExist:
            return Response({
                'detail': 'Token is invalid or expired'
            }, status=status.HTTP_400_BAD_REQUEST)