from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def _get_student_headers():
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "student@campusflow.edu", "password": "password123"}
    )
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_student_dashboard():
    headers = _get_student_headers()
    response = client.get("/api/v1/student/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "student_info" in data
    assert "daily_actions" in data
    assert "risk_assessment" in data
    assert "growth_score_detail" in data

def test_student_daily_actions():
    headers = _get_student_headers()
    response = client.get("/api/v1/student/daily-actions", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_student_study_planner():
    headers = _get_student_headers()
    payload = {
        "exam_title": "End-Sem Comprehensive Exam",
        "exam_date": "2026-09-15",
        "available_hours_per_day": 4.0,
        "subject_ids": [1, 2],
        "preparation_levels": {"1": "Low", "2": "Medium"}
    }
    response = client.post("/api/v1/student/study-plan/generate", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "subject_breakdown" in data
    assert "daily_roadmap" in data
