import sys
from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
)

environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    'corsheaders',
    # Local
    'core',
    'auth.apps.AuthConfig',
    'sources',
    'rag',
    'chat',
    'settings_app',
    'dashboard',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': env.db(
        'DATABASE_URL',
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
    ),
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': (
            'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'
        ),
    },
    {
        'NAME': ('django.contrib.auth.password_validation.MinimumLengthValidator'),
    },
    {
        'NAME': ('django.contrib.auth.password_validation.CommonPasswordValidator'),
    },
    {
        'NAME': ('django.contrib.auth.password_validation.NumericPasswordValidator'),
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173'],
)
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticated',),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
        *(('rest_framework.renderers.BrowsableAPIRenderer',) if DEBUG else ()),
    ),
    'DEFAULT_PARSER_CLASSES': ('rest_framework.parsers.JSONParser',),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

# Google OAuth (Sign in with Google — Web client ID)
GOOGLE_OAUTH_CLIENT_ID = env('GOOGLE_OAUTH_CLIENT_ID', default='')
GOOGLE_OAUTH_CLIENT_SECRET = env('GOOGLE_OAUTH_CLIENT_SECRET', default='')
GOOGLE_DRIVE_REDIRECT_URI = env(
    'GOOGLE_DRIVE_REDIRECT_URI',
    default='http://localhost:8000/api/sources/google/callback/',
)
GOOGLE_TOKEN_ENCRYPTION_KEY = env('GOOGLE_TOKEN_ENCRYPTION_KEY', default='')
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:5173')

# RAG / Chat (OpenAI)
OPENAI_API_KEY = env('OPENAI_API_KEY', default='')
RAG_EMBEDDING_MODEL = env('RAG_EMBEDDING_MODEL', default='text-embedding-3-small')
RAG_CHAT_MODEL = env('RAG_CHAT_MODEL', default='gpt-4o-mini')
RAG_CHUNK_SIZE = env.int('RAG_CHUNK_SIZE', default=512)
RAG_CHUNK_OVERLAP = env.int('RAG_CHUNK_OVERLAP', default=128)
RAG_TOP_K = env.int('RAG_TOP_K', default=5)
RAG_MAX_CITATIONS = env.int('RAG_MAX_CITATIONS', default=3)
RAG_RETRIEVAL_CANDIDATES = env.int('RAG_RETRIEVAL_CANDIDATES', default=20)

# Celery
CELERY_BROKER_URL = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://localhost:6379/0')
CELERY_TIMEZONE = TIME_ZONE
CELERY_TASK_TRACK_STARTED = True
# prefork/spawn pools break on Windows (ValueError unpacking _loc in trace.py)
if sys.platform == 'win32':
    CELERY_WORKER_POOL = 'solo'
CELERY_BEAT_SCHEDULE = {
    'sync-google-drive-every-5-minutes': {
        'task': 'sources.tasks.sync_all_google_drive_connections',
        'schedule': 300.0,
    },
    'index-pending-documents-every-minute': {
        'task': 'rag.tasks.index_pending_documents',
        'schedule': 60.0,
    },
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(
        minutes=env.int('JWT_ACCESS_TOKEN_LIFETIME_MINUTES', default=60),
    ),
    'REFRESH_TOKEN_LIFETIME': timedelta(
        days=env.int('JWT_REFRESH_TOKEN_LIFETIME_DAYS', default=7),
    ),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Askyy API',
    'DESCRIPTION': 'REST API documentation for the Askyy backend.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Email (Google SMTP / Gmail)
EMAIL_SUBJECT_PREFIX = env('EMAIL_SUBJECT_PREFIX', default='Askyy ')
SIGNUP_OTP_LIFETIME_MINUTES = env.int('SIGNUP_OTP_LIFETIME_MINUTES', default=10)
SIGNUP_OTP_MAX_ATTEMPTS = env.int('SIGNUP_OTP_MAX_ATTEMPTS', default=5)

EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = env(
    'DEFAULT_FROM_EMAIL', default=EMAIL_HOST_USER or 'noreply@askyy.local'
)

if EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
elif DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Production security settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31_536_000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
