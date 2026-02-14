"""
UddoktaPay integration for membership payments.
API docs: https://uddoktapay.readme.io/reference/create-charge-api-guideline
Verify: https://uddoktapay.readme.io/reference/verify-payment-api-guideline

Required headers: Content-Type, Accept, RT-UDDOKTAPAY-API-KEY (exact spelling).
403 from UddoktaPay = invalid/missing API key, wrong domain, or missing headers.
"""
import requests
from django.conf import settings


def _get_base_url():
    url = getattr(settings, "UDDOKTAPAY_BASE_URL", "https://sandbox.uddoktapay.com") or ""
    return url.strip().rstrip("/")


def _get_checkout_url():
    """Return full checkout-v2 URL. Handles base URL with or without /api/checkout-v2 path."""
    base = _get_base_url()
    if "/api/checkout-v2" in base:
        return base if base.endswith("/api/checkout-v2") else base.rstrip("/")
    return f"{base}/api/checkout-v2"


def _get_base_domain():
    """Return base domain only (for verify-payment URL). Strips /api/checkout-v2 if present."""
    base = _get_base_url()
    for suffix in ["/api/checkout-v2/", "/api/checkout-v2"]:
        if base.endswith(suffix):
            return base[: -len(suffix)].rstrip("/")
    return base


def _get_api_key():
    key = getattr(settings, "UDDOKTAPAY_API_KEY", "") or ""
    return key.strip()


def create_charge(
    full_name,
    email,
    amount,
    metadata,
    redirect_url,
    cancel_url,
    webhook_url=None,
    return_type="GET",
):
    """
    Create a payment charge via UddoktaPay checkout-v2.
    Returns dict with status, message, payment_url (on success).
    Uses exact headers required by UddoktaPay: Content-Type, Accept, RT-UDDOKTAPAY-API-KEY.
    """
    api_key = _get_api_key()
    if not api_key:
        return {
            "status": False,
            "message": "UDDOKTAPAY_API_KEY is not configured",
        }
    amount_str = str(amount).strip()
    if not full_name or not email or not amount_str:
        return {
            "status": False,
            "message": "full_name, email and amount are required",
        }
    checkout_url = _get_checkout_url()
    if not checkout_url:
        return {"status": False, "message": "UDDOKTAPAY_BASE_URL is not set"}
    payload = {
        "full_name": full_name[:100],
        "email": email[:100],
        "amount": amount_str,
        "metadata": metadata,
        "redirect_url": redirect_url,
        "cancel_url": cancel_url,
        "return_type": return_type,
    }
    if webhook_url:
        payload["webhook_url"] = webhook_url
    # Required headers per UddoktaPay docs (exact names; 403 if missing/wrong)
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": api_key,
    }
    try:
        response = requests.post(
            checkout_url,
            json=payload,
            headers=headers,
            timeout=30,
        )
        try:
            data = response.json()
        except Exception:
            data = {}
        if response.status_code == 403:
            return {
                "status": False,
                "message": (
                    "UddoktaPay returned 403 Forbidden. For the public sandbox (sandbox.uddoktapay.com) "
                    "you must use the official sandbox API key: 982d381360a69d419689740d9f2e26ce36fb7a50. "
                    "Your own dashboard key only works with your own UddoktaPay installation URL."
                ),
                "response": data,
                "http_status": 403,
            }
        if response.ok and data.get("status") is True:
            payment_url = data.get("payment_url")
            if payment_url:
                return {
                    "status": True,
                    "message": data.get("message", "Payment URL created"),
                    "payment_url": payment_url,
                }
            return {
                "status": False,
                "message": data.get("message", "No payment_url in response"),
                "response": data,
            }
        err_msg = data.get("message", f"HTTP {response.status_code}")
        if (response.status_code == 404 or (err_msg and "not found" in str(err_msg).lower())):
            err_msg = (
                "UddoktaPay returned Not Found. This often means redirect_url or cancel_url was rejected "
                "(e.g. localhost is not allowed). Set UDDOKTAPAY_REDIRECT_BASE_URL in .env to a public URL "
                "(e.g. your ngrok URL like https://xxxx.ngrok.io) and use that for success/cancel pages."
            )
        return {
            "status": False,
            "message": err_msg,
            "response": data,
        }
    except requests.RequestException as e:
        return {
            "status": False,
            "message": str(e),
        }


def verify_payment(invoice_id):
    """
    Verify payment status with UddoktaPay.
    Returns dict with status (COMPLETED, PENDING, ERROR), metadata, etc.
    """
    api_key = _get_api_key()
    if not api_key:
        return {"status": "ERROR", "message": "UDDOKTAPAY_API_KEY is not configured"}
    if not invoice_id:
        return {"status": "ERROR", "message": "invoice_id is required"}
    base_domain = _get_base_domain()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "RT-UDDOKTAPAY-API-KEY": api_key,
    }
    try:
        response = requests.post(
            f"{base_domain}/api/verify-payment",
            json={"invoice_id": invoice_id},
            headers=headers,
            timeout=30,
        )
        data = response.json() if response.ok else {}
        if not response.ok:
            return {
                "status": "ERROR",
                "message": data.get("message", f"HTTP {response.status_code}"),
            }
        return data
    except requests.RequestException as e:
        return {"status": "ERROR", "message": str(e)}
