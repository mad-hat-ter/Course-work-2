import pytest
pytestmark = pytest.mark.integration
from tests.helpers import unique_title


@pytest.mark.asyncio
async def test_shift_types_list(client, admin_headers):
    response = await client.get("/shift_type/", headers=admin_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_admin_can_create_shift_type(client, admin_headers):
    title = unique_title("Тестовая смена")
    response = await client.post(
        "/shift_type/",
        headers=admin_headers,
        json={"title": title, "rate": 77},
    )
    assert response.status_code == 200
    assert response.json()["title"] == title
