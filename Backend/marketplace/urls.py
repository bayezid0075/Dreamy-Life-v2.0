from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"jobs", views.JobViewSet, basename="job")
router.register(r"public", views.PublicJobViewSet, basename="public-job")
router.register(r"submissions", views.JobSubmissionViewSet, basename="submission")
router.register(r"admin/jobs", views.AdminJobViewSet, basename="admin-job")

urlpatterns = [
    path("", include(router.urls)),
    path(
        "submissions/<int:submission_id>/review/",
        views.JobSubmissionReviewView.as_view(),
        name="submission-review",
    ),
    path(
        "wallet-check/",
        views.MarketplaceWalletCheckView.as_view(),
        name="wallet-check",
    ),
    path(
        "job-image-upload/",
        views.MarketplaceJobImageUploadView.as_view(),
        name="job-image-upload",
    ),
]
