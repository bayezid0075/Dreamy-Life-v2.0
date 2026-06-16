# Firebase Setup for Push Notifications

## Prerequisites
- A Google account
- Node.js 18+ installed

---

## Step 1: Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `dreamy-life` (or any name you prefer)
4. Disable Google Analytics (optional) → Click **"Create project"**
5. Wait for project creation to finish → Click **"Continue"**

---

## Step 2: Register a Web App

1. In the Firebase console, click the **Web icon** (`</>`) to add a web app
2. Enter app nickname: `Dreamy Life Web`
3. **Check** "Also set up Firebase Hosting" (optional)
4. Click **"Register app"**
5. You'll see a config object like this — **copy all values**:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "dreamy-life-xxxxx.firebaseapp.com",
  projectId: "dreamy-life-xxxxx",
  storageBucket: "dreamy-life-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

6. Click **"Continue to console"**

---

## Step 3: Get VAPID Key (for Web Push)

1. In Firebase console, go to **Project Settings** (gear icon ⚙️)
2. Go to **"Cloud Messaging"** tab
3. Scroll to **"Web push certificates"**
4. Click **"Generate Key Pair"**
5. Copy the **Key pair** value — this is your `VAPID Key`

---

## Step 4: Get Service Account Key (for Backend)

1. In Firebase console, go to **Project Settings** (gear icon ⚙️)
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"** (⚠️ confirm the dialog)
4. A JSON file will download. Open it and copy these 3 values:

```json
{
  "project_id": "dreamy-life-xxxxx",
  "client_email": "firebase-adminsdk-xxxxx@dreamy-life-xxxxx.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEv..."
}
```

---

## Step 5: Enable Cloud Messaging

1. In Firebase console, go to **Project Settings** → **"Cloud Messaging"** tab
2. Ensure **Cloud Messaging API (V1)** is enabled
3. Under **Web Push**, ensure FCM credentials are set

---

## Step 6: Fill in Environment Variables

### Backend (root `.env`)

Edit `packages/backend/.env` or the root `.env`:

```env
FIREBASE_PROJECT_ID=dreamy-life-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@dreamy-life-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----"
```

> ⚠️ The `FIREBASE_PRIVATE_KEY` must be wrapped in quotes and include `\n` for newlines.

### Web App (`apps/web/.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dreamy-life-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dreamy-life-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dreamy-life-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BNx...your...vapid...key
```

---

## Step 7: Restart Services

```bash
# Restart Docker containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Or restart individually
pnpm --filter @dreamy-life/backend dev
pnpm --filter @dreamy-life/web dev
```

---

## Step 8: Test

1. Open the web app at `http://localhost:3000`
2. Login → Go to Dashboard
3. Browser should prompt for notification permission
4. Go to Admin Panel → Notifications → Compose
5. Send a broadcast notification
6. You should receive a push notification on the web

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Firebase credentials not configured" warning | Check `FIREBASE_*` env vars are set in backend `.env` |
| Browser doesn't show notification prompt | Check if `NEXT_PUBLIC_FIREBASE_VAPID_KEY` is set |
| Push not received on web | Check browser console for FCM errors; ensure service worker is registered |
| "messaging/token-permission-not-granted" | User denied notification permission; clear site data and retry |
| Private key errors | Ensure `\n` in `FIREBASE_PRIVATE_KEY` and value is wrapped in quotes |
