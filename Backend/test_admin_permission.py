"""
Test script to verify IsAdminUser permission is working correctly.

Run this script from the Backend directory:
    python test_admin_permission.py
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'referral_system.settings')
django.setup()

from users.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def test_admin_permission():
    """Test that IsAdminUser permission correctly allows/denies access"""
    
    print("=" * 60)
    print("Testing IsAdminUser Permission")
    print("=" * 60)
    
    # Get users
    regular_user = User.objects.filter(is_staff=False, is_superuser=False).first()
    staff_user = User.objects.filter(is_staff=True, is_superuser=False).first()
    superuser = User.objects.filter(is_superuser=True).first()
    
    # Test regular user
    if regular_user:
        print(f"\n[Test 1] Regular User ({regular_user.username})")
        print(f"   is_staff: {regular_user.is_staff}, is_superuser: {regular_user.is_superuser}")
        
        client = APIClient()
        refresh = RefreshToken.for_user(regular_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test admin users endpoint
        response = client.get('/api/admin/users/')
        print(f"   GET /api/admin/users/ -> Status: {response.status_code}")
        
        if response.status_code == 403:
            print("   [PASS] Regular user correctly denied access (403)")
        else:
            print(f"   [FAIL] Expected 403, got {response.status_code}")
            if response.status_code == 200:
                print("   [WARNING] Regular user has admin access! This is a security issue.")
        
        # Test admin dashboard endpoint
        response2 = client.get('/api/admin/dashboard/stats/')
        print(f"   GET /api/admin/dashboard/stats/ -> Status: {response2.status_code}")
        
        if response2.status_code == 403:
            print("   [PASS] Regular user correctly denied access to dashboard (403)")
        else:
            print(f"   [FAIL] Expected 403, got {response2.status_code}")
    else:
        print("\n[WARNING] No regular user found. Create one first.")
    
    # Test staff user
    if staff_user:
        print(f"\n[Test 2] Staff User ({staff_user.username})")
        print(f"   is_staff: {staff_user.is_staff}, is_superuser: {staff_user.is_superuser}")
        
        client = APIClient()
        refresh = RefreshToken.for_user(staff_user)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test admin users endpoint
        response = client.get('/api/admin/users/')
        print(f"   GET /api/admin/users/ -> Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   [PASS] Staff user correctly granted access (200)")
        else:
            print(f"   [FAIL] Expected 200, got {response.status_code}")
            if hasattr(response, 'data'):
                print(f"   Response: {response.data}")
        
        # Test admin dashboard endpoint
        response2 = client.get('/api/admin/dashboard/stats/')
        print(f"   GET /api/admin/dashboard/stats/ -> Status: {response2.status_code}")
        
        if response2.status_code == 200:
            print("   [PASS] Staff user correctly granted access to dashboard (200)")
        else:
            print(f"   [FAIL] Expected 200, got {response2.status_code}")
    else:
        print("\n[WARNING] No staff user found. Create one with is_staff=True")
    
    # Test superuser
    if superuser:
        print(f"\n[Test 3] Superuser ({superuser.username})")
        print(f"   is_staff: {superuser.is_staff}, is_superuser: {superuser.is_superuser}")
        
        client = APIClient()
        refresh = RefreshToken.for_user(superuser)
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        # Test admin users endpoint
        response = client.get('/api/admin/users/')
        print(f"   GET /api/admin/users/ -> Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   [PASS] Superuser correctly granted access (200)")
        else:
            print(f"   [FAIL] Expected 200, got {response.status_code}")
            if hasattr(response, 'data'):
                print(f"   Response: {response.data}")
        
        # Test admin dashboard endpoint
        response2 = client.get('/api/admin/dashboard/stats/')
        print(f"   GET /api/admin/dashboard/stats/ -> Status: {response2.status_code}")
        
        if response2.status_code == 200:
            print("   [PASS] Superuser correctly granted access to dashboard (200)")
        else:
            print(f"   [FAIL] Expected 200, got {response2.status_code}")
    else:
        print("\n[WARNING] No superuser found. Create one with: python manage.py createsuperuser")
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    if regular_user and staff_user and superuser:
        print("[INFO] All user types found. Review test results above.")
    else:
        print("[WARNING] Some user types missing. Create them to complete testing:")
        if not regular_user:
            print("   - Regular user (is_staff=False, is_superuser=False)")
        if not staff_user:
            print("   - Staff user (is_staff=True, is_superuser=False)")
        if not superuser:
            print("   - Superuser (run: python manage.py createsuperuser)")
    
    print("\n" + "=" * 60)


if __name__ == '__main__':
    try:
        test_admin_permission()
    except Exception as e:
        print(f"\n[ERROR] Error running test: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

