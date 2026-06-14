from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from backend.app.schemas.user import User
from backend.app.schemas.shift import Shift_schedule


class ScheduleUserBrief(BaseModel):
    id: int
    name: str
    surname: str
    model_config = ConfigDict(from_attributes=True)


class ShiftUserBrief(BaseModel):
    id: int
    shift_id: int
    user_id: int
    user: Optional[ScheduleUserBrief | None] = None
    model_config = ConfigDict(from_attributes=True)


class ShiftBrief(BaseModel):
    id: int
    type_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    is_free: bool
    max_user: int
    shift_user: List[ShiftUserBrief] = []
    model_config = ConfigDict(from_attributes=True)


class ShiftScheduleBrief(BaseModel):
    id: int
    schedule_id: int
    shift_id: Optional[int | None] = None
    shift: Optional[ShiftBrief | None] = None
    model_config = ConfigDict(from_attributes=True)


class ScheduleBase(BaseModel):
    creator_id: Optional[int | None] = None
    start_date: datetime
    end_date: datetime
    opening_date: datetime
    ending_date: datetime

class ScheduleCreate(ScheduleBase):
    opening_date: datetime = datetime.now()
    ending_date: datetime = datetime.now()
    pass

class ScheduleUpdate(BaseModel):
    creator_id: Optional[int | None] = None
    start_date: datetime
    end_date: datetime
    opening_date: datetime
    ending_date: datetime

class ScheduleListItem(BaseModel):
    id: int
    start_date: datetime
    end_date: datetime
    opening_date: datetime
    ending_date: datetime
    create_date: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class Schedule(ScheduleBase):
    id: int
    create_date: Optional[datetime] = None
    user: Optional[User | None] = None
    shift_schedule: List[Shift_schedule] = []
    model_config = ConfigDict(from_attributes=True)


class ScheduleDisplay(ScheduleBase):
    id: int
    create_date: Optional[datetime] = None
    shift_schedule: List[ShiftScheduleBrief] = []
    model_config = ConfigDict(from_attributes=True)