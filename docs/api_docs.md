# API Reference Guide: CampusFlow REST APIs

Base URL: `http://localhost:8000/api/v1`

FastAPI Interactive Swagger Docs: `http://localhost:8000/docs`

---

## Authentication Endpoints

### `POST /auth/login`
Authenticates user and returns JWT bearer token.
- **Request Body**:
  ```json
  {
    "email": "student@campusflow.edu",
    "password": "password123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "student@campusflow.edu",
      "full_name": "Alex Johnson",
      "role": "student"
    }
  }
  ```

---

## Student Portal Endpoints

### `GET /student/dashboard`
Returns complete student home portal payload including stats, risk assessment, daily actions, growth score, enrolled courses, upcoming exams, and announcements.
- **Headers**: `Authorization: Bearer <token>`

### `GET /student/daily-actions`
Returns prioritized list of daily action items ("What Should I Do Today?").

### `GET /student/risk-status`
Returns ML academic risk prediction with human-readable contributing factor callouts.

### `POST /student/study-plan/generate`
Generates custom study schedule based on exam dates and preparation levels.

---

## Faculty Portal Endpoints

### `GET /faculty/courses`
Returns courses assigned to faculty.

### `POST /faculty/attendance/batch`
Submits batch attendance records for a class date.

### `POST /faculty/marks`
Records student internal assessment mark.

### `GET /faculty/at-risk-students`
Returns list of enrolled students flagged with High or Medium Academic Risk.

---

## Admin Portal Endpoints

### `GET /admin/stats`
Returns institution-wide summary statistics and risk distribution metrics.

### `GET /admin/users`
Returns user directory with role filtering options.

### `POST /admin/users`
Creates new user profile.
![alt text](<Screenshot 2026-09-05 at 4.14.27 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.18.41 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.19.16 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.19.30 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.19.48 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.20.01 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.20.11 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.15.01 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.15.24 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.15.43 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.16.36 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.16.50 PM.png>) ![alt text](<Screenshot 2026-09-05 at 4.17.05 PM.png>)