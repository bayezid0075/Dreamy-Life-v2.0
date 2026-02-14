# Dreamy Life – Flutter app

Mobile app for **Dreamy Life**, using the same Django backend as the web app.

## Quick start (after Flutter is installed)

See **[FLUTTER_SETUP.md](../FLUTTER_SETUP.md)** in the repo root for:

- Installing the Flutter SDK
- Recommended extensions (Flutter + Dart)
- Generating platform folders and running the app
- Configuring the API base URL

```bash
# From this folder, after installing Flutter:
flutter create . --project-name dreamy_life
flutter pub get
flutter run
```

## Features

- **Auth**: Login, register, JWT with secure storage and refresh
- **Shop**: Product list, product detail, categories/brands/vendors (API-ready)
- **Orders**: List orders
- **Wallet**: Balance, income/expense, recent transactions
- **Profile**: User info, referral code, sign out

## Architecture

- **Core**: `ApiClient` (Dio + JWT + refresh), `SecureTokenStorage`, constants
- **Data**: Models and repositories (auth, user, shop, order, wallet)
- **Features**: Auth, shop, orders, wallet, profile screens + Riverpod providers
- **App**: go_router, splash, dashboard shell with bottom nav

The app is built to be **scalable** (feature-based, clear separation), **fast** (Riverpod + minimal rebuilds, repository pattern), and **secure** (tokens in secure storage, refresh on 401).
