from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import JSONParser
from .models import SupportConversation, SupportMessage
from .serializers import SupportConversationSerializer, SupportMessageSerializer


def _is_shutdown_error(exc: BaseException) -> bool:
    """True if this is the 'cannot schedule new futures after interpreter shutdown' error."""
    msg = str(exc).lower()
    return "cannot schedule new futures" in msg or "interpreter shutdown" in msg


class SupportConversationListCreateView(APIView):
    """
    GET: List my conversations (authenticated) or by guest_email (query param, for guests).
    POST: Start a new conversation (auth user or guest with guest_email, guest_name, message).
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            return self._get_impl(request)
        except RuntimeError as e:
            if _is_shutdown_error(e):
                return Response(
                    {"detail": "Server is restarting. Please try again in a moment."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            raise

    def _get_impl(self, request):
        if request.user.is_authenticated:
            qs = (
                SupportConversation.objects.filter(user=request.user)
                .select_related("user__info")
                .prefetch_related("messages")
            )
        else:
            guest_email = request.query_params.get("guest_email", "").strip()
            if not guest_email:
                return Response({"detail": "guest_email required for guests."}, status=status.HTTP_400_BAD_REQUEST)
            qs = SupportConversation.objects.filter(guest_email=guest_email).prefetch_related("messages")
        serializer = SupportConversationSerializer(qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            return self._post_impl(request)
        except RuntimeError as e:
            if _is_shutdown_error(e):
                return Response(
                    {"detail": "Server is restarting. Please try again in a moment."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            raise

    def _post_impl(self, request):
        data = request.data or {}
        guest_email = (data.get("guest_email") or "").strip()
        guest_name = (data.get("guest_name") or "").strip()
        message_body = (data.get("message") or data.get("body") or "").strip()

        if request.user.is_authenticated:
            conv = SupportConversation.objects.create(user=request.user, status="open")
            SupportMessage.objects.create(
                conversation=conv,
                sender_type=SupportMessage.SENDER_USER,
                body=message_body or "Started conversation",
            )
        else:
            if not guest_email:
                return Response(
                    {"detail": "guest_email and message are required for guests."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not guest_name:
                return Response(
                    {"detail": "guest_name is required for guests."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not message_body:
                return Response(
                    {"detail": "message is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            conv = SupportConversation.objects.create(
                guest_email=guest_email,
                guest_name=guest_name,
                status="open",
            )
            SupportMessage.objects.create(
                conversation=conv,
                sender_type=SupportMessage.SENDER_GUEST,
                body=message_body,
            )
        serializer = SupportConversationSerializer(conv)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SupportConversationDetailView(APIView):
    """
    GET: Get one conversation and messages (owner or guest by guest_email).
    POST: Send a new message (user or guest).
    """

    permission_classes = [permissions.AllowAny]

    def _get_conversation(self, request, pk):
        try:
            conv = SupportConversation.objects.get(pk=pk)
        except SupportConversation.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        if request.user.is_authenticated:
            if conv.user_id != request.user.id:
                return None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            guest_email = request.query_params.get("guest_email") or (request.data or {}).get("guest_email") or ""
            if not guest_email or conv.guest_email != guest_email:
                return None, Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return conv, None

    def get(self, request, pk):
        try:
            return self._get_impl(request, pk)
        except RuntimeError as e:
            if _is_shutdown_error(e):
                return Response(
                    {"detail": "Server is restarting. Please try again in a moment."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            raise

    def _get_impl(self, request, pk):
        conv, err = self._get_conversation(request, pk)
        if err:
            return err
        serializer = SupportConversationSerializer(conv)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            return self._post_impl(request, pk)
        except RuntimeError as e:
            if _is_shutdown_error(e):
                return Response(
                    {"detail": "Server is restarting. Please try again in a moment."},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            raise

    def _post_impl(self, request, pk):
        conv, err = self._get_conversation(request, pk)
        if err:
            return err
        body = (request.data.get("message") or request.data.get("body") or "").strip()
        if not body:
            return Response({"detail": "message is required."}, status=status.HTTP_400_BAD_REQUEST)
        if request.user.is_authenticated:
            sender_type = SupportMessage.SENDER_USER
        else:
            sender_type = SupportMessage.SENDER_GUEST
        msg = SupportMessage.objects.create(conversation=conv, sender_type=sender_type, body=body)
        return Response(SupportMessageSerializer(msg).data, status=status.HTTP_201_CREATED)
