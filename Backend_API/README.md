# Dreamy Life v2.0 Backend API

A Django REST API for a multi-level referral system with memberships, wallets, and notifications for the Dreamy Life platform.

## Features

- User registration and authentication with JWT
- Multi-level referral system (up to 10 levels)
- Membership plans with commission distribution
- Wallet system for commissions
- Notifications for referral activities
- Vendor system with product management
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

### Users

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
    "email": null,
    "referral_code": "ABCDEFGH"
  }
  ```

#### Login

- **URL**: `POST /api/users/login/`
- **Body**:
  ```json
  {
    "identifier": "testuser", // username, email, or phone_number
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

#### Update User Info

- **URL**: `POST /api/users/userinfo/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body** (all fields optional):
  ```json
  {
    "profile_picture": "https://example.com/image.jpg",
    "is_verified": true,
    "address": "123 Main St, City, Country",
    "nid_or_brid": "1234567890",
    "profession": "Software Engineer",
    "blood_group": "O+",
    "gender": "Male",
    "marital_status": "Single",
    "father_name": "John Doe",
    "mother_name": "Jane Doe",
    "working_place": "Tech Company"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "user": 1,
    "own_refercode": "12345678",
    "level": 0,
    "member_status": "user",
    "profile_picture": "https://example.com/image.jpg",
    "is_verified": true,
    "address": "123 Main St, City, Country",
    "nid_or_brid": "1234567890",
    "profession": "Software Engineer",
    "blood_group": "O+",
    "gender": "Male",
    "marital_status": "Single",
    "father_name": "John Doe",
    "mother_name": "Jane Doe",
    "working_place": "Tech Company",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
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

### Vendors

#### Apply for Vendor

- **URL**: `POST /api/vendors/applications/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body**:
  ```json
  {
    "payment_status": true
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "user": 1,
    "payment_status": true,
    "is_approved": false,
    "created_at": "2023-01-01T00:00:00Z"
  }
  ```
- **Notes**: If user has VVIP membership, payment_status is automatically set to true. Upon payment, Vendor profile is auto-created.

#### List/Create Products (Vendor only)

- **URL**: `GET/POST /api/vendors/products/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body** (for POST):
  ```json
  {
    "title": "Sample Product",
    "description": "Product description",
    "sku": "SKU123",
    "category": 1,
    "price": "99.99",
    "vat": "5.00"
  }
  ```
- **Response** (for POST):
  ```json
  {
    "id": 1,
    "vendor": 1,
    "title": "Sample Product",
    "description": "Product description",
    "sku": "SKU123",
    "category": 1,
    "price": "99.99",
    "vat": "5.00",
    "created_at": "2023-01-01T00:00:00Z"
  }
  ```

#### Admin Endpoints (Admin only)

- **Categories**: `GET/POST /api/vendors/categories/`, `GET/PUT/DELETE /api/vendors/categories/<id>/`
- **SubCategories**: `GET/POST /api/vendors/subcategories/`, `GET/PUT/DELETE /api/vendors/subcategories/<id>/`
- **Brands**: `GET/POST /api/vendors/brands/`, `GET/PUT/DELETE /api/vendors/brands/<id>/`

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

#### Update User Info

- **URL**: `POST /api/users/userinfo/`
- **Headers**: `Authorization: Bearer <access_token>`
- **Body** (all fields optional):
  ```json
  {
    "profile_picture": "https://example.com/image.jpg",
    "is_verified": true,
    "address": "123 Main St, City, Country",
    "nid_or_brid": "1234567890",
    "profession": "Software Engineer",
    "blood_group": "O+",
    "gender": "Male",
    "marital_status": "Single",
    "father_name": "John Doe",
    "mother_name": "Jane Doe",
    "working_place": "Tech Company"
  }
  ```
- **Response**:
  ```json
  {
    "id": 1,
    "user": 1,
    "own_refercode": "12345678",
    "level": 0,
    "member_status": "user",
    "profile_picture": "https://example.com/image.jpg",
    "is_verified": true,
    "address": "123 Main St, City, Country",
    "nid_or_brid": "1234567890",
    "profession": "Software Engineer",
    "blood_group": "O+",
    "gender": "Male",
    "marital_status": "Single",
    "father_name": "John Doe",
    "mother_name": "Jane Doe",
    "working_place": "Tech Company",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
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

📘 API Testing Guide (Using Postman or cURL)
🔹 1️⃣ Create Vendor
POST /api/vendors/

json
Copy code
{
"shop_name": "Tech Mart BD",
"address": "Dhanmondi, Dhaka",
"banner_image": "image.png",
"payment_status": true
}
✅ Rules:

If user member_status = VVIP → no need for payment.

If normal user → must set "payment_status": true.

🔹 2️⃣ Update Vendor Banner
PATCH /api/vendors/1/

json
Copy code
{
"banner_image": "new_banner.png"
}
Only banner_image is editable.

🔹 3️⃣ Add Product
POST /api/products/

json
Copy code
{
"title": "Bluetooth Headphone",
"description": "Wireless and noise-cancelling.",
"sku": "HP001",
"category": 1,
"subcategory": 2,
"brand": 3,
"image": "product.png",
"tags": "audio,bluetooth,wireless",
"price": 2500.00,
"discount_price": 2000.00,
"reseller_mrp_price": 2700.00,
"delivery_charge_inside_dhaka": 60.00,
"delivery_charge_outside_dhaka": 120.00,
"vat": 5.00
}
🔹 4️⃣ Update Product
PATCH /api/products/1/

json
Copy code
{
"discount_price": 1900.00,
"reseller_mrp_price": 2600.00,
"delivery_charge_inside_dhaka": 50.00,
"delivery_charge_outside_dhaka": 100.00
}
🔹 5️⃣ View All Products
GET /api/products/

🔹 6️⃣ Delete Product
DELETE /api/products/1/

## Complete API Testing Guide

### User Registration & Authentication

#### Register a new user

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
  "email": null,
  "referral_code": "ABCDEFGH"
}
```

#### Login

```bash
curl -X POST http://localhost:8000/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "password123"
  }'
```

Response:

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Get downlines (replace TOKEN with actual access token)

```bash
curl -X GET http://localhost:8000/api/users/downlines/ \
  -H "Authorization: Bearer TOKEN"
```

#### Update user info (replace TOKEN with actual access token)

```bash
curl -X POST http://localhost:8000/api/users/userinfo/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_picture": "https://example.com/image.jpg",
    "is_verified": true,
    "address": "123 Main St, City, Country",
    "profession": "Software Engineer"
  }'
```

### Membership Management

#### Get memberships

```bash
curl -X GET http://localhost:8000/api/memberships/
```

#### Purchase membership (replace TOKEN with actual access token)

```bash
curl -X POST http://localhost:8000/api/memberships/purchase/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "membership_id": 1
  }'
```

### Vendor System

#### Apply for vendor (replace TOKEN with actual access token)

```bash
curl -X POST http://localhost:8000/api/vendors/applications/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": true
  }'
```

#### Create product as vendor (replace TOKEN with actual access token)

```bash
curl -X POST http://localhost:8000/api/vendors/products/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sample Product",
    "description": "Product description",
    "sku": "SKU123",
    "category": 1,
    "price": "99.99",
    "vat": "5.00"
  }'
```

#### Get categories

```bash
curl -X GET http://localhost:8000/api/vendors/categories/
```

#### Get specific category

```bash
curl -X GET http://localhost:8000/api/vendors/categories/1/
```

#### Create category (admin only, replace TOKEN with admin access token)

```bash
curl -X POST http://localhost:8000/api/vendors/categories/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics"
  }'
```

#### Update category (admin only)

```bash
curl -X PUT http://localhost:8000/api/vendors/categories/1/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Electronics"
  }'
```

#### Delete category (admin only)

```bash
curl -X DELETE http://localhost:8000/api/vendors/categories/1/ \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### Get subcategories

```bash
curl -X GET http://localhost:8000/api/vendors/subcategories/
```

#### Create subcategory (admin only)

```bash
curl -X POST http://localhost:8000/api/vendors/subcategories/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": 1,
    "name": "Smartphones"
  }'
```

#### Get brands

```bash
curl -X GET http://localhost:8000/api/vendors/brands/
```

#### Create brand (admin only)

```bash
curl -X POST http://localhost:8000/api/vendors/brands/ \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Samsung"
  }'
