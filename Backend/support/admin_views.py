from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

try:
    from users.superadmin_views import IsSuperadmin
except Exception:
    IsSuperadmin = None

from .models import SupportConversation, SupportMessage
from .serializers import SupportConversationSerializer, SupportMessageSerializer


class SuperadminSupportConversationListView(APIView):
    """List all support conversations (superadmin only)."""
    permission_classes = [IsSuperadmin] if IsSuperadmin else []

    def get(self, request):
        qs = SupportConversation.objects.select_related("user", "user__info").prefetch_related("messages").order_by("-updated_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = SupportConversationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class SuperadminSupportConversationDetailView(APIView):
    """Get one conversation and POST reply as admin."""
    permission_classes = [IsSuperadmin] if IsSuperadmin else []

    def get(self, request, pk):
        try:
            conv = SupportConversation.objects.select_related("user", "user__info").prefetch_related("messages").get(pk=pk)
        except SupportConversation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SupportConversationSerializer(conv)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        """Reply as admin. Body: { "message": "..." } or { "body": "..." }"""
        try:
            conv = SupportConversation.objects.get(pk=pk)
        except SupportConversation.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        body = (request.data.get("message") or request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "message is required."}, status=status.HTTP_400_BAD_REQUEST)
        msg = SupportMessage.objects.create(
            conversation=conv,
            sender_type=SupportMessage.SENDER_ADMIN,
            body=body,
            admin_user=request.user,
        )
        return Response(SupportMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
