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

def test_faculty_overview_analytics():
    headers = get_faculty_headers()
    res = client.get("/api/v1/faculty/overview", headers=headers)
    assert res.status_code == 200, f"Overview failed: {res.text}"
    data = res.json()

    assert "faculty_info" in data
    assert "summary" in data
    assert "analytics" in data
    assert "students_by_department" in data["analytics"]
    assert "students_by_semester" in data["analytics"]
    assert len(data["analytics"]["students_by_semester"]) == 8
    assert "attendance_overview" in data["analytics"]

def test_faculty_students_visibility():
    headers = get_faculty_headers()
    res = client.get("/api/v1/faculty/students", headers=headers)
    assert res.status_code == 200, f"Get students failed: {res.text}"
    students = res.json()
    assert isinstance(students, list)
    if students:
        first = students[0]
        assert "full_name" in first
        assert "roll_number" in first
        assert "department_name" in first
        assert "semester_number" in first
        assert "gpa" in first
        assert "attendance_pct" in first
        assert "risk_level" in first

def test_faculty_courses_and_actions():
    headers = get_faculty_headers()
    courses_res = client.get("/api/v1/faculty/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert isinstance(courses, list)

    at_risk_res = client.get("/api/v1/faculty/at-risk-students", headers=headers)
    assert at_risk_res.status_code == 200
    assert isinstance(at_risk_res.json(), list)
