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
    "users",
    "memberships",
    "wallets",
    "notifications",
    "referral",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
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