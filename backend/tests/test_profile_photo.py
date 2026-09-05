import io
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_profile_photo_upload_student():
    # Login as student
    login_res = client.post("/api/v1/auth/login", json={"email": "student@campusflow.edu", "password": "password123", "account_type": "student"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload valid PNG
    fake_png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("student_avatar.png", io.BytesIO(fake_png_content), "image/png")}
    
    upload_res = client.post("/api/v1/auth/profile-photo", headers=headers, files=files)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert "avatar_url" in data
    assert data["avatar_url"].startswith("/uploads/avatars/user_")
    assert data["avatar_url"].endswith(".png")

    # Verify /auth/me returns updated avatar_url
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["avatar_url"] == data["avatar_url"]

def test_profile_photo_upload_faculty():
    # Login as faculty
    login_res = client.post("/api/v1/auth/login", json={"email": "faculty@campusflow.edu", "password": "password123", "account_type": "faculty"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload valid JPEG
    fake_jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
    files = {"file": ("prof.jpeg", io.BytesIO(fake_jpg_content), "image/jpeg")}
    
    upload_res = client.post("/api/v1/auth/profile-photo", headers=headers, files=files)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["avatar_url"].endswith(".jpeg")

def test_profile_photo_upload_admin():
    # Login as admin
    login_res = client.post("/api/v1/auth/login", json={"email": "admin@campusflow.edu", "password": "password123", "account_type": "admin"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload valid JPG
    fake_jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
    files = {"file": ("admin_pic.jpg", io.BytesIO(fake_jpg_content), "image/jpeg")}
    
    upload_res = client.post("/api/v1/auth/profile-photo", headers=headers, files=files)
    assert upload_res.status_code == 200
    data = upload_res.json()
    assert data["avatar_url"].endswith(".jpg")

def test_profile_photo_rejects_invalid_file_type():
    login_res = client.post("/api/v1/auth/login", json={"email": "student@campusflow.edu", "password": "password123", "account_type": "student"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try uploading a .pdf
    files = {"file": ("document.pdf", io.BytesIO(b"%PDF-1.4..."), "application/pdf")}
    upload_res = client.post("/api/v1/auth/profile-photo", headers=headers, files=files)
    assert upload_res.status_code == 400
    assert "JPG, JPEG, and PNG" in upload_res.json()["detail"]

def test_profile_photo_static_serving_and_relogin_persistence():
    # 1. Login
    login_res = client.post("/api/v1/auth/login", json={"email": "student@campusflow.edu", "password": "password123", "account_type": "student"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload PNG
    fake_png_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc`\x00\x00\x00\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"file": ("student_avatar.png", io.BytesIO(fake_png_content), "image/png")}
    upload_res = client.post("/api/v1/auth/profile-photo", headers=headers, files=files)
    assert upload_res.status_code == 200
    avatar_url = upload_res.json()["avatar_url"]

    # 3. Test static file serving directly via GET /uploads/avatars/...
    static_res = client.get(avatar_url)
    assert static_res.status_code == 200
    assert len(static_res.content) > 0

    # 4. Re-login (simulate logout/re-login)
    relogin_res = client.post("/api/v1/auth/login", json={"email": "student@campusflow.edu", "password": "password123", "account_type": "student"})
    assert relogin_res.status_code == 200
    user_data = relogin_res.json()["user"]
    assert user_data["avatar_url"] == avatar_url

def test_newly_registered_user_profile_photo():
    import time
    unique_email = f"newstudent_{int(time.time())}@campusflow.edu"
    unique_roll = f"CS{int(time.time()) % 100000}"

    # Get a department id
    dept_res = client.get("/api/v1/auth/departments")
    dept_id = dept_res.json()[0]["id"]

    # Register new student
    reg_res = client.post("/api/v1/auth/register/student", json={
        "full_name": "New Student Test",
        "email": unique_email,
        "password": "password123",
        "confirm_password": "password123",
        "roll_number": unique_roll,
        "department_id": dept_id,
        "semester_number": 1,
        "cohort_year": 2024
    })
    assert reg_res.status_code == 200

    # Login new student
    login_res = client.post("/api/v1/auth/login", json={"email": unique_email, "password": "password123", "account_type": "student"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload avatar photo for new student
    fake_jpg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00"
    files = {"file": ("new_avatar.jpg", io.BytesIO(fake_jpg), "image/jpeg")}
    upload_res = client.post("/api/v1/auth/profile-photo", headers=headers, files=files)
    assert upload_res.status_code == 200
    avatar_url = upload_res.json()["avatar_url"]
    assert avatar_url.endswith(".jpg")

    # Verify /auth/me returns updated avatar
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["avatar_url"] == avatar_url

    # Remove avatar
    del_res = client.delete("/api/v1/auth/avatar", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["avatar_url"] is None

    # Verify /auth/me now has None avatar_url
    me_after = client.get("/api/v1/auth/me", headers=headers)
    assert me_after.status_code == 200
    assert me_after.json()["avatar_url"] is None
