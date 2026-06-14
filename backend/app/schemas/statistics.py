from pydantic import BaseModel


class ShiftStatisticsRow(BaseModel):
    shift_type: str
    count: int
    payment: float


class UserStatisticsResponse(BaseModel):
    rows: list[ShiftStatisticsRow]
    total_shifts: int
    total_payment: float


class CuratorStatisticsRow(BaseModel):
    user_id: int
    curator_name: str
    counts: list[int]
    payment: float


class AdminStatisticsResponse(BaseModel):
    shift_type_columns: list[str]
    rows: list[CuratorStatisticsRow]
    total: int
