import requests
import json
from django.conf import settings
from decimal import Decimal

# SohojPay API Configuration
SOHOJPAY_API_KEY = getattr(settings, 'SOHOJPAY_API_KEY', 'NKfoJJL14oLhMBFzlpDchNVwS01L7VutKUcfYmWEk3clB50N7n')
SOHOJPAY_CREATE_URL = 'https://secure.sohojpaybd.com/api/payment/create'
SOHOJPAY_VERIFY_URL = 'https://secure.sohojpaybd.com/api/payment/verify'


def create_payment(cus_name, cus_email, cus_phone, amount, success_url, cancel_url, webhook_url=None, metadata=None):
    """
    Create a payment request with SohojPay gateway
    
    Args:
        cus_name: Customer name
        cus_email: Customer email
        cus_phone: Customer phone (optional)
        amount: Payment amount as string
        success_url: URL to redirect on success
        cancel_url: URL to redirect on cancel
        webhook_url: URL for webhook callback (optional)
        metadata: Additional metadata as dict (optional)
    
    Returns:
        dict: Response from SohojPay API
    """
    # Ensure amount is properly formatted as string
    amount_str = str(amount).strip()
    
    # Validate required fields
    if not cus_name or not cus_email or not amount_str:
        return {
            "status": False,
            "message": "Missing required fields: cus_name, cus_email, or amount"
        }
    
    payload = {
        "cus_name": cus_name[:50],
        "cus_email": cus_email[:50],
        "amount": amount_str,
        "success_url": success_url[:100],
        "cancel_url": cancel_url[:100],
    }
    
    if cus_phone:
        payload["cus_phone"] = cus_phone[:50]
    
    if webhook_url:
        payload["webhook_url"] = webhook_url[:100]
    
    if metadata:
        # Convert metadata to JSON string (max 150 chars)
        # Use compact JSON format (no spaces)
        metadata_str = json.dumps(metadata, separators=(',', ':'))
        if len(metadata_str) <= 150:
            payload["metadata"] = metadata
        else:
            # Truncate metadata if too long, keeping essential fields
            # Remove phone if present to save space
            if "phone" in metadata:
                metadata.pop("phone")
            metadata_str = json.dumps(metadata, separators=(',', ':'))
            if len(metadata_str) <= 150:
                payload["metadata"] = metadata
    
    headers = {
        'Content-Type': 'application/json',
        'SOHOJPAY-API-KEY': SOHOJPAY_API_KEY
    }
    
    try:
        response = requests.post(
            SOHOJPAY_CREATE_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        # Log request and response for debugging
        print(f"\n=== SohojPay Payment Request ===")
        print(f"URL: {SOHOJPAY_CREATE_URL}")
        print(f"Headers: {headers}")
        print(f"Payload: {json.dumps(payload, indent=2)}")
        print(f"\n=== SohojPay Response ===")
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        print(f"========================\n")
        
        # Try to parse JSON response
        try:
            response_data = response.json()
        except ValueError:
            # Response is not JSON
            return {
                "status": False,
                "message": f"Invalid JSON response from gateway: {response.text[:200]}",
                "status_code": response.status_code
            }
        
        # Check HTTP status
        if response.status_code != 200:
            return {
                "status": False,
                "message": response_data.get("message", f"HTTP {response.status_code} error"),
                "response": response_data,
                "status_code": response.status_code
            }
        
        return response_data
        
    except requests.exceptions.HTTPError as e:
        # Try to get error message from response
        try:
            error_data = response.json() if hasattr(response, 'json') else {}
            return {
                "status": False,
                "message": error_data.get("message", f"HTTP {response.status_code} error"),
                "response": error_data,
                "status_code": response.status_code
            }
        except:
            return {
                "status": False,
                "message": f"HTTP {response.status_code} error: {str(e)}",
                "response_text": response.text[:200] if hasattr(response, 'text') else None
            }
    except requests.exceptions.RequestException as e:
        print(f"Request Exception: {str(e)}")
        return {
            "status": False,
            "message": f"Payment gateway error: {str(e)}"
        }


def verify_payment(transaction_id):
    """
    Verify a payment transaction with SohojPay gateway
    
    Args:
        transaction_id: Transaction ID from SohojPay
    
    Returns:
        dict: Verification response from SohojPay API
    """
    payload = {
        "transaction_id": transaction_id
    }
    
    headers = {
        'Content-Type': 'application/json',
        'SOHOJPAY-API-KEY': SOHOJPAY_API_KEY
    }
    
    try:
        response = requests.post(
            SOHOJPAY_VERIFY_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        return {
            "status": False,
            "message": f"Payment verification error: {str(e)}"
        }

