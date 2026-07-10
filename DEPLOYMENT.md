# Dreamy Life — Production Deployment Guide (1-Core VPS)

> Push to `master` → auto-deploys to your VPS. This guide covers everything from
> first-time VPS setup to daily CI/CD workflow.

---

## Architecture Overview

```
GitHub Push (master)
       │
       ▼
 GitHub Actions (CI)
   ├─ type-check
   ├─ lint
   └─ SSH into VPS → git pull → docker build → docker up
                                             │
                                    ┌────────┴────────┐
                                    │   VPS (1 core)  │
                                    │                  │
                                    │  Nginx :80/:443  │
                                    │    ├── :3000 (web)
                                    │    ├── :3001 (admin)
                                    │    └── :4000 (api)
                                    │                  │
                                    │  PostgreSQL:5432  │
                                    │  Redis:6379       │
                                    └──────────────────┘
```

---

## 1. First-Time VPS Setup (Do Once)

### 1.1 Prepare the VPS

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Install Docker Compose plugin
apt install docker-compose-plugin -y

# Install Nginx
apt install nginx -y
systemctl enable nginx && systemctl start nginx

# Install Git
apt install git -y

# Create app directory
mkdir -p /opt/dreamy-life
```

### 1.2 Clone Your Repo on VPS

```bash
cd /opt/dreamy-life
git clone <YOUR_GIT_REPO_URL> .
```

### 1.3 Create `.env` on VPS

```bash
cat > /opt/dreamy-life/.env << 'EOF'
# Database
DB_USER=postgres
DB_PASSWORD=CHANGE_THIS_TO_A_STRONG_PASSWORD
DB_NAME=dreamy_life

# UddoktaPay
UDDOKTAPAY_BASE_URL=https://dreamylife.paymently.io
UDDOKTAPAY_API_KEY=YOUR_API_KEY
UDDOKTAPAY_SUCCESS_URL=https://your-domain.com/vendor/payment-success
UDDOKTAPAY_CANCEL_URL=https://your-domain.com/vendor/apply
UDDOKTAPAY_WEBHOOK_URL=https://api.your-domain.com/vendor/payment-webhook
EOF
```

Also create the backend `.env`:

```bash
cp /opt/dreamy-life/packages/backend/.env.example /opt/dreamy-life/packages/backend/.env
# Edit with production values
nano /opt/dreamy-life/packages/backend/.env
```

### 1.4 Set Up Nginx

```bash
# Copy the nginx config
cp /opt/dreamy-life/nginx/dreamy-life.conf /etc/nginx/sites-available/dreamy-life.conf

# Edit: replace "your-domain.com" with your actual domain
nano /etc/nginx/sites-available/dreamy-life.conf

# Enable the site
ln -sf /etc/nginx/sites-available/dreamy-life.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t && systemctl reload nginx
```

### 1.5 Set Up SSL with Certbot (Recommended)

```bash
apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
certbot --nginx -d your-domain.com -d api.your-domain.com -d admin.your-domain.com

# Auto-renewal is set up by default. Verify:
certbot renew --dry-run
```

After certbot, go back to `dreamy-life.conf` and uncomment the SSL lines.

### 1.6 Set Up Swap (Critical for 1-Core VPS)

```bash
# 1GB swap file
fallocate -l 1G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Verify
free -h
```

---

## 2. GitHub Secrets Setup

Go to your GitHub repo → **Settings → Secrets and variables → Actions** and add:

| Secret Name     | Value                          | Description              |
|----------------|--------------------------------|--------------------------|
| `VPS_HOST`     | `YOUR_VPS_IP`                 | Your VPS IP address      |
| `VPS_USER`     | `root`                        | SSH username             |
| `VPS_SSH_KEY`  | Contents of private SSH key   | Copy full key content    |
| `VPS_CR_PAT`   | GitHub Personal Access Token  | PAT with `read:packages` scope for GHCR |

### Generating SSH Key Pair (if you don't have one)

On your **local machine**:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy        # → paste as VPS_SSH_KEY secret
cat ~/.ssh/github_deploy.pub    # → paste to VPS authorized_keys
```

On **VPS**:

```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Creating a GitHub Personal Access Token (VPS_CR_PAT)

The deploy workflow pulls pre-built Docker images from GitHub Container Registry (GHCR).
Your VPS needs a PAT with `read:packages` scope to authenticate.

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **"Generate new token"** (classic or fine-grained)
3. Select scope: **`read:packages`**
4. Copy the generated token
5. Add it as a GitHub Actions secret named **`VPS_CR_PAT`**

---

## 3. How CI/CD Works

### Trigger

Every push to `master` triggers `.github/workflows/deploy.yml`:

```
Push to master
    │
    ▼
