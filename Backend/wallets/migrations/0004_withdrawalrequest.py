from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_passwordresettoken"),
        ("wallets", "0003_funds_fundstransaction_points_pointstransaction"),
    ]

    operations = [
        migrations.CreateModel(
            name="WithdrawalRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("fee", models.DecimalField(decimal_places=2, max_digits=12)),
                ("total_debit", models.DecimalField(decimal_places=2, max_digits=12)),
                ("method", models.CharField(choices=[("bkash", "Bkash")], max_length=20)),
                ("receiver_phone", models.CharField(max_length=30)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("accepted", "Accepted"), ("rejected", "Rejected"), ("finished", "Finished")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("decided_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("admin_note", models.TextField(blank=True, default="")),
                ("decided_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="withdrawals_decided", to="users.user")),
                ("finished_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="withdrawals_finished", to="users.user")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="withdrawal_requests", to="users.user")),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="withdrawalrequest",
            index=models.Index(fields=["user", "status"], name="wallets_with_user_id_6c55f9_idx"),
        ),
        migrations.AddIndex(
            model_name="withdrawalrequest",
            index=models.Index(fields=["status", "created_at"], name="wallets_with_status_5a8aa0_idx"),
        ),
    ]

