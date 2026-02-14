# Flutter app setup – Dreamy Life

This guide gets the **Dreamy Life** Flutter app running from scratch: what to install, which extensions to use, and how to run/preview.

---

## 1. Install Flutter SDK

### Option A: Official installer (recommended)

1. **Download**
   - Go to: **https://docs.flutter.dev/get-started/install/windows**
   - Download the latest **stable** Flutter SDK (zip).

2. **Extract**
   - Extract to a short path, e.g. `C:\flutter` (avoid spaces and special characters).

3. **Add to PATH**
   - Open **Edit environment variables for your account**.
   - Under **User variables**, select **Path** → **Edit** → **New**.
   - Add: `C:\flutter\bin` (or your extraction path + `\bin`).
   - OK out of all dialogs.

4. **Verify**
   - Open a **new** terminal (e.g. PowerShell or CMD) and run:
   ```bash
   flutter --version
   ```
   - You should see the Flutter version and no “command not found” errors.

### Option B: Chocolatey

If you use Chocolatey:

```bash
choco install flutter
```

Then open a new terminal and run `flutter --version`.

---

## 2. Run Flutter doctor

This checks your environment and tells you what’s missing:

```bash
flutter doctor
```

Fix any reported issues:

- **Android**
  - Install [Android Studio](https://developer.android.com/studio) (or at least Android SDK command-line tools).
  - Accept Android licenses:  
    `flutter doctor --android-licenses`
- **VS Code / Cursor**
  - Install the **Flutter** and **Dart** extensions (see below); then run `flutter doctor` again so it can detect them.

---

## 3. Extensions to install (Cursor / VS Code)

| Extension      | Purpose                          |
|----------------|----------------------------------|
| **Flutter**    | Run/debug, device picker, widgets |
| **Dart**       | Language support, formatting, analysis |

1. Open **Extensions** (Ctrl+Shift+X).
2. Search for **Flutter** → Install.
3. Search for **Dart** → Install (often installed automatically with Flutter).

Optional but useful:

- **Error Lens** – inline errors.
- **Pubspec Assist** – add dependencies from `pubspec.yaml` easily.

---

## 4. Generate platform folders and get dependencies

This repo includes the Flutter app source (`lib/`, `pubspec.yaml`) but not the platform projects (Android/iOS). After installing Flutter, **generate** them from the `flutter_app` folder:

```bash
cd flutter_app
flutter create . --project-name dreamy_life
```

If prompted about overwriting files, keep existing where possible. Then install packages:

```bash
flutter pub get
```

---

## 5. API base URL (backend)

The app talks to your **Django backend**. Set the base URL depending on where you run the app:

| Run target        | Typical API base URL   |
|-------------------|------------------------|
| **Android emulator** | `http://10.0.2.2:8000` |
| **iOS simulator**   | `http://127.0.0.1:8000` or `http://localhost:8000` |
| **Physical device** | `http://<YOUR_PC_IP>:8000` (e.g. `http://192.168.1.5:8000`) |

Default in code is `http://10.0.2.2:8000` (Android emulator). To override without changing code, you can run with a Dart define:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.5:8000
```

Replace `192.168.1.5` with your machine’s IP. Ensure the Django backend is running and that `ALLOWED_HOSTS` / CORS allow that host.

---

## 6. Run and preview the app

### From terminal

```bash
cd flutter_app
flutter pub get
flutter run
```

- If you have only one device/emulator, the app will run there.
- To pick a device:  
  `flutter devices`  
  then:  
  `flutter run -d <device_id>`

### From Cursor / VS Code

1. Open the `flutter_app` folder (or the repo with `flutter_app` inside).
2. Ensure a device or emulator is running (e.g. start an Android emulator from Android Studio).
3. Press **F5** or use **Run → Start Debugging**.
4. In the status bar you should see the selected device; you can click it to change device.

### First run checklist

1. **Start the Django backend** (from the repo root):
   ```bash
   cd Backend
   python manage.py runserver
   ```
2. **Start an emulator** (e.g. Android Studio → Device Manager → start a virtual device), or connect a physical device with USB debugging on.
3. **Run the Flutter app** with the correct `API_BASE_URL` for your setup (see section 5).

---

## 7. App structure (high level)

- **`lib/core`** – API client (Dio + JWT + refresh), secure token storage, constants.
- **`lib/data`** – Models and repositories (auth, shop, orders, wallet, users).
- **`lib/features`** – Auth (login/register), shop (list + product detail), orders, wallet, profile.
- **`lib/app`** – Router (go_router), splash, dashboard shell with bottom nav.

The app uses:

- **Riverpod** for state and dependency injection.
- **go_router** for routing and redirects (e.g. unauthenticated → login).
- **flutter_secure_storage** for JWT tokens.
- **Dio** for HTTP with interceptors (attach token, refresh on 401).

---

## 8. Android and HTTP (development)

If your backend runs on **HTTP** (no HTTPS), Android 9+ blocks cleartext by default. After running `flutter create .`, add to `android/app/src/main/AndroidManifest.xml` inside `<application>`:

```xml
android:usesCleartextTraffic="true"
```

Use only for local development; remove or set to `false` for production with HTTPS.

---

## 9. Common issues

- **“Waiting for another flutter command to release the startup lock”**  
  Delete the lock file (path shown in the message) or close other Flutter processes/terminals.

- **Images or API not loading on device**  
  Use the correct `API_BASE_URL` for your run target (emulator vs physical device). For media URLs, ensure the backend returns absolute URLs (e.g. `http://<host>:8000/media/...`) or the app will need a base URL for media.

- **CORS / connection errors**  
  Ensure Django CORS allows your app’s origin (e.g. for web) or that you’re hitting the right host/IP and port from the app.

---

## 10. Next steps

- Add cart and checkout screens (reuse backend order APIs).
- Add memberships and referrals (reuse existing backend endpoints).
- For production: use a single configurable base URL (e.g. from env or build flavor) and consider certificate pinning for HTTPS.

Once the SDK is installed, extensions are in place, and `flutter run` works with your backend URL, you can run and preview the app from the terminal or from Cursor/VS Code as above.
