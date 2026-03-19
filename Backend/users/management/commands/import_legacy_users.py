from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import connection, transaction

from users.models import User, UserInfo
from wallets.models import Wallet
from memberships.models import Membership, MembershipPurchase
from django.utils import timezone
import time


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
            "--dry-run",
            action="store_true",
            help="Parse and simulate import without writing any data.",
        )

    def handle(self, *args, **options):
        table = options["table"]
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

        # Quote table name appropriately for the active DB backend (Postgres uses double quotes).
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

        @transaction.atomic
        def import_batch():
            created_users = 0
            created_wallets = 0
            started = time.time()

            # Preload existing uniques to avoid O(N^2) "exists()" loops.
            existing_emails = set(User.objects.values_list("email", flat=True))
            existing_phones = set(User.objects.values_list("phone_number", flat=True))

            # Only resolve Basic membership once (if needed).
            basic_membership = None
            if any(safe_str(r[-1]).lower() == "active" for r in rows):
                basic_membership = Membership.objects.filter(name="Basic").first()
                if not basic_membership:
                    raise ValueError("Membership 'Basic' not found. Create it in Admin first.")

            # First pass: create users, userinfo, wallets (without referrals)
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
            ) in rows:
                username = safe_str(username) or f"user{legacy_id}"
                phone = safe_str(phone) or f"0{legacy_id:010d}"
                email = safe_str(email) or f"legacy-{legacy_id}@example.com"
                referral_code = safe_str(referral_code) or None
                password = safe_str(password) or "changeme123"

                account_status = map_member_type(member_type)
                mt = safe_str(member_type).lower()

                # Avoid collisions on unique email/phone without touching model structure.
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
                    # own_refercode is unique and max_length=8. Avoid collisions; if it collides, let
                    # UserInfo.save() auto-generate a fresh code for this user.
                    if candidate and not UserInfo.objects.filter(own_refercode=candidate).exists():
                        info.own_refercode = candidate

                # Legacy membership mapping:
                # - If member_type was "Active" => verified + Basic membership
                # - Otherwise => not verified + "user" tier
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

                # Also create active membership purchase so frontend "active_membership"
                # immediately reflects Basic membership for legacy Active users.
                if mt == "active":
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

                if created_users % 200 == 0:
                    elapsed = time.time() - started
                    self.stdout.write(
                        self.style.WARNING(
                            f"Progress: {created_users}/{len(rows)} users processed "
                            f"({elapsed:.1f}s elapsed)..."
                        )
                    )
                    try:
                        self.stdout.flush()
                    except Exception:
                        pass

            # Second pass: stitch referral chain using referred_by column
            linked = 0
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
            ) in rows:
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

                if parent and parent != user:
                    user.referred_by = parent
                    user.save(update_fields=["referred_by"])
                    linked += 1

            return created_users, created_wallets, linked

        if dry_run:
            # Run inside an atomic block but roll back explicitly.
            with transaction.atomic():
                users_count, wallets_count, linked = import_batch()
                self.stdout.write(
                    self.style.SUCCESS(
                        f"[DRY RUN] Would create {users_count} users, {wallets_count} wallets, "
                        f"and link {linked} referral relationships."
                    )
                )
                raise transaction.TransactionManagementError("Dry run: rolling back.")
        else:
            users_count, wallets_count, linked = import_batch()
            self.stdout.write(
                self.style.SUCCESS(
                    f"Imported {users_count} users, created/updated {wallets_count} wallets, "
                    f"linked {linked} referral relationships (without changing any app models)."
                )
            )

