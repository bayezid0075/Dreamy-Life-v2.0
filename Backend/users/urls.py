from django.urls import path
from .views import (
    RegisterView, LoginView, MyDownlinesView, UserInfoUpdateView,
    PasswordResetRequestView, PasswordResetVerifyView, PasswordResetView
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("downlines/", MyDownlinesView.as_view(), name="downlines"),
    path("userinfo/", UserInfoUpdateView.as_view(), name="userinfo"),
    path("password-reset/request/", PasswordResetRequestView.as_view(), name="password_reset_request"),
    path("password-reset/verify/", PasswordResetVerifyView.as_view(), name="password_reset_verify"),
    path("password-reset/reset/", PasswordResetView.as_view(), name="password_reset"),
]
