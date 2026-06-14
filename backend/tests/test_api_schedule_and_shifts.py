from datetime import datetime, timedelta
import pytest
pytestmark = pytest.mark.integration
from backend.app.db.seed import ADMIN_SURNAME
from tests.helpers import unique_email


def _day_shift_type(shift_types: list[dict]) -> dict:
    return next((item for item in shift_types if "днев" in item["title"].lower()), shift_types[0])


@pytest.mark.asyncio
async def test_schedule_create_assign_and_delete_flow(client, admin_headers):
    shift_type_response = await client.get("/shift_type/", headers=admin_headers)
    shift_types = shift_type_response.json()
    day_type = _day_shift_type(shift_types)

    now = datetime.now().replace(microsecond=0)
    schedule_payload = {
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=6)).isoformat(),
        "opening_date": (now - timedelta(days=1)).isoformat(),
        "ending_date": (now + timedelta(days=5)).isoformat(),
    }

    create_schedule = await client.post("/schedule/", headers=admin_headers, json=schedule_payload)
    assert create_schedule.status_code == 200
    schedule_id = create_schedule.json()["id"]

    shift_payload = {
        "type_id": day_type["id"],
        "start_time": (now + timedelta(days=1, hours=8)).isoformat(),
        "end_time": (now + timedelta(days=1, hours=17)).isoformat(),
        "is_free": True,
        "max_user": 1,
    }
    create_shift = await client.post("/shift/", headers=admin_headers, json=shift_payload)
    assert create_shift.status_code == 200
    shift_id = create_shift.json()["id"]

    assign_shift = await client.post(
        f"/schedule/{schedule_id}/assign",
        headers=admin_headers,
        json=[shift_id],
    )
    assert assign_shift.status_code == 200

    get_schedule = await client.get(f"/schedule/{schedule_id}", headers=admin_headers)
    assert get_schedule.status_code == 200
    assert len(get_schedule.json()["shift_schedule"]) == 1

    admin_user = await client.get("/user/me", headers=admin_headers)
    admin_id = admin_user.json()["id"]
    assign_user = await client.post(
        f"/shift/{shift_id}/assign/{admin_id}",
        headers=admin_headers,
    )
    assert assign_user.status_code == 200

    get_schedule_after_assign = await client.get(
        f"/schedule/{schedule_id}",
        headers=admin_headers,
    )
    assert get_schedule_after_assign.status_code == 200
    schedule_body = get_schedule_after_assign.json()
    assert "user" not in schedule_body
    shift_payload = schedule_body["shift_schedule"][0]["shift"]
    assert "shift_type" not in shift_payload
    assert shift_payload["shift_user"][0]["user"]["surname"] == ADMIN_SURNAME

    duplicate_assign = await client.post(
        f"/shift/{shift_id}/assign/{admin_id}",
        headers=admin_headers,
    )
    assert duplicate_assign.status_code == 409

    delete_schedule = await client.delete(
        f"/schedule/{schedule_id}",
        headers=admin_headers,
    )
    assert delete_schedule.status_code == 200

    get_shift = await client.get(f"/shift/{shift_id}", headers=admin_headers)
    assert get_shift.status_code == 404


