from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.crud.schedule import ScheduleRepository
from backend.app.exceptions import errors
from backend.app.models.shift import Schedule as ScheduleModel
from backend.app.models.shift import Shift as ShiftModel
from backend.app.models.shift import Shift_schedule as Shift_scheduleModel
from backend.app.models.shift import Shift_user as ShiftUserModel
from backend.app.models.user import Roles, User as UserModel
from backend.app.schemas.schedule import ScheduleCreate, ScheduleDisplay, ScheduleListItem, ScheduleUpdate
from backend.app.schemas.shift import Shift_schedule
from backend.app.services.department import ensure_schedule_department_access, require_user_department_id


def is_registration_open(schedule: ScheduleModel, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    return schedule.opening_date <= now <= schedule.ending_date


def is_registration_closed(schedule: ScheduleModel, now: datetime | None = None) -> bool:
    now = now or datetime.now()
    return now > schedule.ending_date


def validate_curator_assign(schedule: ScheduleModel, shift: ShiftModel, actor: UserModel, target_user_id: int, now: datetime | None = None) -> None:
    if actor.role in (Roles.MANAGER, Roles.ADMINISTRATOR):
        return
    if actor.role != Roles.CURATOR:
        errors.forbidden()
    if target_user_id != actor.id:
        errors.forbidden(errors.CURATOR_SELF_ASSIGN_ONLY)
    now = now or datetime.now()
    if is_registration_open(schedule, now):
        return
    if is_registration_closed(schedule, now):
        if shift.start_time < now:
            errors.bad_request(errors.PAST_SHIFT_SIGNUP)
        return
    errors.bad_request(errors.SCHEDULE_SIGNUP_NOT_OPEN)

def validate_curator_remove(schedule: ScheduleModel, actor: UserModel, shift_user: ShiftUserModel, now: datetime | None = None) -> None:
    if actor.role in (Roles.MANAGER, Roles.ADMINISTRATOR):
        return
    if actor.role != Roles.CURATOR:
        errors.forbidden()
    if shift_user.user_id != actor.id:
        errors.forbidden(errors.CURATOR_SELF_REMOVE_ONLY)
    now = now or datetime.now()
    if not is_registration_open(schedule, now):
        errors.bad_request(errors.SHIFT_REMOVAL_CLOSED)


class ScheduleService:
    def __init__(self):
        pass

    async def get_schedule(self, db: AsyncSession, schedule_id: int, current_user: UserModel) -> ScheduleDisplay:
        repo = ScheduleRepository(db)
        schedule = await repo.get(schedule_id)
        ensure_schedule_department_access(schedule, current_user)
        return ScheduleDisplay.model_validate(schedule)

    async def get_schedules(self, db: AsyncSession, current_user: UserModel) -> List[ScheduleListItem]:
        repo = ScheduleRepository(db)
        department_id = require_user_department_id(current_user)
        schedules = await repo.get_all_list(department_id=department_id)
        return [ScheduleListItem.model_validate(schedule) for schedule in schedules]

    async def update_schedules(self, db: AsyncSession, schedules_id: int, schedules_in: ScheduleUpdate, current_user: UserModel) -> ScheduleDisplay:
        repo = ScheduleRepository(db)
        schedule = await repo.get_for_access_check(schedules_id)
        ensure_schedule_department_access(schedule, current_user)
        updated = await repo.update(schedules_id, schedules_in)
        return ScheduleDisplay.model_validate(updated)

    async def create_schedule(self, db: AsyncSession, schedule_in: ScheduleCreate, current_user: UserModel) -> ScheduleDisplay:
        repo = ScheduleRepository(db)
        schedule_data = schedule_in.model_copy(update={"creator_id": current_user.id})
        schedule = await repo.create(schedule_data)
        ensure_schedule_department_access(schedule, current_user)
        return ScheduleDisplay.model_validate(schedule)

    async def delete_schedule(self, db: AsyncSession, schedule_id: int, current_user: UserModel) -> bool:
        repo = ScheduleRepository(db)
        schedule = await repo.get_for_access_check(schedule_id)
        ensure_schedule_department_access(schedule, current_user)
        return await repo.delete(schedule_id)

    async def assign_shifts(self, db: AsyncSession, schedule_id: int, shifts_id: List[int], current_user: UserModel) -> List[Shift_scheduleModel]:
        repo = ScheduleRepository(db)
        schedule = await repo.get_for_access_check(schedule_id)
        ensure_schedule_department_access(schedule, current_user)
        shift_schedules = await repo.assign_shifts(schedule_id, shifts_id)
        return [Shift_schedule.model_validate(shift_schedule) for shift_schedule in shift_schedules]

    async def delete_shift(self, db: AsyncSession, schedule_id: int, shift_id: int, current_user: UserModel) -> bool:
        repo = ScheduleRepository(db)
        schedule = await repo.get_for_access_check(schedule_id)
        ensure_schedule_department_access(schedule, current_user)
        return await repo.delete_shift(schedule_id, shift_id)
