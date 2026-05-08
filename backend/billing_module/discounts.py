def get_discount(plan: str, user: dict) -> float:
    """Calculate discount for a given plan and user."""
    discount = 0.0

    if plan == "family" and user.get("tenure_months", 0) > 12:
        discount = 0.15

    if plan == "professional" and user.get("tenure_months", 0) > 24:
        discount = max(discount, 0.10)

    return discount