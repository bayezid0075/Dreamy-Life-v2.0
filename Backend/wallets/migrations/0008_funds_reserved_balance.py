# Generated manually for marketplace job budgets on Funds (not Wallet).

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("wallets", "0007_remove_withdrawalrequest_source"),
    ]

    operations = [
        migrations.AddField(
            model_name="funds",
            name="reserved_balance",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
    ]
