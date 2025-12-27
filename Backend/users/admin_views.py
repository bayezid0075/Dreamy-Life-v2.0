from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from .models import User, UserInfo
from .admin_serializers import AdminUserSerializer, AdminUserCreateSerializer, AdminUserInfoSerializer

User = get_user_model()


class IsAdminUser(permissions.BasePermission):
    """Permission class to check if user is admin (staff or superuser)"""
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or request.user.is_superuser)


class AdminUserListCreateView(generics.ListCreateAPIView):
    """List all users or create a new user (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = User.objects.all().select_related('info', 'referred_by').prefetch_related('downlines')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AdminUserCreateSerializer
        return AdminUserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all().select_related('info', 'referred_by')
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(phone_number__icontains=search)
            )
        
        # Filter by is_active
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by is_staff
        is_staff = self.request.query_params.get('is_staff', None)
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        # Filter by member_status
        member_status = self.request.query_params.get('member_status', None)
        if member_status:
            queryset = queryset.filter(info__member_status=member_status)
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        queryset = queryset.order_by(ordering)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save()


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a user (Admin only)"""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    queryset = User.objects.all().select_related('info', 'referred_by')
    serializer_class = AdminUserSerializer
    
    def update(self, request, *args, **kwargs):
        """Update user with UserInfo"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Get UserInfo data from request
        info_data = request.data.pop('info', None)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Save user
        user = serializer.save()
        
        # Update UserInfo if provided
        if info_data:
            user_info, created = UserInfo.objects.get_or_create(user=user)
            info_serializer = AdminUserInfoSerializer(user_info, data=info_data, partial=True)
            if info_serializer.is_valid():
                info_serializer.save()
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete user"""
        instance = self.get_object()
        
        # Prevent deleting yourself
        if instance.id == request.user.id:
            return Response(
                {"detail": "You cannot delete your own account"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsAdminUser])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin"""
    from memberships.models import MembershipPurchase
    from vendors.models import Vendor, Product
    from wallets.models import Wallet
    
    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'staff_users': User.objects.filter(is_staff=True).count(),
        'total_vendors': Vendor.objects.count(),
        'total_products': Product.objects.count(),
        'total_memberships': MembershipPurchase.objects.filter(is_active=True).count(),
        'recent_users': User.objects.order_by('-created_at')[:5].values('id', 'username', 'email', 'created_at'),
    }
    
    return Response(stats)

