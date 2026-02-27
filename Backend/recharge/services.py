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


def _api_access_id():
    """access_id for MRC API. Prefer RECHARGE_ACCESS_ID, fallback to RECHARGE_API_USERNAME or DRIVE_OFFER_ACCESS_ID."""
    aid = getattr(settings, "RECHARGE_ACCESS_ID", "").strip()
    if aid:
        return aid
    aid = getattr(settings, "RECHARGE_API_USERNAME", "").strip()
    if aid:
        return aid
    return getattr(settings, "DRIVE_OFFER_ACCESS_ID", "").strip()


def _api_access_pass():
    """access_pass for MRC API. Prefer RECHARGE_ACCESS_PASS, fallback to RECHARGE_API_PASSWORD or DRIVE_OFFER_ACCESS_PASS."""
    apass = getattr(settings, "RECHARGE_ACCESS_PASS", "").strip()
    if apass:
        return apass
    apass = getattr(settings, "RECHARGE_API_PASSWORD", "").strip()
    if apass:
        return apass
    return getattr(settings, "DRIVE_OFFER_ACCESS_PASS", "").strip()


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
    Call recharge API (MRC).
    URL: .../recharge_api_thirdparty.php?access_id=&access_pass=&service=MRC&operator=&number_type=&number=&amount=&refid=
    Operator: Grameenphone=3/7, Banglalink=4/9, Robi=8, Airtel=6, TeleTalk=5
    Number Type: Prepaid=1, Postpaid=2, Skitto=3, PowerLoad/G.Store/Amar Offer=4
    refid must be unique (uuid4.hex).
    """
    access_id = _api_access_id()
    access_pass = _api_access_pass()
    if not access_id or not access_pass:
        return {
            "STATUS": "FAILED",
            "RECHARGE_STATUS": "FAILED",
            "MESSAGE": "Recharge API credentials not configured. Set RECHARGE_ACCESS_ID and RECHARGE_ACCESS_PASS in .env",
        }
    params = {
        "access_id": access_id,
        "access_pass": access_pass,
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
    access_id = _api_access_id()
    access_pass = _api_access_pass()
    if not access_id or not access_pass:
        return {"STATUS": "FAILED", "MESSAGE": "API credentials not configured."}
    params = {
        "access_id": access_id,
        "access_pass": access_pass,
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
    """Unique reference id for the API (no spaces). Must be unique for each request."""
    return uuid.uuid4().hex[:32]


# --- Drive Offer (Offer Pack List) ---
# API returns JSON: { "STATUS": "OK", "GP": [...], "BL": [...], ... } with each item having _operator, _internet_pack, _minute_pack, _validity, _amount, _offer_type, etc.

# Map API operator code to frontend operator filter value (dashboard OPERATORS)
OPERATOR_CODE_TO_ID = {"GP": "7", "BL": "9", "Robi": "8", "8": "8", "Airtel": "6", "6": "6", "TT": "5", "5": "5"}


def _normalize_drive_offer_item(item, operator_key):
    """Convert API offer item (_operator, _internet_pack, _amount, etc.) to frontend-friendly shape."""
    if not isinstance(item, dict):
        return item
    raw_op = str(item.get("_operator") or item.get("operator") or operator_key or "").strip()
    op_id = OPERATOR_CODE_TO_ID.get(raw_op) or raw_op
    internet = str(item.get("_internet_pack") or item.get("internet") or item.get("data") or "").strip()
    minutes = str(item.get("_minute_pack") or item.get("minutes") or "").strip()
    validity = str(item.get("_validity") or item.get("validity") or "").strip()
    amount = item.get("_amount") or item.get("_price") or item.get("amount") or item.get("price") or ""
    offer_type = str(item.get("_offer_type") or item.get("type") or "").strip()
    if amount not in ("", "-"):
        try:
            amount = str(int(float(amount)))
        except (TypeError, ValueError):
            amount = str(amount) if amount is not None else ""
    parts = []
    if internet and internet != "-":
        parts.append(internet)
    if minutes and minutes != "-":
        parts.append(minutes)
    if validity:
        parts.append(validity)
    name = " / ".join(parts) if parts else str(item.get("_offer_details") or "Offer")
    return {
        "operator": raw_op,
        "operator_id": op_id,
        "internet": internet if internet and internet != "-" else None,
        "data": internet if internet and internet != "-" else None,
        "minutes": minutes if minutes and minutes != "-" else None,
        "validity": validity or None,
        "price": amount,
        "amount": amount,
        "type": offer_type,
        "pack_name": name,
        "name": name,
        "title": name,
        "_offer_type": offer_type,
        "_commission_amount": item.get("_commission_amount"),
        "_status": item.get("_status"),
    }


def _drive_offer_url():
    return getattr(settings, "DRIVE_OFFER_API_URL", _api_url()).strip().rstrip("/")


def _drive_offer_access_id():
    return getattr(settings, "DRIVE_OFFER_ACCESS_ID", "").strip()


def _drive_offer_access_pass():
    return getattr(settings, "DRIVE_OFFER_ACCESS_PASS", "").strip()


def get_drive_offer_pack_list() -> dict:
    """
    Call OFFERPACK API. API returns JSON: {"STATUS": "OK", "GP": [...], "BL": [...], ...}.
    Each item has _operator, _internet_pack, _minute_pack, _validity, _amount, _offer_type.
    Returns {"status": "OK"|"FAIL", "message": "...", "packs": [...]} with normalized packs.
    """
    aid = _drive_offer_access_id()
    apass = _drive_offer_access_pass()
    if not aid or not apass:
        logger.warning("Drive Offer API: credentials not configured (DRIVE_OFFER_ACCESS_ID, DRIVE_OFFER_ACCESS_PASS)")
        return {
            "status": "FAIL",
            "message": "Drive Offer API credentials not configured (DRIVE_OFFER_ACCESS_ID, DRIVE_OFFER_ACCESS_PASS).",
            "packs": [],
        }
    params = {
        "access_id": aid,
        "access_pass": apass,
        "service": "OFFERPACK",
    }
    try:
        r = requests.get(_drive_offer_url(), params=params, timeout=30)
        text = (r.text or "").strip()
        data = None
        if text:
            try:
                import json
                data = json.loads(text)
            except Exception:
                data = _parse_response(r)
        if not data and text:
            try:
                import json
                raw = json.loads(text)
                data = raw if isinstance(raw, dict) else {"STATUS": "FAIL", "MESSAGE": text[:500]}
            except Exception:
                data = {"STATUS": "FAIL", "MESSAGE": text[:500]}
        if not data:
            return {"status": "FAIL", "message": "Empty response from Drive Offer API.", "packs": []}
        if isinstance(data, list):
            packs = [_normalize_drive_offer_item(it, "") for it in data if isinstance(it, dict)]
            return {"status": "OK", "message": "", "packs": packs}
        status_key = "STATUS" if "STATUS" in data else "status"
        msg_key = "MESSAGE" if "MESSAGE" in data else "message"
        status = (str(data.get(status_key) or "")).strip().upper()
        message = (str(data.get(msg_key) or data.get("message") or "")).strip()
        packs = []
        meta_keys = {"STATUS", "status", "MESSAGE", "message"}
        for key, val in data.items():
            if key in meta_keys:
                continue
            if isinstance(val, list):
                for it in val:
                    normalized = _normalize_drive_offer_item(it, key)
                    if isinstance(normalized, dict):
                        packs.append(normalized)
        if status not in ("OK", "SUCCESS", "1", "TRUE"):
            logger.warning("Drive Offer OFFERPACK API returned status=%s message=%s", status, message or "(none)")
            return {"status": "FAIL", "message": message or "Offer list unavailable.", "packs": packs}
        return {"status": "OK", "message": message or "", "packs": packs}
    except requests.RequestException as e:
        logger.exception("Drive Offer OFFERPACK request failed: %s", e)
        return {
            "status": "FAIL",
            "message": str(e)[:500],
            "packs": [],
        }
