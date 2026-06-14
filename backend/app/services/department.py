from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.crud.department import DepartmentRepository
from backend.app.exceptions import errors
from backend.app.models.shift import Schedule as ScheduleModel
from backend.app.models.user import Department as DepartmentModel
from backend.app.models.user import Roles, User as UserModel
from backend.app.schemas.department import Department, DepartmentCreate


def get_user_department_id(user: UserModel) -> int | None:
    if user.position is None:
        return None
    return user.position.department_id


def require_user_department_id(user: UserModel) -> int:
    department_id = get_user_department_id(user)
    if department_id is None:
        errors.forbidden(errors.USER_DEPARTMENT_NOT_SET)
    return department_id


def get_schedule_department_id(schedule: ScheduleModel) -> int | None:
    if schedule.user is None or schedule.user.position is None:
        return None
    return schedule.user.position.department_id


def ensure_schedule_department_access(schedule: ScheduleModel | None, user: UserModel) -> ScheduleModel:
    if schedule is None:
        errors.schedule_not_found()
    user_department_id = require_user_department_id(user)
    schedule_department_id = get_schedule_department_id(schedule)
    if schedule_department_id is None or schedule_department_id != user_department_id:
        errors.schedule_not_found()
    return schedule


def resolve_statistics_department_filter(user: UserModel, requested_department_id: int | None) -> int | None:
    if user.role in (Roles.MANAGER, Roles.ADMINISTRATOR):
        return require_user_department_id(user)
    return requested_department_id


def resolve_user_list_department_filter(user: UserModel, requested_department_id: int | None) -> int | None:
    if user.role == Roles.MANAGER:
        return require_user_department_id(user)
    return requested_department_id


def ensure_same_department(actor: UserModel, target: UserModel) -> None:
    actor_department_id = require_user_department_id(actor)
    target_department_id = get_user_department_id(target)
    if target_department_id != actor_department_id:
        errors.forbidden(errors.DEPARTMENT_ACCESS_DENIED)


class DepartmentService:
    def __init__(self):
        pass

    async def get_departments(self, db: AsyncSession, title: str = None, skip: int = 0, limit: int = 20) -> List[DepartmentModel]:
        repo = DepartmentRepository(db)
        departments = await repo.get_all(title, skip, limit)
        return [Department.model_validate(department) for department in departments]

    async def create_department(self, db: AsyncSession, dep_in: DepartmentCreate) -> DepartmentModel:
        repo = DepartmentRepository(db)
        department = await repo.create(dep_in)
        return Department.model_validate(department)
