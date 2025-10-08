from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .models import Membership
from .serializers import MembershipSerializer
from .services import purchase_membership

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