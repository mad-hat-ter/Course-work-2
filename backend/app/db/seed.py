import asyncio
from sqlalchemy import select
from backend.app.core import security
from backend.app.db.session import AsyncSessionLocal
from backend.app.models.shift import Shift_type
from backend.app.models.user import Department, Position, Roles, User

ADMIN_EMAIL = "test@mail.ru"
ADMIN_NAME = "Тест"
ADMIN_SURNAME = "Тест"
ADMIN_PASSWORD = "12345"
DEPARTMENT_TITLE = "Отдел кураторов по математике"
POSITIONS = (
    "Руководитель отдела кураторов по математике",
    "Менеджер чата по математике",
    "Куратора по математике",
)
ADMIN_POSITION_TITLE = "Руководитель отдела кураторов по математике"
SHIFT_TYPES = (
    {
        "title": "Дневная смена",
        "rate": 100.0,
        "quantity_for_increased_payment": 14,
        "increased_payment": 150.0,
    },
    {
        "title": "Смена во время вебинара",
        "rate": 120.0,
        "quantity_for_increased_payment": None,
        "increased_payment": None,
    },
    {
        "title": "Ночная смена",
        "rate": 150.0,
        "quantity_for_increased_payment": None,
        "increased_payment": None,
    },
)


async def _get_or_create_department(session) -> Department:
    department_result = await session.execute(select(Department).where(Department.title == DEPARTMENT_TITLE))
    department = department_result.scalar_one_or_none()
    if department is None:
        department = Department(title=DEPARTMENT_TITLE)
        session.add(department)
        await session.flush()
    return department


async def seed_positions() -> None:
    async with AsyncSessionLocal() as session:
        department = await _get_or_create_department(session)
        created = 0
        for title in POSITIONS:
            existing = await session.execute(select(Position).where(Position.title == title, Position.department_id == department.id))
            if existing.scalar_one_or_none():
                continue
            session.add(Position(title=title, department_id=department.id))
            created += 1
        if created:
            await session.commit()
            print(f"Создано должностей: {created}")
        else:
            print("Должности уже существуют, пропуск.")


async def seed_admin() -> None:
    async with AsyncSessionLocal() as session:
        existing_admin = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        if existing_admin.scalar_one_or_none():
            print(f"Администратор {ADMIN_EMAIL} уже существует, пропуск.")
            return
        department = await _get_or_create_department(session)
        position_result = await session.execute(
            select(Position).where(Position.title == ADMIN_POSITION_TITLE, Position.department_id == department.id))
        position = position_result.scalar_one_or_none()
        if position is None:
            position = Position(title=ADMIN_POSITION_TITLE, department_id=department.id)
            session.add(position)
            await session.flush()

        admin = User(
            name=ADMIN_NAME,
            surname=ADMIN_SURNAME,
            email=ADMIN_EMAIL,
            password=security.get_password_hash(ADMIN_PASSWORD),
            role=Roles.ADMINISTRATOR,
            position_id=position.id,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"Создан администратор: {ADMIN_EMAIL}")


async def seed_shift_types() -> None:
    async with AsyncSessionLocal() as session:
        created = 0
        for item in SHIFT_TYPES:
            existing = await session.execute(select(Shift_type).where(Shift_type.title == item["title"]))
            if existing.scalar_one_or_none():
                continue
            session.add(Shift_type(**item))
            created += 1
        if created:
            await session.commit()
            print(f"Создано типов смен: {created}")
        else:
            print("Типы смен уже существуют, пропуск.")


async def seed_database() -> None:
    await seed_shift_types()
    await seed_positions()
    await seed_admin()


def main() -> None:
    asyncio.run(seed_database())


if __name__ == "__main__":
    main()
