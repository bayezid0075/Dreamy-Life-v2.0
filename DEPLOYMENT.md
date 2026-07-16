# Dreamy Life — VPS Deployment Guide

## How Deploy Works

```
From PC:    git push origin master
From VPS:   ssh root@bayezid.dreamy-life.com
            cd /root/Dreamy-Life-v2.0
            bash deploy.sh
```

One command handles everything: pull code, build Docker images,
run database migrations, restart all containers.

---

## First-Time VPS Setup (Run Once)

### 1. Install Docker & Docker Compose

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

### 3. Configure environment

```bash
# Root .env — set your VPS IP
nano .env
```

Set `VPS_HOST` to your actual VPS IP address (e.g. `123.45.67.89`).

```bash
# Backend .env — should already be correct
nano packages/backend/.env
```

### 4. First deploy

```bash
bash deploy.sh
```

This will:
- Auto-create 2GB swap (one-time)
- Build all Docker images
- Start all containers
- Run database migrations automatically
- Health check

---

## Daily Workflow

```bash
# 1. Push from your PC
git push origin master

# 2. SSH into VPS and deploy
ssh root@bayezid.dreamy-life.com
cd /root/Dreamy-Life-v2.0
bash deploy.sh
```

---

## What deploy.sh Does

| Step | Action |
|------|--------|
| 0 | Creates 2GB swap if missing (one-time) |
| 1 | `git pull origin master` — pulls latest code |
| 2 | `docker compose build` — builds all 3 images locally |
| 3 | `docker compose up -d` — restarts containers |
| 4 | Backend entrypoint runs `drizzle-kit push:pg` — syncs database schema |
| 5 | Health check — waits up to 2 minutes |
| 6 | Prunes old Docker images — saves disk space |

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

# Full rebuild (slow, 10+ min)
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# Check memory usage
docker stats --no-stream

# Check disk usage
docker system df

# Manual database migration (if needed)
docker compose -f docker-compose.prod.yml exec backend npx drizzle-kit push:pg
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Backend keeps restarting | `docker compose -f docker-compose.prod.yml logs backend` |
| Build runs out of memory | Ensure swap exists: `free -h` should show swap |
| Port already in use | `docker compose -f docker-compose.prod.yml down` then `bash deploy.sh` |
| Database connection error | Check `.env` has correct `DB_PASSWORD` |
| Out of disk space | `docker system prune -a --volumes` (WARNING: deletes everything) |
| Tables missing after deploy | `docker compose -f docker-compose.prod.yml restart backend` (triggers migration) |
