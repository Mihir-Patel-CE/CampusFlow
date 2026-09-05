import pytest
import time
from fastapi.testclient import TestClient
from main import app
from app.models.domain import Department, User, StudentProfile, FacultyProfile
from app.core.database import SessionLocal

client = TestClient(app)

def test_student_registration_department_selection_and_persistence():
    # 1. Fetch available departments
    depts_res = client.get("/api/v1/auth/departments")
    assert depts_res.status_code == 200
    depts = depts_res.json()
    assert len(depts) >= 2

    # Choose the second department (e.g. ECE / IT)
    selected_dept = depts[1]
    selected_dept_id = selected_dept["id"]
    selected_dept_name = selected_dept["name"]

    timestamp = int(time.time() * 1000) % 1000000
    reg_payload = {
        "full_name": f"Pooja Patel {timestamp}",
        "email": f"pooja_{timestamp}@campusflow.edu",
        "password": "password123",
        "confirm_password": "password123",
        "roll_number": f"2026-ECE-{timestamp}",
        "department_id": selected_dept_id,
        "semester_number": 3,
        "division": "A",
        "cohort_year": 2024,
        "phone": "+91 98765 43210"
    }

    # 2. Register new student with selected department
    reg_res = client.post("/api/v1/auth/register/student", json=reg_payload)
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"

    # 3. Log in with new student credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": reg_payload["email"], "password": "password123", "account_type": "student"}
    )
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    login_data = login_res.json()
    token = login_data["access_token"]
    user = login_data["user"]

    # Verify user object returned on login has the exact saved department
    assert user["department_id"] == selected_dept_id
    assert user["department_name"] == selected_dept_name
    assert user["roll_number"] == reg_payload["roll_number"]

    # 4. Verify /auth/me returns the exact saved department
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["department_id"] == selected_dept_id
    assert me_data["department_name"] == selected_dept_name

    # 5. Verify /student/dashboard returns the exact saved department
    dash_res = client.get("/api/v1/student/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["student_info"]["department"] == selected_dept_name

    # 6. Verify database record directly
    db = SessionLocal()
    try:
        sp = db.query(StudentProfile).join(User).filter(User.email == reg_payload["email"]).first()
        assert sp is not None
        assert sp.department_id == selected_dept_id
        assert sp.department.name == selected_dept_name
    finally:
        db.close()


def test_faculty_creation_department_selection_and_persistence():
    # 1. Login as Admin
    admin_login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campusflow.edu", "password": "password123", "account_type": "admin"}
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Fetch departments
    depts_res = client.get("/api/v1/admin/departments", headers=admin_headers)
    assert depts_res.status_code == 200
    depts = depts_res.json()
    assert len(depts) >= 2

    # Choose a specific department (e.g. Data Science or Electronics)
    chosen_dept = depts[len(depts) - 1]
    chosen_dept_id = chosen_dept["id"]
    chosen_dept_name = chosen_dept["name"]

    timestamp = int(time.time() * 1000) % 1000000
    fac_payload = {
        "full_name": f"Dr. Rajesh Varma {timestamp}",
        "email": f"rajesh_{timestamp}@campusflow.edu",
        "password": "password123",
        "department_id": chosen_dept_id,
        "employee_id": f"FAC-DS-{timestamp}",
        "designation": "Associate Professor",
        "office_hours": "Tue, Thu 2:00 PM - 4:00 PM"
    }

    create_res = client.post("/api/v1/admin/faculty", headers=admin_headers, json=fac_payload)
    assert create_res.status_code == 200, f"Faculty creation failed: {create_res.text}"

    # 3. Log in as new Faculty
    fac_login = client.post(
        "/api/v1/auth/login",
        json={"email": fac_payload["email"], "password": "password123", "account_type": "faculty"}
    )
    assert fac_login.status_code == 200
    fac_data = fac_login.json()
    fac_token = fac_data["access_token"]
    fac_user = fac_data["user"]

    assert fac_user["department_id"] == chosen_dept_id
    assert fac_user["department_name"] == chosen_dept_name
    assert fac_user["employee_id"] == fac_payload["employee_id"]

    # 4. Verify /auth/me for faculty
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {fac_token}"})
    assert me_res.status_code == 200
    assert me_res.json()["department_id"] == chosen_dept_id
    assert me_res.json()["department_name"] == chosen_dept_name

    # 5. Verify direct database persistence
    db = SessionLocal()
    try:
        fp = db.query(FacultyProfile).join(User).filter(User.email == fac_payload["email"]).first()
        assert fp is not None
        assert fp.department_id == chosen_dept_id
        assert fp.department.name == chosen_dept_name
    finally:
        db.close()
