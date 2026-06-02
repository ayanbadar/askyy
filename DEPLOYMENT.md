# Askyy — Production deployment (Oracle VM + GitHub Actions)

Deploy **Askyy** on the same Oracle VM as **hotel10**, isolated via a separate Docker Compose project (`askyy`), separate networks/volumes, and non-conflicting ports.

| App | Frontend | API | Notes |
|-----|----------|-----|--------|
| hotel10 | **3000** | **7000** | Leave unchanged |
| Askyy | **3001** | **8000** | This guide |

---

## Architecture

```text
Internet / Oracle security list
        │
        ├── :3000  → hotel10-frontend (unchanged)
        ├── :7000  → hotel10 API (unchanged)
        ├── :3001  → askyy-frontend (nginx → Vite build)
        └── :8000  → askyy-backend (Gunicorn)

Docker project "askyy" (internal network askyy-internal)
  ├── pgvector (Postgres 16 + vector extension)
  ├── redis
  ├── backend
  ├── celery-worker
  ├── celery-beat
  └── frontend
```

Images are built in **GitHub Actions**, pushed to **GHCR**, and pulled on the VM on each push to `main`.

---

## Part 1 — One-time VM setup

### 1.1 SSH into the VM

From your machine (same key you use for hotel10):

```bash
ssh -i "ssh-private-key.key" ubuntu@152.67.28.191
```

### 1.2 Confirm Docker

```bash
docker --version
docker compose version
```

If missing, install Docker Engine + Compose plugin for Ubuntu (official Docker docs).

### 1.3 Create app directory and clone the repo

```bash
sudo mkdir -p /opt/askyy
sudo chown ubuntu:ubuntu /opt/askyy
cd /opt/askyy
git clone https://github.com/YOUR_GITHUB_USERNAME/askyy.git .
```

Use SSH clone if the repo is private.

### 1.4 Create production `.env`

```bash
cp .env.production.example .env
nano .env
```

**Required edits:**

| Variable | Example | Notes |
|----------|---------|--------|
| `GHCR_IMAGE_PREFIX` | `ghcr.io/yourusername` | Lowercase GitHub username |
| `POSTGRES_PASSWORD` | long random string | DB password |
| `SECRET_KEY` | 50+ char random | Django secret |
| `ALLOWED_HOSTS` | `152.67.28.191,your.domain` | Comma-separated |
| `CORS_ALLOWED_ORIGINS` | `http://152.67.28.191:3001` | Frontend origin |
| `CSRF_TRUSTED_ORIGINS` | same as CORS | Admin / forms |
| `VITE_API_BASE_URL` | `http://152.67.28.191:8000/api` | Baked into frontend image in CI |
| `FRONTEND_URL` | `http://152.67.28.191:3001` | Email links, OAuth |
| `GOOGLE_DRIVE_REDIRECT_URI` | `http://152.67.28.191:8000/api/sources/google/callback/` | Google Cloud Console |
| `OPENAI_API_KEY` | `sk-...` | RAG chat |
| `GOOGLE_OAUTH_*` | from Google Cloud | SSO + Drive |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | Fernet key | See backend README |
| `EMAIL_*` | Gmail app password | Signup OTP |

Keep `USE_HTTPS=False` until you put **Caddy/Nginx + TLS** in front; then set `USE_HTTPS=True` and use `https://` URLs everywhere.

### 1.5 Oracle Cloud — open ports

In **Networking → Virtual cloud network → Security list → Ingress rules**, allow TCP from `0.0.0.0/0` (or your IP only):

- **8000** — Askyy API
- **3001** — Askyy frontend

Do **not** change hotel10 rules for 3000 / 7000.

### 1.6 GHCR — allow the VM to pull images

After the first GitHub Actions build (Part 2), images live at:

- `ghcr.io/YOUR_USERNAME/askyy-backend`
- `ghcr.io/YOUR_USERNAME/askyy-frontend`

**Option A (simplest):** In GitHub → **Packages** → each package → **Package settings** → **Change visibility** → **Public**. Then the VM can `docker pull` without login.

**Option B (private packages):** On the VM, create a GitHub PAT with `read:packages` and login once:

```bash
echo 'YOUR_GITHUB_PAT' | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 1.7 First manual start (before CI, or if CI is not ready)

On the VM:

```bash
cd /opt/askyy
chmod +x backend/docker-entrypoint.sh scripts/vm-update.sh

# Build locally (slow on free tier) OR wait for CI and only pull
docker compose -f docker-compose.prod.yml --env-file .env pull
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

Check:

```bash
docker compose -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:8000/api/health/
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001/
```

### 1.8 Create Django admin user

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 1.9 Google Cloud OAuth

Add authorized redirect URIs and JavaScript origins for your **production** IP/domain (not only localhost). Match `GOOGLE_DRIVE_REDIRECT_URI`, `FRONTEND_URL`, and `VITE_*` values.

---

## Part 2 — GitHub repository configuration

### 2.1 Repository variables

