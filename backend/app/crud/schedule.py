from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from sqlalchemy.orm import load_only, selectinload
from backend.app.models.shift import Schedule as ScheduleModel, Shift_schedule as Shift_scheduleModel, Shift as ShiftModel, Shift_user as Shift_userModel
from backend.app.models.user import User as UserModel, Position as PositionModel
from backend.app.schemas.schedule import ScheduleCreate, ScheduleUpdate
from typing import List, Optional


def _schedule_display_options():
    return (
        selectinload(ScheduleModel.user)
        .selectinload(UserModel.position)
        .selectinload(PositionModel.department),
        selectinload(ScheduleModel.shift_schedule)
        .selectinload(Shift_scheduleModel.shift)
        .options(
            load_only(
                ShiftModel.id,
                ShiftModel.type_id,
                ShiftModel.start_time,
                ShiftModel.end_time,
                ShiftModel.is_free,
                ShiftModel.max_user,
            )
        )
        .selectinload(ShiftModel.shift_user)
        .selectinload(Shift_userModel.user)
        .options(load_only(UserModel.id, UserModel.name, UserModel.surname)),
    )


class ScheduleRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def _delete_orphan_shifts(self, shift_ids: list[int]) -> None:
        if not shift_ids:
            return
        linked_result = await self.session.execute(select(Shift_scheduleModel.shift_id).where(Shift_scheduleModel.shift_id.in_(shift_ids)))
        still_linked = set(linked_result.scalars().all())
        orphan_shift_ids = [sid for sid in shift_ids if sid not in still_linked]
        if not orphan_shift_ids:
            return
        await self.session.execute(delete(ShiftModel).where(ShiftModel.id.in_(orphan_shift_ids)))

    async def get_base(self, schedule_id: int) -> Optional[ScheduleModel]:
        result = await self.session.execute(select(ScheduleModel).where(ScheduleModel.id == schedule_id))
        return result.scalar_one_or_none()

    async def get_for_access_check(self, schedule_id: int) -> Optional[ScheduleModel]:
        result = await self.session.execute(
            select(ScheduleModel).where(ScheduleModel.id == schedule_id)
            .options(
                selectinload(ScheduleModel.user)
                .selectinload(UserModel.position)
                .selectinload(PositionModel.department)
            )
        )
        return result.scalar_one_or_none()

    async def get(self, schedule_id: int) -> Optional[ScheduleModel]:
        result = await self.session.execute(select(ScheduleModel).where(ScheduleModel.id == schedule_id).options(*_schedule_display_options()))
        return result.scalar_one_or_none()
    
    async def get_all_list(self, department_id: Optional[int] = None) -> List[ScheduleModel]:
        query = select(ScheduleModel).order_by(ScheduleModel.start_date.desc())
        if department_id is not None:
            query = (query.join(UserModel, ScheduleModel.creator_id == UserModel.id).join(PositionModel, UserModel.position_id == PositionModel.id)
                     .where(PositionModel.department_id == department_id))
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def create(self, schedule: ScheduleCreate) -> ScheduleModel:
        db_schedule = ScheduleModel(**schedule.model_dump())
        self.session.add(db_schedule)
        await self.session.commit()
        await self.session.refresh(db_schedule)
        return await self.get(db_schedule.id)

    async def update(self, schedule_id: int, schedule: ScheduleUpdate) -> Optional[ScheduleModel]:
        db_schedule = await self.get_base(schedule_id)
        if not db_schedule:
            return None
        update_data = schedule.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_schedule, key, value)
        await self.session.commit()
        return await self.get(db_schedule.id)

    async def delete(self, schedule_id: int) -> bool:
        exists = await self.session.execute(select(ScheduleModel.id).where(ScheduleModel.id == schedule_id))
        if exists.scalar_one_or_none() is None:
            return False
        shift_ids_result = await self.session.execute(select(Shift_scheduleModel.shift_id).where(Shift_scheduleModel.schedule_id == schedule_id)
                                                      .where(Shift_scheduleModel.shift_id.isnot(None)))
        shift_ids = list(shift_ids_result.scalars().all())
        await self.session.execute(delete(ScheduleModel).where(ScheduleModel.id == schedule_id))
        await self.session.flush()
        await self._delete_orphan_shifts(shift_ids)
        await self.session.commit()
        return True
    
    async def assign_shifts(self, schedule_id: int, shift_ids: List[int]) -> ScheduleModel:
        db_shift_schedule = [Shift_scheduleModel(**{"schedule_id": schedule_id, "shift_id": shift_id}) for shift_id in shift_ids]
        self.session.add_all(db_shift_schedule)
        await self.session.commit()
        created_ids = [s.id for s in db_shift_schedule]
        result = await self.session.execute(
            select(Shift_scheduleModel)
            .where(Shift_scheduleModel.id.in_(created_ids))
            .options(selectinload(Shift_scheduleModel.shift)
                     .selectinload(ShiftModel.shift_type))
        )
        return result.scalars().all()

    async def delete_shift(self, schedule_id: int, shift_id: int) -> bool:
        db_shift_schedule = await self.session.execute(select(Shift_scheduleModel)
                                                       .filter(Shift_scheduleModel.shift_id == shift_id, Shift_scheduleModel.schedule_id == schedule_id))
        db_shift_schedule = db_shift_schedule.scalar_one_or_none()
        if not db_shift_schedule:
            return False
        await self.session.delete(db_shift_schedule)
        await self.session.flush()
        await self._delete_orphan_shifts([shift_id])
        await self.session.commit()
        return True

    async def get_by_shift_id(self, shift_id: int) -> Optional[ScheduleModel]:
        result = await self.session.execute(
            select(ScheduleModel)
            .join(
                Shift_scheduleModel,
                Shift_scheduleModel.schedule_id == ScheduleModel.id,
            )
            .where(Shift_scheduleModel.shift_id == shift_id)
            .options(
                selectinload(ScheduleModel.user)
                .selectinload(UserModel.position)
                .selectinload(PositionModel.department)
            )
        )
        return result.scalar_one_or_none()
