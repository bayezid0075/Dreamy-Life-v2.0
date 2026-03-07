"""
ASGI middleware to catch "cannot schedule new futures after interpreter shutdown"
and return 503 so the server can shut down without 500s and clients can retry.
"""
import asyncio


def _is_shutdown_error(exc: BaseException) -> bool:
    msg = str(exc).lower()
    return "cannot schedule new futures" in msg or "interpreter shutdown" in msg


# 503 response bytes for API clients (JSON)
HTTP_503_BODY = b'{"detail":"Server is restarting. Please try again in a moment."}'
HTTP_503_HEADERS = [
    (b"content-type", b"application/json"),
    (b"content-length", str(len(HTTP_503_BODY)).encode()),
]


async def wrap_http_with_shutdown_handler(app, scope, receive, send):
    """Wrap an ASGI app to catch RuntimeError (interpreter shutdown) and return 503."""
    if scope["type"] != "http":
        await app(scope, receive, send)
        return
    try:
        await app(scope, receive, send)
    except RuntimeError as e:
        if _is_shutdown_error(e):
            try:
                await send({
                    "type": "http.response.start",
                    "status": 503,
                    "headers": HTTP_503_HEADERS,
                })
                await send({"type": "http.response.body", "body": HTTP_503_BODY})
            except (asyncio.CancelledError, OSError, RuntimeError):
                pass
        else:
            raise


def shutdown_safe_http_app(app):
    """Return an ASGI app that wraps `app` and returns 503 on interpreter shutdown RuntimeError."""

    async def wrapped(scope, receive, send):
        await wrap_http_with_shutdown_handler(app, scope, receive, send)

    return wrapped
