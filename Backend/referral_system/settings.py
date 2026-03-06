import os
from pathlib import Path
import environ

env = environ.Env(DEBUG=(bool, False))
BASE_DIR = Path(__file__).resolve().parent.parent
environ.Env.read_env(os.path.join(BASE_DIR, ".env"))
SECRET_KEY = env("SECRET_KEY", default="unsafe-secret")
DEBUG = env("DEBUG", default="True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "users",
    "memberships",
    "wallets.apps.WalletsConfig",
    "notifications",
    "referral",
    "vendors",
    "marketplace",
    "recharge",
    "channels",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "referral_system.middleware.DisableCSRFForAPI",  # CSRF for non-API; /api/ exempt
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "referral_system.urls"
WSGI_APPLICATION = "referral_system.wsgi.application"
ASGI_APPLICATION = "referral_system.asgi.application"

DATABASES = {
     'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',  # Or 'django.db.backends.postgresql' for psycopg
        'NAME': 'dreamy_life_v2.0_data',  # Replace with your PostgreSQL database name
        'USER': 'postgres',      # Replace with your PostgreSQL username (e.g., 'postgres')
        'PASSWORD': '2516',  # Replace with your PostgreSQL user's password
        'HOST': 'localhost',
        'PORT': '5432',               # Default PostgreSQL port
    }
}

AUTH_USER_MODEL = "users.User"

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": ("rest_framework_simplejwt.authentication.JWTAuthentication",),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.AnonRateThrottle","rest_framework.throttling.UserRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {"anon": "20/minute","user": "2000/day"}
}

# JWT Token Settings - Extended lifetime to prevent automatic logout
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=365),  # 1 year access token
    "REFRESH_TOKEN_LIFETIME": timedelta(days=3650),  # 10 years refresh token
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
    "UPDATE_LAST_LOGIN": True,
}

# Celery - Make optional for development
try:
    CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = CELERY_BROKER_URL
    CELERY_ENABLED = True
except Exception:
    # Disable Celery if Redis is not available
    CELERY_ENABLED = False
    CELERY_BROKER_URL = None
    CELERY_RESULT_BACKEND = None

# Static
STATIC_URL = "/static/"

# Media files
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# File upload settings - increase limits for large uploads
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB


CORS_ALLOW_ALL_ORIGINS = True
# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.0.214:3000",
]
# Allow dev servers on any port for these hosts (useful for Next.js, Vite, etc.)
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
    r"^http://192\.168\.0\.214:\d+$",
]
ALLOWED_HOSTS = ["*"]
# Allow credentials (cookies, authorization headers, etc.)
CORS_ALLOW_CREDENTIALS = True

# Allow all headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Allow all methods
CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

# For development, you can also allow all origins (not recommended for production)
# CORS_ALLOW_ALL_ORIGINS = True

# Email Configuration
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = env("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default=EMAIL_HOST_USER or "noreply@dreamylife.com")

# Frontend URL for password reset links
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")

# Backend URL for absolute image URLs
BACKEND_URL = env("BACKEND_URL", default="http://localhost:8000")

# Superadmin: comma-separated list of emails allowed to access the superadmin panel
SUPERADMIN_ALLOWED_EMAILS = [e.strip().lower() for e in env("SUPERADMIN_ALLOWED_EMAILS", default="").split(",") if e.strip()]

# UddoktaPay (membership payments) — no spaces; sandbox key with sandbox URL
UDDOKTAPAY_API_KEY = (env("UDDOKTAPAY_API_KEY", default="") or "").strip()
UDDOKTAPAY_BASE_URL = (env("UDDOKTAPAY_BASE_URL", default="https://sandbox.uddoktapay.com") or "").strip().rstrip("/") or "https://sandbox.uddoktapay.com"
# Optional: use a public base URL for redirect/cancel (required for sandbox if frontend is localhost)
# Example: set to your ngrok URL, e.g. https://abc123.ngrok.io
UDDOKTAPAY_REDIRECT_BASE_URL = (env("UDDOKTAPAY_REDIRECT_BASE_URL", default="") or "").strip().rstrip("/")

# Mobile Recharge API (third-party)
# MRC: access_id, access_pass, service=MRC, operator, number_type, number, amount, refid
# Operator: Grameenphone=3/7, Banglalink=4/9, Robi=8, Airtel=6, TeleTalk=5
# Number Type: Prepaid=1, Postpaid=2, Skitto=3, PowerLoad/G.Store/Amar Offer=4
RECHARGE_API_URL = (env("RECHARGE_API_URL", default="http://118.179.129.98/myportal/api/rechargeapi/recharge_api_thirdparty.php") or "").strip().rstrip("/")
# Prefer access_id/access_pass (matches API param names); fallback to USERNAME/PASSWORD
RECHARGE_ACCESS_ID = (env("RECHARGE_ACCESS_ID", default="") or "").strip()
RECHARGE_ACCESS_PASS = (env("RECHARGE_ACCESS_PASS", default="") or "").strip()
RECHARGE_API_USERNAME = (env("RECHARGE_API_USERNAME", default="") or "").strip()
RECHARGE_API_PASSWORD = (env("RECHARGE_API_PASSWORD", default="") or "").strip()

# Drive Offer (Offer Pack) API - same base URL; set DRIVE_OFFER_ACCESS_ID & DRIVE_OFFER_ACCESS_PASS in .env
DRIVE_OFFER_API_URL = (env("DRIVE_OFFER_API_URL", default="") or "").strip().rstrip("/") or RECHARGE_API_URL
DRIVE_OFFER_ACCESS_ID = (env("DRIVE_OFFER_ACCESS_ID", default="") or "").strip()
DRIVE_OFFER_ACCESS_PASS = (env("DRIVE_OFFER_ACCESS_PASS", default="") or "").strip()

# Channels (WebSocket) - Marketplace live updates
# Use in-memory layer by default so WebSockets work without Redis. Set USE_REDIS_CHANNELS=true
# and REDIS_URL when Redis is available (e.g. production).
_use_redis_channels = env("USE_REDIS_CHANNELS", default="false").lower() in ("true", "1", "yes")
_redis_url = env("REDIS_URL", default="redis://localhost:6379/1")
if _use_redis_channels and _redis_url:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels_redis.core.RedisChannelLayer",
            "CONFIG": {"hosts": [_redis_url]},
        }
    }
else:
    CHANNEL_LAYERS = {
        "default": {"BACKEND": "channels.layers.InMemoryChannelLayer"},
    }