# Import celery app only if Redis is available
try:
    from .celery import app as celery_app
    __all__ = ("celery_app",)
except Exception:
    # Redis not available, skip celery
    celery_app = None
    __all__ = ()