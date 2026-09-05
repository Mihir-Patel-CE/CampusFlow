from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
BASE_URL = "/api/v1"

def test_full_e2e_workflow():
    print("=== STARTING CAMPUSFLOW END-TO-END WORKFLOW VERIFICATION ===")

    # 1. Test Login - Student (Alex)
    res = client.post(f"{BASE_URL}/auth/login", json={"email": "student@campusflow.edu", "password": "password123"})
    assert res.status_code == 200, f"Alex Login failed: {res.text}"
    alex_token = res.json()["access_token"]
    alex_headers = {"Authorization": f"Bearer {alex_token}"}
    print("✓ Alex Johnson (Student) Login Successful")

    # Fetch Alex Dashboard
    dash_res = client.get(f"{BASE_URL}/student/dashboard", headers=alex_headers)
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    dash_data = dash_res.json()
    assert dash_data["stats"]["risk_level"] in ["Low Risk", "Medium Risk"]
    print(f"✓ Alex Student Dashboard Loaded (GPA: {dash_data['stats']['gpa']}, Risk: {dash_data['stats']['risk_level']}, Growth Score: {dash_data['stats']['growth_score']})")

    # Generate Study Plan for Alex
    plan_res = client.post(f"{BASE_URL}/student/study-plan/generate", json={
        "exam_title": "End-Sem Operating Systems",
        "exam_date": "2026-09-25",
        "available_hours_per_day": 4.0,
        "subject_ids": [1, 2],
        "preparation_levels": {"1": "Low", "2": "Medium"}
    }, headers=alex_headers)
    assert plan_res.status_code == 200, f"Study plan failed: {plan_res.text}"
    print("✓ Alex AI Study Schedule Generated Successfully")

    # 2. Test Login - At-Risk Student (Michael)
    res_atrisk = client.post(f"{BASE_URL}/auth/login", json={"email": "student_atrisk@campusflow.edu", "password": "password123"})
    assert res_atrisk.status_code == 200, f"Michael Login failed: {res_atrisk.text}"
    michael_headers = {"Authorization": f"Bearer {res_atrisk.json()['access_token']}"}
    
    m_dash_res = client.get(f"{BASE_URL}/student/dashboard", headers=michael_headers)
    assert m_dash_res.status_code == 200, f"Michael Dashboard failed with status {m_dash_res.status_code}: {m_dash_res.text}"
    m_dash = m_dash_res.json()
    assert m_dash["stats"]["risk_level"] == "High Risk", f"Expected High Risk, got {m_dash['stats']['risk_level']}"
    assert len(m_dash["risk_assessment"]["key_factors"]) > 0
    print(f"✓ Michael Scott (At-Risk Student) Flagged as 'High Risk' with {len(m_dash['risk_assessment']['key_factors'])} factor callouts")

    # 3. Test Login - Faculty (Prof. Sarah)
    res_fac = client.post(f"{BASE_URL}/auth/login", json={"email": "faculty@campusflow.edu", "password": "password123"})
    assert res_fac.status_code == 200, f"Faculty Login failed: {res_fac.text}"
    fac_headers = {"Authorization": f"Bearer {res_fac.json()['access_token']}"}
    print("✓ Prof. Sarah Jenkins (Faculty) Login Successful")

    # Fetch Faculty Courses
    f_courses = client.get(f"{BASE_URL}/faculty/courses", headers=fac_headers).json()
    assert len(f_courses) > 0
    course_id = f_courses[0]["id"]
    print(f"✓ Faculty Assigned Courses Loaded ({len(f_courses)} courses, selected course ID {course_id})")

    # Fetch Flagged At-Risk Students for Faculty
    at_risk_list = client.get(f"{BASE_URL}/faculty/at-risk-students", headers=fac_headers).json()
    assert len(at_risk_list) > 0
    print(f"✓ Faculty At-Risk Alert Banner Loaded ({len(at_risk_list)} flagged student(s))")

    # Batch Attendance Entry
    att_res = client.post(f"{BASE_URL}/faculty/attendance/batch", json={
        "course_id": course_id,
        "date": "2026-08-25",
        "records": [{"student_id": 1, "status": "present"}, {"student_id": 2, "status": "absent"}]
    }, headers=fac_headers)
    assert att_res.status_code == 200
    print("✓ Faculty Batch Attendance Entry Recorded")

    # 4. Test Login - Admin (Dr. Vance)
    res_admin = client.post(f"{BASE_URL}/auth/login", json={"email": "admin@campusflow.edu", "password": "password123"})
    assert res_admin.status_code == 200, f"Admin Login failed: {res_admin.text}"
    admin_headers = {"Authorization": f"Bearer {res_admin.json()['access_token']}"}
    print("✓ Dr. Robert Vance (Admin) Login Successful")

    # Admin Stats & Analytics
    a_stats = client.get(f"{BASE_URL}/admin/stats", headers=admin_headers).json()
    assert a_stats["total_students"] > 0
    print(f"✓ Admin Institution Stats Loaded ({a_stats['total_students']} Students, {a_stats['total_faculty']} Faculty, {a_stats['total_departments']} Depts)")

    analytics = client.get(f"{BASE_URL}/analytics/institution-summary", headers=admin_headers).json()
    assert len(analytics["departments"]) > 0
    print(f"✓ Department Performance Analytics Loaded ({len(analytics['departments'])} departments)")

    print("\n=== ALL END-TO-END WORKFLOW VERIFICATIONS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    test_full_e2e_workflow()
