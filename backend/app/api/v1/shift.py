from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import RoleChecker, get_current_user
from backend.app.db.session import get_db
from backend.app.models.user import Roles, User as UserModel
from backend.app.schemas import shift as schemas
from backend.app.services.shift import ShiftService, Shift_typeService

router = APIRouter()
shift_service = ShiftService()
shift_type_router = APIRouter()
shift_type_service = Shift_typeService()


@router.get("/{shift_id}", response_model=schemas.Shift, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_shift(shift_id: int, db: AsyncSession = Depends(get_db)):
    return await shift_service.get_shift(db, shift_id)


@router.get("/", response_model=list[schemas.Shift], dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_shifts_filter(type_id: int = None, is_free: bool = None, user_id: int = None, db: AsyncSession = Depends(get_db)):
    return await shift_service.get_shifts_filter(db, type_id, is_free, user_id)


@router.post("/", response_model=schemas.Shift, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def create_shift(shift_in: schemas.ShiftCreate, db: AsyncSession = Depends(get_db)):
    return await shift_service.create_shift(db, shift_in)


@router.patch("/{shift_id}", response_model=schemas.Shift, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def update_shift(shift_in: schemas.ShiftUpdate, shift_id: int, db: AsyncSession = Depends(get_db)):
    return await shift_service.update_shift(db, shift_id, shift_in)


@router.delete("/{shift_id}", response_model=bool)
async def delete_shift(shift_id: int, db: AsyncSession = Depends(get_db)):
    return await shift_service.delete_shift(db, shift_id)


@router.post("/all", response_model=list[schemas.Shift], dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def create_many_shifts(shift_in: list[schemas.ShiftCreate], db: AsyncSession = Depends(get_db)):
    return await shift_service.create_many_shifts(db, shift_in)


@router.delete("/assign-record/{shift_user_id}", response_model=bool, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def delete_user_record(shift_user_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await shift_service.delete_user_record(db, shift_user_id, current_user)


@router.post("/{shift_id}/assign/{user_id}", response_model=schemas.Shift, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def assign_user(shift_id: int, user_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await shift_service.assign_user(db, shift_id, user_id, current_user)


@router.delete("/{shift_id}/assign/{user_id}", response_model=bool, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def delete_user(shift_id: int, user_id: int, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await shift_service.delete_user(db, shift_id, user_id, current_user)


@shift_type_router.get("/", response_model=list[schemas.Shift_type], dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_shift_types(title: str = None, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await shift_type_service.get_shift_types(db, title, skip, limit)


@shift_type_router.post("/", response_model=schemas.Shift_type,dependencies=[Depends(RoleChecker([Roles.ADMINISTRATOR]))])
async def create_shift_type(shift_type_in: schemas.Shift_typeCreate, db: AsyncSession = Depends(get_db)):
    return await shift_type_service.create_shift_type(db, shift_type_in)
