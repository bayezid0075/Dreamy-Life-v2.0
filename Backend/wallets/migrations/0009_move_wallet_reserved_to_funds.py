# Move marketplace-locked amounts from Wallet to Funds (same backing value).

from decimal import Decimal

from django.db import migrations


def forwards(apps, schema_editor):
    Wallet = apps.get_model("wallets", "Wallet")
    Funds = apps.get_model("wallets", "Funds")
    for w in Wallet.objects.filter(reserved_balance__gt=0):
        funds, _ = Funds.objects.get_or_create(
            user=w.user,
            defaults={"balance": Decimal("0"), "reserved_balance": Decimal("0")},
        )
        r = w.reserved_balance
        if w.balance < r:
            raise ValueError(
                f"Wallet user_id={w.user_id}: balance {w.balance} < reserved {r}"
            )
        funds.balance = (funds.balance + r).quantize(Decimal("0.01"))
        funds.reserved_balance = (funds.reserved_balance + r).quantize(Decimal("0.01"))
        w.balance = (w.balance - r).quantize(Decimal("0.01"))
        w.reserved_balance = Decimal("0")
        funds.save(update_fields=["balance", "reserved_balance"])
        w.save(update_fields=["balance", "reserved_balance"])


def backwards(apps, schema_editor):
    Funds = apps.get_model("wallets", "Funds")
    Wallet = apps.get_model("wallets", "Wallet")
    for f in Funds.objects.filter(reserved_balance__gt=0):
        w, _ = Wallet.objects.get_or_create(
            user=f.user,
            defaults={"balance": Decimal("0"), "reserved_balance": Decimal("0")},
        )
        r = f.reserved_balance
        if f.balance < r:
            raise ValueError(
                f"Funds user_id={f.user_id}: balance {f.balance} < reserved {r}"
            )
        w.balance = (w.balance + r).quantize(Decimal("0.01"))
        w.reserved_balance = (w.reserved_balance + r).quantize(Decimal("0.01"))
        f.balance = (f.balance - r).quantize(Decimal("0.01"))
        f.reserved_balance = Decimal("0")
        w.save(update_fields=["balance", "reserved_balance"])
        f.save(update_fields=["balance", "reserved_balance"])


class Migration(migrations.Migration):

    dependencies = [
        ("wallets", "0008_funds_reserved_balance"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
