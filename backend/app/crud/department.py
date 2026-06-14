from typing import List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.models.user import Department as DepartmentModel
from backend.app.models.user import Position as PositionModel
from backend.app.schemas.department import DepartmentCreate, PositionCreate


class DepartmentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, title: str, skip: int, limit: int) -> List[DepartmentModel]:
        query = select(DepartmentModel)
        if title:
            query = query.where(DepartmentModel.title.ilike(f"%{title}%"))
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, department: DepartmentCreate) -> DepartmentModel:
        db_department = DepartmentModel(**department.model_dump())
        self.session.add(db_department)
        await self.session.commit()
        await self.session.refresh(db_department)
        return db_department


class PositionRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get(self, position_id: int) -> PositionModel:
        query = (select(PositionModel).where(PositionModel.id == position_id).options(selectinload(PositionModel.department)))
        result = await self.session.execute(query)
        return result.scalars().one_or_none()

    async def get_all(self, title: str, skip: int, limit: int) -> List[PositionModel]:
        query = select(PositionModel).options(selectinload(PositionModel.department))
        if title:
            query = query.where(PositionModel.title.ilike(f"%{title}%"))
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def create(self, position: PositionCreate) -> PositionModel:
        db_position = PositionModel(**position.model_dump())
        self.session.add(db_position)
        await self.session.commit()
        await self.session.refresh(db_position)
        return await self.get(db_position.id)