**Settings → Secrets and variables → Actions → Variables**

| Name | Example |
|------|---------|
| `VITE_API_BASE_URL` | `http://152.67.28.191:8000/api` |

Must match production API URL (used when building the frontend image).

### 2.2 Repository secrets

**Settings → Secrets and variables → Actions → Secrets**

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | `152.67.28.191` |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | Full private key file contents (PEM) |
| `SSH_APP_PATH` | Optional; default `/opt/askyy` |
| `VITE_GOOGLE_CLIENT_ID` | Same as `GOOGLE_OAUTH_CLIENT_ID` / frontend Google button |

`GITHUB_TOKEN` is provided automatically for pushing to GHCR.

### 2.3 Workflows in this repo

| File | Trigger | Purpose |
|------|---------|---------|
| `.github/workflows/ci.yml` | PR + push to `main` | Ruff, ESLint, build smoke, compose validate |
| `.github/workflows/deploy-production.yml` | Push to `main`, manual | Build images → push GHCR → SSH deploy |

### 2.4 First deploy from GitHub

1. Merge deployment files to `main`.
2. Actions → **Deploy Production** → confirm **build-and-push** and **deploy** succeed.
3. On the VM, verify:

```bash
cd /opt/askyy
docker compose -f docker-compose.prod.yml ps
```

### 2.5 Manual redeploy on VM

```bash
cd /opt/askyy
./scripts/vm-update.sh latest
# or a specific SHA from GitHub Actions:
./scripts/vm-update.sh abc123def456...
```

---

## Part 3 — Repo files added for production

| Path | Purpose |
|------|---------|
| `backend/Dockerfile` | Gunicorn API image |
| `backend/docker-entrypoint.sh` | `migrate` + `collectstatic` before start |
| `frontend/Dockerfile` | Vite build + nginx |
| `frontend/nginx.conf` | SPA routing |
| `docker-compose.prod.yml` | Full production stack |
| `.env.production.example` | Template for VM `.env` |
| `.dockerignore` | Smaller build context |
| `.github/workflows/ci.yml` | CI checks |
| `.github/workflows/deploy-production.yml` | Build + deploy pipeline |
| `scripts/vm-update.sh` | Pull/up on VM |

**Backend changes:**

- `gunicorn`, `whitenoise` in `requirements.txt`
- `USE_HTTPS`, `CSRF_TRUSTED_ORIGINS` in `config/settings.py` (HTTP on IP works with `USE_HTTPS=False`)

---

## Part 4 — Isolation from hotel10

Always use the prod compose file and project name:

```bash
cd /opt/askyy
docker compose -f docker-compose.prod.yml --env-file .env ps
```

hotel10 continues under its own directory (e.g. `/opt/containerd` or `/opt/hotel10`) and its own compose project. **Do not** attach Askyy services to hotel10 Postgres/Redis.

**Resource warning:** Free Oracle VMs are often ~1 GB RAM. Running both stacks plus Celery + pgvector may cause OOM. Monitor:

```bash
free -h
docker stats --no-stream
```

If needed, lower Celery `--concurrency` in `docker-compose.prod.yml` or stop beat on small VMs until you upgrade.

---

## Part 5 — HTTPS (optional, recommended later)

1. Point a domain A-record to `152.67.28.191`.
2. Install Caddy or Nginx on the host (ports 80/443).
3. Reverse-proxy:
   - `https://askyy.example.com` → `127.0.0.1:3001`
   - `https://api.askyy.example.com` → `127.0.0.1:8000`
4. Update `.env`: `USE_HTTPS=True`, `ALLOWED_HOSTS`, `CORS_*`, `CSRF_*`, `FRONTEND_URL`, `VITE_API_BASE_URL` (rebuild frontend in CI), Google OAuth URIs.
5. Close public 8000/3001 in Oracle security list; expose only 443.

---

## Part 6 — Troubleshooting

| Symptom | Check |
|---------|--------|
| `pull access denied` | GHCR public or `docker login ghcr.io` on VM |
| Frontend calls wrong API | Rebuild frontend: `VITE_API_BASE_URL` var in GitHub + redeploy |
| 502 / unhealthy backend | `docker compose logs backend --tail=100` |
| DB errors | `docker compose logs pgvector`; verify `POSTGRES_PASSWORD` |
| OTP emails not sent | `docker compose logs celery-worker`; verify `EMAIL_*` |
| Redirect loop | `USE_HTTPS=True` without TLS proxy — set `False` for plain HTTP |
| hotel10 slow | `docker stats`; reduce Askyy workers/concurrency |

**Logs:**

```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f celery-worker
```

**Restart one service:**

```bash
docker compose -f docker-compose.prod.yml restart backend
```

---

## Quick reference

```bash
# VM — status
cd /opt/askyy && docker compose -f docker-compose.prod.yml ps

# VM — update after CI
./scripts/vm-update.sh latest

# Local — validate compose
cp .env.production.example .env && docker compose -f docker-compose.prod.yml config
```
