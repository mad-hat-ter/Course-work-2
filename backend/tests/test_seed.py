import pytest
pytestmark = pytest.mark.integration
from backend.app.db.seed import ADMIN_EMAIL


@pytest.mark.asyncio
async def test_seed_creates_admin(client, admin_headers):
    me_response = await client.get("/user/me", headers=admin_headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == ADMIN_EMAIL
    assert me_response.json()["role"] == "ADMINISTRATOR"
