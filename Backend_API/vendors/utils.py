def create_vendor_if_payment_true(user, app):
    from .models import Vendor
    if app.payment_status and not Vendor.objects.filter(user=user).exists():
        Vendor.objects.create(
            user=user,
            shop_name=f"{user.username}'s Shop",
            address="Update your address",
        )