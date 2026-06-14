from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from backend.app.models.user import Position as PositionModel
from backend.app.schemas.department import Position, PositionCreate
from backend.app.crud.department import PositionRepository



class PositionService:
    def __init__(self):
        pass

    async def get_positions(self, db: AsyncSession, title: str = None, skip: int = 0, limit: int = 20) -> List[PositionModel]:
        repo = PositionRepository(db)
        positions = await repo.get_all(title, skip, limit)
        return [Position.model_validate(position) for position in positions]
    
    async def get_position(self, db: AsyncSession, position_id: int) -> PositionModel:
        repo = PositionRepository(db)
        position = await repo.get(position_id)
        return Position.model_validate(position)

    async def create_position(self, db: AsyncSession, pos_in: PositionCreate) -> PositionModel:
        repo = PositionRepository(db)
        position = await repo.create(pos_in)
        return Position.model_validate(position)