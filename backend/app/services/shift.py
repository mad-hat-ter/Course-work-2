from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.crud.schedule import ScheduleRepository
from backend.app.crud.shift import ShiftRepository, Shift_typeRepository
from backend.app.crud.user import UserRepository
from backend.app.exceptions import errors
from backend.app.models.shift import Shift as ShiftModel
from backend.app.models.shift import Shift_type as Shift_typeModel
from backend.app.models.shift import Shift_user as ShiftUserModel
from backend.app.models.user import Roles, User as UserModel
from backend.app.schemas.shift import Shift, ShiftCreate, ShiftUpdate, Shift_type, Shift_typeCreate
from backend.app.services.department import ensure_same_department, ensure_schedule_department_access
from backend.app.services.schedule import validate_curator_assign, validate_curator_remove


class Shift_typeService:
    def __init__(self):
        pass

    async def get_shift_types(self, db: AsyncSession, title: str = None, skip: int = 0, limit: int = 20) -> List[Shift_typeModel]:
        repo = Shift_typeRepository(db)
        shift_types = await repo.get_all(title, skip, limit)
        return [Shift_type.model_validate(shift_type) for shift_type in shift_types]

    async def create_shift_type(self, db: AsyncSession, st_in: Shift_typeCreate) -> Shift_typeModel:
        repo = Shift_typeRepository(db)
        shift_type = await repo.create(st_in)
        return Shift_type.model_validate(shift_type)


class ShiftService:
    def __init__(self):
        pass

    async def get_shift(self, db: AsyncSession, shift_id: int) -> ShiftModel:
        repo = ShiftRepository(db)
        shift = await repo.get(shift_id)
        if shift is None:
            errors.shift_not_found()
        return Shift.model_validate(shift)

    async def get_shifts_filter(self, db: AsyncSession, type_id: int = None, is_free: bool = None, user_id: int = None) -> List[ShiftModel]:
        repo = ShiftRepository(db)
        shifts = await repo.get_filter(type_id, is_free, user_id)
        return [Shift.model_validate(shift) for shift in shifts]

    async def update_shift(self, db: AsyncSession, shift_id: int, shift_in: ShiftUpdate) -> ShiftModel:
        repo = ShiftRepository(db)
        shift = await repo.update(shift_id, shift_in)
        return Shift.model_validate(shift)

    async def create_shift(self, db: AsyncSession, shift_in: ShiftCreate) -> ShiftModel:
        repo = ShiftRepository(db)
        shift = await repo.create(shift_in)
        return Shift.model_validate(shift)

    async def create_many_shifts(self, db: AsyncSession, shift_in: List[ShiftCreate]) -> List[ShiftModel]:
        repo = ShiftRepository(db)
        shifts = await repo.create_many(shift_in)
        return [Shift.model_validate(shift) for shift in shifts]

    async def delete_shift(self, db: AsyncSession, shift_id: int) -> bool:
        repo = ShiftRepository(db)
        answer = await repo.delete(shift_id)
        return answer

    async def assign_user(self, db: AsyncSession, shift_id: int, user_id: int, current_user: UserModel) -> ShiftModel:
        shift_repo = ShiftRepository(db)
        schedule_repo = ScheduleRepository(db)
        shift = await shift_repo.get_base(shift_id)
        if not shift:
            errors.shift_not_found()
        schedule = await schedule_repo.get_by_shift_id(shift_id)
        ensure_schedule_department_access(schedule, current_user)
        if (current_user.role in (Roles.MANAGER, Roles.ADMINISTRATOR) and user_id != current_user.id):
            user_repo = UserRepository(db)
            target_user = await user_repo.get(user_id)
            if not target_user:
                errors.not_found("Пользователь не найден")
            ensure_same_department(current_user, target_user)
        validate_curator_assign(schedule, shift, current_user, user_id)
        updated_shift = await shift_repo.assign_user(shift_id, user_id)
        return Shift.model_validate(updated_shift)

    async def delete_user(self, db: AsyncSession, shift_id: int, user_id: int, current_user: UserModel) -> bool:
        shift_repo = ShiftRepository(db)
        schedule_repo = ScheduleRepository(db)
        schedule = await schedule_repo.get_by_shift_id(shift_id)
        ensure_schedule_department_access(schedule, current_user)
        result = await db.execute(select(ShiftUserModel).where(ShiftUserModel.shift_id == shift_id, ShiftUserModel.user_id == user_id))
        shift_user = result.scalars().first()
        if not shift_user:
            return False
        validate_curator_remove(schedule, current_user, shift_user)
        return await shift_repo.delete_user(shift_id, user_id)

    async def delete_user_record(self, db: AsyncSession, shift_user_id: int, current_user: UserModel) -> bool:
        shift_repo = ShiftRepository(db)
        schedule_repo = ScheduleRepository(db)
        result = await db.execute(select(ShiftUserModel).where(ShiftUserModel.id == shift_user_id))
        shift_user = result.scalar_one_or_none()
        if not shift_user:
            return False
        schedule = await schedule_repo.get_by_shift_id(shift_user.shift_id)
        ensure_schedule_department_access(schedule, current_user)
        validate_curator_remove(schedule, current_user, shift_user)
        return await shift_repo.delete_user_record(shift_user_id)
