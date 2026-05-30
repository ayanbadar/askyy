# Askyy Backend

Minimal Django REST API boilerplate.

## Stack

- **Django 5** — web framework
- **Django REST Framework** — JSON API
- **django-cors-headers** — frontend CORS
- **django-environ** — environment-based configuration

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

## API endpoints

| Method | Path           | Description  |
| ------ | -------------- | ------------ |
| GET    | `/api/health/` | Health check |

### Example request

```bash
curl http://localhost:8000/api/health/
```

## Project structure

```
backend/
├── config/                 # Project configuration
│   ├── settings.py         # All settings (env-driven via DEBUG)
│   ├── urls.py             # Root URL routing
│   ├── wsgi.py
│   └── asgi.py
├── core/                   # Health check + shared API utilities
├── manage.py
└── requirements.txt
```

## Best practices included

- **Single settings file** — environment toggles via `DEBUG` and `.env`
- **Environment variables** — secrets and config via `.env`
- **CORS** — configured for the Vite dev server (`localhost:5173`)
- **Normalized errors** — `{ "message": "..." }` for frontend compatibility

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
