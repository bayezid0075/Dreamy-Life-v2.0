from django.urls import path
from . import views

urlpatterns = [
    path("", views.notification_list),
    path("unread-count/", views.notification_unread_count),
    path("<int:pk>/mark-read/", views.notification_mark_read),
    path("mark-all-read/", views.notification_mark_all_read),
    path("device-tokens/", views.notification_device_tokens),
]
