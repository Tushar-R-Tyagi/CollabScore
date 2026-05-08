import logging
from ..plans import get_plan
from .discounts import get_discount

logger = logging.getLogger(__name__)


def calculate_total(user_id: str, plan_id: str, quantity: int = 1) -> dict:
    """Calculate total billing for a user's plan."""
    try:
        plan = get_plan(plan_id)
        base_price = plan["price_per_unit"]
        discount = get_discount(plan=plan_id, user=user_id)

        discounted_price = base_price * (1 - discount)
        total = discounted_price * quantity

        return {
            "user_id": user_id,
            "plan_id": plan_id,
            "plan_name": plan["name"],
            "base_price": base_price,
            "discount_applied": discount,
            "discounted_price": discounted_price,
            "quantity": quantity,
            "total": round(total, 2)
        }
    except Exception as e:
        logger.error(f"Billing calculation failed: {e}")
        return None