┌─────────────────────────┐
│  GitHub Actions Runner  │
│  1. Checkout code       │
│  2. pnpm install        │
│  3. type-check          │
│  4. lint (non-blocking) │
│  5. SSH → VPS           │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Your VPS               │
│  1. git pull            │
│  2. docker build        │
│  3. docker up -d        │
│  4. health check        │
│  5. prune old images    │
└─────────────────────────┘
```

### What Gets Deployed

| Service  | Container           | Port    | Description         |
|----------|---------------------|---------|---------------------|
| Backend  | dreamy-life-backend | 4000    | NestJS API          |
| Web      | dreamy-life-web     | 3000    | Next.js frontend    |
| Admin    | dreamy-life-admin   | 3001    | Next.js admin panel |
| Postgres | dreamy-life-db      | 5432*   | Database            |
| Redis    | dreamy-life-redis   | 6379*   | Cache               |

\* Ports not exposed externally — only nginx proxies traffic.

---

## 4. Memory Budget (1-Core / 1-2 GB VPS)

The `docker-compose.prod.yml` enforces hard memory limits:

| Container   | Memory Limit | Notes                    |
|-------------|-------------|--------------------------|
| PostgreSQL  | 300 MB      | with 128 MB shared mem   |
| Redis       | 100 MB      | LRU eviction at 64 MB    |
| Backend     | 400 MB      | NestJS + Drizzle ORM     |
| Web         | 350 MB      | Next.js SSR              |
| Admin       | 350 MB      | Next.js SSR              |
| **Total**   | **~1.5 GB** | Fits in 2 GB VPS        |

> If you have only 1 GB RAM: disable pgAdmin, reduce Postgres to 200 MB,
> reduce Web/Admin to 250 MB each.

---

## 5. Manual Deployment (Without CI)

SSH into VPS and run:

```bash
cd /opt/dreamy-life
bash deploy.sh
```

---

## 6. Useful Commands

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# View logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# View logs (specific service)
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f web

# Restart a single service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Rebuild from scratch
docker compose -f docker-compose.prod.yml up -d --build --force-recreate

# Check memory usage
docker stats --no-stream

# Check disk usage
docker system df
```

---

## 7. Database Migrations

After schema changes in Drizzle:

```bash
# SSH into VPS
cd /opt/dreamy-life

# Run migration inside the backend container
docker compose -f docker-compose.prod.yml exec backend \
  npx drizzle-kit push:pg
```

---

## 8. Backup Database

```bash
# On VPS — create backup
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres dreamy_life > /opt/backups/dreamy-life-$(date +%Y%m%d).sql

# Restore
docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres dreamy_life < /opt/backups/dreamy-life-20260709.sql
```

For automated daily backups, add a cron job:

```bash
crontab -e
# Add:
0 3 * * * docker compose -f /opt/dreamy-life/docker-compose.prod.yml exec -T postgres pg_dump -U postgres dreamy_life > /opt/backups/dreamy-life-$(date +\%Y\%m\%d).sql
```

---

## 9. Troubleshooting

| Problem | Fix |
|---------|-----|
| Deploy fails — SSH error | Check VPS_HOST, VPS_USER, VPS_SSH_KEY in GitHub Secrets |
| Containers OOM killed | Increase VPS RAM or reduce memory limits in `docker-compose.prod.yml` |
| Backend health check fails | `docker compose -f docker-compose.prod.yml logs backend` |
| Nginx 502 Bad Gateway | Containers not running — `docker compose -f docker-compose.prod.yml ps` |
| Slow builds on VPS | Normal for 1-core — builds take 5-10 min. First build is slowest. |
| Domain not resolving | Check DNS A records point to VPS IP |

---

## 10. File Structure After Setup

```
/opt/dreamy-life/
├── .env                          ← production env vars
├── docker-compose.prod.yml       ← production compose
├── packages/backend/.env         ← backend-specific env
├── nginx/dreamy-life.conf        ← nginx config
├── .github/workflows/deploy.yml  ← CI/CD pipeline
└── deploy.sh                     ← manual deploy script
```

---

## Quick Start Checklist

- [ ] VPS ready with Docker, Nginx, Git installed
- [ ] Swap configured (1 GB)
- [ ] Repo cloned to `/opt/dreamy-life`
- [ ] `.env` files configured with production values
- [ ] GitHub Secrets added (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] Nginx config in `/etc/nginx/sites-available/` with your domain
- [ ] SSL certificate obtained via certbot
- [ ] DNS A records pointing to VPS IP
- [ ] Push to `master` — verify deployment works
