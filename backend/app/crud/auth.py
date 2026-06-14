from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.user import User as UserModel
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.schemas.user import UserCreate
from backend.app.core import security
from sqlalchemy.orm import selectinload
from backend.app.models.user import Position as PositionModel


class AuthRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def register(self, user: UserCreate) -> UserModel:
        password = security.get_password_hash(user.password)
        db_user = UserModel(
            name=user.name, 
            surname=user.surname, 
            lastname=user.lastname, 
            position_id=user.position_id, 
            phone=user.phone, 
            is_active=user.is_active, 
            email=user.email, 
            password=password, 
            role=user.role)
        self.session.add(db_user)
        await self.session.commit()
        result = await self.session.execute(select(UserModel).where(UserModel.id == db_user.id).options(selectinload(UserModel.position).selectinload(PositionModel.department)))
        return result.scalars().one_or_none()
    
    async def login(self, oath: OAuth2PasswordRequestForm) -> UserModel:
        result = await self.session.execute(select(UserModel).where(UserModel.email == oath.username))
        return result.scalar_one_or_none()
