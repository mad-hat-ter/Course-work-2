from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from backend.app.models.user import Roles
from backend.app.schemas.department import Position


class UserBase(BaseModel):
    name: str
    surname: str
    lastname: Optional[str | None] = None
    position_id: Optional[int | None] = None
    email: str
    phone: Optional[str | None] = None
    is_active: bool
    role: Roles = Roles.NONE

class UserCreate(UserBase):
    is_active: bool = True
    password: str 
    pass

class UserUpdate(BaseModel):
    name: str
    surname: str
    lastname: Optional[str | None] = Field(None, examples=[None])
    position_id: Optional[int | None] = Field(None, examples=[None])
    email: str
    phone: Optional[str | None] = Field(None, examples=[None])
    is_active: bool
    role: Roles
    password: Optional[str | None] = None

class User(UserBase):
    id: int
    registration_date: datetime
    last_login: Optional[datetime | None] = None
    position: Optional[Position | None] = None
    model_config = ConfigDict(from_attributes=True) 

class Token(BaseModel):
    access_token: str
    token_type: str