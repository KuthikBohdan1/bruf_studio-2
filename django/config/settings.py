"""Django settings for the studio site.

All environment-specific values are read from the environment (see `.env.example`
in the repository root). Nothing that differs between machines is hardcoded here.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent

# The repository-root .env is the single source of truth; docker compose reads
# the same file, so container and host runs stay in sync.
load_dotenv(REPO_ROOT / ".env")
load_dotenv(BASE_DIR / ".env")


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-dev-only-key-change-me")

DEBUG = env_bool("DEBUG", False)

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "127.0.0.1,localhost")

# Public origin of the site — used for canonical URLs, Open Graph tags and sitemap.
SITE_URL = os.getenv("SITE_URL", "http://127.0.0.1:8008").rstrip("/")

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", SITE_URL)


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "main",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

# Vite writes its production build here (see front/vite.config.ts). The directory
# is both a template dir (Django renders index.html to inject SEO tags) and a
# static dir (hashed JS/CSS bundles are served from /static/). The path is
# overridable so the Docker image can keep the build outside the mounted code.
FRONTEND_DIST = Path(os.getenv("FRONTEND_DIST", BASE_DIR / "frontend_dist"))

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [FRONTEND_DIST],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database — PostgreSQL when configured, SQLite otherwise (zero-setup local runs).

if os.getenv("POSTGRES_DB") and os.getenv("POSTGRES_USER"):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("POSTGRES_DB"),
            "USER": os.getenv("POSTGRES_USER"),
            "PASSWORD": os.getenv("POSTGRES_PASSWORD", ""),
            "HOST": os.getenv("POSTGRES_HOST", "127.0.0.1"),
            "PORT": os.getenv("POSTGRES_PORT", "5432"),
            # Reuse connections between requests instead of reconnecting each time.
            "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


LANGUAGE_CODE = os.getenv("LANGUAGE_CODE", "uk-ua")
TIME_ZONE = os.getenv("TIME_ZONE", "Europe/Kyiv")
USE_I18N = True
USE_TZ = True


# Static & media files

STATIC_URL = "/static/"
STATIC_ROOT = Path(os.getenv("STATIC_ROOT", BASE_DIR / "staticfiles"))
STATICFILES_DIRS = [FRONTEND_DIST] if FRONTEND_DIST.exists() else []

MEDIA_URL = "/media/"
MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", BASE_DIR / "media"))


def immutable_file_test(path: str, url: str) -> bool:
    """Vite emits `name-<hash>.js`; those bundles never change, so cache forever."""
    import re

    return bool(re.match(r"^.+[.-][0-9a-zA-Z_-]{8,}\.[a-zA-Z0-9]+$", url))


STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # No manifest: Vite already content-hashes every asset it emits.
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

WHITENOISE_IMMUTABLE_FILE_TEST = immutable_file_test
WHITENOISE_MAX_AGE = 3600
# Already-compressed formats gain nothing from another gzip/brotli pass.
WHITENOISE_SKIP_COMPRESS_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "zip", "gz", "woff", "woff2"]


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Uploads are small site images; keep them out of memory-heavy territory.
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024


REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": (
        ["rest_framework.renderers.JSONRenderer", "rest_framework.renderers.BrowsableAPIRenderer"]
        if DEBUG
        else ["rest_framework.renderers.JSONRenderer"]
    ),
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        # Contact form is public and unauthenticated — rate limit it.
        "message": os.getenv("MESSAGE_THROTTLE_RATE", "10/hour"),
        "subscribe": os.getenv("SUBSCRIBE_THROTTLE_RATE", "10/hour"),
    },
    "UNAUTHENTICATED_USER": None,
}


# The API is same-origin in production; CORS only matters for the Vite dev server.
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
CORS_URLS_REGEX = r"^/api/.*$"


# Cache for the aggregated /api/site/ payload, invalidated by the signals in
# main/signals.py whenever content changes in the admin.
#
# File-based rather than in-process on purpose: gunicorn runs several worker
# processes, and a LocMemCache gives each of them a private copy. An admin edit
# is handled by one worker, so only that worker's cache gets cleared and the
# others keep serving the old payload until it expires — the site then looks
# like it changes at random depending on which worker answers.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.filebased.FileBasedCache",
        "LOCATION": os.getenv("CACHE_DIR", str(BASE_DIR / ".cache")),
        "TIMEOUT": int(os.getenv("CACHE_TIMEOUT", "3600")),
    }
}


# New leads go to this Telegram chat when both are set (main/notify.py).
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# Security headers (only meaningful when the site is served over HTTPS).
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True

if not DEBUG:
    # TLS is terminated by the reverse proxy (Caddy), so the scheme of the
    # original request only survives in this header.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = env_bool("COOKIE_SECURE", False)
    CSRF_COOKIE_SECURE = env_bool("COOKIE_SECURE", False)

    # Caddy already redirects :80 to :443; this covers the app if it is ever put
    # behind a proxy that does not.
    SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", False)

    # HSTS is a promise browsers cache for the full duration — a domain that
    # later loses HTTPS becomes unreachable, with no click-through. Leave it at
    # 0 until the certificate is confirmed working, then raise it in .env.
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "0"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
    SECURE_HSTS_PRELOAD = env_bool("SECURE_HSTS_PRELOAD", False)


LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
