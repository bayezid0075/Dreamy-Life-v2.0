"""
Marketplace API: jobs (CRUD, list public), submissions (create, list), review (owner), admin (approve/reject job).
All financial operations use atomic transactions and select_for_update.
"""
import os
import uuid
from decimal import Decimal
from django.conf import settings
from django.core.files.storage import default_storage
from django.db import transaction
from django.utils import timezone
from django.db.models import Q, Count
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Job, JobImage, JobSubmission, JobSubmissionFile
from .serializers import (
    JobListSerializer,
    JobDetailSerializer,
    JobCreateSerializer,
    JobSubmissionSerializer,
    JobSubmissionCreateSerializer,
)
from .permissions import IsJobOwner, IsAdminOrReadOnly, IsAdminOrSuperadmin
from .services import (
    reserve_budget_for_job,
    release_reserved_on_job_reject,
    release_payment_to_worker,
)
from .signals import broadcast_marketplace_event

try:
    from users.account_restriction import check_area_allowed
except ImportError:
    def check_area_allowed(user, area):
        return None, False


class JobViewSet(viewsets.ModelViewSet):
    """
    List: my jobs (filter by status). Create: post job (reserves wallet). Retrieve: detail.
    Update/destroy: only owner, only if pending/rejected or no submissions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = (
            Job.objects.filter(user=self.request.user)
            .prefetch_related("images", "submissions", "submissions__files")
            .annotate(_submissions_count=Count("submissions"))
            .order_by("-created_at")
        )
        status_filter = self.request.query_params.get("status")
        if status_filter in ("pending", "approved", "rejected", "completed"):
            qs = qs.filter(status=status_filter)
        return qs

    def get_serializer_class(self):
        if self.action == "list":
            return JobListSerializer
        if self.action in ("create", "update", "partial_update"):
            return JobCreateSerializer
        return JobDetailSerializer

    def create(self, request, *args, **kwargs):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        work_type = serializer.validated_data["work_type"]
        price = serializer.validated_data["price"]
        total_quantity = serializer.validated_data["total_quantity"]
        total_budget = (price * total_quantity) if work_type == "multi" else price
        total_budget = Decimal(str(total_budget)).quantize(Decimal("0.01"))

        with transaction.atomic():
            ok, err = reserve_budget_for_job(request.user.id, total_budget, 0)
            if not ok:
                return Response(
                    {"detail": err},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            job = serializer.save(user=request.user)
        return Response(
            JobDetailSerializer(job, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        job = self.get_object()
        serializer = JobDetailSerializer(job, context={"request": request})
        return Response(serializer.data)


class PublicJobViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve approved jobs only (for marketplace listing). No auth required for list; auth optional for retrieve.
    """
    serializer_class = JobListSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = (
            Job.objects.filter(status="approved", remaining_quantity__gt=0)
            .select_related("user")
            .prefetch_related("images")
            .annotate(_submissions_count=Count("submissions"))
            .order_by("-created_at")
        )
        work_type = self.request.query_params.get("work_type")
        if work_type in ("single", "multi"):
            qs = qs.filter(work_type=work_type)
        sort = self.request.query_params.get("sort", "latest")
        if sort == "price_asc":
            qs = qs.order_by("price")
        elif sort == "price_desc":
            qs = qs.order_by("-price")
        else:
            qs = qs.order_by("-created_at")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        return qs


