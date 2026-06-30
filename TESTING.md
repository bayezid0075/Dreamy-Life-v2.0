# 🧪 Dreamy Life — User Testing Guide

A comprehensive guide to test all features across the Dreamy Life application — **Backend API**, **Web Frontend**, and **Mobile App**.

---

## 📋 Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Setting Up the Application](#2-setting-up-the-application)
- [3. Running the Services](#3-running-the-services)
- [4. API Documentation (Swagger)](#4-api-documentation-swagger)
- [5. Testing the Backend API](#5-testing-the-backend-api)
- [6. Testing User Registration & Login](#6-testing-user-registration--login)
- [7. Testing the Referral System](#7-testing-the-referral-system)
- [8. Testing the Membership System](#8-testing-the-membership-system)
- [9. Testing the Web Frontend](#9-testing-the-web-frontend)
- [10. Testing the Mobile App](#10-testing-the-mobile-app)
- [11. Full Test Scenarios](#11-full-test-scenarios)
- [12. Testing with Docker](#12-testing-with-docker)
- [13. Troubleshooting](#13-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | >= 18 | Runtime |
| **pnpm** | >= 8 | Package manager (`npm install -g pnpm`) |
| **Docker & Docker Compose** | Latest | PostgreSQL, Redis, Backend, Web, Admin containers |
| **Expo Go** (mobile) | Latest | Run mobile app on device |
| **curl** or **Postman** | Any | Test API endpoints |
| **Git** | Any | Version control |

---

## 2. Setting Up the Application

### 2.1 Clone & Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd dreamy-life

# Install all dependencies (monorepo)
pnpm install
```

### 2.2 Environment Configuration

Create environment files for each service:

```bash
# Backend
cp packages/backend/.env.example packages/backend/.env

# Web Frontend (optional — has sensible defaults)
cp apps/web/.env.example apps/web/.env

# Mobile (optional — has sensible defaults)
# Edit apps/mobile/.env directly
```

**Backend** — minimal `.env` configuration:

```env
# Database
DB_USER=postgres
DB_PASSWORD=postgres_password
DB_NAME=dreamy_life
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgres://postgres:postgres_password@localhost:5432/dreamy_life

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Sentry (optional — leave blank if not used)
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
```

**Web Frontend** — `apps/web/.env`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Mobile** — `apps/mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 2.3 Start Infrastructure (Database & Redis)

```bash
docker-compose up -d postgres redis
```

Verify they are running:
```bash
docker ps
# Expected: dreamy-life-db, dreamy-life-redis
```

### 2.4 Initialize Database Schema

```bash
cd packages/backend
npx drizzle-kit push:pg
cd ../..
```

---

## 3. Running the Services

You need **four terminals** to run all services locally.

### Terminal 1: Backend API (NestJS)

```bash
pnpm --filter @dreamy-life/backend dev
```

Expected output:
```
Backend is running on: http://localhost:3000
Swagger docs: http://localhost:3000/api/docs
```

> ⚠️ **Important:** On startup, the backend will auto-seed membership plans (basic, standard, smart, vvip). You should see: `Membership plans seeded successfully`

### Terminal 2: User Web Frontend (Next.js)

```bash
pnpm --filter @dreamy-life/web dev
```

Expected output:
```
▲ Next.js 14.x
- Local: http://localhost:300x
```

### Terminal 3: Admin Panel (Next.js)

```bash
pnpm --filter admin dev
```

Expected output:
```
▲ Next.js 14.x
- Local: http://localhost:3001
```

### Terminal 4: Mobile App (Expo)

```bash
pnpm --filter mobile start
```

Expected output:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go
```

---

## 4. API Documentation (Swagger)

### 4.1 Accessing Swagger UI

Once the backend is running, open Swagger UI at:

```
http://localhost:3000/api/docs
```

Or via Docker:

```
http://localhost:4000/api/docs
```

### 4.2 What You See

Swagger UI is organized by tags:

| Tag | Description | Auth |
|-----|-------------|------|
| **Health** | Backend health check (`GET /`) | None |
| **Authentication** | Register, Login, Refresh, Profile, Logout | Bearer (profile) |
| **Membership** | Plans, My Membership, Purchase | Bearer |
| **Wallet** | Wallet balance, Transactions, Add Funds | Bearer |
| **Referral** | Stats, Downline, Downline Tree, Upline | Bearer |
| **Admin** | Dashboard, Users CRUD, Referral stats/tree | Bearer + AdminGuard |

### 4.3 Authentication in Swagger

1. Click the **"Authorize"** button at the top right of Swagger UI
2. In the "access-token" field, paste your JWT token: `Bearer <your-token>`
3. Click **"Authorize"** to apply globally
4. All subsequent requests will include the token automatically

> **Tip:** First hit `POST /auth/login` with valid credentials, copy the `accessToken` from the response, then use the Authorize button.

### 4.4 Exploring Endpoints

Each endpoint shows:
- HTTP method and full path
- Short summary description
- Request parameters (path, query, header)
- Request body schema (for POST/PATCH) — with property descriptions, types, and examples
- Response status codes with full response schemas
- "Try it out" button to test endpoints directly from the browser

### 4.5 Error Responses

Swagger documents the standard error format:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Description of the error",
    "detail": null
  }
}
```

Common error codes:
- `400` — Validation errors (missing fields, wrong types)
- `401` — Unauthorized (missing/invalid token, wrong credentials)
- `403` — Forbidden (non-admin accessing admin endpoints)
- `404` — Not Found (resource doesn't exist)
- `409` — Conflict (duplicate username/phone, already have membership)
- `500` — Internal Server Error

### 4.6 Swagger Configuration

| Aspect | Value |
|--------|-------|
| **Title** | Dreamy Life API |
| **Version** | 1.0 |
| **Auth Scheme** | JWT Bearer Token (`access-token`) |
| **Cookie Auth** | `refresh_token` httpOnly cookie |
| **UI Framework** | swagger-ui-express |
| **Schema Generation** | @nestjs/swagger plugin (auto-detects DTO decorators) |

---

## 5. Testing the Backend API

All API endpoints are served at `http://localhost:3000` (locally) or `http://localhost:4000` (Docker).

### 5.1 Health Check

```bash
curl http://localhost:3000/
```

**Expected response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2026-06-11T...",
  "service": "dreamy-life-backend"
}
```

### 5.2 API Response Format

All successful API responses follow a standard format:

```json
{
  "success": true,
  "data": { ... }
}
```

All error responses follow a standard format:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Description of the error",
    "detail": null
  }
}
```

---

## 6. Testing User Registration & Login

### 5.1 User Registration (without referral)

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "phoneNumber": "01712345678",
    "password": "MyStrongP@ss1"
  }'
```

**Expected response (201):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "phoneNumber": "01712345678",
      "ownRefercode": "12345678",
      "memberStatus": "user",
      "referredBy": null
    }
  }
}
```

### 5.2 User Registration (with referral code)

```bash
# First, register a user to get their referral code
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "referrer",
    "phoneNumber": "01711111111",
    "password": "StrongP@ss1"
  }'
# Note the ownRefercode from the response, e.g. "87654321"

# Then register a second user using that referral code
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "referee",
    "phoneNumber": "01722222222",
    "password": "StrongP@ss1",
    "referCode": "87654321"
  }'
```

**Expected response:** `referredBy` field should contain the referrer's code ("87654321").

### 5.3 User Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "MyStrongP@ss1"
  }'
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "phoneNumber": "01712345678",
      "ownRefercode": "12345678",
      "memberStatus": "user",
      "referredBy": null
    }
  }
}
```

> **Note:** Login also supports entering your phone number in the `username` field.

### 5.4 Token Refresh

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Cookie: refresh_token=<your-refresh-token>"
```

Or:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your-refresh-token>"}'
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new-access-token..."
  }
}
```

### 5.5 Get User Profile

```bash
curl http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <access-token>"
```

**Expected response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "phoneNumber": "01712345678",
      "ownRefercode": "12345678",
      "memberStatus": "user",
      "referredBy": null,
      "info": {
        "id": "uuid",
        "userId": "uuid",
        "fullName": null,
        "email": null,
        "avatarUrl": null,
        "address": null,
        "city": null,
        "country": null,
        "dateOfBirth": null
      }
    },
    "stats": {
      "totalReferrals": 0,
      "directReferrals": 0
    }
  }
}
```

### 5.6 Validation Error Tests

```bash
# Missing fields
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "short"}'
# Expected: 400 Bad Request with validation error

# Duplicate username
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "phoneNumber": "01799999999", "password": "TestP@ss1"}'
# Expected: 409 Conflict - "Username already taken"

# Duplicate phone number
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "another", "phoneNumber": "01712345678", "password": "TestP@ss1"}'
# Expected: 409 Conflict - "Phone number already registered"

# Invalid referral code
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "phoneNumber": "01733333333", "password": "TestP@ss1", "referCode": "00000000"}'
# Expected: 409 Conflict - "Invalid referral code"

# Wrong credentials
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "password": "wrongpassword"}'
# Expected: 401 Unauthorized - "Invalid credentials"
```

---

## 7. Testing the Referral System

### 6.1 Referral Stats

```bash
# Get stats for any logged-in user
curl http://localhost:3000/referral/stats \
  -H "Authorization: Bearer <access-token>"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 5,
    "level1Count": 2,
    "level2Count": 2,
    "level3Count": 1,
    "level4Count": 0,
    "level5Count": 0,
    "level6To10Count": 0
  }
}
```

### 6.2 Downline Members (Flat List)

```bash
curl http://localhost:3000/referral/downline \
  -H "Authorization: Bearer <access-token>"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "userId": "uuid",
        "username": "referee1",
        "phoneNumber": "01722222222",
        "memberStatus": "user",
        "level": 1,
        "joinedAt": "2026-06-11T...",
        "totalDownline": 2
      }
    ],
    "count": 5
  }
}
```

### 6.3 Downline Tree (Hierarchical)

```bash
curl http://localhost:3000/referral/downline/tree \
  -H "Authorization: Bearer <access-token>"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "tree": [
      {
        "userId": "uuid",
        "username": "referee1",
        "phoneNumber": "01722222222",
        "memberStatus": "user",
        "level": 1,
        "joinedAt": "2026-06-11T...",
        "children": [
          {
            "userId": "uuid",
            "username": "referee2",
            "phoneNumber": "...",
            "memberStatus": "user",
            "level": 2,
            "joinedAt": "...",
            "children": [...]
          }
        ]
      }
    ],
    "totalCount": 5,
    "levels": 3
  }
```

### 6.4 Upline (Who referred me)

```bash
curl http://localhost:3000/referral/upline \
  -H "Authorization: Bearer <access-token>"
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "upline": [
      {
        "userId": "uuid",
        "username": "referrer",
        "level": 1
      },
      {
        "userId": "uuid",
        "username": "grand-referrer",
        "level": 2
      }
    ],
    "levels": 2
  }
}
```

### 6.5 Referral Code Uniqueness

Every user gets a unique 8-digit referral code. The system generates codes by looping until it finds one that doesn't exist in the database. To verify:

```bash
# Register multiple users and check that no two have the same ownRefercode
curl -X POST ...  # Register user 1 → note refercode
curl -X POST ...  # Register user 2 → note refercode
# Verify: refercode1 !== refercode2
```

---

## 8. Testing the Membership System

### 7.1 View Membership Plans

```bash
curl http://localhost:3000/membership/plans \
  -H "Authorization: Bearer <access-token>"
```

**Expected response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "basic",
      "price": "500",
      "description": "Basic membership with starter benefits",
      "level": 1,
      "createdAt": "..."
    },
    {
      "id": "uuid",
      "name": "standard",
      "price": "1500",
      "description": "Standard membership with enhanced benefits",
      "level": 2,
      "createdAt": "..."
    },
    {
      "id": "uuid",
      "name": "smart",
      "price": "3500",
      "description": "Smart membership with premium benefits",
      "level": 3,
      "createdAt": "..."
    },
    {
      "id": "uuid",
      "name": "vvip",
      "price": "10000",
      "description": "VVIP membership with exclusive benefits",
      "level": 4,
      "createdAt": "..."
    }
  ]
}
```

### 7.2 View Current Membership

```bash
curl http://localhost:3000/membership/my \
  -H "Authorization: Bearer <access-token>"
```

**Expected response (new user):**
```json
{
  "success": true,
  "data": {
    "currentPlan": null,
    "plans": [...],
    "purchaseHistory": [],
    "commissionEarned": 0,
    "commissionHistory": []
  }
}
```

### 7.3 Purchase a Membership

```bash
# First, get the plan ID from /membership/plans
# Then purchase it
curl -X POST http://localhost:3000/membership/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access-token>" \
  -d '{"planId": "<plan-uuid>"}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "purchase": {
      "id": "uuid",
      "userId": "uuid",
      "planId": "uuid",
      "amount": 500,
      "status": "completed",
      "createdAt": "..."
    },
    "commissions": [
      {
        "id": "uuid",
        "fromUserId": "uuid",
        "toUserId": "uuid",
        "level": 1,
        "amount": 50,
        "percentage": 10
      },
      {
        "id": "uuid",
        "fromUserId": "uuid",
        "toUserId": "uuid",
        "level": 2,
        "amount": 25,
        "percentage": 5
      }
    ],
    "newStatus": "basic"
  }
}
```

### 7.4 Commission Distribution Table

When a user purchases a membership, commissions are distributed to their upline according to these percentages:

| Plan | L1 | L2 | L3 | L4 | L5 | L6 | L7 | L8 | L9 | L10 |
|------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Basic** ($500) | 10% | 5% | 3% | 2% | 1% | 0.5% | 0.5% | 0.5% | 0.5% | 0.5% |
| **Standard** ($1500) | 12% | 6% | 4% | 3% | 2% | 1% | 1% | 0.5% | 0.5% | 0.5% |
| **Smart** ($3500) | 15% | 8% | 5% | 3% | 2% | 1.5% | 1% | 0.5% | 0.5% | 0.5% |
| **VVIP** ($10000) | 20% | 10% | 6% | 4% | 3% | 2% | 1.5% | 1% | 1% | 0.5% |

### 7.5 Commission History

After purchase commissions have been distributed, check commission history:

```bash
# Get membership details (includes commission history)
curl http://localhost:3000/membership/my \
  -H "Authorization: Bearer <access-token>"
