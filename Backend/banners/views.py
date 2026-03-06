from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import get_object_or_404

from .models import BannerSlide
from .serializers import BannerSlideSerializer, BannerSlidePublicSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def public_banner_list(request):
    """List active banner slides for the dashboard slider (no auth required)."""
    qs = BannerSlide.objects.filter(is_active=True)
    serializer = BannerSlidePublicSerializer(qs, many=True, context={"request": request})
    return Response(serializer.data)


class AdminBannerListCreateView(APIView):
    """List all banners and create new (admin/staff only)."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = BannerSlide.objects.all()
        serializer = BannerSlideSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = BannerSlideSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminBannerDetailView(APIView):
    """Retrieve, update, delete a banner (admin/staff only)."""
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        return get_object_or_404(BannerSlide, pk=pk)

    def get(self, request, pk):
        banner = self.get_object(pk)
        serializer = BannerSlideSerializer(banner, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        banner = self.get_object(pk)
        serializer = BannerSlideSerializer(
            banner, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        banner = self.get_object(pk)
        banner.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
