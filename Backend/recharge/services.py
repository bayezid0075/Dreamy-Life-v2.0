"""
Call third-party mobile recharge API.
API docs: recharge request (MRC), status (MRCSTATUS), balance (BLCK).
"""
import logging
import uuid
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

def _api_url():
    return getattr(
        settings,
        "RECHARGE_API_URL",
        "http://118.179.129.98/myportal/api/rechargeapi/recharge_api_thirdparty.php",
    )


def _api_username():
    return getattr(settings, "RECHARGE_API_USERNAME", "").strip()


def _api_password():
    return getattr(settings, "RECHARGE_API_PASSWORD", "").strip()


def _parse_response(resp):
    """Parse API response. May be JSON or key=value / key: value text."""
    text = (resp.text or "").strip()
    if not text:
        return {}
    # Try JSON first
    try:
        import json
        return json.loads(text)
    except Exception:
        pass
    # Parse as key=value or key: value lines
    out = {}
    for line in text.splitlines():
        line = line.strip()
        for sep in ("=", ":"):
            if sep in line:
                k, _, v = line.partition(sep)
                out[k.strip().upper()] = v.strip()
                break
    return out


def request_recharge(operator: str, number_type: str, number: str, amount: str, refid: str) -> dict:
    """
    Call recharge API (MRC). Returns dict with STATUS, RECHARGE_STATUS, MESSAGE, TRXID, etc.
    """
    if not _api_username() or not _api_password():
        return {
            "STATUS": "FAILED",
            "RECHARGE_STATUS": "FAILED",
            "MESSAGE": "Recharge API credentials not configured.",
        }
    params = {
        "access_id": _api_username(),
        "access_pass": _api_password(),
        "service": "MRC",
        "operator": operator,
        "number_type": number_type,
        "number": number.strip(),
        "amount": amount,
        "refid": refid,
    }
    try:
        r = requests.get(_api_url(), params=params, timeout=30)
        data = _parse_response(r)
        if not data and r.text:
            data = {"STATUS": "FAILED", "MESSAGE": r.text[:500]}
        return data
    except requests.RequestException as e:
        logger.exception("Recharge API request failed: %s", e)
        return {
            "STATUS": "FAILED",
            "RECHARGE_STATUS": "FAILED",
            "MESSAGE": str(e)[:500],
        }


def check_recharge_status(refid: str) -> dict:
    """Call status API (MRCSTATUS). Returns STATUS, RECHARGE_STATUS, RECHARGE_TRXID, MESSAGE."""
    if not _api_username() or not _api_password():
        return {"STATUS": "FAILED", "MESSAGE": "API credentials not configured."}
    params = {
        "access_id": _api_username(),
        "access_pass": _api_password(),
        "service": "MRCSTATUS",
        "refid": refid,
    }
    try:
        r = requests.get(_api_url(), params=params, timeout=15)
        return _parse_response(r)
    except requests.RequestException as e:
        logger.exception("Recharge status API failed: %s", e)
        return {"STATUS": "FAILED", "MESSAGE": str(e)[:500]}


def generate_refid() -> str:
    """Unique reference id for the API (no spaces)."""
    return uuid.uuid4().hex[:32]
