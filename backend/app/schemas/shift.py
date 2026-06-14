from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.user import User


class Shift_typeBase(BaseModel):
    title: str
    rate: float
    quantity_for_increased_payment: Optional[int | None] = None
    increased_payment: Optional[float | None] = None


class Shift_typeCreate(Shift_typeBase):
    rate: float = 0
    pass


class Shift_type(Shift_typeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class Shift_userBase(BaseModel):
    shift_id: int
    user_id: int


class Shift_user(Shift_userBase):
    id: int
    user: Optional[User | None] = None
    model_config = ConfigDict(from_attributes=True)


class ShiftBase(BaseModel):
    type_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    is_free: bool
    max_user: int


class ShiftCreate(ShiftBase):
    is_free: bool = True
    pass


class ShiftUpdate(BaseModel):
    type_id: Optional[int | None] = None
    start_time: Optional[datetime | None] = None
    end_time: Optional[datetime | None] = None
    is_free: Optional[bool | None] = None
    max_user: Optional[int | None] = None


class Shift(ShiftBase):
    id: int
    shift_type: Shift_type
    shift_user: Optional[List[Shift_user] | None] = None
    model_config = ConfigDict(from_attributes=True)


class Shift_scheduleBase(BaseModel):
    shift_id: Optional[int | None] = None
    schedule_id: int


class Shift_schedule(Shift_scheduleBase):
    id: int
    shift: Optional[Shift | None] = None
    model_config = ConfigDict(from_attributes=True)
