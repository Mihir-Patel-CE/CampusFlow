import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token
from app.core.database import SessionLocal
from app.models.domain import User, StudentProfile, FacultyProfile, Department, Course, Enrollment

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def db_session():
    db = SessionLocal()
    yield db
    db.close()

def get_auth_header(role: str, user_id: int):
    token = create_access_token(subject=user_id, role=role)
    return {"Authorization": f"Bearer {token}"}

def test_admin_add_faculty(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin@campusflow.edu").first()
    dept = db_session.query(Department).first()
    assert admin is not None
    assert dept is not None

    headers = get_auth_header("admin", admin.id)
    faculty_payload = {
        "full_name": "Dr. Bhavik Shah",
        "email": "bhavik.shah@campusflow.edu",
        "password": "password123",
        "department_id": dept.id,
        "employee_id": "FAC-TEST-999",
        "designation": "Associate Professor",
        "office_hours": "Tue, Thu 2:00 PM - 4:00 PM"
    }

    # Delete existing if any
    existing_user = db_session.query(User).filter(User.email == "bhavik.shah@campusflow.edu").first()
    if existing_user:
        db_session.delete(existing_user)
        db_session.commit()

    res = client.post("/api/v1/admin/faculty", json=faculty_payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "faculty_id" in data

    # Verify created faculty in DB
    created_user = db_session.query(User).filter(User.email == "bhavik.shah@campusflow.edu").first()
    assert created_user is not None
    assert created_user.role == "faculty"
    assert created_user.faculty_profile.employee_id == "FAC-TEST-999"

    # Verify newly created faculty can log in
    login_res = client.post("/api/v1/auth/login", json={
        "email": "bhavik.shah@campusflow.edu",
        "password": "password123",
        "account_type": "faculty"
    })
    assert login_res.status_code == 200
    assert login_res.json()["user"]["role"] == "faculty"

def test_admin_semester_filter_students(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin@campusflow.edu").first()
    headers = get_auth_header("admin", admin.id)

    # Filter Semester 5
    res = client.get("/api/v1/admin/students?semester=5", headers=headers)
    assert res.status_code == 200
    students_sem5 = res.json()
    assert len(students_sem5) > 0
    for s in students_sem5:
        assert s["semester_number"] == 5

    # Filter non-existent semester (e.g. 8)
    res8 = client.get("/api/v1/admin/students?semester=8", headers=headers)
    assert res8.status_code == 200
    assert isinstance(res8.json(), list)

def test_admin_subject_crud_and_semester_management(client, db_session):
    admin = db_session.query(User).filter(User.email == "admin@campusflow.edu").first()
    dept = db_session.query(Department).first()
    headers = get_auth_header("admin", admin.id)

    # 1. Add Subject for Semester 2
    subject_code = "CS109TEST"
    existing_c = db_session.query(Course).filter(Course.code == subject_code).first()
    if existing_c:
        db_session.delete(existing_c)
        db_session.commit()

    create_res = client.post("/api/v1/admin/courses", json={
        "code": subject_code,
        "title": "Advanced Algorithmic Design Lab",
        "department_id": dept.id,
        "semester_number": 2,
        "credits": 4
    }, headers=headers)
    assert create_res.status_code == 200, create_res.text
    created_id = create_res.json()["id"]

    # 2. Query filtered by Department and Semester
    get_res = client.get(f"/api/v1/admin/courses?department_id={dept.id}&semester=2", headers=headers)
    assert get_res.status_code == 200
    codes = [c["code"] for c in get_res.json()]
    assert subject_code in codes

    # 3. Edit Subject
    update_res = client.put(f"/api/v1/admin/courses/{created_id}", json={
        "title": "Advanced Algorithmic Design & Optimization",
        "credits": 5,
        "semester_number": 3
    }, headers=headers)
    assert update_res.status_code == 200

    # 4. Verify updated course
    c_updated = db_session.query(Course).filter(Course.id == created_id).first()
    assert c_updated.title == "Advanced Algorithmic Design & Optimization"
    assert c_updated.credits == 5
    assert c_updated.semester_number == 3

    # 5. Delete Subject
    del_res = client.delete(f"/api/v1/admin/courses/{created_id}", headers=headers)
    assert del_res.status_code == 200
    assert db_session.query(Course).filter(Course.id == created_id).first() is None

def test_student_department_semester_subjects(client, db_session):
    student_user = db_session.query(User).filter(User.email == "student@campusflow.edu").first()
    assert student_user is not None
    sp = student_user.student_profile
    assert sp is not None

    headers = get_auth_header("student", student_user.id)
    dash_res = client.get("/api/v1/student/dashboard", headers=headers)
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert data["student_info"]["semester"] == sp.semester_number
    assert data["student_info"]["department"] == sp.department.name

    # Check that courses returned belong to student's semester
    for c in data["courses"]:
        db_course = db_session.query(Course).filter(Course.id == c["id"]).first()
        assert db_course.department_id == sp.department_id
        assert db_course.semester_number == sp.semester_number

def test_faculty_features_still_operational(client, db_session):
    faculty_user = db_session.query(User).filter(User.email == "faculty@campusflow.edu").first()
    assert faculty_user is not None
    headers = get_auth_header("faculty", faculty_user.id)

    courses_res = client.get("/api/v1/faculty/courses", headers=headers)
    assert courses_res.status_code == 200
    courses = courses_res.json()
    assert len(courses) > 0
    assert "code" in courses[0]
    assert "enrolled_students" in courses[0]
