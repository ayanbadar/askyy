# Askyy

Monorepo for the Askyy chatbot platform (Django backend + React frontend).

## Dev setup

From the repo root, run once after cloning:

```bash
./scripts/setup-dev.sh
```

This installs Python dev tools, frontend dependencies, and **registers the pre-commit git hook** so checks run on every commit.

Manual setup (equivalent):

```bash
pip install -r requirements-dev.txt
cd frontend && npm install && cd ..
pre-commit install --install-hooks
```

Run hooks manually on all files:

```bash
pre-commit run --all-files
```

## Projects

- [backend/README.md](backend/README.md) — Django API
- [frontend/README.md](frontend/README.md) — React + Vite UI
