from billing_module.billing import calculate_total


def make_user(tenure_months=0):
    return {"id": "user123", "tenure_months": tenure_months}


def test_basic_plan():
    result = calculate_total("user123", "basic", quantity=5)
    assert result is not None
    assert result["plan_name"] == "Basic"
    assert result["total"] == 50.00
    assert result["discount_applied"] == 0.0