"""
Send WebSocket events for marketplace live updates.
Uses channel layer to broadcast to 'marketplace' group.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def broadcast_marketplace_event(event_type: str, **payload):
    """Broadcast to all connected marketplace WebSocket clients."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            "marketplace",
            {
                "type": "marketplace_event",
                "event": event_type,
                **payload,
            },
        )
    except Exception:
        pass
