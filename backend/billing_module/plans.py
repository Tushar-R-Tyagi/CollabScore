PLANS = {
    "basic": {
        "name": "Basic",
        "price_per_unit": 10.00,
        "features": ["email_support"]
    },
    "professional": {
        "name": "Professional", 
        "price_per_unit": 25.00,
        "features": ["email_support", "phone_support"]
    },
    "FAMILY": {
        "name": "Family",
        "price_per_unit": 40.00,
        "features": ["email_support", "phone_support", "priority_support", "multi_user"]
    }
}

def get_plan(plan_id: str) -> dict:
    """Get plan details by ID."""
    if plan_id not in PLANS:
        raise ValueError(f"Unknown plan: {plan_id}")
    return PLANS[plan_id]
