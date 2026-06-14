from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import load_only, selectinload
from backend.app.exceptions import errors
from backend.app.models.shift import Shift as ShiftModel, Shift_type as ShiftTypeModel, Shift_user as Shift_userModel
from backend.app.models.user import User as UserModel, Position as PositionModel
from backend.app.schemas.shift import ShiftCreate, ShiftUpdate, Shift_typeCreate
from typing import List, Optional


class ShiftRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_base(self, shift_id: int) -> Optional[ShiftModel]:
        result = await self.session.execute(select(ShiftModel).where(ShiftModel.id == shift_id))
        return result.scalar_one_or_none()

    async def get(self, shift_id: int) -> Optional[ShiftModel]:
        result = await self.session.execute(
            select(ShiftModel)
            .where(ShiftModel.id == shift_id)
            .options(selectinload(ShiftModel.shift_type))
            .options(
                selectinload(ShiftModel.shift_user)
                .selectinload(Shift_userModel.user)
                .selectinload(UserModel.position)
                .selectinload(PositionModel.department)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_filter(self, type_id: Optional[int] = None, is_free: Optional[bool] = None, user_id: Optional[int] = None) -> List[ShiftModel]:
        query = (
            select(ShiftModel)
            .options(selectinload(ShiftModel.shift_type))
            .options(
                selectinload(ShiftModel.shift_user)
                .selectinload(Shift_userModel.user)
                .selectinload(UserModel.position)
                .selectinload(PositionModel.department)
            )
        )
        if type_id is not None:
            query = query.where(ShiftModel.type_id == type_id)
        if is_free is not None:
            query = query.where(ShiftModel.is_free == is_free)
        if user_id is not None:
            query = query.join(Shift_userModel).where(Shift_userModel.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create_many(self, shifts: List[ShiftCreate]) -> List[ShiftModel]:
        db_shifts = [ShiftModel(**shift.model_dump()) for shift in shifts]
        self.session.add_all(db_shifts)
        await self.session.commit()
        created_ids = [s.id for s in db_shifts]
        result = await self.session.execute(
            select(ShiftModel)
            .where(ShiftModel.id.in_(created_ids))
            .options(selectinload(ShiftModel.shift_type))
            .options(
                selectinload(ShiftModel.shift_user)
                .selectinload(Shift_userModel.user)
                .selectinload(UserModel.position)
                .selectinload(PositionModel.department)
            )
        )
        return result.scalars().all()
    
    async def create(self, shift: ShiftCreate) -> ShiftModel:
        db_shift = ShiftModel(**shift.model_dump())
        self.session.add(db_shift)
        await self.session.commit()
        await self.session.refresh(db_shift)
        return await self.get(db_shift.id)

    async def update(self, shift_id: int, shift: ShiftUpdate) -> Optional[ShiftModel]:
        db_shift = await self.get_base(shift_id)
        if not db_shift:
            return None
        update_data = shift.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_shift, key, value)
        await self.session.commit()
        return await self.get(db_shift.id)

    async def delete(self, shift_id: int) -> bool:
        db_shift = await self.get_base(shift_id)
        if not db_shift:
            return False
        await self.session.delete(db_shift)
        await self.session.commit()
        return True
    
    async def assign_user(self, shift_id: int, user_id: int) -> ShiftModel:
        result = await self.session.execute(select(ShiftModel).where(ShiftModel.id == shift_id).with_for_update())
        shift = result.scalar_one_or_none()
        if not shift:
            await self.session.rollback()
            errors.shift_not_found()
        existing = await self.session.execute(
            select(Shift_userModel).where(Shift_userModel.shift_id == shift_id, Shift_userModel.user_id == user_id))
        if existing.scalar_one_or_none():
            await self.session.rollback()
            errors.shift_already_assigned()
        assigned_count = await self.session.execute(select(func.count()).select_from(Shift_userModel).where(Shift_userModel.shift_id == shift_id))
        if assigned_count.scalar_one() >= shift.max_user:
            await self.session.rollback()
            errors.shift_no_free_slots()
        try:
            db_shift_user = Shift_userModel(shift_id=shift_id, user_id=user_id)
            self.session.add(db_shift_user)
            await self.session.commit()
            await self.session.refresh(db_shift_user)
        except IntegrityError:
            await self.session.rollback()
            errors.shift_already_assigned()
        return await self.get_assign_result(shift_id)

    async def get_assign_result(self, shift_id: int) -> ShiftModel:
        result = await self.session.execute(
            select(ShiftModel)
            .where(ShiftModel.id == shift_id)
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
            .options(
                selectinload(ShiftModel.shift_type).options(
                    load_only(
                        ShiftTypeModel.id,
                        ShiftTypeModel.title,
                        ShiftTypeModel.rate,
                        ShiftTypeModel.quantity_for_increased_payment,
                        ShiftTypeModel.increased_payment,
                    )
                )
            )
            .options(
                selectinload(ShiftModel.shift_user)
                .selectinload(Shift_userModel.user)
                .options(
                    load_only(
                        UserModel.id,
                        UserModel.name,
                        UserModel.surname,
                        UserModel.lastname,
                        UserModel.email,
                        UserModel.phone,
                        UserModel.position_id,
                        UserModel.role,
                        UserModel.is_active,
                        UserModel.registration_date,
                        UserModel.last_login,
                    )
                )
            )
        )
        shift = result.scalar_one_or_none()
        if not shift:
            errors.shift_not_found()
        return shift

    async def _lock_shift(self, shift_id: int) -> ShiftModel | None:
        result = await self.session.execute(select(ShiftModel).where(ShiftModel.id == shift_id).with_for_update())
        return result.scalar_one_or_none()

    async def delete_user(self, shift_id: int, user_id: int) -> bool:
        shift = await self._lock_shift(shift_id)
        if not shift:
            await self.session.rollback()
            return False
        result = await self.session.execute(select(Shift_userModel).where(Shift_userModel.shift_id == shift_id, Shift_userModel.user_id == user_id,))
        db_shift_user = result.scalars().first()
        if not db_shift_user:
            await self.session.rollback()
            return False
        await self.session.delete(db_shift_user)
        await self.session.commit()
        return True

    async def delete_user_record(self, shift_user_id: int) -> bool:
        result = await self.session.execute(select(Shift_userModel).where(Shift_userModel.id == shift_user_id))
        db_shift_user = result.scalar_one_or_none()
        if not db_shift_user:
            return False
        shift = await self._lock_shift(db_shift_user.shift_id)
        if not shift:
            await self.session.rollback()
            return False
        await self.session.delete(db_shift_user)
        await self.session.commit()
        return True


class Shift_typeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, title: str, skip: int, limit: int) -> List[ShiftTypeModel]:
        query = select(ShiftTypeModel)
        if title:
            query = query.where(ShiftTypeModel.title.ilike(f"%{title}%"))
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, shift_type: Shift_typeCreate) -> ShiftTypeModel:
        db_shift_type = ShiftTypeModel(**shift_type.model_dump())
        self.session.add(db_shift_type)
        await self.session.commit()
        await self.session.refresh(db_shift_type)
        return db_shift_type