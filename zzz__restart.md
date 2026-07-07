Your services from docker-compose.dev.yml:
## Restart only backend (fastest for code changes):
docker restart dreamy-life-backend
## Restart all containers (no rebuild):
docker restart dreamy-life-backend dreamy-life-web dreamy-life-admin dreamy-life-db dreamy-life-redis
## Fastest full rebuild (rebuilds only changed layers):
docker compose -f docker-compose.dev.yml up -d --build
## Nuclear option — stop everything, rebuild, start fresh:
docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.dev.yml up -d --build

<p> For just the backend (since that's where your recharge code lives), docker restart dreamy-life-backend is the fastest — it picks up changes via the volume mount without rebuilding.</p>