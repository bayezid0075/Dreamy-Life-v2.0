## 🎯 CORE PRINCIPLES (NON-NEGOTIABLE)

### 1. Technology Stack Rules
- **Backend**: NestJS + TypeScript ONLY (no Express, no Fastify)
- **Database**: PostgreSQL + Drizzle ORM ONLY (no Prisma, no TypeORM)
- **Real-time**: Socket.io with NestJS WebSockets Gateway ONLY
- **Cache/Queue**: Redis + BullMQ ONLY
- **Auth**: JWT + Passport.js + OAuth2 (Google/Facebook) ONLY
- **Validation**: class-validator + class-transformer + Zod ONLY
- **Mobile**: Expo (React Native) with Expo Router ONLY (no React Native CLI)
- **Styling**: NativeWind (Tailwind for RN) ONLY (no styled-components)
- **State**: Zustand + TanStack Query ONLY (no Redux, no Context API for state)
- **HTTP Client**: Axios with interceptors ONLY
- **File Storage**: AWS S3 (private) + CloudFront CDN ONLY
- **Media Processing**: AWS Lambda + Sharp ONLY
- **Monitoring**: Sentry + Prometheus + Grafana ONLY
- **Logging**: Winston (structured JSON) ONLY
- **Deploy**: Coolify (self-hosted on VPS) for zero-downtime ONLY
- **CI/CD**: GitHub Actions ONLY

### 2. Architecture Rules
- **Monorepo structure**: Use Turborepo for package management
- **Shared code**: Web and mobile MUST share API client, types, utils
- **Same backend**: Single NestJS API serves web, mobile, and admin
- **DDD pattern**: Backend uses Domain-Driven Design (application/domain/infrastructure/interfaces layers)
- **Feature-based**: Frontendorganized by features (auth/, feed/, post/, referral/) not by type
- **Microservices-ready**: Backend modules must be independent (can be split later)

### 3. Programming Paradigm Rules
- **Backend**: Hybrid OOP + Functional
  - OOP: Classes for Services, Controllers, Entities, Modules
  - Functional: Pure functions for calculations, validation, transformations
- **Frontend**: Functional ONLY
  - NO class components in React Native
  - Functional components + hooks (useState, useEffect, custom hooks)
  - Immutable state (Zustand stores, never mutate directly)
  - Pure functions for utils, validators, calculators
- **Reactive**: Use RxJS Observables for real-time streams in backend

### 4. Security Rules (MUST FOLLOW)
- **Every endpoint**: Input validation with Zod + class-validator DTO
- **Input sanitization**: Remove XSS, SQL injection prevention
- **Rate limiting**: 100 requests/minute per user, 10/minute per IP
- **JWT tokens**: Access token (15min) + refresh token (7 days, HTTP-only cookie)
- **Password**: Min 8 chars, 1 uppercase, 1 number, 1 special char, bcrypt hashed
- **Email**: RFC 5322 compliant validation, 6-digit email verification
- **CORS**: Whitelist only your domains (never allow *)
- **HTTPS**: Enforce everywhere in production
- **Socket.io**: JWT authentication middleware on every socket connection
- **Secrets**: NEVER commit .env files, use environment variables
- **AWS keys**: NEVER expose in frontend, only in backend environment

### 5. Real-Time Rules (Socket.io)
- **Every user action**: Must emit real-time event (post, like, comment, referral)
- **Rooms**: Use rooms for user-specific (`user:{userId}`) and post-specific (`post:{postId}`) events
- **Reconnection**: Exponential backoff (1s → 5s → 10s max), auto-reconnect enabled
- **Rate limiting**: 10 socket events/second per client
- **Health checks**: Track active connections, ping every 30s
- **Horizontal scaling**: Use Socket.IO Redis adapter for multiple backend instances
- **Offline support**: BullMQ queue for offline notifications (deliver when user comes online)

### 6. Frontend Rules (Reloadless, Super Fast)
- **No page refreshes**: TanStack Query for background refetch, optimistic updates
- **Optimistic UI**: Update UI immediately, rollback on error
- **Loading states**: Skeleton loaders for all data fetching
- **Error boundaries**: Wrap all screens with ErrorBoundary + Sentry
- **Code splitting**: Lazy load screens, route-based code splitting
- **Image optimization**: expo-image with caching, lazy loading
- **Bundle size**: Mobile <50MB install, Web <2MB initial bundle
- **Offline support**: Cache feed with TanStack Query, queue actions for sync

