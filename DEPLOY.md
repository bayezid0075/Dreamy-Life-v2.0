# Docker & VPS Deploy Guide

This project uses **Docker Compose** for local development and **GitHub Actions** for automatic deploy to a VPS on push to `master`.

**Env files:** Use `.env` for local and `.env.production` for the VPS. Django loads the right env when `DJANGO_ENV=production`. Docker Compose should be run with `--env-file` so `${...}` substitutions use the correct env file.

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
   docker compose --env-file .env -f docker-compose.dev.yml up -d --build
   ```

   First start may take a minute while the frontend runs `npm ci` inside the container. Wait until logs show the dev server listening.

3. **Apply migrations (first time or after model changes)**:

   ```bash
   docker compose --env-file .env -f docker-compose.dev.yml exec backend python manage.py migrate --noinput
   ```

   - Backend: http://localhost:8888  
   - Frontend: http://localhost:3333  
   - Postgres: port 5432

4. **Useful commands**:

   - Logs: `docker compose -f docker-compose.dev.yml logs -f`
   - Stop: `docker compose -f docker-compose.dev.yml down`

### Optional: run production build locally

```bash
docker compose --env-file .env -f docker-compose.prod.yml up -d --build
docker compose --env-file .env -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
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

3. **Create `.env.production`** in project root with production values (see `.env.production.example`):

   - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
   - `BACKEND_URL`, `FRONTEND_URL`, `NEXT_PUBLIC_API_URL` (your domain URLs)
   - `BACKEND_INTERNAL_URL=http://backend:8888` (container-to-container API routing)
   - Django `SECRET_KEY`, email, and any payment/API keys

4. **First run** (optional; CI/CD will also do this on first deploy):

   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
   docker compose --env-file .env.production -f docker-compose.prod.yml exec backend python manage.py migrate --noinput
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

### Domain & HTTPS (Nginx required for production)

Use the provided config at `nginx/dreamy-life.conf` as your site config.

Important routing:
- `/` → `http://127.0.0.1:3333` (Next.js frontend)
- `/api/` → `http://127.0.0.1:8888` (Django API)
- `/ws/` → `http://127.0.0.1:8888` (Django Channels WebSocket)

Example setup on VPS:

```bash
sudo cp nginx/dreamy-life.conf /etc/nginx/sites-available/dreamy-life.conf
sudo ln -s /etc/nginx/sites-available/dreamy-life.conf /etc/nginx/sites-enabled/dreamy-life.conf
sudo nginx -t
sudo systemctl reload nginx
```

Then validate:

```bash
curl -I https://dreamy-life.com
curl -i -X POST https://dreamy-life.com/api/users/login/ -H "Content-Type: application/json" -d '{"email":"x","password":"y"}'
```

If the second command returns Django JSON (even 400/401), routing is correct. If it returns HTML 404, Nginx is still not proxying `/api/` to backend.

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
