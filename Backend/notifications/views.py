from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notification_list(request):
    """List notifications for the current user (newest first)."""
    qs = Notification.objects.filter(user=request.user)[:50]
    serializer = NotificationSerializer(qs, many=True)
    return Response(serializer.data)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notification_unread_count(request):
    """Return count of unread notifications."""
    count = Notification.objects.filter(user=request.user, is_read=False).count()
    return Response({"count": count})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, pk):
    """Mark a single notification as read."""
    try:
        notification = Notification.objects.get(pk=pk, user=request.user)
    except Notification.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return Response(NotificationSerializer(notification).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def notification_mark_all_read(request):
    """Mark all notifications as read for the current user."""
    updated = Notification.objects.filter(user=request.user, is_read=False).update(
        is_read=True
    )
    return Response({"marked": updated})
