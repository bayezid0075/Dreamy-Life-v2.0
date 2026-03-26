import json
from typing import Iterable

from django.conf import settings

_init_error = None
_initialized = False


def _init_firebase():
    global _initialized, _init_error
    if _initialized:
        return True
    if _init_error is not None:
        return False
    try:
        import firebase_admin
        from firebase_admin import credentials
    except Exception as exc:  # pragma: no cover - import guard
        _init_error = str(exc)
        return False

    try:
        if firebase_admin._apps:
            _initialized = True
            return True

        service_account_json = getattr(settings, "FIREBASE_SERVICE_ACCOUNT_JSON", "") or ""
        service_account_path = getattr(settings, "FIREBASE_SERVICE_ACCOUNT_PATH", "") or ""

        if service_account_json.strip():
            cred_info = json.loads(service_account_json)
            cred = credentials.Certificate(cred_info)
            firebase_admin.initialize_app(cred)
        elif service_account_path.strip():
            cred = credentials.Certificate(service_account_path.strip())
            firebase_admin.initialize_app(cred)
        else:
            # Fallback to GOOGLE_APPLICATION_CREDENTIALS if configured in environment.
            firebase_admin.initialize_app()

        _initialized = True
        return True
    except Exception as exc:
        _init_error = str(exc)
        return False


def send_fcm_push(
    tokens: Iterable[str], title: str, message: str, image: str | None = None, link: str | None = None
):
    """
    Sends Android push via Firebase Cloud Messaging.
    Returns dict with success/failure counters and optional reason.
    """
    token_list = [t.strip() for t in tokens if isinstance(t, str) and t.strip()]
    if not token_list:
        return {"success": 0, "failure": 0, "skipped": True, "reason": "No device tokens"}

    if not _init_firebase():
        return {
            "success": 0,
            "failure": len(token_list),
            "skipped": True,
            "reason": _init_error or "Firebase is not configured",
        }

    try:
        from firebase_admin import messaging

        data_payload = {"title": title or "", "message": message or ""}
        if link:
            data_payload["link"] = link
        if image:
            data_payload["image"] = image

        multicast = messaging.MulticastMessage(
            tokens=token_list,
            notification=messaging.Notification(
                title=title or "",
                body=message or "",
                image=image or None,
            ),
            data=data_payload,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="default",
                    image=image or None,
                ),
            ),
        )
        response = messaging.send_each_for_multicast(multicast)
        return {"success": response.success_count, "failure": response.failure_count}
    except Exception as exc:
        return {"success": 0, "failure": len(token_list), "reason": str(exc)}
