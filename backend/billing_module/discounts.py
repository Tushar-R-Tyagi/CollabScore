# The buggy codebase (hardcoded as strings)
def get_discount(plan: str, user: dict) -> float:
    """Calculate discount for a given plan and user.
    
    Bug: Case sensitivity issue - compares plan against "family" 
    but actual plan ID is "FAMILY"
    """
    discount = 0.0
    
    # Bug 1: This comparison will fail for Family plan
    if plan == "family" and user.get("tenure_months", 0) > 12:
        discount = 0.15  # 15% loyalty discount for family plan
    
    # Professional plan discount for long-term users
    if plan == "professional" and user.get("tenure_months", 0) > 24:
        discount = max(discount, 0.10)
    
    return discount