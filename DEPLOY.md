# Docker & VPS Deploy Guide

This project uses **Docker Compose** for local development and **GitHub Actions** for automatic deploy to a VPS on push to `master`.

**Single `.env`:** The whole project uses one `.env` file at the **project root**. Docker Compose and Django (Backend) both read from it. See `.env.example` for all variables.

---

## Local Docker Setup

### Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)

### Steps

1. **Create `.env` from example** (project root only):

   ```bash
   cp .env.example .env
   ```

   Edit `.env`: set `POSTGRES_PASSWORD`, `SECRET_KEY`, and any URLs or API keys. All variables are in this one file.

2. **Start dev stack**:

   ```bash
   docker compose -f docker-compose.dev.yml up -d --build
   ```

   First start may take a minute while the frontend runs `npm ci` inside the container. Wait until logs show the dev server listening.

3. **Apply migrations (first time or after model changes)**:

   ```bash
   docker compose -f docker-compose.dev.yml exec backend python manage.py migrate --noinput
   ```

   - Backend: http://localhost:8888  
   - Frontend: http://localhost:3333  
   - Postgres: port 5432

4. **Useful commands**:

   - Logs: `docker compose -f docker-compose.dev.yml logs -f`
   - Stop: `docker compose -f docker-compose.dev.yml down`

### Optional: run production build locally

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
```

---

## VPS Deploy (existing CI/CD)

Deploy is handled by [.github/workflows/deploy.yml](.github/workflows/deploy.yml):

- **Trigger:** Push to `master`
- **Actions:** SSH to VPS → `git pull` → `docker compose -f docker-compose.prod.yml up -d --build` → run migrations

### One-time VPS setup

1. **Install Docker** on the VPS (e.g. Ubuntu):

   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```

2. **Clone repo** (use the path you will set as `VPS_APP_DIR`):

   ```bash
   git clone <your-repo-url> /home/ubuntu/dreamy-life
   cd /home/ubuntu/dreamy-life
   ```

3. **Create `.env`** in project root with production values (same file as local; see `.env.example`):

   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
   - `BACKEND_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL` (your domain URLs)
   - Django `SECRET_KEY`, email, and any payment/API keys

4. **First run** (optional; CI/CD will also do this on first deploy):

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   docker compose -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
   ```

### GitHub Actions secrets

In repo **Settings → Secrets and variables → Actions**, add:

| Secret       | Description |
|-------------|-------------|
| `VPS_HOST`  | VPS IP or hostname |
| `VPS_USER`  | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Full private SSH key content |
| `VPS_APP_DIR` | Absolute path to app on VPS (e.g. `/home/ubuntu/dreamy-life`) |

After that, **pushing to `master`** will automatically deploy (pull, build, migrate).

### Optional: domain & HTTPS

- Expose ports 80/443 with **Nginx** (or Caddy) as reverse proxy.
- Point domain to VPS, then proxy:
  - Frontend → `http://127.0.0.1:3333`
  - Backend/API → `http://127.0.0.1:8888`
- Use **Let’s Encrypt** (e.g. certbot) for SSL.

---

### Troubleshooting

**Build fails with `rpc error: code = Unavailable desc = error reading from server: EOF`**

Docker BuildKit/daemon dropped the connection during a long build (common with the frontend image).

1. Restart Docker Desktop, then run again:  
   `docker compose -f docker-compose.dev.yml up -d --build`
2. If it still fails, give Docker more memory (Docker Desktop → Settings → Resources → Memory, e.g. 4 GB+).
3. Or use the legacy builder (Git Bash):  
   `DOCKER_BUILDKIT=0 docker compose -f docker-compose.dev.yml up -d --build`  
   PowerShell:  
   `$env:DOCKER_BUILDKIT="0"; docker compose -f docker-compose.dev.yml up -d --build`
