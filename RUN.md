# 🚀 How to Run the Dreamy Life Application

This guide will walk you through setting up and running the Dreamy Life Newapp monorepo.

## 🛠 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **pnpm** (`npm install -g pnpm`)
- **Docker** & **Docker Compose**
- **Expo Go** app on your mobile device (for mobile testing)

## 📦 Installation & Setup

### 1. Clone and Install
```bash
# Clone the repository
git clone <repo-url>
cd dreamy-life

# Install dependencies
pnpm install
```

### 2. Environment Configuration
Copy the example environment file for the backend:
```bash
cp packages/backend/.env.example packages/backend/.env
```
Edit `packages/backend/.env` and fill in your actual values (Sentry DSN, OAuth keys, etc.).

### 3. Start Infrastructure (Database & Redis)
Use Docker Compose to spin up PostgreSQL and Redis:
```bash
docker-compose up -d
```

### 4. Initialize Database Schema
Run the Drizzle migrations to set up the database tables:
```bash
cd packages/backend
pnpm drizzle-kit push:pg
```

## 🖥 Running the Application

### 1. Backend (NestJS)
```bash
pnpm --filter @dreamy-life/backend run dev
```
The API will be available at `http://localhost:4000`.

### 2. Mobile App (Expo)
```bash
pnpm --filter mobile run start
```
- Scan the QR code with your **Expo Go** app.
- Ensure your mobile device is on the same WiFi network as your computer.
- **Important**: In the mobile app config, ensure the API URL points to your machine's local IP (not `localhost`).

## 🧪 Testing
```bash
# Run all tests across the monorepo
pnpm run test
```