```

### 7.6 Edge Cases

| Test Case | Steps | Expected |
|-----------|-------|----------|
| **Purchase same plan twice** | Buy "basic" → try buying "basic" again | 409 Conflict - "You already have this or a higher membership" |
| **Purchase lower plan** | Buy "standard" → try buying "basic" | 409 Conflict - "You already have this or a higher membership" |
| **No upline** | User without referral buys membership | No commissions distributed (empty array) |
| **10-level upline** | Referral chain of 10+ levels, last person buys | All 10 levels get commissions |

---

## 9. Testing the Web Frontend

The user web app is built with Next.js (pages router). Key pages:

| URL | Page | Description |
|-----|------|-------------|
| `/` | Home / Landing Page | Welcome page with Sign In & Create Account CTAs, feature highlights |
| `/login` | Login Page | Glassmorphic login with username/phone + password, auto-redirect if authenticated |
| `/register` | Register Page | Registration with optional referral code (`?ref=` query param), auto-redirect if authenticated |
| `/dashboard` | Dashboard | User dashboard with stats, referral code, navigation |
| `/referral` | Referral Detail | Downline tree visualization, stats, member table |
| `/membership` | Membership | Plan cards with purchase, commission history |

### 9.0 Auth Flow Overview

The web frontend uses a **Zustand auth store** (`apps/web/src/store/authStore.ts`) to manage authentication state globally. The flow works as follows:

1. User visits `/` (home page) → sees Sign In / Create Account CTAs
2. User clicks **Sign In** → navigates to `/login`
3. User fills credentials → submits → API returns `{ accessToken, user }`
4. `setAuth(token, user)` stores the token in localStorage + zustand state → redirects to `/dashboard`
5. On subsequent visits, `hydrate()` reads the token from localStorage → if valid, sets `isAuthenticated = true`
6. If `isAuthenticated` is true on `/`, `/login`, or `/register`, the user is automatically **redirected to `/dashboard`**
7. Logout calls `clearAuth()` → removes token from localStorage + zustand → redirects to `/login`

### 9.1 Home / Landing Page (`/`)

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Aurora Background** | Look at the page background | 3 animated pastel blobs floating slowly |
| **Brand Header** | Top of the page | "Dreamy Life" logo with spa icon |
| **Welcome Title** | Center of card | "Welcome to Dreamy Life" |
| **Description** | Below title | Paragraph describing wellness journey, referrals, membership |
| **Sign In CTA** | Primary button | Dark button with arrow icon → navigates to `/login` |
| **Create Account CTA** | Secondary button | Light button with person_add icon → navigates to `/register` |
| **Feature Highlights** | Below buttons | 3-column grid: Referral Program, Membership, Community |
| **Authenticated Redirect** | Visit `/` while logged in | Auto-redirects to `/dashboard` within a second |
| **Card Animation** | Refresh the page | Card fades in and slides up |

### 9.2 Login Page (`/login`)

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Aurora Background** | Look at the page background | 3 animated pastel blobs floating slowly |
| **Brand Header** | Top of the page | "Dreamy Life" logo with spa icon |
| **Avatar Icon** | Center of the card | Person icon in a circle |
| **Welcome Title** | Below the avatar | "Welcome Back" |
| **Username/Phone Field** | Type in field | Input accepts username or phone number |
| **Password Field** | Type a password | Masked input |
| **Sign In Button** | Click with valid data | Calls API, stores token via auth store, redirects to `/dashboard` |
| **Error State** | Submit wrong credentials | Red error banner: "Invalid credentials" |
| **Network Error** | Submit with backend down | "Connection error. Please try again." banner |
| **Loading State** | Click Sign In | Button shows "Signing in..." and is disabled |
| **Sign Up Link** | Bottom of card | Navigates to `/register` |
| **Card Animation** | Refresh the page | Card fades in and slides up |
| **Authenticated Redirect** | Visit `/login` while logged in | Auto-redirects to `/dashboard` (uses zustand auth store hydration) |

### 9.3 Register Page (`/register`)

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Aurora Gradient BG** | Look at background | 4-corner radial gradient with slow animation |
| **Form Fields** | Fill username, phone, password, confirm password | All fields accept input |
| **Password Toggle** | Click eye icon on password fields | Toggles visibility |
| **Referral Code Field** | Navigate with `?ref=CODE` URL param | Auto-fills from `router.query.ref` |
| **Referral Code Field** | Visit directly without param | Empty optional field |
| **Validation** | Submit empty fields | "Username is required", "Phone number is required" |
| **Validation** | Submit with short password | "Password must be at least 6 characters" |
| **Validation** | Submit with mismatched passwords | "Passwords do not match" error |
| **Success** | Submit valid form | Calls API, stores token via auth store, redirects to `/dashboard` |
| **Duplicate Username** | Register with existing username | "Username already taken" error banner |
| **Duplicate Phone** | Register with existing phone | "Phone number already registered" error banner |
| **Invalid Referral** | Enter a fake referral code | "Invalid referral code" error banner |
| **Loading State** | Click Sign Up | Button shows "Creating Account..." and is disabled |
| **Sign In Link** | Bottom of card | Navigates to `/login` |
| **Authenticated Redirect** | Visit `/register` while logged in | Auto-redirects to `/dashboard` |

### 9.4 Dashboard Page (`/dashboard`)

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **User Info** | Top section | Shows username, phone, member status badge |
| **Referral Code** | Below user info | Shows 8-digit code with copy button |
| **Stats Cards** | 4-card grid | Shows total referrals, direct, membership, refer code |
| **Quick Actions** | Grid buttons | "Referral Team" and "Membership" link to pages |
| **Side Drawer** | Click hamburger menu (mobile) | Slides in from left with user info, navigation, logout |
| **Bottom Nav** | Mobile view | 4-tab navigation bar (Home, Search, Cart, Profile) |
| **Logout** | Click logout | Clears token, redirects to `/login` |
| **Responsive** | Resize browser | Desktop: fixed top bar; Mobile: sticky header + bottom nav |

### 9.5 Referral Page (`/referral`)

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Referral Link** | Top of page | Shows full shareable link with copy button |
| **Stats Grid** | 6 stat cards | Total, Level 1-4, Level 5+ counts |
| **Downline Tree** | Expandable sections | Each level listed with member details, expand/ collapse |
| **Member Table** | Full list table | Username, phone, level badge, status badge, downline count |
| **Empty State** | User with no referrals | "No referrals yet" message with group icon |

### 9.6 Membership Page (`/membership`)

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Current Plan** | Top card | Shows current plan name + commission earned |
| **Plan Cards** | Grid of 4 plans | Basic ($500), Standard ($1500), Smart ($3500), VVIP ($10000) |
| **Upgrade Button** | Click on a plan | Processes purchase, shows success alert |
| **Locked State** | Already own higher plan | "Already Upgraded" disabled button |
| **Commission History** | After purchase | Shows level, percentage, date, amount |
| **No Commissions** | New user | Empty state for commission history |

---

## 10. Testing the Mobile App

Open the Expo Go app on your device and scan the QR code from the Metro bundler.

### 10.1 Screen Structure

| Screen | File | Description |
|--------|------|-------------|
| Login | `apps/mobile/src/screens/LoginScreen.tsx` | Login with username + password |
| Register | `apps/mobile/src/screens/RegisterScreen.tsx` | Registration with referral code |
| Dashboard | `apps/mobile/src/screens/DashboardScreen.tsx` | User dashboard with stats & actions |
| Referral | `apps/mobile/src/screens/ReferralScreen.tsx` | Referral code, stats, downline list |

### 10.2 Login Screen

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Brand** | Top | Dreamy Life with floral icon |
| **Welcome Title** | Below logo | "Welcome Back" |
| **Username Field** | Tap and type | Input accepts text |
| **Password Field** | Tap and type | Characters are masked |
| **Password Toggle** | Tap eye icon | Toggles visibility |
| **Sign In Button** | Tap it | Submits credentials, shows ActivityIndicator |
| **Error** | Wrong credentials | Alert: "Invalid credentials" |
| **Sign Up Link** | Bottom | Navigates to Register screen |

### 10.3 Register Screen

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Form Fields** | Fill in all fields | Username, phone, password, confirm password |
| **Referral Code** | Optional field | Can enter a referral code |
| **Validation** | Mismatched passwords | "Passwords do not match" error |
| **Success** | Valid submission | Registers user, navigates to Dashboard |
| **Error** | Duplicate username | Alert with error message |
| **Sign In Link** | Bottom | Navigates to Login |

### 10.4 Dashboard Screen

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **User Info** | Header | Username, member status badge, phone |
| **Referral Code** | Card | 8-digit code displayed |
| **Stats** | Row of 3 cards | Total referrals, Direct, Status |
| **Quick Actions** | 2x2 grid | Referral Team, Membership, Wallet, Support |
| **Menu Items** | List | Parcels, Summary, Payments, Tickets |
| **Logout** | Bottom button | Clears token, navigates to Login |
| **Pull to Refresh** | Swipe down | Reloads data |

### 10.5 Referral Screen

**What to verify:**

| Feature | How to Test | Expected |
|---------|-------------|----------|
| **Referral Code** | Prominent display | Large 8-digit code with hint text |
| **Stats** | Row of 4 cards | Total, Level 1, Level 2, Level 3 |
| **Downline List** | Scrollable list | Each member shows avatar, name, phone, level, status |
| **Empty State** | No referrals | "No referrals yet" message |

---

## 11. Full Test Scenarios

### Scenario 1: Complete User Lifecycle

```bash
# 1. Health check
curl http://localhost:3000/          # Should return OK

