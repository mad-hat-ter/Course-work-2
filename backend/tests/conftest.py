import os
from collections.abc import AsyncIterator
import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from backend.app.db.session import engine

ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "test@mail.ru")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "12345")


async def _database_ready() -> bool:
    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


@pytest.fixture
async def db_available() -> bool:
    return await _database_ready()


@pytest.fixture
async def client(db_available: bool) -> AsyncIterator[AsyncClient]:
    if not db_available:
        pytest.skip("База данных недоступна для интеграционных тестов")
    from backend.app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as api_client:
        yield api_client


@pytest.fixture
async def admin_headers(client: AsyncClient) -> dict[str, str]:
    from backend.app.db.seed import seed_database
    await seed_database()
    response = await client.post("/login", data={"username": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert response.status_code == 200, response.text
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
