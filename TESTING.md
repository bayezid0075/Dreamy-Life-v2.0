# Testing Guide

## Prerequisites

- Docker & Docker Compose installed
- Node.js 20+ (for local development without Docker)

## Quick Start

### Docker (Recommended)

```bash
# Start all services with hot-reload
docker compose -f docker-compose.dev.yml up --build

# Start in background
docker compose -f docker-compose.dev.yml up --build -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop all services
docker compose -f docker-compose.dev.yml down
```

### Services & Ports

| Service | URL | Description |
|---------|-----|-------------|
| Web (Frontend) | http://localhost:3000 | Customer-facing app |
| Admin Panel | http://localhost:3001 | Admin dashboard |
| Backend API | http://localhost:4080 | NestJS API server |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache/Queue |
| PgAdmin | http://localhost:5433 | Database admin UI |

## Hot-Reload Setup

All services are configured with volume mounts for automatic code updates:

### Backend (NestJS)
- **Source:** `./packages/backend/src` → `/app/packages/backend/src`
- **Watch mode:** `nest start --watch` auto-restarts on file changes
- **Test:** Edit any `.ts` file in `packages/backend/src/`, save, and the backend restarts automatically

### Web (Next.js)
- **Source:** `./apps/web/src` → `/app/apps/web/src`
- **HMR:** Next.js built-in hot module replacement
- **Test:** Edit any file in `apps/web/src/`, save, and the browser updates instantly

### Admin (Next.js)
- **Source:** `./apps/admin/src` → `/app/apps/admin/src`
- **HMR:** Next.js built-in hot module replacement
- **Test:** Edit any file in `apps/admin/src/`, save, and the browser updates instantly

## Testing Specific Features

### 1. Vendor Registration & Payment Flow

**Steps:**
1. Go to http://localhost:3000/vendor/apply
2. Fill out the vendor application form
3. Upload a banner image (local file upload)
4. Submit the form
5. You should be redirected to UddoktaPay payment gateway
6. Complete payment
7. Should redirect to `/vendor/payment-success` with animated popup
8. Click "Go to Dashboard" to go to vendor dashboard

**Expected Results:**
- Banner image uploads and displays correctly
- Payment gateway opens with correct amount
- Success page shows animated checkmark with confetti
- Auto-redirects to dashboard after 5 seconds

### 2. Fund Wallet Payment Flow

**Steps:**
1. Go to http://localhost:3000/wallet
2. Click "Add Fund" button
3. Enter amount (minimum 10 BDT)
4. Select payment method
5. Click "Proceed to Payment"
6. Complete payment on UddoktaPay
7. Should redirect to `/wallet/payment-success` with animated popup
8. Auto-redirects back to wallet page

**Expected Results:**
- Payment gateway opens correctly
- Success page shows animated checkmark with confetti
- Wallet balance updates after payment
- Transaction appears in wallet history

### 3. Admin Funds Tracking

**Steps:**
1. Go to http://localhost:3001
2. Login with admin credentials
3. Click "Funds" in the sidebar
4. View summary cards (Total Funds, Pending, Completed, Failed)
5. Use search bar to filter by transaction ID or user
6. Use status filter dropdown
7. Use date range picker
8. Click column headers to sort

**Expected Results:**
- Summary cards show correct totals
- Table displays all fund payments
- Search filters results in real-time
- Status filter works correctly
- Date range filter works correctly
- Sorting works on all columns

### 4. Image Upload & Serving

**Steps:**
1. Go to any page with file upload (e.g., vendor apply)
2. Upload an image file
3. Check the uploaded image displays correctly
4. Inspect the image URL in browser dev tools

**Expected Results:**
- Image uploads successfully
- Image URL should be `http://localhost:4080/uploads/filename.png`
- Image displays correctly on the page
- No 404 errors in browser console

**Troubleshooting:**
If images show 404:
1. Check `UPLOAD_BASE_URL` in `packages/backend/.env`
2. Ensure it's set to `http://localhost:4080`
3. Restart the backend container

