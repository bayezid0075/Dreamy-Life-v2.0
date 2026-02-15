# Generated manually - add "transaction" to Notification source choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0002_add_image_link_source"),
    ]

    operations = [
        migrations.AlterField(
            model_name="notification",
            name="source",
            field=models.CharField(
                choices=[
                    ("system", "System"),
                    ("admin", "Admin"),
                    ("order", "Order"),
                    ("referral", "Referral"),
                    ("wallet", "Wallet"),
                    ("membership", "Membership"),
                    ("transaction", "Transaction"),
                ],
                default="system",
                max_length=32,
            ),
        ),
    ]
