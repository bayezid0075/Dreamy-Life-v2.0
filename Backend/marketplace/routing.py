from django.urls import path
from . import consumers

websocket_urlpatterns = [
    path("ws/marketplace/", consumers.MarketplaceConsumer.as_asgi()),
]