### 5. Reseller Shop Page

**Steps:**
1. Go to http://localhost:3000/reseller-shop
2. Scroll through product categories
3. Click on a product card
4. View product details
5. Add to cart

**Expected Results:**
- Aurora/glass-panel theme displays correctly
- Category scroll works horizontally
- Product cards have hover effects
- Bottom navigation works
- Cart updates correctly

## API Testing

### Using cURL

**Create Fund Payment:**
```bash
curl -X POST http://localhost:4080/wallet/create-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 100}'
```

**Get Wallet Balance:**
```bash
curl http://localhost:4080/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get Admin Fund Stats:**
```bash
curl http://localhost:4080/admin/fund-stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Get Admin Fund Payments:**
```bash
curl "http://localhost:4080/admin/fund-payments?page=1&limit=10" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

## Database Testing

### Connect to PostgreSQL

```bash
# Using Docker exec
docker exec -it dreamy-life-db psql -U postgres -d dreamy_life

# Using PgAdmin
# Go to http://localhost:5433
# Email: admin@dreamy-life.com
# Password: admin
```

### Useful SQL Queries

```sql
-- Check fund_payments table
SELECT * FROM fund_payments ORDER BY created_at DESC LIMIT 10;

-- Check wallets
SELECT * FROM wallets;

-- Check vendors
SELECT * FROM vendors;

-- Check users
SELECT * FROM users;
```

## Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Find process using the port
netstat -ano | findstr :4080

# Kill the process
taskkill /PID <PROCESS_ID> /F
```

### Issue: Docker Build Fails
```bash
# Clean build
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```

### Issue: Hot-Reload Not Working
1. Ensure volume mounts are correct in `docker-compose.dev.yml`
2. Check if files are saved (not just open in editor)
3. Restart the specific service:
   ```bash
   docker compose -f docker-compose.dev.yml restart backend
   ```

### Issue: Database Connection Refused
1. Wait for PostgreSQL health check to pass
2. Check `DATABASE_URL` in backend `.env`
3. Ensure PostgreSQL container is running:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```

### Issue: Images Not Loading (404)
1. Check `UPLOAD_BASE_URL` in `packages/backend/.env`
2. Ensure it's set to `http://localhost:4080`
3. Check if uploads directory exists in the container:
   ```bash
   docker exec -it dreamy-life-backend ls -la /app/packages/backend/uploads
   ```

## Running Tests

### Backend Unit Tests
```bash
# In Docker
docker exec -it dreamy-life-backend pnpm --filter @dreamy-life/backend run test

# Locally
pnpm --filter @dreamy-life/backend run test
```

### Frontend Linting
```bash
# Web
docker exec -it dreamy-life-web pnpm --filter @dreamy-life/web run lint

# Admin
docker exec -it dreamy-life-admin pnpm --filter admin run lint
```

### Type Checking
```bash
# Web
docker exec -it dreamy-life-web pnpm --filter @dreamy-life/web run type-check

# Admin
docker exec -it dreamy-life-admin pnpm --filter admin run type-check
```

## Environment Variables Reference

### Backend (.env)
```env
PORT=4000
UPLOAD_BASE_URL=http://localhost:4080
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgres://postgres:2516@postgres:5432/dreamy_life
UDDOKTAPAY_BASE_URL=https://dreamylife.paymently.io/api
UDDOKTAPAY_API_KEY=your-api-key
UDDOKTAPAY_FUND_SUCCESS_URL=http://localhost:3000/wallet/payment-success
UDDOKTAPAY_FUND_CANCEL_URL=http://localhost:3000/wallet
UDDOKTAPAY_FUND_WEBHOOK_URL=http://localhost:4080/wallet/payment-webhook
```

### Frontend (docker-compose.dev.yml)
```env
NEXT_PUBLIC_API_URL=http://localhost:4080
```
