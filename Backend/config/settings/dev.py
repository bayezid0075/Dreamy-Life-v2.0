from .base import *  # noqa: F401,F403

# Route through new config package entrypoints.
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

