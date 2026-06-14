from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.app.core.config import get_settings
from backend.app.db.session import get_db
from backend.app.exceptions import errors
from backend.app.models.user import Position as PositionModel
from backend.app.models.user import Roles, User as UserModel

settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


async def get_current_user(token: str = Depends(oauth2_scheme), session: AsyncSession = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await session.execute(select(UserModel).where(UserModel.email == email).options(selectinload(UserModel.position).selectinload(PositionModel.department)))
    user = user.scalars().one_or_none()
    if user is None:
        raise credentials_exception
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[Roles]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: UserModel = Depends(get_current_user)):
        if current_user.role not in self.allowed_roles:
            errors.forbidden()
        return current_user
