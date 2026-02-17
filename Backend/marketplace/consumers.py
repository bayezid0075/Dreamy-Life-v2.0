"""
WebSocket consumer for marketplace live updates.
Broadcasts: job_approved, job_rejected, submission_approved, submission_rejected.
Frontend can subscribe and invalidate queries / show toasts.
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer


class MarketplaceConsumer(AsyncWebsocketConsumer):
    """Subscribe to group 'marketplace' for broadcast events."""

    async def connect(self):
        self.room_group_name = "marketplace"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        # Optional: handle client messages (e.g. ping)
        pass

    async def marketplace_event(self, event):
        """Broadcast from channel_layer.group_send('marketplace', {...})."""
        await self.send(text_data=json.dumps(event))