# 2. Register first user (referrer)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "grandparent", "phoneNumber": "01710000001", "password": "TestP@ss1"}'
# Save ownRefercode: e.g. "11111111"

# 3. Register second user (with referrer's code)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "parent", "phoneNumber": "01710000002", "password": "TestP@ss1", "referCode": "11111111"}'
# Save ownRefercode: e.g. "22222222"

# 4. Register third user (with parent's code)
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "child", "phoneNumber": "01710000003", "password": "TestP@ss1", "referCode": "22222222"}'

# 5. Login as child
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "child", "password": "TestP@ss1"}'
# Save accessToken

# 6. Check child's upline
curl http://localhost:3000/referral/upline -H "Authorization: Bearer <child-token>"
# Should show: parent (L1), grandparent (L2)

# 7. Login as grandparent
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "grandparent", "password": "TestP@ss1"}'
# Save accessToken

# 8. Check grandparent's downline
curl http://localhost:3000/referral/stats -H "Authorization: Bearer <gp-token>"
# Should show: totalReferrals=2, level1Count=1, level2Count=1

# 9. Get downline tree
curl http://localhost:3000/referral/downline/tree -H "Authorization: Bearer <gp-token>"

# 10. Purchase membership (as child)
curl -X POST http://localhost:3000/membership/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <child-token>" \
  -d '{"planId": "<basic-plan-uuid>"}'
