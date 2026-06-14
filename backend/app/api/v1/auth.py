from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.schemas.user import UserCreate, User, Token
from backend.app.models.user import User as UserModel
from backend.app.services.auth import AuthService

router = APIRouter()
crud = AuthService()

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)) -> UserModel:
    return await crud.register(db, user_in) 


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    return await crud.login(db, form_data)   