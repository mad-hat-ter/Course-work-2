from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, date, time
from collections import defaultdict
from backend.app.models.user import User as UserModel
from backend.app.schemas.user import UserCreate, User, UserUpdate, Roles
from backend.app.schemas.shift import Shift
from backend.app.schemas.statistics import ShiftStatisticsRow, UserStatisticsResponse, CuratorStatisticsRow, AdminStatisticsResponse
from backend.app.crud.user import UserRepository
from backend.app.crud.shift import Shift_typeRepository
from backend.app.models.shift import Shift as ShiftModel, Shift_type as ShiftTypeModel
from backend.app.services.department import resolve_statistics_department_filter, resolve_user_list_department_filter



def _calculate_payment(count: int, shift_type: ShiftTypeModel) -> float:
    rate = shift_type.rate or 0
    threshold = shift_type.quantity_for_increased_payment
    increased = shift_type.increased_payment
    if threshold and increased is not None and count > threshold:
        regular = min(count, threshold)
        extra = count - threshold
        return regular * rate + extra * increased
    return count * rate


class UserService:
    def __init__(self):
        pass

    async def get_user(self, db: AsyncSession, user_id: int) -> UserModel:
        repo = UserRepository(db)
        user = await repo.get(user_id)
        return User.model_validate(user)

    async def get_shift_me(self, db: AsyncSession, user_id: int) -> List[ShiftModel]:
        repo = UserRepository(db)
        shifts = await repo.get_shift_me(user_id)
        return [Shift.model_validate(shift) for shift in shifts]

    async def get_statistics_me(self, db: AsyncSession, user_id: int, start_date: date, end_date: date,) -> UserStatisticsResponse:
        repo = UserRepository(db)
        period_start = datetime.combine(start_date, time.min)
        period_end = datetime.combine(end_date, time.max)
        shifts = await repo.get_shifts_me_in_period(user_id, period_start, period_end)
        grouped: dict[int, dict] = defaultdict(lambda: {"title": "", "count": 0, "shift_type": None})
        for shift in shifts:
            if not shift.shift_type:
                continue
            entry = grouped[shift.type_id]
            entry["title"] = shift.shift_type.title
            entry["count"] += 1
            entry["shift_type"] = shift.shift_type
        rows: list[ShiftStatisticsRow] = []
        for entry in grouped.values():
            shift_type: ShiftTypeModel = entry["shift_type"]
            count = entry["count"]
            payment = _calculate_payment(count, shift_type)
            rows.append(ShiftStatisticsRow(shift_type=entry["title"], count=count, payment=round(payment, 2)))
        rows.sort(key=lambda row: row.shift_type)
        total_shifts = sum(row.count for row in rows)
        total_payment = round(sum(row.payment for row in rows), 2)
        return UserStatisticsResponse(rows=rows, total_shifts=total_shifts,total_payment=total_payment)

    async def _get_shift_types(self, db: AsyncSession) -> list[ShiftTypeModel]:
        repo = Shift_typeRepository(db)
        return await repo.get_all(title=None, skip=0, limit=1000)

    def _format_curator_name(self, user: UserModel) -> str:
        return f"{user.surname} {user.name} {user.lastname or ''}".strip()

    def _build_curator_statistics_row_from_shifts(self, user: UserModel, shift_types: list[ShiftTypeModel], shifts: list[ShiftModel]) -> CuratorStatisticsRow:
        counts_by_type: dict[int, int] = defaultdict(int)
        payment_by_type: dict[int, float] = defaultdict(float)
        for shift in shifts:
            if not shift.shift_type:
                continue
            type_id = shift.type_id
            counts_by_type[type_id] += 1
            payment_by_type[type_id] = _calculate_payment(counts_by_type[type_id], shift.shift_type)
        counts = [counts_by_type.get(shift_type.id, 0) for shift_type in shift_types]
        payment = round(sum(payment_by_type.values()), 2)
        return CuratorStatisticsRow(user_id=user.id, curator_name=self._format_curator_name(user), counts=counts, payment=payment)

    async def _build_admin_statistics_rows(self, db: AsyncSession, users: list[UserModel], shift_types: list[ShiftTypeModel], period_start: datetime, period_end: datetime) -> list[CuratorStatisticsRow]:
        if not users:
            return []
        user_repo = UserRepository(db)
        user_ids = [user.id for user in users]
        assignments = await user_repo.get_shift_assignments_for_users_in_period(user_ids, period_start, period_end)
        shifts_by_user: dict[int, list[ShiftModel]] = defaultdict(list)
        for user_id, shift in assignments:
            shifts_by_user[user_id].append(shift)
        return [self._build_curator_statistics_row_from_shifts(user, shift_types, shifts_by_user.get(user.id, [])) for user in users]

    async def get_statistics_admin(
        self,
        db: AsyncSession,
        start_date: date,
        end_date: date,
        current_user: UserModel,
        q: str | None = None,
        is_active: bool | None = None,
        department_id: int | None = None,
        role: Roles | None = None,
        skip: int = 0,
        limit: int = 5,
    ) -> AdminStatisticsResponse:
        user_repo = UserRepository(db)
        shift_types = await self._get_shift_types(db)
        columns = [shift_type.title for shift_type in shift_types]
        period_start = datetime.combine(start_date, time.min)
        period_end = datetime.combine(end_date, time.max)
        department_id = resolve_statistics_department_filter(current_user, department_id)
        users = await user_repo.get_filter(
            q=q or None,
            is_active=is_active,
            department_id=department_id,
            role=role,
            skip=skip,
            limit=limit,
        )
        total = await user_repo.count_filter(q=q or None, is_active=is_active, department_id=department_id, role=role)
        rows = await self._build_admin_statistics_rows(db, users, shift_types, period_start, period_end)
        return AdminStatisticsResponse(shift_type_columns=columns, rows=rows, total=total)

    async def get_statistics_admin_export(
        self,
        db: AsyncSession,
        start_date: date,
        end_date: date,
        current_user: UserModel,
        q: str | None = None,
        is_active: bool | None = None,
        department_id: int | None = None,
        role: Roles | None = None,
    ) -> AdminStatisticsResponse:
        user_repo = UserRepository(db)
        shift_types = await self._get_shift_types(db)
        columns = [shift_type.title for shift_type in shift_types]
        period_start = datetime.combine(start_date, time.min)
        period_end = datetime.combine(end_date, time.max)
        department_id = resolve_statistics_department_filter(current_user, department_id)
        users = await user_repo.get_filter(
            q=q or None,
            is_active=is_active,
            department_id=department_id,
            role=role,
            skip=0,
            limit=10000,
        )
        rows = await self._build_admin_statistics_rows(db, users, shift_types, period_start, period_end)
        return AdminStatisticsResponse(shift_type_columns=columns, rows=rows, total=len(rows))

    async def get_users_filter(
        self,
        db: AsyncSession,
        current_user: UserModel,
        q: str = None,
        is_active: bool = None,
        department_id: int = None,
        role: Roles = None,
        skip: int = 0,
        limit: int = 20,
    ) -> List[UserModel]:
        repo = UserRepository(db)
        department_id = resolve_user_list_department_filter(current_user, department_id)
        users = await repo.get_filter(q, is_active, department_id, role, skip, limit)
        return [User.model_validate(user) for user in users]

    async def update_user(self, db: AsyncSession, user_id: int, user_in: UserUpdate) -> UserModel:
        repo = UserRepository(db)
        user = await repo.update(user_id, user_in)
        return User.model_validate(user)

    async def create_user(self, db: AsyncSession, user_in: UserCreate) -> UserModel:
        repo = UserRepository(db)
        user = await repo.create(user_in)
        return User.model_validate(user)
