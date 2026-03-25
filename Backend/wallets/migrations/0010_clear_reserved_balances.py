# No reservation model: zero out legacy reserved_balance on wallet and funds.

from django.db import migrations


def forwards(apps, schema_editor):
    Wallet = apps.get_model("wallets", "Wallet")
    Funds = apps.get_model("wallets", "Funds")
    Wallet.objects.all().update(reserved_balance=0)
    Funds.objects.all().update(reserved_balance=0)


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("wallets", "0009_move_wallet_reserved_to_funds"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
