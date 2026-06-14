from datetime import datetime, timedelta
from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from backend.app.exceptions.errors import (
    CURATOR_SELF_ASSIGN_ONLY,
    CURATOR_SELF_REMOVE_ONLY,
    PAST_SHIFT_SIGNUP,
    SCHEDULE_SIGNUP_NOT_OPEN,
    SHIFT_REMOVAL_CLOSED,
)
from backend.app.models.user import Roles
from backend.app.services import schedule as permissions


def _schedule(opening: datetime, ending: datetime):
    return SimpleNamespace(opening_date=opening, ending_date=ending)


def _shift(start: datetime):
    return SimpleNamespace(start_time=start)


def _user(role: Roles, user_id: int = 1):
    return SimpleNamespace(role=role, id=user_id)


def test_registration_open_and_closed():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(opening=now - timedelta(days=1), ending=now + timedelta(days=1))
    assert permissions.is_registration_open(schedule, now) is True
    assert permissions.is_registration_closed(schedule, now) is False
    closed_schedule = _schedule(opening=now - timedelta(days=10), ending=now - timedelta(days=1))
    assert permissions.is_registration_closed(closed_schedule, now) is True


def test_curator_can_assign_self_when_open():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=1), now + timedelta(days=1))
    shift = _shift(now + timedelta(days=2))
    permissions.validate_curator_assign(schedule, shift, _user(Roles.CURATOR, 5), target_user_id=5, now=now)


def test_curator_cannot_assign_other_curator():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=1), now + timedelta(days=1))
    shift = _shift(now + timedelta(days=2))
    with pytest.raises(HTTPException) as exc:
        permissions.validate_curator_assign(schedule, shift, _user(Roles.CURATOR, 5), target_user_id=9, now=now)
    assert exc.value.detail == CURATOR_SELF_ASSIGN_ONLY


def test_curator_can_assign_future_shift_after_close():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=10), now - timedelta(days=1))
    shift = _shift(now + timedelta(days=2))
    permissions.validate_curator_assign(schedule, shift, _user(Roles.CURATOR, 3), target_user_id=3, now=now)


def test_curator_cannot_assign_past_shift_after_close():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=10), now - timedelta(days=1))
    shift = _shift(now - timedelta(hours=1))
    with pytest.raises(HTTPException) as exc:
        permissions.validate_curator_assign(schedule, shift, _user(Roles.CURATOR, 3), target_user_id=3, now=now)
    assert exc.value.detail == PAST_SHIFT_SIGNUP


def test_curator_cannot_assign_before_opening():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now + timedelta(days=1), now + timedelta(days=10))
    shift = _shift(now + timedelta(days=2))
    with pytest.raises(HTTPException) as exc:
        permissions.validate_curator_assign(schedule, shift, _user(Roles.CURATOR, 3), target_user_id=3, now=now)
    assert exc.value.detail == SCHEDULE_SIGNUP_NOT_OPEN


def test_curator_cannot_remove_when_registration_closed():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=10), now - timedelta(days=1))
    shift_user = SimpleNamespace(user_id=4)
    with pytest.raises(HTTPException) as exc:
        permissions.validate_curator_remove(schedule, _user(Roles.CURATOR, 4), shift_user, now=now)
    assert exc.value.detail == SHIFT_REMOVAL_CLOSED


def test_manager_can_assign_without_restrictions():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now + timedelta(days=1), now + timedelta(days=10))
    shift = _shift(now + timedelta(days=2))
    permissions.validate_curator_assign(schedule, shift, _user(Roles.MANAGER, 1), target_user_id=99, now=now)


def test_admin_can_remove_when_registration_closed():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=10), now - timedelta(days=1))
    shift_user = SimpleNamespace(user_id=4)
    permissions.validate_curator_remove(schedule, _user(Roles.ADMINISTRATOR, 1), shift_user, now=now)


def test_none_role_cannot_assign():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=1), now + timedelta(days=1))
    shift = _shift(now + timedelta(days=2))
    with pytest.raises(HTTPException) as exc:
        permissions.validate_curator_assign(schedule, shift, _user(Roles.NONE, 5), target_user_id=5, now=now)
    assert exc.value.status_code == 403


def test_curator_cannot_remove_other_user():
    now = datetime(2026, 6, 15, 12, 0, 0)
    schedule = _schedule(now - timedelta(days=1), now + timedelta(days=1))
    shift_user = SimpleNamespace(user_id=9)
    with pytest.raises(HTTPException) as exc:
        permissions.validate_curator_remove(schedule, _user(Roles.CURATOR, 4), shift_user, now=now)
    assert exc.value.detail == CURATOR_SELF_REMOVE_ONLY
