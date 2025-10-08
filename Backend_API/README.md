# Dreamy Life v2.0 Backend API

A Django REST API for a multi-level referral system with memberships, wallets, and notifications for the Dreamy Life platform.

## Features

- User registration and authentication with JWT
- Multi-level referral system (up to 10 levels)
- Membership plans with commission distribution
- Wallet system for commissions
- Notifications for referral activities
- Celery for background tasks

## Setup

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Set up environment variables in `.env`:

   ```
   SECRET_KEY=your-secret-key
   DEBUG=True
   REDIS_URL=redis://localhost:6379/0
   DATABASE_URL=postgresql://username:password@localhost:5432/dreamy_life_v2.0_data
   ```

3. Run migrations:

   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. Create superuser:

   ```bash
   python manage.py createsuperuser
   ```

5. Run server:

   ```bash
   python manage.py runserver
   ```

6. Access admin panel at `http://localhost:8000/admin/` with superuser credentials

7. (Optional) Run Celery for background tasks (requires Redis):
   ```bash
   celery -A referral_system.celery worker -l info
   ```
   **Note**: If Redis is not available, the application will work without background tasks.

## API Endpoints

### Authentication

#### Register User

- **URL**: `POST /api/users/register/`
- **Body**:
  ```json
  {
    "username": "testuser",
    "phone_number": "1234567890",
    "password": "password123",
    "referred_by": "ABCDEFGHIJ" // optional
  }
  ```
- **Response**:
  ```json
  {
    "detail": "registered",
    "user_id": 1,
    "username": "testuser",
    "referral_code": "ABCDEFGH"
  }
  ```

#### Login

- **URL**: `POST /api/users/login/`
- **Body**:
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```
- **Response**:
  ```json
  {
    "refresh": "refresh_token",
    "access": "access_token"
  }
  ```

### Users

#### Get Downlines

- **URL**: `GET /api/users/downlines/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**:
  ```json
  {
    "downlines": [
      {
        "user_id": 2,
        "username": "user2",
        "level": 1
      }
    ]
  }
  ```

### Memberships

#### List Memberships

- **URL**: `GET /api/memberships/`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "name": "Basic",
      "price": "100.00",
      "description": "Basic plan",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
  ```

#### Purchase Membership

- **URL**: `POST /api/memberships/purchase/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**:
  ```json
  {
    "membership_id": 1
  }
  ```
- **Response** (Success):
  ```json
  {
    "message": "Basic purchased successfully!",
    "membership": "Basic"
  }
  ```
- **Response** (Error):
  ```json
  {
    "error": "Membership not found"
  }
  ```
- **Commission Distribution**: Automatically distributes commissions to up to 10 levels of uplines based on `MembershipCommission` rules.

## Testing with cURL

### Register a new user

```bash
curl -X POST http://localhost:8000/api/users/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "phone_number": "1234567890",
    "password": "password123",
    "referred_by": "ABCDEFGHIJ"
  }'
```

Response:

```json
{
  "detail": "registered",
  "user_id": 1,
  "username": "testuser",
  "referral_code": "ABCDEFGH"
}
```

### Login

```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Get downlines (replace TOKEN with actual access token)

```bash
curl -X GET http://localhost:8000/api/users/downlines/ \
  -H "Authorization: Bearer TOKEN"
```

### Get memberships

```bash
curl -X GET http://localhost:8000/api/memberships/
```

### Purchase membership (replace TOKEN with actual access token)

```bash
curl -X POST http://localhost:8000/api/memberships/purchase/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membership_id": 1
  }'
```

## Referral System Flow

1. User registers with optional referral code
2. If referral code provided, user is linked to referrer
3. User can view their downlines
4. User purchases membership via API, which automatically:
   - Creates a `MembershipPurchase` record
   - Distributes commissions to up to 10 levels of uplines based on `MembershipCommission` rules
   - Credits wallets atomically with transaction logging
5. Notifications are sent for new referrals and commissions

## Models

- **User**: Custom user model with referral relationships (referred_by)
- **UserInfo**: Additional user info, own referral code, level, and profile details
- **Membership**: Membership plans
- **MembershipCommission**: Commission rules per level
- **MembershipPurchase**: Records of membership purchases by users
- **Wallet**: User wallet for commissions
- **WalletTransaction**: Transaction history (credit/debit with descriptions)
- **Notification**: User notifications

## Project Structure

```
Backend_API/
├── manage.py
├── referral_system/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── celery.py
│   └── asgi.py
├── users/
│   ├── models.py (User, UserInfo)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── memberships/
│   ├── models.py (Membership, MembershipCommission, MembershipPurchase)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   ├── services.py
│   └── migrations/
├── wallets/
│   ├── models.py (Wallet, WalletTransaction)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── notifications/
│   ├── models.py (Notification)
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── admin.py
│   └── migrations/
├── requirements.txt
├── README.md
├── .env
└── Pipfile*
```

## Background Tasks

- Notify uplines on new registration
- Process membership purchase commissions (handled synchronously in services.py with atomic transactions)

Run Celery worker to process background tasks.
