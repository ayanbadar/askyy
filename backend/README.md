# Askyy Backend

Minimal Django REST API boilerplate.

## Stack

- **Django 5** — web framework
- **Django REST Framework** — JSON API
- **django-cors-headers** — frontend CORS
- **django-environ** — environment-based configuration
- **drf-spectacular** — OpenAPI 3 / Swagger documentation
- **djangorestframework-simplejwt** — JWT authentication

## Getting started

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver 8000
```

API base URL: [http://localhost:8000/api](http://localhost:8000/api)

Update the frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Create an admin user:

```bash
python manage.py createsuperuser
```

## API documentation

Interactive Swagger UI: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)

ReDoc: [http://localhost:8000/api/docs/redoc/](http://localhost:8000/api/docs/redoc/)

OpenAPI schema: [http://localhost:8000/api/schema/](http://localhost:8000/api/schema/)

## API endpoints

| Method | Path                | Auth     | Description                    |
| ------ | ------------------- | -------- | ------------------------------ |
| GET    | `/api/health/`      | None     | Health check                   |
| POST   | `/api/auth/google/` | None     | Google ID token → JWT tokens   |
| POST   | `/api/auth/login/`  | None     | Obtain access & refresh tokens |
| POST   | `/api/auth/refresh/`| None     | Refresh access token           |
| GET    | `/api/auth/me/`     | Bearer   | Current user profile           |

### Example request

```bash
curl http://localhost:8000/api/health/
```

Login (use a user from `createsuperuser` or another Django user):

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'
```

### Google SSO setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create an **OAuth 2.0 Client ID** (type: **Web application**).
2. Add **Authorized JavaScript origins**: `http://localhost:5173`, `http://127.0.0.1:5173`
3. Copy the **Client ID** into both env files:
   - `backend/.env` → `GOOGLE_OAUTH_CLIENT_ID=...`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...` (same value)
4. Restart backend and frontend dev servers.

Call protected endpoints with the access token:

```bash
curl http://localhost:8000/api/some-endpoint/ \
  -H "Authorization: Bearer <access-token>"
```

## Project structure

```
backend/
├── config/                 # Project configuration
│   ├── settings.py         # All settings (env-driven via DEBUG)
│   ├── urls.py             # Root URL routing
│   ├── wsgi.py
│   └── asgi.py
├── auth/                   # JWT login & token refresh
├── core/                   # Health check + shared API utilities
├── manage.py
└── requirements.txt
```

## Best practices included

- **Single settings file** — environment toggles via `DEBUG` and `.env`
- **Environment variables** — secrets and config via `.env`
- **CORS** — configured for the Vite dev server (`localhost:5173`)
- **Normalized errors** — `{ "message": "..." }` for frontend compatibility
- **JWT auth** — `IsAuthenticated` by default; public views opt in with `AllowAny`

Add domain apps (e.g. `users`, `products`) under `backend/` as your project grows.

## Linting & formatting

Ruff config lives in `backend/pyproject.toml`. Dev tools are installed once from the **repo root**:

```bash
# From repo root
pip install -r requirements-dev.txt
pre-commit install

# Run manually on backend
cd backend && ruff check . && ruff format .
```

## Production

Set environment variables:

```env
DJANGO_SETTINGS_MODULE=config.settings
DEBUG=False
SECRET_KEY=<long-random-secret>
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgres://user:pass@host:5432/askyy
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

Then:

```bash
python manage.py collectstatic --noinput
python manage.py migrate
gunicorn config.wsgi:application
```