### 7. Multi-Level Referral Rules
- **Tree structure**: PostgreSQL recursive CTE for traversal (up to 10 levels)
- **Pure functions**: Referral calculation MUST be pure functional (same input → same output)
- **Bonus rules**:
  - Level 1 (direct): 10% of referee's earnings
  - Level 2: 5%
  - Level 3-5: 3%
  - Level 6-10: 1%
- **Database**: Use PostgreSQL `ltree` extension for materialized paths (performance)
- **Cache**: Redis cache for frequent referral queries
- **Transactions**: BullMQ queue for async bonus calculations (avoid blocking)

### 8. Smart Media Handling Rules
- **Upload flow**:
  1. Client requests presigned URL from backend
  2. Backend generates URL with AWS S3 + CloudFront
  3. Client uploads directly to S3 (backend never touches file)
  4. S3 triggers Lambda → generates thumbnails + multiple qualities
  5. CloudFront serves adaptive quality based on connection
- **Quality levels**:
  - WiFi/5G: High (500KB)
  - 3G: Low (100KB)
  - 2G: Thumbnail only (10KB)
- **File structure**:
s3://bucket/post_media/
├── abc.jpg (original)
├── abc_high.jpg (500KB)
├── abc_low.jpg (100KB)
└── abc_thumb.jpg (10KB)

text
- **Adaptive loading**: API returns multiple quality URLs, client picks based on connection
- **Storage**: Store only S3 key in database, build full URL at query time

### 9. Error Handling Rules
- **Backend**: Global exception filter + Sentry capture + Winston logger
- **Frontend**: ErrorBoundary + Sentry capture + user-friendly message
- **WebSocket**: Try/catch in event handlers + send error to client + Sentry capture
- **Standardized errors**: Always return `{ success: false, error: { code, message, detail } }`
- **Don't expose details**: In production, hide internal error details from client (only in development)
- **Retry logic**: TanStack Query retry 3 times for 5xx errors, NO retry for 4xx errors

### 10. Zero-Downtime Deployment Rules
- **Health checks**: Every container must have `/health` endpoint
- **Rolling update**: Start new container → wait for health check → switch traffic → stop old container
- **Coolify**: Use Coolify for auto-deploy on git push (no manual SSH)
- **Mobile OTA**: Expo EAS Update for over-the-air updates (no App Store review for JS changes)
- **Database migrations**: Run migrations BEFORE deploying new code (backward compatible)
- **Environment variables**: Separate env vars for staging and production
- **Auto-rollback**: If health check fails, auto-rollback to previous version

### 11. Testing Rules
- **Backend**: Unit tests for services (Jest), integration tests for API (Supertest)
- **Frontend**: Component tests (React Testing Library), E2E tests (Playwright for web, Detox for mobile)
- **Load testing**: k6 for WebSocket concurrency (test 10K concurrent connections)
- **Coverage**: Minimum 80% code coverage for critical paths
- **CI pipeline**: Run tests before every deployment

### 12. Performance Rules
- **Database**: Indexes on `referred_by_id`, `created_at`, `user_id`; use `ltree` for referral tree
- **Cache**: Redis cache for frequent queries (user profile, referral tree)
- **CDN**: CloudFront for all static assets + media
- **Lazy loading**: Infinite scroll for feed, lazy load images below fold
- **Bundle optimization**: Tree-shaking, code splitting, minification
- **Hermes**: Enable Hermes engine for React Native (faster startup)
- **Connection pooling**: PostgreSQL connection pool (max 20 connections)

