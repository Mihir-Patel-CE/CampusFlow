import pytest
from fastapi.testclient import TestClient
from main import app
import app.api.v1.endpoints.auth as auth_endpoint

client = TestClient(app)

# --- 1. SUCCESSFUL LOGINS (WITH DEV BYPASS & NORMAL) ---

def test_login_student_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "student"
    assert data["user"]["email"] == "student@campusflow.edu"

def test_login_faculty_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "faculty@campusflow.edu", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "faculty"
    assert data["user"]["email"] == "faculty@campusflow.edu"

def test_login_admin_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campusflow.edu", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "admin"
    assert data["user"]["email"] == "admin@campusflow.edu"
    assert "Mihir Patel" in data["user"]["full_name"]

# --- 2. WRONG CREDENTIALS MUST FAIL WITH 401 ---

def test_login_student_wrong_password_fails():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "wrong_password_123"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_faculty_wrong_password_fails():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "faculty@campusflow.edu", "password": "wrong_password_123"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_admin_wrong_password_fails():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campusflow.edu", "password": "wrong_password_123"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_empty_credentials_fails():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "", "password": ""}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

# --- 3. NON-EXISTENT USER MUST ALWAYS FAIL ---

def test_login_nonexistent_email_always_fails():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent_user@campusflow.edu", "password": "password123"}
    )
    assert response.status_code == 401
    assert "access_token" not in response.json()

def test_login_role_mismatch():
    # Student account attempting to log in as admin account type
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123", "account_type": "admin"}
    )
    assert response.status_code == 400
    assert "access_token" not in response.json()

# --- 5. ROLE-BASED ACCESS RESTRICTIONS ---

def test_student_cannot_access_faculty_endpoints():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Accessing faculty courses
    res = client.get("/api/v1/faculty/courses", headers=headers)
    assert res.status_code == 403

def test_student_cannot_access_admin_endpoints():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Accessing admin stats
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403

    # Accessing institution summary analytics
    res_analytics = client.get("/api/v1/analytics/institution-summary", headers=headers)
    assert res_analytics.status_code == 403

def test_faculty_cannot_access_admin_endpoints():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "faculty@campusflow.edu", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Accessing admin stats
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403

    # Accessing institution summary analytics
    res_analytics = client.get("/api/v1/analytics/institution-summary", headers=headers)
    assert res_analytics.status_code == 403

def test_admin_can_access_admin_endpoints():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campusflow.edu", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Accessing admin stats
    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 200

    # Accessing institution summary analytics
    res_analytics = client.get("/api/v1/analytics/institution-summary", headers=headers)
    assert res_analytics.status_code == 200

def test_cannot_create_additional_admin():
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@campusflow.edu", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempting to create another admin
    res = client.post(
        "/api/v1/admin/users",
        json={"email": "hacker_admin@campusflow.edu", "password": "password123", "full_name": "Fake Admin", "role": "admin"},
        headers=headers
    )
    assert res.status_code == 400
    assert "Only Mihir Patel is the administrator" in res.json()["detail"]
