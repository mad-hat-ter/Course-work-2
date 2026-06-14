from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.api.deps import RoleChecker
from backend.app.db.session import get_db
from backend.app.models.user import Roles
from backend.app.schemas import department as schemas
from backend.app.services.department import DepartmentService
from backend.app.services.position import PositionService

router = APIRouter()
department_service = DepartmentService()

position_router = APIRouter()
position_service = PositionService()


@router.get("/",response_model=list[schemas.Department],dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_departments(title: str = None, skip: int = 0, limit: int = 20, db: AsyncSession = Depends(get_db)):
    return await department_service.get_departments(db, title, skip, limit)


@router.post("/", response_model=schemas.Department, dependencies=[Depends(RoleChecker([Roles.ADMINISTRATOR]))])
async def create_department(department_in: schemas.DepartmentCreate, db: AsyncSession = Depends(get_db)):
    return await department_service.create_department(db, department_in)


@position_router.get("/", response_model=list[schemas.Position], dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_positions(title: str = None, skip: int = 0, limit: int = 100,db: AsyncSession = Depends(get_db)):
    return await position_service.get_positions(db, title, skip, limit)


@position_router.post("/", response_model=schemas.Position, dependencies=[Depends(RoleChecker([Roles.ADMINISTRATOR]))])
async def create_position(position_in: schemas.PositionCreate, db: AsyncSession = Depends(get_db)):
    return await position_service.create_position(db, position_in)


@position_router.get("/{position_id}", response_model=schemas.Position, dependencies=[Depends(RoleChecker([Roles.CURATOR, Roles.MANAGER, Roles.ADMINISTRATOR]))])
async def get_position(position_id: int, db: AsyncSession = Depends(get_db)):
    return await position_service.get_position(db, position_id)