@pytest.mark.asyncio
async def test_assign_user_rejects_when_shift_is_full(client, admin_headers):
    shift_type_response = await client.get("/shift_type/", headers=admin_headers)
    day_type = _day_shift_type(shift_type_response.json())

    positions_response = await client.get("/position/", headers=admin_headers)
    curator_position = next(
        item
        for item in positions_response.json()
        if item["title"] == "Специалист чата поддержки"
    )

    create_curator = await client.post(
        "/user/",
        headers=admin_headers,
        json={
            "name": "Куратор",
            "surname": "Первый",
            "email": unique_email("curator1"),
            "password": "12345",
            "role": "CURATOR",
            "position_id": curator_position["id"],
            "is_active": True,
        },
    )
    assert create_curator.status_code == 200
    curator_one_id = create_curator.json()["id"]

    create_curator_two = await client.post(
        "/user/",
        headers=admin_headers,
        json={
            "name": "Куратор",
            "surname": "Второй",
            "email": unique_email("curator2"),
            "password": "12345",
            "role": "CURATOR",
            "position_id": curator_position["id"],
            "is_active": True,
        },
    )
    assert create_curator_two.status_code == 200
    curator_two_id = create_curator_two.json()["id"]

    now = datetime.now().replace(microsecond=0)
    schedule_payload = {
        "start_date": now.isoformat(),
        "end_date": (now + timedelta(days=6)).isoformat(),
        "opening_date": (now - timedelta(days=1)).isoformat(),
        "ending_date": (now + timedelta(days=5)).isoformat(),
    }
    create_schedule = await client.post(
        "/schedule/",
        headers=admin_headers,
        json=schedule_payload,
    )
    assert create_schedule.status_code == 200
    schedule_id = create_schedule.json()["id"]

    shift_payload = {
        "type_id": day_type["id"],
        "start_time": (now + timedelta(days=1, hours=9)).isoformat(),
        "end_time": (now + timedelta(days=1, hours=10)).isoformat(),
        "is_free": True,
        "max_user": 1,
    }
    create_shift = await client.post("/shift/", headers=admin_headers, json=shift_payload)
    assert create_shift.status_code == 200
    shift_id = create_shift.json()["id"]

    assign_shift = await client.post(
        f"/schedule/{schedule_id}/assign",
        headers=admin_headers,
        json=[shift_id],
    )
    assert assign_shift.status_code == 200

    first_assign = await client.post(
        f"/shift/{shift_id}/assign/{curator_one_id}",
        headers=admin_headers,
    )
    assert first_assign.status_code == 200

    second_assign = await client.post(
        f"/shift/{shift_id}/assign/{curator_two_id}",
        headers=admin_headers,
    )
    assert second_assign.status_code == 409
    assert second_assign.json()["detail"] == "На смене нет свободных мест"

    await client.delete(f"/schedule/{schedule_id}", headers=admin_headers)



@pytest.mark.asyncio
async def test_manager_can_view_schedule_created_by_admin(client, admin_headers):
    positions_response = await client.get("/position/", headers=admin_headers)
    manager_position = next(
        item
        for item in positions_response.json()
        if item["title"] == "Менеджер чата поддержки"
    )

    manager_email = unique_email("manager-schedule-view")
    create_manager = await client.post(
        "/user/",
        headers=admin_headers,
        json={
            "name": "Менеджер",
            "surname": "Тест",
            "email": manager_email,
            "password": "12345",
            "role": "MANAGER",
            "position_id": manager_position["id"],
            "is_active": True,
        },
    )
    assert create_manager.status_code == 200

    manager_login = await client.post(
        "/login",
        data={"username": manager_email, "password": "12345"},
    )
    assert manager_login.status_code == 200
    manager_headers = {
        "Authorization": f"Bearer {manager_login.json()['access_token']}"
    }

    shift_type_response = await client.get("/shift_type/", headers=admin_headers)
    day_type = _day_shift_type(shift_type_response.json())

    now = datetime.now().replace(microsecond=0)
    create_schedule = await client.post(
        "/schedule/",
        headers=admin_headers,
        json={
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=6)).isoformat(),
            "opening_date": (now - timedelta(days=1)).isoformat(),
            "ending_date": (now + timedelta(days=5)).isoformat(),
        },
    )
    assert create_schedule.status_code == 200
    schedule_id = create_schedule.json()["id"]

    create_shift = await client.post(
        "/shift/",
        headers=admin_headers,
        json={
            "type_id": day_type["id"],
            "start_time": (now + timedelta(days=1, hours=10)).isoformat(),
            "end_time": (now + timedelta(days=1, hours=11)).isoformat(),
            "is_free": True,
            "max_user": 2,
        },
    )
    assert create_shift.status_code == 200

    assign_shift = await client.post(
        f"/schedule/{schedule_id}/assign",
        headers=admin_headers,
        json=[create_shift.json()["id"]],
    )
    assert assign_shift.status_code == 200

    manager_view = await client.get(
        f"/schedule/{schedule_id}",
        headers=manager_headers,
    )
    assert manager_view.status_code == 200
    assert len(manager_view.json()["shift_schedule"]) == 1

    await client.delete(f"/schedule/{schedule_id}", headers=admin_headers)
