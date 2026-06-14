from datetime import date, timedelta
import pytest
pytestmark = pytest.mark.integration
from tests.helpers import unique_email


@pytest.mark.asyncio
async def test_admin_can_list_users(client, admin_headers):
    response = await client.get("/user/", headers=admin_headers, params={"limit": 10})
    assert response.status_code == 200
    assert len(response.json()) >= 1


@pytest.mark.asyncio
async def test_admin_can_create_curator(client, admin_headers):
    departments = await client.get("/department/", headers=admin_headers)
    assert departments.status_code == 200
    department_id = departments.json()[0]["id"]
    positions = await client.get("/position/", headers=admin_headers)
    assert positions.status_code == 200
    position_id = positions.json()[0]["id"]
    unique_email_value = unique_email("curator")
    response = await client.post(
        "/user/",
        headers=admin_headers,
        json={
            "name": "Анна",
            "surname": "Кураторова",
            "lastname": None,
            "email": unique_email_value,
            "phone": None,
            "position_id": position_id,
            "role": "CURATOR",
            "is_active": True,
            "password": "12345",
        },
    )
    assert response.status_code == 200
    assert response.json()["email"] == unique_email_value


@pytest.mark.asyncio
async def test_admin_statistics_endpoint(client, admin_headers):
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    response = await client.get(
        "/user/statistics/admin",
        headers=admin_headers,
        params={"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
    )
    assert response.status_code == 200
    body = response.json()
    assert "rows" in body
    assert "shift_type_columns" in body


@pytest.mark.asyncio
async def test_statistics_rejects_invalid_period(client, admin_headers):
    response = await client.get(
        "/user/statistics/admin",
        headers=admin_headers,
        params={
            "start_date": "2026-06-10",
            "end_date": "2026-06-01",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_statistics_me_rejects_invalid_period(client, admin_headers):
    positions = await client.get("/position/", headers=admin_headers)
    curator_position = next(
        item
        for item in positions.json()
        if item["title"] == "Специалист чата поддержки"
    )
    curator_email = unique_email("stats-me")
    create_curator = await client.post(
        "/user/",
        headers=admin_headers,
        json={
            "name": "Стат",
            "surname": "Куратор",
            "email": curator_email,
            "password": "12345",
            "role": "CURATOR",
            "position_id": curator_position["id"],
            "is_active": True,
        },
    )
    assert create_curator.status_code == 200

    curator_login = await client.post(
        "/login",
        data={"username": curator_email, "password": "12345"},
    )
    curator_headers = {
        "Authorization": f"Bearer {curator_login.json()['access_token']}"
    }

    response = await client.get(
        "/user/statistics/me",
        headers=curator_headers,
        params={"start_date": "2026-06-10", "end_date": "2026-06-01"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_curator_statistics_me_after_shift_assign(client, admin_headers):
    from datetime import datetime

    positions = await client.get("/position/", headers=admin_headers)
    curator_position = next(
        item
        for item in positions.json()
        if item["title"] == "Специалист чата поддержки"
    )
    curator_email = unique_email("stats-shift")
    create_curator = await client.post(
        "/user/",
        headers=admin_headers,
        json={
            "name": "Анна",
            "surname": "Статистика",
            "email": curator_email,
            "password": "12345",
            "role": "CURATOR",
            "position_id": curator_position["id"],
            "is_active": True,
        },
    )
    curator_id = create_curator.json()["id"]

    shift_types = await client.get("/shift_type/", headers=admin_headers)
    day_type = next(
        item for item in shift_types.json() if "днев" in item["title"].lower()
    ) or shift_types.json()[0]

    now = datetime.now().replace(microsecond=0)
    schedule = await client.post(
        "/schedule/",
        headers=admin_headers,
        json={
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=6)).isoformat(),
            "opening_date": (now - timedelta(days=1)).isoformat(),
            "ending_date": (now + timedelta(days=5)).isoformat(),
        },
    )
    schedule_id = schedule.json()["id"]

    shift = await client.post(
        "/shift/",
        headers=admin_headers,
        json={
            "type_id": day_type["id"],
            "start_time": (now + timedelta(days=1, hours=12)).isoformat(),
            "end_time": (now + timedelta(days=1, hours=13)).isoformat(),
            "is_free": True,
            "max_user": 1,
        },
    )
    shift_id = shift.json()["id"]

    await client.post(
        f"/schedule/{schedule_id}/assign",
        headers=admin_headers,
        json=[shift_id],
    )
    await client.post(
        f"/shift/{shift_id}/assign/{curator_id}",
        headers=admin_headers,
    )

    curator_login = await client.post(
        "/login",
        data={"username": curator_email, "password": "12345"},
    )
    curator_headers = {
        "Authorization": f"Bearer {curator_login.json()['access_token']}"
    }

    start_date = date.today() - timedelta(days=1)
    end_date = date.today() + timedelta(days=30)
    response = await client.get(
        "/user/statistics/me",
        headers=curator_headers,
        params={
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total_shifts"] >= 1
    assert body["total_payment"] > 0

    await client.delete(f"/schedule/{schedule_id}", headers=admin_headers)


@pytest.mark.asyncio
async def test_admin_statistics_csv_export(client, admin_headers):
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    response = await client.get(
        "/user/statistics/admin/export",
        headers=admin_headers,
        params={"start_date": start_date.isoformat(), "end_date": end_date.isoformat()},
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "attachment" in response.headers["content-disposition"]
    body = response.text
    assert body.startswith("\ufeff")
    assert "Куратор" in body
    assert "Оплата" in body
