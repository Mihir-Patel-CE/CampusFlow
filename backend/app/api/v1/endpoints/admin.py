from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.core.database import get_db
from app.core.security import require_role, get_password_hash
from app.models.domain import (
    User, StudentProfile, FacultyProfile, Department, Course, Enrollment,
    Attendance, InternalMark, AssignmentSubmission, Goal, StudyPlan, Announcement, RiskPrediction
)
from app.schemas.pydantic_models import (
    DepartmentBase, DepartmentUpdate, CourseBase, CourseUpdate, UserCreate, StudentCreate, StudentUpdate,
    FacultyCreate, FacultyUpdate, AnnouncementCreate, AnnouncementUpdate
)
from app.services.risk_ml import risk_service

router = APIRouter()

@router.get("/stats")
def get_admin_stats(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_students = db.query(StudentProfile).count()
    total_faculty = db.query(FacultyProfile).count()
    total_departments = db.query(Department).count()
    total_courses = db.query(Course).count()

    # Risk Distribution count
    high_risk_count = db.query(RiskPrediction).filter(RiskPrediction.risk_level == "High Risk").count()
    medium_risk_count = db.query(RiskPrediction).filter(RiskPrediction.risk_level == "Medium Risk").count()
    low_risk_count = db.query(RiskPrediction).filter(RiskPrediction.risk_level == "Low Risk").count()

    # Attendance overall
    total_att = db.query(Attendance).count()
    present_att = db.query(Attendance).filter(Attendance.status == "present").count()
    overall_att_pct = round(present_att / total_att * 100.0, 1) if total_att > 0 else 88.0

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_departments": total_departments,
        "total_courses": total_courses,
        "overall_attendance_pct": overall_att_pct,
        "risk_distribution": {
            "high_risk": high_risk_count,
            "medium_risk": medium_risk_count,
            "low_risk": low_risk_count
        }
    }

@router.get("/users")
def get_all_users(
    role: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    
    users = query.all()
    res = []
    for u in users:
        dept_name = None
        dept_id = None
        roll_or_emp = None
        semester = None
        if u.role == "student" and u.student_profile:
            dept_name = u.student_profile.department.name if u.student_profile.department else None
            dept_id = u.student_profile.department_id
            roll_or_emp = u.student_profile.roll_number
            semester = u.student_profile.semester_number
        elif u.role == "faculty" and u.faculty_profile:
            dept_name = u.faculty_profile.department.name if u.faculty_profile.department else None
            dept_id = u.faculty_profile.department_id
            roll_or_emp = u.faculty_profile.employee_id

        res.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "avatar_url": u.avatar_url,
            "is_active": u.is_active,
            "department": dept_name,
            "department_id": dept_id,
            "semester": semester,
            "identifier": roll_or_emp,
            "created_at": u.created_at.strftime("%Y-%m-%d")
        })

    return res

# --- ADMIN STUDENT MANAGEMENT MODULE ---

@router.get("/students")
def get_admin_students(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    risk_level: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(StudentProfile).join(User)

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(search_fmt)) |
            (User.email.ilike(search_fmt)) |
            (StudentProfile.roll_number.ilike(search_fmt))
        )

    if department_id:
        query = query.filter(StudentProfile.department_id == department_id)

    if semester:
        query = query.filter(StudentProfile.semester_number == semester)

    students = query.all()
    res = []
    for sp in students:
        u = sp.user
        risk = db.query(RiskPrediction).filter(RiskPrediction.student_id == sp.id).order_by(RiskPrediction.evaluated_at.desc()).first()

        if risk_level and risk and risk.risk_level != risk_level:
            continue

        res.append({
            "id": sp.id,
            "user_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "roll_number": sp.roll_number,
            "department_id": sp.department_id,
            "department_name": sp.department.name if sp.department else "N/A",
            "semester_number": sp.semester_number,
            "gpa": sp.gpa,
            "target_gpa": sp.target_gpa,
            "cohort_year": sp.cohort_year,
            "phone": sp.phone,
            "is_active": u.is_active,
            "risk_level": risk.risk_level if risk else "Low Risk",
            "avatar_url": u.avatar_url,
            "created_at": u.created_at.strftime("%Y-%m-%d")
        })

    return res

