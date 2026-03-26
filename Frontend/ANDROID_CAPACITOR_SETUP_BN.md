# Dreamy Life Android App Setup (Capacitor) - বাংলা গাইড

এই প্রজেক্টে এখন Capacitor + Android push notification (FCM) support এর base integration যোগ করা হয়েছে।

## 1) App architecture (এই কোডবেস অনুযায়ী)

- Frontend: `Next.js` (App Router), path: `Frontend/`
- Backend: `Django + DRF`, path: `Backend/`
- Superadmin থেকে notification endpoint: `/api/superadmin/push-notification/`
- Android push enable করতে backend-এ device token registry + FCM send flow যোগ করা হয়েছে।

## 2) কী কী কোড যোগ হয়েছে

- `Frontend/capacitor.config.ts`
- `Frontend/src/components/providers/mobile-push-provider.tsx`
- `Frontend/src/lib/api/notifications.ts` (device token register/unregister API)
- `Backend/notifications/models.py` (`DeviceToken` model)
- `Backend/notifications/views.py` (`/api/notifications/device-tokens/` endpoint)
- `Backend/notifications/firebase.py` (FCM sender helper)
- `Backend/users/superadmin_views.py` (superadmin push থেকে FCM send)
- `Backend/notifications/migrations/0004_devicetoken.py`

## 3) Dependency install

Frontend:

```bash
cd Frontend
npm install
```

Backend:

```bash
cd Backend
pip install -r requirements.txt
```

## 4) Backend migrate

```bash
cd Backend
python manage.py migrate
```

## 5) Firebase (FCM) setup

1. Firebase Console এ project তৈরি করুন।
2. Android app register করুন (`com.dreamylife.app`)।
3. Service account key JSON download করুন।
4. Backend environment এ নিচের যেকোনো একভাবে দিন:

- `FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/service-account.json`
- অথবা `FIREBASE_SERVICE_ACCOUNT_JSON={... পুরো JSON ...}`

> production এ JSON string না দিয়ে PATH ব্যবহার করা safer।

## 6) Capacitor Android project create/sync

```bash
cd Frontend
npm run build
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

## 7) Live webapp URL দিয়ে Android app চালানো

`Frontend/capacitor.config.ts` এ:

- `CAPACITOR_LIVE_URL` env দিলে সেটাই use হবে।
- এটি অবশ্যই publicly reachable frontend URL হতে হবে।

উদাহরণ:

```bash
CAPACITOR_LIVE_URL=https://your-frontend-domain.com
```

## 8) আপনার আপলোড করা logo কে Android icon হিসেবে ব্যবহার

আপনার logo file path:

`assets/c__Users_mdbh0_AppData_Roaming_Cursor_User_workspaceStorage_9441a1b58a6fc5ac78639dc8272de070_images_logo_smaller-dcc80fec-8fdf-4470-8738-2e594ee1fac4.png`

### অপশন A (recommended): Capacitor assets tool

```bash
cd Frontend
npx @capacitor/assets generate --android --iconBackgroundColor '#ffffff' --iconBackgroundColorDark '#111111' --assetPath "<LOGO_FILE_PATH>"
npm run cap:sync
```

> `LOGO_FILE_PATH` এ আপনার logo path বসান।

### অপশন B: Android Studio দিয়ে manual launcher icon

1. Android Studio -> `android` module
2. `app` এ right click -> `New` -> `Image Asset`
3. Foreground image হিসেবে আপনার uploaded logo দিন
4. Finish -> তারপর build/run

## 9) Push flow কিভাবে কাজ করবে

1. Android app login করলে Capacitor native push token generate হবে।
2. সেই token backend এ `/api/notifications/device-tokens/` এ save হবে।
3. Superadmin panel থেকে "Push notification to all users" পাঠালে:
   - in-app DB notification create হবে (আগের মতো)
   - Android token থাকলে FCM push send হবে

## 10) Android notification click behavior

Superadmin notification এ `link` দিলে, user notification tap করলে app সেই `link` এ যাবে।

## 11) "Other phone access" (camera/location/files) - ready plugins

ইতিমধ্যে install করা হয়েছে:

- `@capacitor/camera`
- `@capacitor/geolocation`
- `@capacitor/filesystem`
- `@capacitor/local-notifications`

এগুলো use করতে চাইলে feature-specific UI/action থেকে plugin call করুন; Android এ runtime permission prompt আসবে।

## 12) Quick verification checklist

- [ ] Backend migrate done
- [ ] Firebase credential env set
- [ ] Android app build/run success
- [ ] Mobile app login
- [ ] Superadmin থেকে test notification send
- [ ] Device এ push আসে

