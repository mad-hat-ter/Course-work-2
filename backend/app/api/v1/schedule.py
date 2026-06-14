from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.schemas import schedule as schemas
from backend.app.services.schedule import ScheduleService
from typing import List
from backend.app.api.deps import RoleChecker, get_current_user
from backend.app.models.user import Roles, User as UserModel

router = APIRouter()
crud = ScheduleService()


@router.get("/{schedule_id}", response_model=schemas.ScheduleDisplay, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_schedule(schedule_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.get_schedule(db, schedule_id, current_user)

@router.get("/", response_model=list[schemas.ScheduleListItem], dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_schedules(db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.get_schedules(db, current_user)

@router.post("/", response_model=schemas.ScheduleDisplay, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def create_schedule(schedule_in: schemas.ScheduleCreate, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.create_schedule(db, schedule_in, current_user)

@router.patch("/{schedule_id}", response_model=schemas.ScheduleDisplay, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def update_schedules(schedule_in: schemas.ScheduleUpdate, schedule_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.update_schedules(db, schedule_id, schedule_in, current_user)

@router.delete("/{schedule_id}", response_model=bool, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def delete_schedule(schedule_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.delete_schedule(db, schedule_id, current_user)


@router.post("/{schedule_id}/assign", response_model=List[schemas.Shift_schedule], dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def assign_user(schedule_id: int, shifts_id: List[int] = Body(...), db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.assign_shifts(db, schedule_id, shifts_id, current_user)

@router.delete("/{schedule_id}/assign/{shift_id}", response_model=bool, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def delete_user(schedule_id: int, shift_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.delete_shift(db, schedule_id, shift_id, current_user)
