from memberships.uddoktapay_service import create_charge, verify_payment


def create_gateway_charge(**kwargs):
    return create_charge(**kwargs)


def verify_gateway_payment(invoice_id: str):
    return verify_payment(invoice_id=invoice_id)

