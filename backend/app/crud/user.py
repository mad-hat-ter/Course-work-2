from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload
from backend.app.models.user import User as UserModel
from backend.app.models.shift import Shift as ShiftModel, Shift_schedule as Shift_scheduleModel, Shift_user as Shift_userModel
from backend.app.models.user import Position as PositionModel
from backend.app.schemas.user import UserCreate, UserUpdate, Roles
from backend.app.core import security
from typing import List, Optional
from datetime import datetime


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    
    async def get(self, user_id: int) -> UserModel:
        result = await self.session.execute(select(UserModel).where(UserModel.id == user_id).options(selectinload(UserModel.position).selectinload(PositionModel.department)))
        return result.scalars().one_or_none()
    
    async def get_shift_me(self, user_id: int) -> List[ShiftModel]:
        result = await self.session.execute(
            select(ShiftModel)
            .join(Shift_userModel, Shift_userModel.shift_id == ShiftModel.id)
            .join(Shift_scheduleModel, Shift_scheduleModel.shift_id == ShiftModel.id)
            .where(Shift_userModel.user_id == user_id)
            .options(selectinload(ShiftModel.shift_type))
            .options(
                selectinload(ShiftModel.shift_user)
                .selectinload(Shift_userModel.user)
                .selectinload(UserModel.position)
                .selectinload(PositionModel.department)
            )
            .distinct()
        )
        return result.scalars().all()

    async def get_shifts_me_in_period(self, user_id: int, start_date: datetime, end_date: datetime,) -> List[ShiftModel]:
        result = await self.session.execute(
            select(ShiftModel)
            .join(Shift_userModel, Shift_userModel.shift_id == ShiftModel.id)
            .join(Shift_scheduleModel, Shift_scheduleModel.shift_id == ShiftModel.id)
            .where(Shift_userModel.user_id == user_id)
            .where(ShiftModel.start_time >= start_date)
            .where(ShiftModel.start_time <= end_date)
            .options(selectinload(ShiftModel.shift_type))
            .distinct()
        )
        return result.scalars().all()

    async def get_shift_assignments_for_users_in_period(self, user_ids: list[int], start_date: datetime, end_date: datetime) -> list[tuple[int, ShiftModel]]:
        if not user_ids:
            return []
        result = await self.session.execute(
            select(Shift_userModel)
            .where(Shift_userModel.user_id.in_(user_ids))
            .join(ShiftModel, Shift_userModel.shift_id == ShiftModel.id)
            .where(ShiftModel.start_time >= start_date)
            .where(ShiftModel.start_time <= end_date)
            .options(selectinload(Shift_userModel.shift).selectinload(ShiftModel.shift_type))
        )
        return [
            (assignment.user_id, assignment.shift)
            for assignment in result.scalars().unique().all()
            if assignment.shift is not None
        ]

    async def _get_base(self, user_id: int) -> Optional[UserModel]:
        result = await self.session.execute(select(UserModel).where(UserModel.id == user_id))
        return result.scalar_one_or_none()

    async def create(self, user: UserCreate) -> UserModel:
        user_data = user.model_dump()
        plain_password = user_data.pop('password')
        user_data['password'] = security.get_password_hash(plain_password)
        db_user = UserModel(**user_data)
        self.session.add(db_user)
        await self.session.commit()
        await self.session.refresh(db_user)
        return await self.get(db_user.id)

    async def update(self, user_id: int, user: UserUpdate) -> Optional[UserModel]:
        db_user = await self._get_base(user_id)
        if not db_user:
            return None
        update_data = user.model_dump(exclude_unset=True)
        plain_password = update_data.pop('password', None)
        if plain_password:
            update_data['password'] = security.get_password_hash(plain_password)
        for key, value in update_data.items():
            setattr(db_user, key, value)
        await self.session.commit()
        await self.session.refresh(db_user)
        return await self.get(db_user.id)

    async def get_filter(
        self, 
        q: Optional[str] = None, 
        is_active: Optional[bool] = None, 
        department_id: Optional[int] = None,
        role: Optional[Roles] = None,
        skip: int = 0, 
        limit: int = 20
    ) -> List[UserModel]:
        query = select(UserModel).options(selectinload(UserModel.position).selectinload(PositionModel.department))
        query = self._apply_user_filters(query, q, is_active, department_id, role)
        query = query.order_by(UserModel.surname, UserModel.name)
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    def _apply_user_filters(
        self,
        query,
        q: Optional[str] = None,
        is_active: Optional[bool] = None,
        department_id: Optional[int] = None,
        role: Optional[Roles] = None,
    ):
        if is_active is not None:
            query = query.where(UserModel.is_active == is_active)
        if department_id is not None:
            query = query.join(UserModel.position).where(PositionModel.department_id == department_id)
        if role is not None:
            query = query.where(UserModel.role == role)
        if q:
            query = query.filter(or_(UserModel.name.ilike(f"%{q}%"), UserModel.surname.ilike(f"%{q}%"), UserModel.lastname.ilike(f"%{q}%"), UserModel.email.ilike(f"%{q}%")))
        return query

    async def count_filter(self, q: Optional[str] = None, is_active: Optional[bool] = None, department_id: Optional[int] = None, role: Optional[Roles] = None) -> int:
        query = select(func.count()).select_from(UserModel)
        query = self._apply_user_filters(query, q, is_active, department_id, role)
        result = await self.session.execute(query)
        return result.scalar_one()