# Should return commissions to parent (L1) and grandparent (L2)

# 11. Check parent's commission
curl http://localhost:3000/membership/my -H "Authorization: Bearer <parent-token>"
# Should show commissionEarned > 0
```

### Scenario 2: Web Frontend User Flow

1. Open `http://localhost:3000` (home/landing page)
2. Click **"Sign In"** → navigate to `/login`
3. (or click **"Create Account"** → navigate to `/register`)
4. At `/login`, click **"Sign up"** → navigate to `/register`
5. Enter: username, phone number, password, confirm password
6. Submit → registers via API, token saved to auth store, **redirects to `/dashboard`**
7. View dashboard: stats cards, referral code, quick actions
8. Click **"Referral Team"** → navigate to `/referral`
9. Copy your referral link from the top
10. Open an incognito/private window → navigate to `/register?ref=YOURCODE`
11. The referral code is **pre-filled** in the form (via `router.query.ref`)
12. Register the second user → auto-redirects to dashboard
13. Go back to the first user's dashboard → refresh → see referrals increase
14. Test **auto-redirect**: Visit `/login` or `/register` while logged in → immediately redirected to `/dashboard`
15. Test **logout**: Click logout in the side drawer → token cleared, redirected to `/login`

### Scenario 3: Membership Purchase Flow

