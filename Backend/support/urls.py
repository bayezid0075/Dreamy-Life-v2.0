from django.urls import path
from .views import SupportConversationListCreateView, SupportConversationDetailView

app_name = "support"

urlpatterns = [
    path("conversations/", SupportConversationListCreateView.as_view()),
    path("conversations/<int:pk>/", SupportConversationDetailView.as_view()),
]
