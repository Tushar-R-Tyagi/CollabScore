from backend.billing_module.billing import calculate_total

# Test helper - creates a mock user
def make_user(tenure_months=0):
    return {"id": "user123", "tenure_months": tenure_months}

def test_basic_plan():
    """Test basic plan billing with no discount."""
    result = calculate_total("user123", "basic", quantity=5)
    assert result is not None
    assert result["plan_name"] == "Basic"
    assert result["total"] == 50.00
    assert result["discount_applied"] == 0.0

def test_professional_long_term():
    """Test professional plan with loyalty discount."""
    user = make_user(tenure_months=30)
    # This test would need to be modified to pass the user properly
    # but we haven't exposed user in the API yet
    pass

def test_family_discount():
    """Test family plan loyalty discount."""
    user = make_user(tenure_months=18)
    # This test should catch the case-sensitivity bug
    # but it doesn't exist yet - candidate needs to add it
    pass