```

#### Get vendor applications

```bash
curl -X GET http://localhost:8000/api/vendors/applications/ \
  -H "Authorization: Bearer TOKEN"
```

#### Get specific vendor application

```bash
curl -X GET http://localhost:8000/api/vendors/applications/1/ \
  -H "Authorization: Bearer TOKEN"
```

#### Update vendor application

```bash
curl -X PUT http://localhost:8000/api/vendors/applications/1/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": true,
    "is_approved": true
  }'
```

#### Get vendors

```bash
curl -X GET http://localhost:8000/api/vendors/vendors/ \
  -H "Authorization: Bearer TOKEN"
```

#### Get specific vendor

```bash
curl -X GET http://localhost:8000/api/vendors/vendors/1/ \
  -H "Authorization: Bearer TOKEN"
```

#### Update vendor profile

```bash
curl -X PUT http://localhost:8000/api/vendors/vendors/1/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shop_name": "Updated Shop Name",
    "address": "New Address"
  }'
```

#### Get products

```bash
curl -X GET http://localhost:8000/api/vendors/products/ \
  -H "Authorization: Bearer TOKEN"
```

#### Get specific product

```bash
curl -X GET http://localhost:8000/api/vendors/products/1/ \
  -H "Authorization: Bearer TOKEN"
