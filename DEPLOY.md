# Dreamy Life — Deployment Guide

## How Deploy Works

Images are built on your PC (fast, multi-core) and pushed to GitHub Container Registry (GHCR).
VPS pulls pre-built images and restarts — no building on VPS.

```
PC:  git push → build-and-push.sh → images on GHCR
VPS: bash deploy.sh → pull → migrate → restart (~2 min)
```

---

## Deploy Workflow

### Step 1: From your PC

```bash
# Push code to master
git push origin master

# Build and push images to GHCR
bash build-and-push.sh
```

### Step 2: From VPS

```bash
# SSH into VPS
ssh root@bayezid.dreamy-life.com

# Deploy
cd /root/Dreamy-Life-v2.0
bash deploy.sh
```

**Total VPS time: ~2 minutes** (pull + migrate + restart)

---

## First-Time PC Setup

### 1. Install Docker Desktop

Download from https://www.docker.com/products/docker-desktop/

### 2. Login to GHCR

```bash
docker login ghcr.io -u bayezid0075
```

Use a GitHub Personal Access Token with `read:packages` + `write:packages` scope.

To create a token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes: `read:packages`, `write:packages`
4. Copy the token and use it as password

---

## First-Time VPS Setup

### 1. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
apt install docker-compose-plugin -y
```

### 2. Clone the repo

```bash
cd /root
git clone <YOUR_REPO_URL> Dreamy-Life-v2.0
cd Dreamy-Life-v2.0
```

### 3. Login to GHCR

```bash
docker login ghcr.io -u bayezid0075
```

Use a GitHub PAT with `read:packages` scope.

### 4. Configure environment

```bash
nano .env
```

Set `VPS_HOST` to your VPS IP address.

### 5. First deploy

```bash
bash deploy.sh
```

This will:
- Auto-create 2GB swap (one-time)
- Pull images from GHCR
- Run database migrations
- Start all services
- Health check

---

## What deploy.sh Does

| Step | Action | Time |
|------|--------|------|
| 0 | Create 2GB swap if missing | 2 sec |
| 1 | Pre-flight checks (disk, memory) | 1 sec |
| 2 | `git pull origin master` | 5 sec |
| 3 | `docker compose pull` — pull images from GHCR | ~30 sec |
| 4 | `docker compose run --rm migrate` — run drizzle-kit push:pg | ~10 sec |
| 5 | `docker compose up -d` — restart all services | ~30 sec |
| 6 | Health check — wait for backend | ~10-30 sec |
| 7 | Cleanup old images | ~5 sec |
| **Total** | | **~2 min** |

---

## What build-and-push.sh Does

| Step | Action | Time (on PC) |
|------|--------|------|
| 1 | `docker compose build` — build 3 images | ~5-10 min |
| 2 | `docker compose push` — push to GHCR | ~1-2 min |
| **Total** | | **~6-12 min** |

---

## VPS Specs

| Resource | Value |
|----------|-------|
| OS | Ubuntu 24.04 |
| CPU | 1 core (Intel Xeon E5-2695 v4 @ 2.10GHz) |
| RAM | 2 GB (+ 2 GB swap auto-created) |
| Disk | 24 GB total |
| Hostname | bayezid.dreamy-life.com |

---

## Memory Budget

| Container | Limit |
|-----------|-------|
| PostgreSQL | 300 MB |
| Redis | 100 MB |
| Backend | 512 MB |
| Web | 350 MB |
| Admin | 350 MB |
| **Total** | **~1.6 GB** |

---

## Services

| Service | Port | URL |
|---------|------|-----|
| Web Frontend | 3000 | http://bayezid.dreamy-life.com:3000 |
| Admin Panel | 3001 | http://bayezid.dreamy-life.com:3001 |
| Backend API | 4000 | http://bayezid.dreamy-life.com:4000 |
| PostgreSQL | 5432 | internal only |
| Redis | 6379 | internal only |

---

## Error Logs

### Production errors (on VPS)

```bash
# View backend error log
cat /root/Dreamy-Life-v2.0/logs/errors.json

# View Docker logs
docker compose -f docker-compose.prod.yml logs backend --tail=100
```

### Development errors (on PC)

```bash
# View dev error log
cat logs/dev-errors.json
```

---

## Useful Commands

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs (all)
docker compose -f docker-compose.prod.yml logs -f

# View logs (backend only)
docker compose -f docker-compose.prod.yml logs -f backend

# Restart one service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Manual migration
docker compose -f docker-compose.prod.yml run --rm migrate

# Check memory
docker stats --no-stream

# Check disk
docker system df

# Full cleanup (WARNING: removes all unused data)
docker system prune -a --volumes
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend keeps restarting | `docker compose -f docker-compose.prod.yml logs backend` |
| GHCR login failed | Check PAT has `read:packages` + `write:packages` scope |
| Tables missing | `docker compose -f docker-compose.prod.yml run --rm migrate` |
| Port already in use | `docker compose -f docker-compose.prod.yml down` then `bash deploy.sh` |
| Out of disk space | `docker system prune -a --volumes` (WARNING: deletes everything) |
| OOM killed | Check swap: `free -h`. Ensure 2GB swap exists. |
| Build fails on PC | Check Docker Desktop is running. Try `docker system prune`. |