1. Login as a user
2. Navigate to `/membership`
3. View available plans with prices
4. Click "Upgrade" on a plan (e.g., Basic $500)
5. See success alert
6. Refresh → current plan shows "Basic"
7. Purchase "Standard" → success
8. Try to purchase "Basic" or "Standard" again → "Already Upgraded"

### Scenario 4: Mobile App Flow

1. Open the Expo app
2. Login screen appears
3. Tap "Sign up" → navigate to Register
4. Fill in form and register
5. Dashboard loads with stats
6. Tap "Referral Team" → see referral code and empty list
7. Go back → share your referral code
8. After someone registers with your code, pull to refresh

### Scenario 5: Edge Cases

| Test Case | Steps | Expected |
|-----------|-------|----------|
| **Username too short** | Register with 1 character | 400 Validation error |
| **Invalid phone format** | Register with non-numeric phone | Accepted (no validation on format yet) |
| **Password < 6 chars** | Frontend validation | "Password must be at least 6 characters" |
| **10-level chain** | Build chain of 10 referrals, bottom buys | All 10 levels get commissions |
| **Same referral code** | Register without refferal | Gets unique 8-digit code |
| **Empty referral code** | Register with empty referCode | Treated as no referral |
| **Expired JWT** | Wait 15 min after login | 401, frontend redirects to login |
| **Double login** | Login on two devices | Both sessions work independently |
| **Logout** | Click logout | Token cleared, redirect to login |