```

#### Update product (vendor only)

```bash
curl -X PUT http://localhost:8000/api/vendors/products/1/ \
  -H "Authorization: Bearer VENDOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Product",
    "price": "150.00"
  }'
```

#### Delete product (vendor only)

```bash
curl -X DELETE http://localhost:8000/api/vendors/products/1/ \
  -H "Authorization: Bearer VENDOR_TOKEN"
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
- **VendorApplication**: Vendor application requests
- **Vendor**: Vendor profiles with shop details
- **Product**: Products managed by vendors
- **Category**: Product categories
- **SubCategory**: Product subcategories
- **Brand**: Product brands

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
├── vendors/
│   ├── models.py (VendorApplication, Vendor, Product, Category, SubCategory, Brand)
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

## Vendor System Flow

1. User applies for vendor role via `POST /api/vendor/applications/` (multipart/form-data for banner)
2. If user has VVIP membership, payment is waived (payment_status auto True)
3. Upon successful payment (payment_status=True and verified via transaction_id), Vendor profile is auto-created
4. Vendor can now manage products via CRUD APIs at `/api/vendor/products/`
5. Only banner_image can be updated on Vendor profile via PATCH /api/vendor/vendors/<id>/
6. Admins can manage categories, subcategories, and brands

### Vendor API Usage Guide

#### Apply for Vendor

```bash
curl -X POST "http://127.0.0.1:8000/api/vendor/applications/" \
 -H "Authorization: Bearer <token>" \
 -F "shop_name=My Shop" \
 -F "address=Dhaka" \
 -F "payment_status=true" \
 -F "transaction_id=MOCK_SUCCESS" \
 -F "banner=@/path/to/banner.jpg"
```

#### Update Vendor Banner (only banner allowed)

```bash
curl -X PATCH "http://127.0.0.1:8000/api/vendor/vendors/<vendor_id>/" \
 -H "Authorization: Bearer <token>" \
 -F "banner=@/path/new_banner.jpg"
```

#### Create Product (vendor only)

```bash
curl -X POST "http://127.0.0.1:8000/api/vendor/products/" \
 -H "Authorization: Bearer <token>" \
 -F "title=Phone Model X" \
 -F "sku=PMX-001" \
 -F "price=25000.00" \
 -F "image=@/path/phone.jpg"
```

## Background Tasks

- Notify uplines on new registration
- Process membership purchase commissions (handled synchronously in services.py with atomic transactions)

Run Celery worker to process background tasks.
