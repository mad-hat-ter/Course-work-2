from types import SimpleNamespace
import pytest
from fastapi import HTTPException
from backend.app.exceptions.errors import DEPARTMENT_ACCESS_DENIED, USER_DEPARTMENT_NOT_SET
from backend.app.models.user import Roles
from backend.app.services import department as access


def _user(role: Roles, department_id: int | None):
    position = None if department_id is None else SimpleNamespace(department_id=department_id)
    return SimpleNamespace(role=role, position=position)


def _schedule(creator_department_id: int | None):
    creator = SimpleNamespace(position=None if creator_department_id is None else SimpleNamespace(department_id=creator_department_id))
    return SimpleNamespace(user=creator)


def test_manager_statistics_locked_to_own_department():
    user = _user(Roles.MANAGER, 2)
    assert access.resolve_statistics_department_filter(user, requested_department_id=99) == 2


def test_admin_user_list_not_locked_to_department():
    user = _user(Roles.ADMINISTRATOR, 2)
    assert access.resolve_user_list_department_filter(user, requested_department_id=5) == 5


def test_manager_user_list_locked_to_department():
    user = _user(Roles.MANAGER, 3)
    assert access.resolve_user_list_department_filter(user, requested_department_id=8) == 3


def test_ensure_schedule_department_access_rejects_foreign_department():
    user = _user(Roles.MANAGER, 1)
    schedule = _schedule(creator_department_id=2)

    with pytest.raises(HTTPException):
        access.ensure_schedule_department_access(schedule, user)


def test_require_user_department_id_raises_without_department():
    user = _user(Roles.CURATOR, None)

    with pytest.raises(HTTPException) as exc:
        access.require_user_department_id(user)
    assert exc.value.detail == USER_DEPARTMENT_NOT_SET


def test_ensure_same_department_rejects_different_departments():
    actor = _user(Roles.MANAGER, 1)
    target = _user(Roles.CURATOR, 2)

    with pytest.raises(HTTPException) as exc:
        access.ensure_same_department(actor, target)
    assert exc.value.detail == DEPARTMENT_ACCESS_DENIED