---

## 12. Testing with Docker

### 12.1 Full Stack Docker Setup

Build and run all services:

```bash
docker-compose up -d --build
```

### 12.2 Verify All Containers

```bash
docker ps
```

Expected containers:
| Container Name | Service | Port |
|----------------|---------|------|
| `dreamy-life-db` | PostgreSQL 15 | 5432 |
| `dreamy-life-redis` | Redis 7 | 6379 |
| `dreamy-life-backend` | NestJS API | **4000** |
| `dreamy-life-web` | Next.js User Web | 3000 |
| `dreamy-life-admin` | Next.js Admin | 3001 |

### 12.3 Test Docker Services

```bash
# Backend API (port 4000 in Docker)
curl http://localhost:4000/

# User Web Frontend
curl http://localhost:3000/

# Admin Panel
curl http://localhost:3001/
```

### 12.4 Docker Logs

```bash
docker logs dreamy-life-backend -f
docker logs dreamy-life-web -f
docker logs dreamy-life-admin -f
docker logs dreamy-life-db -f
```

---

## 13. Troubleshooting

### Backend won't start

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `ECONNREFUSED` on port 5432 | PostgreSQL not running | Run `docker-compose up -d postgres` |
| `ECONNREFUSED` on port 6379 | Redis not running | Run `docker-compose up -d redis` |
| `relation "users" does not exist` | Schema not pushed | Run `npx drizzle-kit push:pg` |
| `JWT_SECRET not configured` | Missing env variables | Check `packages/backend/.env` |
| `cookie-parser not found` | Missing dependency | Run `pnpm install` from root |
| `Cannot find module '@nestjs/jwt'` | Missing dependency | Run `pnpm install` from root |

