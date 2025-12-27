"""
Quick script to grant admin access to a user.

Usage:
    python grant_admin_access.py <email_or_username> [--superuser]

Examples:
    python grant_admin_access.py user@example.com
    python grant_admin_access.py username --superuser
    python grant_admin_access.py user@example.com --staff
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'referral_system.settings')
django.setup()

from users.models import User


def grant_admin_access(identifier, is_superuser=False, is_staff=True):
    """Grant admin access to a user"""
    try:
        # Try to find user by email or username
        user = User.objects.filter(email=identifier).first() or \
               User.objects.filter(username=identifier).first()
        
        if not user:
            print(f"[ERROR] User not found: {identifier}")
            print("\nAvailable users:")
            for u in User.objects.all()[:10]:
                try:
                    print(f"  - {u.username} ({u.email})")
                except:
                    print(f"  - {u.username}")
            return False
        
        # Set permissions
        if is_superuser:
            user.is_superuser = True
            user.is_staff = True  # Superusers are always staff
            print(f"[SUCCESS] Made {user.username} a SUPERUSER (full admin access)")
        elif is_staff:
            user.is_staff = True
            print(f"[SUCCESS] Made {user.username} a STAFF user (admin access)")
        
        user.save()
        
        print(f"\nUser Details:")
        print(f"  Username: {user.username}")
        print(f"  Email: {user.email}")
        print(f"  is_staff: {user.is_staff}")
        print(f"  is_superuser: {user.is_superuser}")
        print(f"\n[INFO] User can now access admin panel!")
        print(f"[INFO] User must LOGOUT and LOGIN again to see changes.")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to grant admin access: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    if len(sys.argv) < 2 or '--help' in sys.argv or '-h' in sys.argv:
        print(__doc__)
        sys.exit(0)
    
    identifier = sys.argv[1]
    is_superuser = '--superuser' in sys.argv or '-s' in sys.argv
    is_staff = '--staff' in sys.argv or not is_superuser
    
    print("=" * 60)
    print("Grant Admin Access")
    print("=" * 60)
    print(f"\nLooking for user: {identifier}")
    
    success = grant_admin_access(identifier, is_superuser=is_superuser, is_staff=is_staff)
    
    print("\n" + "=" * 60)
    
    if not success:
        sys.exit(1)

