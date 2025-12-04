from django.urls import path
from .views import RegisterView, LoginView, MyDownlinesView, UserInfoUpdateView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("downlines/", MyDownlinesView.as_view(), name="downlines"),
    path("userinfo/", UserInfoUpdateView.as_view(), name="userinfo"),
]
