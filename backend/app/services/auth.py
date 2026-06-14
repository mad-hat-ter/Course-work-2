from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.schemas.user import UserCreate, User
from backend.app.models.user import User as UserModel
from backend.app.crud.auth import AuthRepository
from fastapi.security import OAuth2PasswordRequestForm
from backend.app.core import security
from backend.app.exceptions import errors


class AuthService:
    def __init__(self):
        pass

    async def register(self, db: AsyncSession, user: UserCreate) -> UserModel:
        repo = AuthRepository(db)
        users = await repo.register(user)
        return User.model_validate(users)

    async def login(self, db: AsyncSession, oath: OAuth2PasswordRequestForm):
        repo = AuthRepository(db)
        users = await repo.login(oath)
        if not users or not security.verify_password(oath.password, users.password):
            errors.unauthorized()

        users.last_login = datetime.now()
        await db.commit()
        await db.refresh(users)
    
        access_token = security.create_access_token({"sub": users.email})
    
        return {
        "access_token": access_token,
        "token_type": "bearer"
        }