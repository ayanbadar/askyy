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
| POST   | `/api/auth/signup/` | None     | Register account, send email OTP |
| POST   | `/api/auth/signup/verify/` | None | Verify OTP, activate account & login |
| POST   | `/api/auth/signup/resend/` | None | Resend signup verification code |
| POST   | `/api/auth/refresh/`| None     | Refresh access token           |
| GET    | `/api/auth/me/`     | Bearer   | Current user profile           |
| GET    | `/api/sources/google/status/` | Bearer | Google Drive connection status |
| GET    | `/api/sources/google/connect/` | Bearer | Start Google Drive OAuth URL |
| GET    | `/api/sources/google/callback/` | None | OAuth callback (Google redirect) |
| POST   | `/api/sources/google/disconnect/` | Bearer | Disconnect Google Drive |
| GET    | `/api/sources/google/folders/` | Bearer | List My Drive folders |
| GET/PUT | `/api/sources/google/folders/selection/` | Bearer | Get/save selected folders |
| POST   | `/api/sources/google/sync/` | Bearer | Run sync now |

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

Signup (OTP is sent by a Celery worker; without a worker, check worker logs or use resend):

```bash
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"username": "jane", "email": "jane@example.com", "password": "secure-pass-123"}'

curl -X POST http://localhost:8000/api/auth/signup/verify/ \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@example.com", "otp": "123456"}'
```

Start a Celery worker so signup OTP emails are delivered:

```bash
celery -A config worker -l info
```

### Email (signup OTP via Google SMTP)

For production and real email delivery, configure Gmail SMTP in `backend/.env`:

1. Enable 2-Step Verification on your Google account.
2. Create an [App Password](https://support.google.com/accounts/answer/185833) for Mail.
3. Set:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=you@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=you@gmail.com
```

Without these variables, `DEBUG=True` uses the console email backend (OTP appears in the Celery worker terminal when a worker is running).

### Google SSO setup

1. In [Google Cloud Console](https://console.cloud.google.com/), create an **OAuth 2.0 Client ID** (type: **Web application**).
2. Add **Authorized JavaScript origins**: `http://localhost:5173`, `http://127.0.0.1:5173`
3. Copy the **Client ID** into both env files:
   - `backend/.env` → `GOOGLE_OAUTH_CLIENT_ID=...`
   - `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...` (same value)
4. Restart backend and frontend dev servers.

### Google Drive setup (Source page)

1. In Google Cloud Console, enable the **Google Drive API** for the same project.
2. Use the same OAuth Web client, and add **Authorized redirect URI**:
   - `http://localhost:8000/api/sources/google/callback/`
3. Set in `backend/.env`:
   - `GOOGLE_OAUTH_CLIENT_ID` — same as sign-in
   - `GOOGLE_OAUTH_CLIENT_SECRET` — from the OAuth client
   - `GOOGLE_DRIVE_REDIRECT_URI=http://localhost:8000/api/sources/google/callback/`
   - `GOOGLE_TOKEN_ENCRYPTION_KEY` — generate with:
     ```bash
     python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
     ```
   - `FRONTEND_URL=http://localhost:5173`
4. Start Redis (`docker compose up -d redis`) for background sync.
5. Run Celery worker + beat (syncs every 5 minutes):
   ```bash
   celery -A config worker -l info
   celery -A config beat -l info
   ```
   On Windows, the worker uses the `solo` pool automatically (prefork is unsupported).
   Manual sync: `python manage.py sync_google_drive`

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

See **[DEPLOYMENT.md](../DEPLOYMENT.md)** for the full Oracle VM + Docker + GitHub Actions guide.

Quick local production env vars:

```env
DEBUG=False
USE_HTTPS=False
SECRET_KEY=<long-random-secret>
ALLOWED_HOSTS=yourdomain.com
DATABASE_URL=postgres://user:pass@host:5432/askyy
CORS_ALLOWED_ORIGINS=https://yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```
