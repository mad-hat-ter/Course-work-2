from datetime import datetime
from types import SimpleNamespace
from backend.app.services.user import UserService


def _shift(type_id: int, title: str, rate: float = 100.0):
    shift_type = SimpleNamespace(
        id=type_id,
        title=title,
        rate=rate,
        quantity_for_increased_payment=None,
        increased_payment=None,
    )
    return SimpleNamespace(
        type_id=type_id,
        shift_type=shift_type,
        start_time=datetime(2026, 6, 15, 10, 0, 0),
    )


def _user(
    user_id: int = 1,
    surname: str = "Иванов",
    name: str = "Иван",
    lastname: str | None = "Иванович",
):
    return SimpleNamespace(id=user_id, surname=surname, name=name, lastname=lastname)


def test_format_curator_name_with_and_without_lastname():
    service = UserService()
    assert service._format_curator_name(_user()) == "Иванов Иван Иванович"
    assert service._format_curator_name(_user(lastname=None)) == "Иванов Иван"


def test_build_curator_statistics_row_counts_and_payment():
    service = UserService()
    shift_types = [
        SimpleNamespace(id=1, title="Дневная смена"),
        SimpleNamespace(id=2, title="Ночная смена"),
    ]
    shifts = [
        _shift(1, "Дневная смена", rate=100),
        _shift(1, "Дневная смена", rate=100),
        _shift(2, "Ночная смена", rate=150),
    ]
    row = service._build_curator_statistics_row_from_shifts(_user(), shift_types, shifts)
    assert row.user_id == 1
    assert row.curator_name == "Иванов Иван Иванович"
    assert row.counts == [2, 1]
    assert row.payment == 350.0


def test_build_curator_statistics_row_skips_shifts_without_type():
    service = UserService()
    shift_types = [
        SimpleNamespace(id=1, title="Дневная смена"),
        SimpleNamespace(id=2, title="Ночная смена"),
    ]
    shifts = [
        SimpleNamespace(type_id=1, shift_type=None, start_time=datetime(2026, 6, 15, 10, 0)),
        _shift(1, "Дневная смена"),
    ]
    row = service._build_curator_statistics_row_from_shifts(_user(), shift_types, shifts)
    assert row.counts == [1, 0]
    assert row.payment == 100.0