### 13. Database Schema Rules
- **Primary keys**: UUID with `defaultRandom()` (not auto-increment)
- **Timestamps**: Every table must have `created_at` and `updated_at`
- **Soft deletes**: Use `deleted_at` column (don't hard delete)
- **Foreign keys**: Always define foreign key constraints
- **Indexes**: Create indexes on frequently queried columns
- **JSONB**: Use JSONB for flexible data (calculation rules, metadata)
- **Migrations**: Drizzle migrations for every schema change

### 14. Code Quality Rules
- **TypeScript**: Strict mode ON, NO `any` types
- **Naming**: PascalCase for classes/components, camelCase for functions/variables, kebab-case for files
- **Comments**: Comment complex logic, NOT obvious code
- **Functions**: Max 50 lines per function, extract larger functions into smaller ones
- **Files**: Max 300 lines per file, extract larger files into modules
- **Imports**: Organize imports (React/Node/third-party/local), use absolute imports with path aliases
- **Linter**: ESLint with strict rules, fix all errors before committing
- **Formatter**: Prettier with consistent config, format on save

### 15. Documentation Rules
- **README**: Project overview, setup instructions, environment variables, scripts
- **API docs**: OpenAPI/Swagger docs for all endpoints (auto-generated from NestJS decorators)
- **Code docs**: JSDoc comments for public functions, complex algorithms
- **Environment**: `.env.example` with all required variables
- **Deployment**: Deploy guide with step-by-step instructions

---

## ⚠️ CRITICAL DO NOTS

### DO NOT:
- ❌ Use class components in React Native
- ❌ Use blocking operations (sync file I/O, synchronous database queries)
- ❌ Use plaintext passwords (always use environment variables)
- ❌ Expose secrets in frontend code (AWS keys, JWT secrets, API keys)
- ❌ Skip input validation (every endpoint, every socket event)
- ❌ Skip error handling (try/catch, global exception filter, Sentry)
- ❌ Skip health checks (/health endpoint for deployment verification)
- ❌ Use `any` type in TypeScript (use `unknown` instead + type narrowing)
- ❌ Write verbose comments (comment WHY, not WHAT)
- ❌ Commit `.env` files to git
- ❌ Use `console.log` in production (use Winston logger)
- ❌ Hardcode values (use environment variables or constants)
- ❌ Create tight coupling between modules (use dependency injection)
- ❌ Ignore mobile performance (optimize bundle size, images, animations)
- ❌ Skip testing (write tests for critical paths)

---

## ✅ CRITICAL DOS

### ALWAYS:
- ✅ Use TypeScript strict mode
- ✅ Validate EVERY input (Zod + class-validator)
- ✅ Handle EVERY error (try/catch + global filter + Sentry)
- ✅ Use health checks (/health endpoint)
- ✅ Write tests for critical paths
- ✅ Optimize for performance (lazy loading, caching, code splitting)
- ✅ Use environment variables for config
- ✅ Follow DRY principle (don't repeat yourself)
- ✅ Follow SOLID principles (single responsibility, dependency injection)
- ✅ Use async/await (never use raw promises)
- ✅ Use functional components + hooks in React
- ✅ Use pure functions for calculations
- ✅ Use immutable state (Zustand, TanStack Query)
- ✅ Use optimistic UI updates
- ✅ Use real-time updates (Socket.io for every action)
- ✅ Use CDN for media (CloudFront)
- ✅ Use compression (gzip, Brotli)
- ✅ Use HTTPS everywhere
- ✅ Use rate limiting
- ✅ Log errors (Winston + Sentry)
- ✅ Monitor performance (Prometheus + Grafana)
- ✅ Auto-deploy with zero downtime (Coolify + GitHub Actions)

---

## 📁 PROJECT STRUCTURE RULES

### MUST follow this exact structure:
project-root/
├── apps/
│ ├── mobile/ # Expo React Native (DO NOT change name)
│ └── admin/ # Admin panel (DO NOT change name)
├── packages/
│ ├── shared-types/ # TypeScript types + Zod schemas
│ ├── api-client/ # Shared API + Socket client
│ ├── utils/ # Shared utility functions (FP)
│ └── config/ # Shared ESLint, TSConfig, Tailwind
└── packages/backend/ # NestJS Backend (DO NOT change name)

text

### Backend module structure (MUST follow):
modules/
├── feature-name/
│ ├── application/ # Application layer (use cases, services)
│ │ ├── dto/
│ │ ├── services/
│ │ └── interfaces/
│ ├── domain/ # Domain layer (entities, business logic)
│ │ ├── entities/
│ │ ├── value-objects/
│ │ └── services/
│ ├── infrastructure/ # Infrastructure layer (DB, external)
│ │ ├── repository/
│ │ └── models/
│ ├── interfaces/ # Interface layer (API controller, WebSocket)
│ │ ├── controllers/
│ │ └── sockets/
│ └── feature-name.module.ts

text

### Frontend feature structure (MUST follow):
features/
├── feature-name/
│ ├── screens/
│ ├── components/ # Feature-specific components
│ ├── api.ts # React Query hooks
│ ├── useFeatureStore.tsx # Zustand store
│ └── types.ts

text

---

## 🚀 BUILD ORDER (FOLLOW SEQUENCE)

### Phase 1: Setup (DO THIS FIRST)
1. Initialize monorepo with Turborepo
2. Set up shared packages (types, utils, api-client)
3. Configure ESLint + Prettier + TypeScript strict
4. Set up GitHub Actions + Coolify

### Phase 2: Backend Core (PHASE 1 MUST COMPLETE FIRST)
1. NestJS setup with Docker
2. PostgreSQL + Drizzle ORM + migrations
3. Auth module (JWT + OAuth2 + email verification)
4. Users module (CRUD + profile)
5. Redis + BullMQ setup
6. Global exception filter + validation pipe
7. Sentry integration

### Phase 3: Core Features (PHASE 2 MUST COMPLETE FIRST)
1. Posts module (create, read, like, comment)
2. Socket.io integration (real-time events)
3. Feed with infinite scroll
4. Media module (S3 + CloudFront + Lambda)
5. Referral module (tree calculation + bonuses)
6. Notification system

### Phase 4: Frontend Mobile (PHASE 3 MUST COMPLETE FIRST)
1. Expo setup with Expo Router
2. Auth screens (sign in, sign up, OAuth)
3. Feed screen with real-time updates
4. Create post screen (media picker + upload)
5. Profile screen
6. Zustand stores + TanStack Query
7. ErrorBoundary + Sentry

### Phase 5: Frontend Web + Admin (PHASE 4 MUST COMPLETE FIRST)
1. Next.js web app (shared code with mobile)
2. Admin panel (dashboard, user management, moderation)
3. Real-time analytics
4. Content moderation tools

### Phase 6: Polish & Deploy (PHASE 5 MUST COMPLETE FIRST)
1. Performance optimization
2. Security audit
3. Load testing (10K concurrent users)
4. Deploy to production with Coolify
5. Expo EAS OTA setup
6. Documentation

---

## 🎯 ACCEPTANCE CRITERIA (MUST PASS ALL)

Before considering any feature complete, verify:

1. ✅ Web and mobile share the SAME backend API
2. ✅ Every action (like, comment, post) updates in real-time (no refresh)
3. ✅ Multi-level referral calculates bonuses correctly (up to 10 levels)
4. ✅ Media uploads create thumbnails + multiple qualities automatically
5. ✅ JWT authentication with auto-refresh tokens works
6. ✅ All endpoints have input validation + error handling
7. ✅ Zero-downtime deployment (push to GitHub → auto-deploy)
8. ✅ Mobile OTA updates work (no App Store review for JS changes)
9. ✅ Sentry captures all errors with stack traces
10. ✅ App is lightweight (<50MB mobile, <2MB initial web bundle)

---

## ⚡ WHEN YOU'RE UNSURE

If you're unsure about ANY requirement:
1. **STOP** and ask me for clarification
2. **DO NOT** make assumptions
3. **DO NOT** proceed with wrong implementation
4. **REVIEW** the rules above again
5. **CONFIRM** with me before proceeding

---

## 📝 STARTING INSTRUCTIONS

When I say "Start building":
1. Begin with Phase 1: Monorepo setup
2. Create the complete folder structure
3. Initialize all packages
4. Configure all tools
5. Provide working code for EVERY file
6. Build everything production-ready (NOT tutorial-level)

If any step is unclear, ask me BEFORE proceeding.

---

## 🔥 FINAL REMINDER

This is a **PRODUCTION APP**, not a tutorial project. Every line of code must be:
- Production-ready
- Secure
- Performant
- Maintainable
- Tested
- Documented

**FOLLOW THESE RULES EXACTLY. DO NOT DEVIATE.**