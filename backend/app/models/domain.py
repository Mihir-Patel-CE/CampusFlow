from datetime import datetime, date
from typing import Optional, List, Any
from sqlalchemy import Integer, String, Float, Boolean, DateTime, Date, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)  # student, faculty, admin
    avatar_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    student_profile: Mapped[Optional["StudentProfile"]] = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile: Mapped[Optional["FacultyProfile"]] = relationship("FacultyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    @property
    def department_name(self) -> Optional[str]:
        if self.role == "student" and self.student_profile and self.student_profile.department:
            return self.student_profile.department.name
        elif self.role == "faculty" and self.faculty_profile and self.faculty_profile.department:
            return self.faculty_profile.department.name
        return None

    @property
    def department_id(self) -> Optional[int]:
        if self.role == "student" and self.student_profile:
            return self.student_profile.department_id
        elif self.role == "faculty" and self.faculty_profile:
            return self.faculty_profile.department_id
        return None

    @property
    def roll_number(self) -> Optional[str]:
        if self.role == "student" and self.student_profile:
            return self.student_profile.roll_number
        return None

    @property
    def employee_id(self) -> Optional[str]:
        if self.role == "faculty" and self.faculty_profile:
            return self.faculty_profile.employee_id
        return None

    @property
    def semester_number(self) -> Optional[int]:
        if self.role == "student" and self.student_profile:
            return self.student_profile.semester_number
        return None


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    faculty_members: Mapped[List["FacultyProfile"]] = relationship("FacultyProfile", back_populates="department")
    students: Mapped[List["StudentProfile"]] = relationship("StudentProfile", back_populates="department")
    courses: Mapped[List["Course"]] = relationship("Course", back_populates="department")


class FacultyProfile(Base):
    __tablename__ = "faculty_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    employee_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    designation: Mapped[str] = mapped_column(String, nullable=False)  # Professor, Associate Prof, Asst Prof
    office_hours: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="faculty_profile")
    department: Mapped["Department"] = relationship("Department", back_populates="faculty_members")
    courses_taught: Mapped[List["CourseFaculty"]] = relationship("CourseFaculty", back_populates="faculty")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    roll_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    semester_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    gpa: Mapped[float] = mapped_column(Float, default=3.5)
    target_gpa: Mapped[float] = mapped_column(Float, default=3.8)
    cohort_year: Mapped[int] = mapped_column(Integer, nullable=False, default=2024)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="student_profile")
    department: Mapped["Department"] = relationship("Department", back_populates="students")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="student")
    attendance_records: Mapped[List["Attendance"]] = relationship("Attendance", back_populates="student")
    marks: Mapped[List["InternalMark"]] = relationship("InternalMark", back_populates="student")
    submissions: Mapped[List["AssignmentSubmission"]] = relationship("AssignmentSubmission", back_populates="student")
    goals: Mapped[List["Goal"]] = relationship("Goal", back_populates="student")
    study_plans: Mapped[List["StudyPlan"]] = relationship("StudyPlan", back_populates="student")
    risk_predictions: Mapped[List["RiskPrediction"]] = relationship("RiskPrediction", back_populates="student")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    department_id: Mapped[int] = mapped_column(Integer, ForeignKey("departments.id"), nullable=False)
    credits: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    semester_number: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    department: Mapped["Department"] = relationship("Department", back_populates="courses")
    assigned_faculty: Mapped[List["CourseFaculty"]] = relationship("CourseFaculty", back_populates="course")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="course")
    assignments: Mapped[List["Assignment"]] = relationship("Assignment", back_populates="course")
    exams: Mapped[List["Exam"]] = relationship("Exam", back_populates="course")
    timetables: Mapped[List["Timetable"]] = relationship("Timetable", back_populates="course")


class CourseFaculty(Base):
    __tablename__ = "course_faculty"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    faculty_id: Mapped[int] = mapped_column(Integer, ForeignKey("faculty_profiles.id"), nullable=False)
    academic_year: Mapped[str] = mapped_column(String, nullable=False, default="2025-2026")

    course: Mapped["Course"] = relationship("Course", back_populates="assigned_faculty")
    faculty: Mapped["FacultyProfile"] = relationship("FacultyProfile", back_populates="courses_taught")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    grade: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # A, B+, B, C, etc.

    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="enrollments")
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)  # present, absent, excused
    marked_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("faculty_profiles.id"), nullable=True)

    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="attendance_records")
    course: Mapped["Course"] = relationship("Course")


class InternalMark(Base):
    __tablename__ = "internal_marks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)  # Mid-Term 1, Quiz 2, Lab Practical
    score: Mapped[float] = mapped_column(Float, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, nullable=False, default=100.0)
    weightage: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)

    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="marks")
    course: Mapped["Course"] = relationship("Course")


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    due_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=100.0)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("faculty_profiles.id"), nullable=False)

    course: Mapped["Course"] = relationship("Course", back_populates="assignments")
    submissions: Mapped[List["AssignmentSubmission"]] = relationship("AssignmentSubmission", back_populates="assignment")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    assignment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    submission_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    feedback: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="submitted")  # submitted, graded, pending

    assignment: Mapped["Assignment"] = relationship("Assignment", back_populates="submissions")
    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="submissions")


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)  # End-Sem Exam, Quiz 1
    exam_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=180)
    max_score: Mapped[float] = mapped_column(Float, default=100.0)
    room: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    course: Mapped["Course"] = relationship("Course", back_populates="exams")


class Timetable(Base):
    __tablename__ = "timetables"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    day_of_week: Mapped[str] = mapped_column(String, nullable=False)  # Monday, Tuesday, etc.
    start_time: Mapped[str] = mapped_column(String, nullable=False)  # "09:00"
    end_time: Mapped[str] = mapped_column(String, nullable=False)    # "10:30"
    room: Mapped[str] = mapped_column(String, nullable=False)
    faculty_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("faculty_profiles.id"), nullable=True)

    course: Mapped["Course"] = relationship("Course", back_populates="timetables")


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    target_role: Mapped[str] = mapped_column(String, default="all")  # all, student, faculty
    department_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("departments.id"), nullable=True)
    semester_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    author_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    author: Mapped["User"] = relationship("User")
    department: Mapped[Optional["Department"]] = relationship("Department")


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="goals")


class StudyPlan(Base):
    __tablename__ = "study_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    exam_title: Mapped[str] = mapped_column(String, nullable=False)
    plan_data_json: Mapped[Any] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="study_plans")


class RiskPrediction(Base):
    __tablename__ = "risk_predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    risk_level: Mapped[str] = mapped_column(String, nullable=False)  # Low Risk, Medium Risk, High Risk
    risk_score: Mapped[float] = mapped_column(Float, nullable=False)
    key_factors_json: Mapped[Any] = mapped_column(JSON, nullable=False)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    student: Mapped["StudentProfile"] = relationship("StudentProfile", back_populates="risk_predictions")
