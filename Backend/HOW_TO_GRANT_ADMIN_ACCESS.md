# How to Grant Admin Access to Users

This guide explains how to give a user permission to access the admin panel.

## Understanding Admin Permissions

A user needs **either** of these to access the admin panel:
- `is_staff = True` (Staff user)
- `is_superuser = True` (Superuser - has all permissions)

## Method 1: Using Django Admin Panel (Easiest)

1. **Access Django Admin:**
   - Go to `http://localhost:8000/admin/`
   - Login with a superuser account

2. **Navigate to Users:**
   - Click on "Users" in the admin panel

3. **Edit User:**
   - Find the user you want to make admin
   - Click on their username to edit

4. **Grant Permissions:**
   - Check the **"Staff status"** checkbox (for staff access)
   - OR check the **"Superuser status"** checkbox (for full admin access)
   - Click **"Save"**

## Method 2: Using Django Shell

```bash
cd Backend
python manage.py shell
```

```python
from users.models import User

# Find the user by email or username
user = User.objects.get(email='user@example.com')
# OR
user = User.objects.get(username='username')

# Make them staff (can access admin panel)
user.is_staff = True
user.save()

# OR make them superuser (full admin access)
user.is_superuser = True
user.save()

print(f"User {user.username} is now admin!")
print(f"is_staff: {user.is_staff}")
print(f"is_superuser: {user.is_superuser}")
```

## Method 3: Create a New Superuser

```bash
cd Backend
python manage.py createsuperuser
```

Follow the prompts to create a new superuser account.

## Method 4: Using Admin API (If you're already admin)

If you already have admin access, you can use the admin API to update users:

1. **Login as admin** and get your access token
2. **Update user via API:**

```bash
curl -X PUT http://localhost:8000/api/admin/users/<user_id>/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "username",
    "email": "user@example.com",
    "phone_number": "1234567890",
    "is_staff": true,
    "is_superuser": false
  }'
```

## Verify Admin Access

After granting permissions:

1. **Logout** from the frontend (if logged in)
2. **Login again** with the updated user account
3. **Try accessing** `/admin` or `/admin/users`
4. You should now have access!

## Quick Check Script

Run this to check if a user has admin permissions:

```bash
cd Backend
python manage.py shell
```

```python
from users.models import User

# Check a specific user
user = User.objects.get(email='user@example.com')
print(f"User: {user.username}")
print(f"Email: {user.email}")
print(f"is_staff: {user.is_staff}")
print(f"is_superuser: {user.is_superuser}")
print(f"Can access admin: {user.is_staff or user.is_superuser}")
```

## Troubleshooting

### Issue: User still can't access admin after granting permissions

**Solution:**
1. Make sure the user **logs out and logs back in** (to refresh their token)
2. Check that the user object in the database actually has `is_staff=True` or `is_superuser=True`
3. Clear browser cache and localStorage
4. Check browser console for any errors

### Issue: "You do not have permission to access the admin panel"

**This means:**
- The user's `is_staff` and `is_superuser` are both `False`
- OR the frontend is not receiving the updated user data

**Fix:**
1. Grant permissions using one of the methods above
2. Have the user logout and login again
3. The frontend will fetch fresh user data with the updated permissions

## Security Notes

- **Staff users** (`is_staff=True`) can access admin panel but may have limited permissions
- **Superusers** (`is_superuser=True`) have full access to everything
- Only grant admin access to trusted users
- Regularly audit who has admin access

