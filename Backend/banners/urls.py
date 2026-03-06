from django.urls import path
from . import views

urlpatterns = [
    path("", views.public_banner_list),
    path("admin/", views.AdminBannerListCreateView.as_view()),
    path("admin/<int:pk>/", views.AdminBannerDetailView.as_view()),
]
