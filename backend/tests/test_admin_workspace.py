import pytest
import time
from fastapi.testclient import TestClient
from main import app
from app.models.domain import User, StudentProfile, FacultyProfile, Department, Course, Announcement
from app.core.database import SessionLocal

client = TestClient(app)

def get_admin_headers():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campusflow.edu", "password": "password123", "account_type": "admin"}
    )
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_admin_user_directory_crud():
    headers = get_admin_headers()
    timestamp = int(time.time() * 1000) % 1000000

    # 1. Create Student
    student_payload = {
        "full_name": f"Test Student {timestamp}",
        "email": f"tstudent_{timestamp}@campusflow.edu",
        "password": "password123",
        "roll_number": f"2026-TST-{timestamp}",
        "department_id": 1,
        "semester_number": 2,
        "cohort_year": 2024,
        "gpa": 3.65,
        "target_gpa": 3.90,
        "phone": "+91 99887 76655"
    }
    create_st_res = client.post("/api/v1/admin/students", headers=headers, json=student_payload)
    assert create_st_res.status_code == 200, f"Create student failed: {create_st_res.text}"
    st_id = create_st_res.json()["student_id"]
    st_user_id = create_st_res.json()["user_id"]

    # 2. Edit Student
    edit_st_res = client.put(f"/api/v1/admin/students/{st_id}", headers=headers, json={
        "full_name": f"Test Student Updated {timestamp}",
        "gpa": 3.85
    })
    assert edit_st_res.status_code == 200

    # 3. Create Faculty
    faculty_payload = {
        "full_name": f"Dr. Faculty {timestamp}",
        "email": f"tfaculty_{timestamp}@campusflow.edu",
        "password": "password123",
        "department_id": 1,
        "employee_id": f"FAC-TST-{timestamp}",
        "designation": "Associate Professor",
        "office_hours": "Mon, Wed 2:00 PM - 4:00 PM"
    }
    create_fac_res = client.post("/api/v1/admin/faculty", headers=headers, json=faculty_payload)
    assert create_fac_res.status_code == 200, f"Create faculty failed: {create_fac_res.text}"
    fac_id = create_fac_res.json()["faculty_id"]

    # 4. Edit Faculty
    edit_fac_res = client.put(f"/api/v1/admin/faculty/{fac_id}", headers=headers, json={
        "designation": "Professor",
        "office_hours": "Fri 10:00 AM - 12:00 PM"
    })
    assert edit_fac_res.status_code == 200

    # 5. Toggle Status
    toggle_res = client.patch(f"/api/v1/admin/users/{st_user_id}/toggle-status", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    toggle_back = client.patch(f"/api/v1/admin/users/{st_user_id}/toggle-status", headers=headers)
    assert toggle_back.status_code == 200
    assert toggle_back.json()["is_active"] is True

    # 6. Delete Student & Faculty
    del_st_res = client.delete(f"/api/v1/admin/users/{st_user_id}", headers=headers)
    assert del_st_res.status_code == 200

    del_fac_res = client.delete(f"/api/v1/admin/faculty/{fac_id}", headers=headers)
    assert del_fac_res.status_code == 200

def test_admin_departments_and_courses_crud():
    headers = get_admin_headers()
    timestamp = int(time.time() * 1000) % 1000000

    # 1. Create Department
    dept_code = f"T{timestamp % 1000:03d}"
    dept_res = client.post("/api/v1/admin/departments", headers=headers, json={
        "code": dept_code,
        "name": f"Test Dept {timestamp}",
        "description": "Experimental Research Department"
    })
    assert dept_res.status_code == 200, f"Create department failed: {dept_res.text}"
    dept_id = dept_res.json()["id"]

    # 2. Edit Department
    edit_dept_res = client.put(f"/api/v1/admin/departments/{dept_id}", headers=headers, json={
        "name": f"Test Dept Renamed {timestamp}",
        "description": "Updated description"
    })
    assert edit_dept_res.status_code == 200

    # 3. Create Course
    course_code = f"TC{timestamp % 1000:03d}"
    course_res = client.post("/api/v1/admin/courses", headers=headers, json={
        "code": course_code,
        "title": f"Intro to Advanced Systems {timestamp}",
        "department_id": dept_id,
        "semester_number": 3,
        "credits": 4
    })
    assert course_res.status_code == 200, f"Create course failed: {course_res.text}"
    course_id = course_res.json()["id"]

    # 4. Edit Course
    edit_course_res = client.put(f"/api/v1/admin/courses/{course_id}", headers=headers, json={
        "title": f"Intro to Advanced Systems V2 {timestamp}",
        "credits": 5
    })
    assert edit_course_res.status_code == 200

    # 5. Delete Course
    del_course_res = client.delete(f"/api/v1/admin/courses/{course_id}", headers=headers)
    assert del_course_res.status_code == 200

    # 6. Delete Department
    del_dept_res = client.delete(f"/api/v1/admin/departments/{dept_id}", headers=headers)
    assert del_dept_res.status_code == 200

def test_admin_analytics_summary():
    headers = get_admin_headers()
    analytics_res = client.get("/api/v1/analytics/institution-summary", headers=headers)
    assert analytics_res.status_code == 200
    data = analytics_res.json()

    assert "summary" in data
    assert data["summary"]["total_students"] >= 0
    assert data["summary"]["total_faculty"] >= 0
    assert data["summary"]["total_departments"] >= 1
    assert data["summary"]["total_courses"] >= 1
    assert "semester_distribution" in data
    assert len(data["semester_distribution"]) == 8
    assert "departments" in data

def test_admin_announcements_crud_and_targeting():
    headers = get_admin_headers()
    timestamp = int(time.time() * 1000) % 1000000

    # 1. Create targeted announcement for CSE Semester 5
    ann_payload = {
        "title": f"CSE Sem 5 Project Evaluation {timestamp}",
        "content": "Please submit your capstone project milestone 1 by Friday 5 PM.",
        "target_role": "student",
        "department_id": 1,
        "semester_number": 5
    }
    create_res = client.post("/api/v1/admin/announcements", headers=headers, json=ann_payload)
    assert create_res.status_code == 200, f"Create announcement failed: {create_res.text}"
    ann_id = create_res.json()["id"]

    # 2. List announcements as admin
    list_res = client.get("/api/v1/admin/announcements", headers=headers)
    assert list_res.status_code == 200
    ann_list = list_res.json()
    assert any(a["id"] == ann_id for a in ann_list)

    # 3. Edit announcement
    edit_res = client.put(f"/api/v1/admin/announcements/{ann_id}", headers=headers, json={
        "title": f"CSE Sem 5 Project Evaluation Updated {timestamp}"
    })
    assert edit_res.status_code == 200

    # 4. Student login & dashboard announcement verification
    stu_login = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123", "account_type": "student"}
    )
    assert stu_login.status_code == 200
    stu_token = stu_login.json()["access_token"]
    stu_headers = {"Authorization": f"Bearer {stu_token}"}

    stu_dash = client.get("/api/v1/student/dashboard", headers=stu_headers)
    assert stu_dash.status_code == 200
    stu_ann = stu_dash.json()["announcements"]
    assert any(a["id"] == ann_id for a in stu_ann)

    # 5. Delete announcement
    del_res = client.delete(f"/api/v1/admin/announcements/{ann_id}", headers=headers)
    assert del_res.status_code == 200