@router.get("/students/{id}")
def get_admin_student_detail(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    sp = db.query(StudentProfile).filter(StudentProfile.id == id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    u = sp.user
    risk = db.query(RiskPrediction).filter(RiskPrediction.student_id == sp.id).order_by(RiskPrediction.evaluated_at.desc()).first()
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == sp.id).all()

    return {
        "id": sp.id,
        "user_id": u.id,
        "full_name": u.full_name,
        "email": u.email,
        "roll_number": sp.roll_number,
        "department_id": sp.department_id,
        "department_name": sp.department.name if sp.department else "N/A",
        "semester_number": sp.semester_number,
        "gpa": sp.gpa,
        "target_gpa": sp.target_gpa,
        "cohort_year": sp.cohort_year,
        "phone": sp.phone,
        "is_active": u.is_active,
        "risk_level": risk.risk_level if risk else "Low Risk",
        "risk_score": risk.risk_score if risk else 0.15,
        "key_factors": risk.key_factors_json if risk else [],
        "avatar_url": u.avatar_url,
        "enrolled_courses": [{
            "course_id": en.course_id,
            "code": en.course.code,
            "title": en.course.title,
            "grade": en.grade or "N/A"
        } for en in enrollments]
    }

@router.post("/students")
def create_student_by_admin(
    payload: StudentCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()
    clean_roll = payload.roll_number.strip()

    # Check duplicate email
    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    # Check duplicate roll number / Student ID
    if db.query(StudentProfile).filter(StudentProfile.roll_number == clean_roll).first():
        raise HTTPException(status_code=400, detail="A student with this Student ID already exists.")

    # Validate department existence
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Invalid department selected. Department does not exist.")

    try:
        hashed_pwd = get_password_hash(payload.password)
        user = User(
            email=clean_email,
            password_hash=hashed_pwd,
            full_name=payload.full_name.strip(),
            role="student",
            is_active=True,
            avatar_url="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        sp = StudentProfile(
            user_id=user.id,
            department_id=payload.department_id,
            roll_number=payload.roll_number,
            semester_number=payload.semester_number,
            cohort_year=payload.cohort_year,
            gpa=payload.gpa,
            target_gpa=payload.target_gpa,
            phone=payload.phone
        )
        db.add(sp)
        db.commit()
        db.refresh(sp)

        # Enroll in courses for the student's department + semester
        dept_courses = db.query(Course).filter(
            Course.department_id == payload.department_id,
            Course.semester_number == payload.semester_number
        ).all()
        if not dept_courses:
            dept_courses = db.query(Course).filter(Course.department_id == payload.department_id).all()

        for crs in dept_courses:
            db.add(Enrollment(student_id=sp.id, course_id=crs.id, semester=payload.semester_number, grade="A-"))

        # Initial Risk Prediction
        pred = risk_service.predict_risk(88.0, 85.0, 95.0, payload.gpa, 0, 14.0, 4.0)
        db.add(RiskPrediction(
            student_id=sp.id,
            risk_level=pred["risk_level"],
            risk_score=pred["risk_score"],
            key_factors_json=pred["key_factors"]
        ))

        db.commit()
        return {
            "message": "Student created successfully.",
            "student_id": sp.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "roll_number": sp.roll_number,
            "semester_number": sp.semester_number
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error during student creation: {str(e)}")

@router.put("/students/{id}")
def update_student_by_admin(
    id: int,
    payload: StudentUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    sp = db.query(StudentProfile).filter(StudentProfile.id == id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    u: User = sp.user
    if not u:
        raise HTTPException(status_code=404, detail="Associated user not found.")

    if payload.email and payload.email != u.email:
        if db.query(User).filter(User.email == payload.email, User.id != u.id).first():
            raise HTTPException(status_code=400, detail="Email already taken by another user.")
        u.email = payload.email

    if payload.roll_number and payload.roll_number != sp.roll_number:
        if db.query(StudentProfile).filter(StudentProfile.roll_number == payload.roll_number, StudentProfile.id != sp.id).first():
            raise HTTPException(status_code=400, detail="Student ID / Roll Number already taken.")
        sp.roll_number = payload.roll_number

    sem_changed = False
    dept_changed = False

    if payload.full_name is not None:
        u.full_name = payload.full_name
    if payload.department_id is not None and payload.department_id != sp.department_id:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Invalid department selected. Department does not exist.")
        sp.department_id = payload.department_id
        dept_changed = True
    if payload.semester_number is not None and payload.semester_number != sp.semester_number:
        sp.semester_number = payload.semester_number
        sem_changed = True
    if payload.cohort_year is not None:
        sp.cohort_year = payload.cohort_year
    if payload.gpa is not None:
        sp.gpa = payload.gpa
    if payload.target_gpa is not None:
        sp.target_gpa = payload.target_gpa
    if payload.phone is not None:
        sp.phone = payload.phone

    db.commit()

    # Auto-synchronize semester courses if semester or department changed
    if sem_changed or dept_changed:
        dept_courses = db.query(Course).filter(
            Course.department_id == sp.department_id,
            Course.semester_number == sp.semester_number
        ).all()
        existing_enr = db.query(Enrollment).filter(Enrollment.student_id == sp.id).all()
        enr_cids = {e.course_id for e in existing_enr}
        for dc in dept_courses:
            if dc.id not in enr_cids:
                g = "A" if sp.gpa > 3.6 else ("B" if sp.gpa > 3.0 else "C")
                db.add(Enrollment(student_id=sp.id, course_id=dc.id, semester=sp.semester_number, grade=g))
        db.commit()

    return {"message": "Student updated successfully."}

@router.patch("/users/{id}/toggle-status")
def toggle_user_status(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own admin account.")

    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User status updated to {'Active' if user.is_active else 'Disabled'}.", "is_active": user.is_active}

@router.delete("/students/{id}")
def delete_student_by_admin(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    sp = db.query(StudentProfile).filter(StudentProfile.id == id).first()
    if not sp:
        raise HTTPException(status_code=404, detail="Student profile not found.")

    u = sp.user

    # Cleanup student relations
    db.query(Attendance).filter(Attendance.student_id == sp.id).delete()
    db.query(InternalMark).filter(InternalMark.student_id == sp.id).delete()
    db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == sp.id).delete()
    db.query(Enrollment).filter(Enrollment.student_id == sp.id).delete()
    db.query(Goal).filter(Goal.student_id == sp.id).delete()
    db.query(StudyPlan).filter(StudyPlan.student_id == sp.id).delete()
    db.query(RiskPrediction).filter(RiskPrediction.student_id == sp.id).delete()

    db.delete(sp)
    db.delete(u)
    db.commit()

    return {"message": "Student account deleted successfully."}

@router.post("/users")
def create_user_by_admin(
    payload: UserCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    req_role = payload.role.strip().lower()
    if req_role == "admin":
        raise HTTPException(
            status_code=400,
            detail="Additional admin accounts cannot be created. Only Mihir Patel is the administrator."
        )

    clean_email = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User email already exists.")

    hashed_pwd = get_password_hash(payload.password)
    user = User(
        email=clean_email,
        password_hash=hashed_pwd,
        full_name=payload.full_name,
        role=req_role,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if payload.role == "student" and payload.department_id:
        sp = StudentProfile(
            user_id=user.id,
            department_id=payload.department_id,
            roll_number=payload.roll_number or f"2026-STU-{user.id:03d}",
            semester_number=1
        )
        db.add(sp)
    elif payload.role == "faculty" and payload.department_id:
        fp = FacultyProfile(
            user_id=user.id,
            department_id=payload.department_id,
            employee_id=payload.employee_id or f"FAC-{user.id:03d}",
            designation=payload.designation or "Assistant Professor"
        )
        db.add(fp)

    db.commit()
    return {"message": "User created successfully.", "user_id": user.id}

@router.post("/faculty")
def create_faculty_by_admin(
    payload: FacultyCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    clean_email = payload.email.strip().lower()
    clean_emp_id = payload.employee_id.strip()

    if db.query(User).filter(User.email == clean_email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    if db.query(FacultyProfile).filter(FacultyProfile.employee_id == clean_emp_id).first():
        raise HTTPException(status_code=400, detail="A faculty member with this Employee ID already exists.")

    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Selected department does not exist.")

    try:
        hashed_pwd = get_password_hash(payload.password)
        user = User(
            email=clean_email,
            password_hash=hashed_pwd,
            full_name=payload.full_name.strip(),
            role="faculty",
            is_active=True,
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        fp = FacultyProfile(
            user_id=user.id,
            department_id=payload.department_id,
            employee_id=clean_emp_id,
            designation=payload.designation.strip() if payload.designation else "Assistant Professor",
            office_hours=payload.office_hours.strip() if payload.office_hours else "Mon, Wed 10:00 AM - 12:00 PM"
        )
        db.add(fp)
        db.commit()
        db.refresh(fp)

        return {
            "message": "Faculty account created successfully.",
            "faculty_id": fp.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "employee_id": fp.employee_id
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error creating faculty: {str(e)}")

@router.get("/faculty")
def get_admin_faculty(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(FacultyProfile).join(User)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (User.full_name.ilike(s)) |
            (User.email.ilike(s)) |
            (FacultyProfile.employee_id.ilike(s))
        )
    if department_id:
        query = query.filter(FacultyProfile.department_id == department_id)

    faculty_list = query.all()
    res = []
    for fp in faculty_list:
        u = fp.user
        res.append({
            "id": fp.id,
            "user_id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "employee_id": fp.employee_id,
            "designation": fp.designation,
            "office_hours": fp.office_hours,
            "department_id": fp.department_id,
            "department_name": fp.department.name if fp.department else "N/A",
            "department_code": fp.department.code if fp.department else "N/A",
            "is_active": u.is_active,
            "avatar_url": u.avatar_url,
            "created_at": u.created_at.strftime("%Y-%m-%d")
        })
    return res

@router.put("/faculty/{id}")
def update_faculty_by_admin(
    id: int,
    payload: FacultyUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    fp = db.query(FacultyProfile).filter(FacultyProfile.id == id).first()
    if not fp:
        raise HTTPException(status_code=404, detail="Faculty profile not found.")

    u = fp.user
    if payload.email and payload.email != u.email:
        clean_email = payload.email.strip().lower()
        if db.query(User).filter(User.email == clean_email, User.id != u.id).first():
            raise HTTPException(status_code=400, detail="Email already taken by another account.")
        u.email = clean_email

    if payload.employee_id and payload.employee_id != fp.employee_id:
        clean_emp = payload.employee_id.strip()
        if db.query(FacultyProfile).filter(FacultyProfile.employee_id == clean_emp, FacultyProfile.id != fp.id).first():
            raise HTTPException(status_code=400, detail="Employee ID already taken.")
        fp.employee_id = clean_emp

    if payload.full_name is not None:
        u.full_name = payload.full_name.strip()
    if payload.department_id is not None:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Selected department does not exist.")
        fp.department_id = payload.department_id
    if payload.designation is not None:
        fp.designation = payload.designation.strip()
    if payload.office_hours is not None:
        fp.office_hours = payload.office_hours.strip()

    db.commit()
    return {"message": "Faculty profile updated successfully."}

@router.delete("/faculty/{id}")
def delete_faculty_by_admin(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    fp = db.query(FacultyProfile).filter(FacultyProfile.id == id).first()
    if not fp:
        raise HTTPException(status_code=404, detail="Faculty profile not found.")

    u = fp.user
    db.delete(fp)
    if u:
        db.delete(u)
    db.commit()
    return {"message": "Faculty account deleted successfully."}

@router.delete("/users/{id}")
def delete_user(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")

    if user.student_profile:
        sp = user.student_profile
        db.query(Attendance).filter(Attendance.student_id == sp.id).delete()
        db.query(InternalMark).filter(InternalMark.student_id == sp.id).delete()
        db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == sp.id).delete()
        db.query(Enrollment).filter(Enrollment.student_id == sp.id).delete()
        db.query(Goal).filter(Goal.student_id == sp.id).delete()
        db.query(StudyPlan).filter(StudyPlan.student_id == sp.id).delete()
        db.query(RiskPrediction).filter(RiskPrediction.student_id == sp.id).delete()
        db.delete(sp)

    if user.faculty_profile:
        db.delete(user.faculty_profile)

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully."}

@router.get("/departments")
def get_departments(
    current_user: User = Depends(require_role(["admin", "faculty", "student"])),
    db: Session = Depends(get_db)
):
    depts = db.query(Department).all()
    res = []
    for d in depts:
        student_count = db.query(StudentProfile).filter(StudentProfile.department_id == d.id).count()
        faculty_count = db.query(FacultyProfile).filter(FacultyProfile.department_id == d.id).count()
        course_count = db.query(Course).filter(Course.department_id == d.id).count()
        res.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "description": d.description,
            "student_count": student_count,
            "faculty_count": faculty_count,
            "course_count": course_count
        })
    return res

@router.post("/departments")
def create_department(
    payload: DepartmentBase,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    clean_code = payload.code.strip().upper()
    if db.query(Department).filter(Department.code == clean_code).first():
        raise HTTPException(status_code=400, detail=f"Department code '{clean_code}' already exists.")

    dept = Department(
        code=clean_code,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {
        "id": dept.id,
        "code": dept.code,
        "name": dept.name,
        "description": dept.description,
        "student_count": 0,
        "faculty_count": 0,
        "course_count": 0
    }

@router.put("/departments/{id}")
def update_department(
    id: int,
    payload: DepartmentUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    if payload.code:
        clean_code = payload.code.strip().upper()
        if clean_code != dept.code:
            if db.query(Department).filter(Department.code == clean_code, Department.id != id).first():
                raise HTTPException(status_code=400, detail=f"Department code '{clean_code}' already exists.")
            dept.code = clean_code

    if payload.name is not None:
        dept.name = payload.name.strip()
    if payload.description is not None:
        dept.description = payload.description.strip()

    db.commit()
    db.refresh(dept)
    return {"message": "Department updated successfully.", "id": dept.id}

@router.delete("/departments/{id}")
def delete_department(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found.")

    has_students = db.query(StudentProfile).filter(StudentProfile.department_id == id).count()
    has_faculty = db.query(FacultyProfile).filter(FacultyProfile.department_id == id).count()
    if has_students > 0 or has_faculty > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department with {has_students} active students and {has_faculty} faculty members. Reassign them first."
        )

    # Delete courses in this department
    courses = db.query(Course).filter(Course.department_id == id).all()
    for c in courses:
        db.delete(c)

    code_saved = dept.code
    db.delete(dept)
    db.commit()
    return {"message": f"Department {code_saved} and its courses deleted successfully."}

@router.get("/courses")
def get_admin_courses(
    department_id: Optional[int] = None,
    semester: Optional[int] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if semester:
        query = query.filter(Course.semester_number == semester)
    if search:
        s = f"%{search}%"
        query = query.filter((Course.title.ilike(s)) | (Course.code.ilike(s)))

    courses = query.order_by(Course.department_id.asc(), Course.semester_number.asc(), Course.code.asc()).all()
    res = []
    for c in courses:
        student_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
        res.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "department_id": c.department_id,
            "department": c.department.name if c.department else "N/A",
            "department_code": c.department.code if c.department else "N/A",
            "credits": c.credits,
            "semester": c.semester_number,
            "enrolled_students": student_count
        })
    return res

@router.post("/courses")
def create_course(
    payload: CourseBase,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    clean_code = payload.code.strip().upper()
    existing = db.query(Course).filter(Course.code == clean_code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Subject with code '{clean_code}' already exists.")

    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Selected department does not exist.")

    course = Course(
        code=clean_code,
        title=payload.title.strip(),
        department_id=payload.department_id,
        credits=payload.credits,
        semester_number=payload.semester_number
    )
    db.add(course)
    db.commit()
    db.refresh(course)

    # Auto-enroll students currently in this department + semester
    relevant_students = db.query(StudentProfile).filter(
        StudentProfile.department_id == course.department_id,
        StudentProfile.semester_number == course.semester_number
    ).all()
    for st in relevant_students:
        g = "A" if st.gpa > 3.6 else ("B" if st.gpa > 3.0 else "C")
        db.add(Enrollment(student_id=st.id, course_id=course.id, semester=course.semester_number, grade=g))
    if relevant_students:
        db.commit()

    return {
        "message": "Subject created successfully.",
        "id": course.id,
        "code": course.code,
        "title": course.title,
        "department": dept.name,
        "semester": course.semester_number,
        "credits": course.credits
    }

@router.put("/courses/{id}")
def update_course(
    id: int,
    payload: CourseUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Subject not found.")

    if payload.code:
        clean_code = payload.code.strip().upper()
        if clean_code != course.code:
            existing = db.query(Course).filter(Course.code == clean_code).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Subject with code '{clean_code}' already exists.")
            course.code = clean_code

    if payload.title is not None:
        course.title = payload.title.strip()
    if payload.department_id is not None:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Selected department does not exist.")
        course.department_id = payload.department_id
    if payload.credits is not None:
        course.credits = payload.credits
    if payload.semester_number is not None:
        course.semester_number = payload.semester_number

    db.commit()
    db.refresh(course)
    return {"message": "Subject updated successfully.", "id": course.id}

@router.delete("/courses/{id}")
def delete_course(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.id == id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Subject not found.")

    # Delete enrollments for course
    db.query(Enrollment).filter(Enrollment.course_id == id).delete()
    code_saved = course.code
    db.delete(course)
    db.commit()
    return {"message": f"Subject {code_saved} deleted successfully."}

@router.get("/announcements")
def get_admin_announcements(
    current_user: User = Depends(require_role(["admin", "faculty"])),
    db: Session = Depends(get_db)
):
    announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    res = []
    for a in announcements:
        author = db.query(User).filter(User.id == a.author_id).first()
        dept = db.query(Department).filter(Department.id == a.department_id).first() if a.department_id else None
        res.append({
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "target_role": a.target_role,
            "department_id": a.department_id,
            "department_name": dept.name if dept else "All Departments",
            "department_code": dept.code if dept else "ALL",
            "semester_number": a.semester_number,
            "author_id": a.author_id,
            "author_name": author.full_name if author else "Administrator",
            "created_at": a.created_at.strftime("%b %d, %Y %I:%M %p")
        })
    return res

@router.post("/announcements")
def create_announcement(
    payload: AnnouncementCreate,
    current_user: User = Depends(require_role(["admin", "faculty"])),
    db: Session = Depends(get_db)
):
    if not payload.title.strip() or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Title and message content cannot be empty.")

    ann = Announcement(
        title=payload.title.strip(),
        content=payload.content.strip(),
        target_role=payload.target_role.strip().lower() if payload.target_role else "all",
        department_id=payload.department_id,
        semester_number=payload.semester_number,
        author_id=current_user.id
    )
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return {"message": "Announcement published successfully.", "id": ann.id}

@router.put("/announcements/{id}")
def update_announcement(
    id: int,
    payload: AnnouncementUpdate,
    current_user: User = Depends(require_role(["admin", "faculty"])),
    db: Session = Depends(get_db)
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    if payload.title is not None:
        ann.title = payload.title.strip()
    if payload.content is not None:
        ann.content = payload.content.strip()
    if payload.target_role is not None:
        ann.target_role = payload.target_role.strip().lower()
    if payload.department_id is not None:
        ann.department_id = payload.department_id if payload.department_id != 0 else None
    if payload.semester_number is not None:
        ann.semester_number = payload.semester_number if payload.semester_number != 0 else None

    db.commit()
    db.refresh(ann)
    return {"message": "Announcement updated successfully.", "id": ann.id}

@router.delete("/announcements/{id}")
def delete_announcement(
    id: int,
    current_user: User = Depends(require_role(["admin", "faculty"])),
    db: Session = Depends(get_db)
):
    ann = db.query(Announcement).filter(Announcement.id == id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found.")

    db.delete(ann)
    db.commit()
    return {"message": "Announcement deleted successfully."}
