# Admin Permission Testing Guide

This guide explains how to test and verify that the `IsAdminUser` permission is working correctly.

## Overview

The `IsAdminUser` permission class ensures that only staff users (`is_staff=True`) or superusers (`is_superuser=True`) can access admin endpoints.

## Changes Made

1. **Updated `UserSerializer`** in `Backend/users/serializers.py`:
   - Added `is_staff` and `is_superuser` fields to the serializer
   - This allows the frontend to check user permissions

2. **Created Test Script** (`Backend/test_admin_permission.py`):
   - Automated test script to verify permission checks
   - Tests regular users, staff users, and superusers

## How to Test

### Method 1: Automated Test Script (Recommended)

Run the test script from the Backend directory:

```bash
cd Backend
python test_admin_permission.py
```

The script will:
- Test regular users (should get 403 Forbidden)
- Test staff users (should get 200 OK)
- Test superusers (should get 200 OK)

### Method 2: Manual Testing with Django Shell

```bash
cd Backend
python manage.py shell
```

```python
from users.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

# Get a regular user
regular_user = User.objects.filter(is_staff=False, is_superuser=False).first()

# Test with regular user
client = APIClient()
refresh = RefreshToken.for_user(regular_user)
client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

# Should return 403
response = client.get('/api/admin/users/')
print(f"Status: {response.status_code}")  # Should be 403

# Get an admin user
admin_user = User.objects.filter(is_staff=True).first() or User.objects.filter(is_superuser=True).first()

# Test with admin user
client2 = APIClient()
refresh2 = RefreshToken.for_user(admin_user)
client2.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh2.access_token}')

# Should return 200
response2 = client2.get('/api/admin/users/')
print(f"Status: {response2.status_code}")  # Should be 200
```

### Method 3: Using Postman/Thunder Client

1. **Login as Regular User:**
   - POST `/api/users/login/`
   - Body: `{"email": "user@example.com", "password": "password"}`
   - Copy the `access` token

2. **Test Admin Endpoint:**
   - GET `/api/admin/users/`
   - Header: `Authorization: Bearer <access_token>`
   - **Expected:** 403 Forbidden

3. **Login as Admin User:**
   - POST `/api/users/login/`
   - Body: `{"email": "admin@example.com", "password": "password"}`
   - Copy the `access` token

4. **Test Admin Endpoint:**
   - GET `/api/admin/users/`
   - Header: `Authorization: Bearer <access_token>`
   - **Expected:** 200 OK with user list

### Method 4: Using curl

```bash
# Test with regular user token
curl -X GET http://localhost:8000/api/admin/users/ \
  -H "Authorization: Bearer YOUR_REGULAR_USER_TOKEN"
# Expected: {"detail":"You do not have permission to perform this action."}

# Test with admin user token
curl -X GET http://localhost:8000/api/admin/users/ \
  -H "Authorization: Bearer YOUR_ADMIN_USER_TOKEN"
# Expected: List of users (JSON array)
```

## Creating Test Users

### Create a Superuser

```bash
cd Backend
python manage.py createsuperuser
```

### Create a Staff User (via Django Admin)

1. Go to `http://localhost:8000/admin/`
2. Navigate to Users
3. Edit a user or create a new one
4. Check "Staff status" checkbox
5. Save

### Create a Staff User (via Django Shell)

```bash
python manage.py shell
```

```python
from users.models import User

# Create or update a user to be staff
user = User.objects.get(email='user@example.com')
user.is_staff = True
user.save()
```

## Expected Behavior

| User Type | is_staff | is_superuser | Access to `/api/admin/*` |
|-----------|----------|--------------|--------------------------|
| Regular User | False | False | ❌ 403 Forbidden |
| Staff User | True | False | ✅ 200 OK |
| Superuser | True | True | ✅ 200 OK |

## Protected Endpoints

The following endpoints are protected by `IsAdminUser`:

- `GET /api/admin/users/` - List all users
- `POST /api/admin/users/` - Create a new user
- `GET /api/admin/users/<id>/` - Get user details
- `PUT /api/admin/users/<id>/` - Update user
- `DELETE /api/admin/users/<id>/` - Delete user
- `GET /api/admin/dashboard/stats/` - Get dashboard statistics

## Frontend Integration

The frontend now receives `is_staff` and `is_superuser` fields in the user object from `/api/users/userinfo/`. This allows:

1. **Admin Guard** (`Frontend/app/(protected)/admin/admin-guard.jsx`) to check permissions
2. **Navigation** to conditionally show admin menu items
3. **Components** to conditionally render admin features

## Troubleshooting

### Issue: Regular users can access admin endpoints

**Solution:** Check that:
1. The `IsAdminUser` permission class is applied to the view
2. The user's `is_staff` or `is_superuser` is correctly set in the database

### Issue: Admin users get 403 errors

**Solution:** 
1. Verify the user has `is_staff=True` or `is_superuser=True`
2. Check that the JWT token is valid and not expired
3. Ensure the token is being sent in the `Authorization` header

### Issue: Frontend doesn't show admin menu

**Solution:**
1. Check that `UserSerializer` includes `is_staff` and `is_superuser` fields
2. Verify the user object in the frontend has these fields
3. Check browser console for any errors

## Security Notes

- The permission check happens on **both** frontend and backend
- Frontend checks are for UX only - backend checks are the real security
- Never trust frontend-only permission checks
- Always verify permissions on the backend

