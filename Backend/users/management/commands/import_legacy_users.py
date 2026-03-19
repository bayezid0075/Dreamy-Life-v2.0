from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import connection, transaction

from users.models import User, UserInfo
from wallets.models import Wallet
from memberships.models import Membership, MembershipPurchase
from django.utils import timezone


class Command(BaseCommand):
    help = (
        "Import legacy users from a raw MySQL `users` (or legacy) table and rebuild "
        "referral chain + wallet balances without changing current app models."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--table",
            default="users",
            help="Legacy table name to import from (default: users).",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=250,
            help="How many users to import per DB transaction commit (default: 250).",
        )
        parser.add_argument(
            "--progress-every",
            type=int,
            default=100,
            help="Print progress every N imported users (default: 100).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Parse and simulate import without writing any data.",
        )

    def handle(self, *args, **options):
        table = options["table"]
        batch_size = options["batch_size"]
        progress_every = options["progress_every"]
        dry_run = options["dry_run"]

        # DB-agnostic table existence check (works on Postgres, MySQL, etc.)
        existing_tables = connection.introspection.table_names()
        if table not in existing_tables:
            self.stderr.write(
                self.style.ERROR(
                    f"Legacy table `{table}` not found in current database. "
                    f"Import your users_dump.sql first, or pass --table=<name>."
                )
            )
            return

        # Use double-quoted identifier for PostgreSQL; backticks are MySQL-only and cause syntax error.
        table_quoted = connection.ops.quote_name(table)
        with connection.cursor() as cur:
            cur.execute(
                f"""
                SELECT
                  id,
                  username,
                  phone,
                  email,
                  password,
                  referral_code,
                  referred_by,
                  level,
                  wallet_balance,
                  member_type
                FROM {table_quoted}
                ORDER BY id ASC
                """
            )
            rows = cur.fetchall()

        if not rows:
            self.stdout.write(self.style.WARNING(f"No rows found in `{table}`. Nothing to import."))
            return

        self.stdout.write(self.style.WARNING(f"Found {len(rows)} legacy users in `{table}`."))

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    "Running in --dry-run mode: no users, wallets, or referrals will be written."
                )
            )

        # Maps to stitch referrals later
        id_to_user = {}
        code_to_user = {}

        def safe_str(val):
            if isinstance(val, str):
                return val.strip()
            if val is None:
                return ""
            return str(val)

        def map_member_type(member_type):
            """
            Map legacy member_type to current account_status without changing the model.

            Legacy: Created, Pending, Active, Admin, Ban
            Current: active, hold, ban, inactive
            """
            mt = safe_str(member_type).lower()
            if mt == "ban":
                return "ban"
            if mt in {"created", "pending"}:
                return "hold"
            # Treat admin / active / anything else as active; staff/superuser can be set manually.
            return "active"

        def import_all():
            """
            Import in small transactions so progress is visible and we don't appear "stuck".
            Also avoids O(n) DB lookups per row by maintaining in-memory sets for unique fields.
            """
            created_users = 0
            created_wallets = 0

            # Cache current unique fields for fast collision avoidance.
            existing_emails = set(User.objects.values_list("email", flat=True))
            existing_phones = set(User.objects.values_list("phone_number", flat=True))
            existing_ref_codes = set(UserInfo.objects.values_list("own_refercode", flat=True))

            basic_membership = Membership.objects.filter(name="Basic").first()

            total = len(rows)

            # First pass: create users, userinfo, wallets (without referrals) in batches.
            for start in range(0, total, batch_size):
                chunk = rows[start : start + batch_size]
                with transaction.atomic():
                    for idx, (
                        legacy_id,
                        username,
                        phone,
                        email,
                        password,
                        referral_code,
                        referred_by_code,
                        legacy_level,
                        wallet_balance,
                        member_type,
                    ) in enumerate(chunk, start=start + 1):
                        username = safe_str(username) or f"user{legacy_id}"
                        phone = safe_str(phone) or f"0{legacy_id:010d}"
                        email = safe_str(email) or f"legacy-{legacy_id}@example.com"
                        referral_code = safe_str(referral_code) or None
                        password = safe_str(password) or "changeme123"

                        account_status = map_member_type(member_type)
                        mt = safe_str(member_type).lower()

                        # Avoid collisions on unique email/phone without repeated DB queries.
                        base_email = email
                        suffix = 1
                        while email in existing_emails:
                            email = f"{legacy_id}-{suffix}-{base_email}"
                            suffix += 1
                        existing_emails.add(email)

                        base_phone = phone
                        suffix = 1
                        while phone in existing_phones:
                            phone = f"{base_phone}-{suffix}"
                            suffix += 1
                        existing_phones.add(phone)

                        user = User.objects.create_user(
                            email=email,
                            username=username,
                            phone_number=phone,
                            password=password,
                        )
                        user.account_status = account_status
                        user.save(update_fields=["account_status"])

                        # UserInfo: keep referral_code as own_refercode when present, else auto-generated.
                        info = UserInfo(user=user)
                        if referral_code:
                            candidate = referral_code[:8]
                            # own_refercode is unique and max_length=8.
                            if candidate and candidate not in existing_ref_codes:
                                info.own_refercode = candidate
                                existing_ref_codes.add(candidate)

                        if mt == "active":
                            info.is_verified = True
                            info.member_status = "Basic"
                        else:
                            info.is_verified = False
                            info.member_status = "user"

                        try:
                            info.level = int(legacy_level) if legacy_level is not None else 0
                        except (TypeError, ValueError):
                            info.level = 0
                        info.save()

                        # Also create active membership purchase for legacy Active users.
                        if mt == "active":
                            if not basic_membership:
                                raise ValueError(
                                    "Membership 'Basic' not found. Create it in Admin first."
                                )
                            MembershipPurchase.objects.update_or_create(
                                user=user,
                                membership=basic_membership,
                                defaults={
                                    "is_active": True,
                                    "purchased_at": timezone.now(),
                                },
                            )

                        # Wallet: set legacy wallet_balance
                        try:
                            bal = Decimal(str(wallet_balance if wallet_balance is not None else "0"))
                        except Exception:
                            bal = Decimal("0")

                        wallet, created = Wallet.objects.get_or_create(
                            user=user,
                            defaults={"balance": bal},
                        )
                        if not created and bal != wallet.balance:
                            wallet.balance = bal
                            wallet.save(update_fields=["balance"])
                        if created:
                            created_wallets += 1

                        created_users += 1
                        id_to_user[legacy_id] = user
                        if referral_code:
                            code_to_user[referral_code] = user

                        if progress_every and (idx % progress_every == 0 or idx == total):
                            self.stdout.write(
                                self.style.WARNING(f"Imported {idx}/{total} legacy users...")
                            )

                if dry_run:
                    # Roll back this batch on dry-run by raising inside the atomic block.
                    raise transaction.TransactionManagementError("Dry run: rolling back.")

            # Second pass: stitch referral chain (fast updates), also in batches.
            linked = 0
            for start in range(0, total, batch_size):
                chunk = rows[start : start + batch_size]
                with transaction.atomic():
                    for (
                        legacy_id,
                        username,
                        phone,
                        email,
                        password,
                        referral_code,
                        referred_by_code,
                        legacy_level,
                        wallet_balance,
                        member_type,
                    ) in chunk:
                        referred_by_code = safe_str(referred_by_code)
                        if not referred_by_code:
                            continue

                        user = id_to_user.get(legacy_id)
                        if not user:
                            continue

                        parent = code_to_user.get(referred_by_code)

                        # Fallback: sometimes referred_by might be a numeric ID string
                        if not parent:
                            try:
                                legacy_parent_id = int(referred_by_code)
                            except ValueError:
                                legacy_parent_id = None
                            if legacy_parent_id and legacy_parent_id in id_to_user:
                                parent = id_to_user[legacy_parent_id]

                        if parent and parent != user and user.referred_by_id != parent.id:
                            user.referred_by = parent
                            user.save(update_fields=["referred_by"])
                            linked += 1

            return created_users, created_wallets, linked

        if dry_run:
            try:
                users_count, wallets_count, linked = import_all()
            except transaction.TransactionManagementError:
                # Expected: we force rollback batches during dry-run.
                users_count = 0
                wallets_count = 0
                linked = 0
            self.stdout.write(
                self.style.SUCCESS(
                    "[DRY RUN] Completed parsing. No data was written (all batches rolled back)."
                )
            )
        else:
            users_count, wallets_count, linked = import_all()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Imported {users_count} users, created/updated {wallets_count} wallets, "
                    f"linked {linked} referral relationships (without changing any app models)."
                )
            )

