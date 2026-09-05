import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def get_faculty_headers():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "faculty@campusflow.edu", "password": "password123", "account_type": "faculty"}
    )
    assert res.status_code == 200, f"Faculty login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def get_student_headers():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123", "account_type": "student"}
    )
    assert res.status_code == 200, f"Student login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_faculty_timetable_lifecycle_and_student_sync():
    f_headers = get_faculty_headers()
    s_headers = get_student_headers()

    # 1. Get faculty courses to find a valid course_id
    courses_res = client.get("/api/v1/faculty/courses", headers=f_headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) > 0
    course_id = courses[0]["id"]
    course_code = courses[0]["code"]

    # 2. Create timetable slot by Faculty
    create_res = client.post("/api/v1/faculty/timetable", headers=f_headers, json={
        "course_id": course_id,
        "day_of_week": "Friday",
        "start_time": "11:00 AM",
        "end_time": "12:30 PM",
        "room": "Room-999"
    })
    assert create_res.status_code == 200, f"Create timetable failed: {create_res.text}"
    tt_id = create_res.json()["id"]

    # 3. Faculty retrieves timetable and verifies entry is present
    f_tt_res = client.get("/api/v1/faculty/timetable", headers=f_headers)
    assert f_tt_res.status_code == 200
    f_entries = [e for e in f_tt_res.json() if e["id"] == tt_id]
    assert len(f_entries) == 1
    assert f_entries[0]["room"] == "Room-999"
    assert f_entries[0]["day_of_week"] == "Friday"

    # 4. Student retrieves timetable and verifies entry is visible
    s_tt_res = client.get("/api/v1/student/timetable", headers=s_headers)
    assert s_tt_res.status_code == 200
    s_entries = [e for e in s_tt_res.json() if e["id"] == tt_id]
    assert len(s_entries) == 1
    assert s_entries[0]["room"] == "Room-999"
    assert s_entries[0]["course_code"] == course_code

    # 5. Faculty updates the timetable slot
    update_res = client.put(f"/api/v1/faculty/timetable/{tt_id}", headers=f_headers, json={
        "room": "Lab-888",
        "start_time": "02:00 PM",
        "end_time": "03:30 PM"
    })
    assert update_res.status_code == 200

    # 6. Student verifies updated slot
    s_tt_updated = client.get("/api/v1/student/timetable", headers=s_headers)
    assert s_tt_updated.status_code == 200
    s_updated_entries = [e for e in s_tt_updated.json() if e["id"] == tt_id]
    assert len(s_updated_entries) == 1
    assert s_updated_entries[0]["room"] == "Lab-888"
    assert s_updated_entries[0]["start_time"] == "02:00 PM"

    # 7. Faculty deletes the timetable slot
    del_res = client.delete(f"/api/v1/faculty/timetable/{tt_id}", headers=f_headers)
    assert del_res.status_code == 200

    # 8. Student verifies deleted slot is gone
    s_tt_after_del = client.get("/api/v1/student/timetable", headers=s_headers)
    assert s_tt_after_del.status_code == 200
    s_del_entries = [e for e in s_tt_after_del.json() if e["id"] == tt_id]
    assert len(s_del_entries) == 0