### Auth Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `Invalid or expired token` after login | Wrong JWT_SECRET | Check `.env` matches JWT_SECRET |
| `Refresh token missing` | No cookie parser | Ensure cookie-parser is installed and mounted |
| `401` on profile endpoint | No Authorization header | Include `Authorization: Bearer <token>` |
| Login works but dashboard loads forever | CORS issue | Check backend CORS config in `main.ts` |

### Referral Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Referral tree returns empty | No referrals yet | Register more users with referral codes |
| Downline shows fewer users than expected | Chain broken somewhere | Verify each user in chain has a valid `referredBy` |
| `Invalid referral code` | Code doesn't exist | Check the code is exactly 8 digits and registered |
| Upline returns empty | User didn't register with referral | Check `referredBy` field in database |

### Membership Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| No plans returned | Plans not seeded | Backend auto-seeds on start; check `seedPlans()` in logs |
| Purchase returns "Plan not found" | Wrong plan UUID | Fetch `/membership/plans` first to get valid IDs |
| No commissions after purchase | User has no upline | Commissions only go to upline; no upline = no commissions |
| `Already have this or higher` | User is on same/better plan | Can only upgrade to higher plans |

### Mobile Issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| `Network request failed` | Wrong API URL | Set `EXPO_PUBLIC_API_URL` to your machine's local IP |
| `@react-native-async-storage/async-storage` not found | Missing dependency | Run `pnpm install` from root |
| Can't scan QR code | Different WiFi | Ensure phone and computer are on same network |

