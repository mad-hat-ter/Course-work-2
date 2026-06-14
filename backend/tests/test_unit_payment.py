from types import SimpleNamespace
from backend.app.services.user import _calculate_payment


def test_payment_without_increased_rate():
    shift_type = SimpleNamespace(rate=100, quantity_for_increased_payment=None, increased_payment=None)
    assert _calculate_payment(3, shift_type) == 300


def test_payment_with_increased_rate_after_threshold():
    shift_type = SimpleNamespace(rate=100, quantity_for_increased_payment=2, increased_payment=150)
    assert _calculate_payment(4, shift_type) == 500
