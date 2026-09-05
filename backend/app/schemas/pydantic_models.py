from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime, date

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class TokenPayload(BaseModel):
    sub: Optional[int] = None
    role: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str

class UserCreate(UserBase):
    password: str
    department_id: Optional[int] = None
    roll_number: Optional[str] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None

class UserOut(UserBase):
    id: int
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime
    department_name: Optional[str] = None
    department_id: Optional[int] = None
    roll_number: Optional[str] = None
    employee_id: Optional[str] = None
    semester_number: Optional[int] = None

    class Config:
        from_attributes = True

class StudentCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    roll_number: str
    department_id: int
    semester_number: int = 1
    cohort_year: int = 2024
    gpa: float = 3.5
    target_gpa: float = 3.8
    phone: Optional[str] = None

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    roll_number: Optional[str] = None
    department_id: Optional[int] = None
    semester_number: Optional[int] = None
    cohort_year: Optional[int] = None
    gpa: Optional[float] = None
    target_gpa: Optional[float] = None
    phone: Optional[str] = None

# Login Schema
class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = ""
    account_type: Optional[str] = None

class PublicStudentRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    confirm_password: str
    roll_number: str
    department_id: int
    semester_number: int = 1
    division: Optional[str] = "A"
    cohort_year: int = 2024
    phone: Optional[str] = None

# Department Schemas
class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None

class DepartmentOut(DepartmentBase):
    id: int
    class Config:
        from_attributes = True

# Course Schemas
class CourseBase(BaseModel):
    code: str
    title: str
    department_id: int
    credits: int = 4
    semester_number: int = 1

class CourseUpdate(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    department_id: Optional[int] = None
    credits: Optional[int] = None
    semester_number: Optional[int] = None

class CourseOut(CourseBase):
    id: int
    department_name: Optional[str] = None
    class Config:
        from_attributes = True

# Student Schemas
class StudentProfileOut(BaseModel):
    id: int
    roll_number: str
    semester_number: int
    gpa: float
    target_gpa: float
    cohort_year: int
    department_name: Optional[str] = None
    user: UserOut

    class Config:
        from_attributes = True

# Faculty Schemas
class FacultyCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    department_id: int
    employee_id: str
    designation: str = "Assistant Professor"
    office_hours: Optional[str] = "Mon, Wed 10:00 AM - 12:00 PM"

class FacultyUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    department_id: Optional[int] = None
    employee_id: Optional[str] = None
    designation: Optional[str] = None
    office_hours: Optional[str] = None

class FacultyProfileOut(BaseModel):
    id: int
    employee_id: str
    designation: str
    office_hours: Optional[str] = None
    department_name: Optional[str] = None
    user: UserOut

    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceCreate(BaseModel):
    student_id: int
    course_id: int
    date: date
    status: str  # present, absent, excused

class BatchAttendanceCreate(BaseModel):
    course_id: int
    date: date
    records: List[dict]  # [{"student_id": 1, "status": "present"}, ...]

class AttendanceOut(BaseModel):
    id: int
    student_id: int
    course_id: int
    course_code: str
    course_title: str
    date: date
    status: str

    class Config:
        from_attributes = True

# Internal Mark Schemas
class InternalMarkCreate(BaseModel):
    student_id: int
    course_id: int
    title: str
    score: float
    max_score: float = 100.0
    weightage: float = 20.0

class InternalMarkOut(BaseModel):
    id: int
    course_id: int
    course_code: str
    course_title: str
    title: str
    score: float
    max_score: float
    weightage: float

    class Config:
        from_attributes = True

# Assignment Schemas
class AssignmentCreate(BaseModel):
    course_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_score: float = 100.0

class AssignmentOut(BaseModel):
    id: int
    course_id: int
    course_code: str
    course_title: str
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_score: float
    submissions_count: Optional[int] = 0

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assignment_id: int
    submission_text: str

class GradeSubmission(BaseModel):
    score: float
    feedback: Optional[str] = None

class SubmissionOut(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: str
    roll_number: str
    submission_text: Optional[str] = None
    submitted_at: datetime
    score: Optional[float] = None
    feedback: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# Smart Feature Schemas
class RiskPredictionOut(BaseModel):
    risk_level: str
    risk_score: float
    key_factors: List[str]
    evaluated_at: datetime

class DailyActionItem(BaseModel):
    id: str
    title: str
    category: str  # Assignment, Attendance, Exam Prep, Revision
    priority: str  # High, Medium, Low
    course_code: Optional[str] = None
    action_type: str
    due_info: Optional[str] = None

class StudyPlannerRequest(BaseModel):
    exam_title: str
    exam_date: date
    available_hours_per_day: float
    subject_ids: List[int]
    preparation_levels: dict  # {course_id: "Low" | "Medium" | "High"}

class StudyPlannerResponse(BaseModel):
    exam_title: str
    total_days: int
    total_study_hours: float
    schedule: List[dict]

class GrowthScoreOut(BaseModel):
    overall_score: int  # 0 to 100
    grade_tier: str     # Excellent, High Performer, Steady Progress, Needs Support
    breakdown: dict     # {"attendance": 85, "marks": 78, "assignments": 90, "consistency": 82}
    tips: List[str]

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    target_role: str = "all"  # all, student, faculty
    department_id: Optional[int] = None
    semester_number: Optional[int] = None

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    target_role: Optional[str] = None
    department_id: Optional[int] = None
    semester_number: Optional[int] = None

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    target_role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    semester_number: Optional[int] = None
    author_id: Optional[int] = None
    author_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TimetableCreate(BaseModel):
    course_id: int
    day_of_week: str
    start_time: str
    end_time: str
    room: str

class TimetableUpdate(BaseModel):
    course_id: Optional[int] = None
    day_of_week: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    room: Optional[str] = None
