import pytest

pytestmark = pytest.mark.integration


@pytest.mark.asyncio
async def test_departments_list_contains_seeded_department(client, admin_headers):
    response = await client.get("/department/", headers=admin_headers)
    assert response.status_code == 200
    titles = [item["title"] for item in response.json()]
    assert "Чат поддержки" in titles