### Docker issues

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Build fails at `pnpm install` | Network/lockfile issues | Check Docker network, try `docker-compose build --no-cache` |
| Container exits immediately | Missing `.env` file | Ensure `packages/backend/.env` exists |
| Backend can't connect to DB | Health check failing | Wait for PostgreSQL to initialize (may take 10s) |

### File Structure Reference

Key files created/updated for the auth, referral, and membership system:

| File | Purpose |
|------|---------|
| `packages/backend/src/infrastructure/database/schema.ts` | Users, user_info, referrals, membership, commissions tables |
| `packages/backend/src/modules/auth/` | Auth module (register, login, JWT, guards) |
| `packages/backend/src/modules/referral/` | Referral module (tree, stats, downline, upline) |
| `packages/backend/src/modules/membership/` | Membership module (plans, purchase, commissions) |
| `packages/shared-types/src/entities/user.ts` | User entity with member_status |
| `packages/shared-types/src/entities/referral.ts` | Referral, referral tree, membership plan entities |
| `packages/shared-types/src/dtos/auth.dto.ts` | Auth request/response DTOs |
| `packages/shared-types/src/dtos/membership.dto.ts` | Membership DTOs |
| `packages/shared-types/src/dtos/referral.dto.ts` | Referral DTOs |
| `apps/web/src/pages/index.tsx` | Web landing / home page |
| `apps/web/src/pages/login.tsx` | Web login page |
| `apps/web/src/pages/register.tsx` | Web register page |
| `apps/web/src/pages/dashboard.tsx` | Web dashboard |
| `apps/web/src/pages/referral.tsx` | Web referral detail |
| `apps/web/src/pages/membership.tsx` | Web membership page |
| `apps/web/src/store/authStore.ts` | Zustand auth store (setAuth, clearAuth, hydrate) |
| `apps/mobile/src/screens/LoginScreen.tsx` | Mobile login |
| `apps/mobile/src/screens/RegisterScreen.tsx` | Mobile register |
| `apps/mobile/src/screens/DashboardScreen.tsx` | Mobile dashboard |
| `apps/mobile/src/screens/ReferralScreen.tsx` | Mobile referral |