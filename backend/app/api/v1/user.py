import csv
import io
from datetime import date
from fastapi import APIRouter, Depends
from backend.app.exceptions import errors
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.schemas import user as schemas
from backend.app.schemas.statistics import UserStatisticsResponse, AdminStatisticsResponse
from backend.app.services.user import UserService
from backend.app.api.deps import RoleChecker 
from backend.app.models.user import Roles
from backend.app.api.deps import get_current_user
from backend.app.models.user import User as UserModel
from backend.app.schemas.shift import Shift

router = APIRouter()
crud = UserService()


@router.get("/me", response_model=schemas.User, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def read_user_me(current_user = Depends(get_current_user)):
    return current_user

@router.get("/shiftme", response_model=list[Shift], dependencies=[Depends(RoleChecker([Roles.CURATOR]))])
async def get_shift_me(db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    return await crud.get_shift_me(db, current_user.id)

@router.get("/statistics/me", response_model=UserStatisticsResponse, dependencies=[Depends(RoleChecker([Roles.CURATOR]))])
async def get_statistics_me(start_date: date, end_date: date, db: AsyncSession = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    if end_date < start_date:
        errors.period_end_before_start()
    return await crud.get_statistics_me(db, current_user.id, start_date, end_date)

@router.get("/statistics/admin/export", dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def export_statistics_admin(
    start_date: date,
    end_date: date,
    q: str = None,
    is_active: bool = None,
    department_id: int = None,
    role: schemas.Roles = None,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if end_date < start_date:
        errors.period_end_before_start()
    data = await crud.get_statistics_admin_export(db, start_date, end_date, current_user, q, is_active, department_id, role,)
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    writer.writerow(['Куратор', *data.shift_type_columns, 'Оплата'])
    for row in data.rows:
        writer.writerow([row.curator_name, *row.counts, f"{row.payment:.2f}".replace('.', ',')])
    output.seek(0)
    return StreamingResponse(
        iter(['\ufeff' + output.getvalue()]),
        media_type='text/csv; charset=utf-8',
        headers={
            'Content-Disposition': 'attachment; filename="statistics.csv"',
        },
    )


@router.get("/statistics/admin", response_model=AdminStatisticsResponse, dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_statistics_admin(
    start_date: date,
    end_date: date,
    q: str = None,
    is_active: bool = None,
    department_id: int = None,
    role: schemas.Roles = None,
    skip: int = 0,
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    if end_date < start_date:
        errors.period_end_before_start()
    return await crud.get_statistics_admin(db, start_date, end_date, current_user, q, is_active, department_id, role, skip, limit)


@router.get("/{user_id}", response_model=schemas.User, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_user(user_id: int,  db: AsyncSession = Depends(get_db)):
    return await crud.get_user(db, user_id)


@router.get("/", response_model=list[schemas.User], dependencies=[Depends(RoleChecker([Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_users_filter(
    q: str = None,
    is_active: bool = None,
    department_id: int = None,
    role: schemas.Roles = None,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return await crud.get_users_filter(db, current_user, q, is_active, department_id, role, skip, limit)

@router.post("/", response_model=schemas.User, dependencies=[Depends(RoleChecker([Roles.ADMINISTRATOR]))])
async def create_user(user_in: schemas.UserCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_user(db, user_in)

@router.patch("/{user_id}", response_model=schemas.User, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def update_user(user_in: schemas.UserUpdate, user_id: int,db: AsyncSession = Depends(get_db)):
    return await crud.update_user(db, user_id, user_in)

@router.patch("/", response_model=schemas.User, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def update_user_me(user_in: schemas.UserUpdate,  db: AsyncSession = Depends(get_db),current_user: UserModel = Depends(get_current_user)):
    return await crud.update_user(db, current_user.id, user_in)