class JobSubmissionViewSet(viewsets.ModelViewSet):
    """Create submission (worker); list my submissions."""
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            JobSubmission.objects.filter(user=self.request.user)
            .select_related("job")
            .prefetch_related("files")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return JobSubmissionCreateSerializer
        return JobSubmissionSerializer

    def create(self, request, *args, **kwargs):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.validated_data["job"]
        quantity = serializer.validated_data["quantity"]
        job = (
            Job.objects.select_for_update()
            .filter(id=job.id, status="approved")
            .first()
        )
        if not job:
            return Response(
                {"detail": "Job not found or not available."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if job.user_id == request.user.id:
            return Response(
                {"detail": "You cannot submit work for your own job."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if job.remaining_quantity < quantity:
            return Response(
                {"detail": f"Only {job.remaining_quantity} unit(s) available."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        amount = (job.price * quantity).quantize(Decimal("0.01"))
        with transaction.atomic():
            job.remaining_quantity -= quantity
            job.save(update_fields=["remaining_quantity"])
            sub = JobSubmission.objects.create(
                job=job,
                user=request.user,
                quantity=quantity,
                submission_text=serializer.validated_data.get("submission_text", ""),
                amount=amount,
                status="submitted",
            )
        return Response(
            JobSubmissionSerializer(sub, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class JobSubmissionReviewView(APIView):
    """Job owner approves or rejects a submission. On approve, payment is released to worker."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        action_type = request.data.get("action")
        if action_type not in ("approve", "reject"):
            return Response(
                {"detail": "action must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        sub = (
            JobSubmission.objects.select_related("job")
            .select_for_update()
            .filter(id=submission_id, status="submitted")
            .first()
        )
        if not sub:
            return Response(
                {"detail": "Submission not found or already reviewed."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if sub.job.user_id != request.user.id:
            return Response(
                {"detail": "You can only review submissions for your own jobs."},
                status=status.HTTP_403_FORBIDDEN,
            )
        with transaction.atomic():
            if action_type == "approve":
                ok, err = release_payment_to_worker(
                    sub.job.user_id,
                    sub.user_id,
                    sub.amount,
                    sub.job_id,
                    sub.id,
                    f"Job #{sub.job_id} submission approved",
                )
                if not ok:
                    return Response({"detail": err}, status=status.HTTP_400_BAD_REQUEST)
                sub.status = "approved"
            else:
                sub.status = "rejected"
                sub.job.remaining_quantity += sub.quantity
                sub.job.save(update_fields=["remaining_quantity"])
            sub.reviewed_at = timezone.now()
            sub.save(update_fields=["status", "reviewed_at"])
            job = sub.job
            if job.remaining_quantity == 0:
                job.status = "completed"
                job.save(update_fields=["status"])
            job.reserved_amount = max(
                Decimal("0"),
                job.reserved_amount - (sub.amount if action_type == "approve" else Decimal("0")),
            )
            job.save(update_fields=["reserved_amount"])
            broadcast_marketplace_event(
                "submission_reviewed",
                submission_id=sub.id,
                job_id=job.id,
                action=action_type,
            )
        return Response(
            JobSubmissionSerializer(
                JobSubmission.objects.get(id=sub.id),
                context={"request": request},
            ).data
        )


class AdminJobViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin / superadmin: list all jobs, approve/reject pending jobs."""
    serializer_class = JobDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperadmin]

    def get_queryset(self):
        return (
            Job.objects.all()
            .select_related("user", "approved_by")
            .prefetch_related("images", "submissions")
            .order_by("-created_at")
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        job = self.get_object()
        action_type = request.data.get("action")
        if action_type not in ("approve", "reject"):
            return Response(
                {"detail": "action must be 'approve' or 'reject'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if job.status != "pending":
            return Response(
                {"detail": "Job is not pending."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        with transaction.atomic():
            if action_type == "reject":
                release_reserved_on_job_reject(job.user_id, job.total_budget)
                job.status = "rejected"
            else:
                job.status = "approved"
                job.approved_by = request.user
                job.approved_at = timezone.now()
            job.save(update_fields=["status", "approved_by", "approved_at"])
            broadcast_marketplace_event(
                "job_reviewed",
                job_id=job.id,
                action=action_type,
            )
        return Response(JobDetailSerializer(job, context={"request": request}).data)


class MarketplaceWalletCheckView(APIView):
    """Return wallet balance and available (balance - reserved) for marketplace posting."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from wallets.models import Wallet
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        wallet, _ = Wallet.objects.get_or_create(user=request.user)
        return Response({
            "balance": str(wallet.balance),
            "reserved_balance": str(wallet.reserved_balance),
            "available_balance": str(wallet.balance - wallet.reserved_balance),
        })


class MarketplaceJobImageUploadView(APIView):
    """Upload an image for a job listing. Returns { url: absolute_media_url }."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        forbidden, is_forbidden = check_area_allowed(request.user, "wallet")
        if is_forbidden:
            return forbidden
        file_obj = request.FILES.get("image") or request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file sent. Use form key 'image' or 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Restrict to images
        allowed = ("image/jpeg", "image/png", "image/gif", "image/webp")
        if file_obj.content_type not in allowed:
            return Response(
                {"detail": "Only image files (JPEG, PNG, GIF, WebP) are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        ext = os.path.splitext(getattr(file_obj, "name", "img"))[1] or ".jpg"
        if ext.lower() not in (".jpg", ".jpeg", ".png", ".gif", ".webp"):
            ext = ".jpg"
        path = f"marketplace/job_uploads/{timezone.now().strftime('%Y/%m')}/{uuid.uuid4().hex}{ext}"
        saved_path = default_storage.save(path, file_obj)
        url = request.build_absolute_uri(settings.MEDIA_URL + saved_path)
        return Response({"url": url})
