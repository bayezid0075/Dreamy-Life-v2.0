"""
Marketplace Job models.
Uses existing User and Wallet; reserves/releases wallet balance for job budgets.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL

WORK_TYPE_CHOICES = [
    ("single", "Single Unit"),
    ("multi", "Multi Unit"),
]

JOB_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("completed", "Completed"),
]

SUBMISSION_STATUS_CHOICES = [
    ("submitted", "Submitted"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
]


class Job(models.Model):
    """A job/task posted by a user. Budget is reserved from wallet until completion/cancellation."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="marketplace_jobs"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(help_text="Rich text supported")
    work_type = models.CharField(
        max_length=20, choices=WORK_TYPE_CHOICES, default="single"
    )
    # Fixed price (single) or price per unit (multi)
    price = models.DecimalField(max_digits=12, decimal_places=2)
    total_quantity = models.PositiveIntegerField(default=1)
    remaining_quantity = models.PositiveIntegerField(default=1)
    # Total budget (price * total_quantity for multi; price for single). Reserved from wallet.
    total_budget = models.DecimalField(max_digits=12, decimal_places=2)
    # Amount still locked (reduced as submissions are approved)
    reserved_amount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0
    )
    status = models.CharField(
        max_length=20,
        choices=JOB_STATUS_CHOICES,
        default="pending",
        db_index=True,
    )
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="marketplace_jobs_approved",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class JobImage(models.Model):
    """Multiple images for a job (gallery)."""

    job = models.ForeignKey(
        Job, on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(
        upload_to="marketplace/jobs/%Y/%m/", blank=True, null=True
    )
    # Allow URL for external images (e.g. Cloudinary)
    image_url = models.URLField(max_length=500, blank=True)
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"Image for {self.job.title} (#{self.order})"


class JobSubmission(models.Model):
    """Work submitted by a worker for a job. Owner approves/rejects; on approve, payment is released."""

    job = models.ForeignKey(
        Job, on_delete=models.CASCADE, related_name="submissions"
    )
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="marketplace_submissions"
    )
    quantity = models.PositiveIntegerField(default=1)
    submission_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=SUBMISSION_STATUS_CHOICES,
        default="submitted",
        db_index=True,
    )
    # Amount to pay worker (price * quantity)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(default=timezone.now)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["job", "status"]),
            models.Index(fields=["user", "status"]),
        ]
        # Prevent double submission: one approved/rejected per (job, user, quantity batch) is allowed; multiple "submitted" for same job by same user could be restricted in service layer
        constraints = []

    def __str__(self):
        return f"Submission by {self.user.username} for {self.job.title}"


class JobSubmissionFile(models.Model):
    """File or image attached to a submission."""

    submission = models.ForeignKey(
        JobSubmission, on_delete=models.CASCADE, related_name="files"
    )
    file = models.FileField(upload_to="marketplace/submissions/%Y/%m/")
    name = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name or str(self.file)
