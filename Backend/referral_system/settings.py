import os
from pathlib import Path
import environ

env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env()  # reads .env

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = env("SECRET_KEY", default="unsafe-secret")
DEBUG = env("DEBUG", default="True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
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
    "wallets",
    "notifications",
    "referral",
    "vendors",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "referral_system.urls"
WSGI_APPLICATION = "referral_system.wsgi.application"

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

# CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

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