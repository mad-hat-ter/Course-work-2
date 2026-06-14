import pytest

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_login_with_seeded_admin(client, admin_headers):
    assert "Authorization" in admin_headers


@pytest.mark.asyncio
async def test_login_with_wrong_password(client):
    response = await client.post("/login", data={"username": "test@mail.ru", "password": "wrong-password"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_authentication(client):
    response = await client.get("/user/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_admin_profile(client, admin_headers):
    response = await client.get("/user/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@mail.ru"
    assert data["role"] == "ADMINISTRATOR"
