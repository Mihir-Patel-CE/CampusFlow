from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid
from app.core.config import settings
from app.core.database import get_db
from app.core.security import verify_password, create_access_token, get_current_user, get_password_hash
from app.models.domain import User, StudentProfile, Department, Enrollment, Course, RiskPrediction
from app.schemas.pydantic_models import LoginRequest, Token, UserOut, UserCreate, PublicStudentRegister
from app.services.risk_ml import risk_service

router = APIRouter()

@router.get("/departments")
def get_public_departments(db: Session = Depends(get_db)):
    depts = db.query(Department).all()
    return [{"id": d.id, "code": d.code, "name": d.name} for d in depts]

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    if not request.email or not request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email_clean = request.email.strip().lower()
    user: User | None = db.query(User).filter(User.email == email_clean).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(request.password, str(user.password_hash)):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account has been disabled. Please contact the administrator."
        )

    if request.account_type:
        req_role = request.account_type.strip().lower()
        actual_role = str(user.role).strip().lower()
        if req_role != actual_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account type does not match this account."
            )
    
    access_token = create_access_token(subject=user.id, role=str(user.role))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/jpg", "image/pjpeg"}

@router.post("/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Invalid image format. Only JPG, JPEG, and PNG images are supported."
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_IMAGE_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only JPG, JPEG, and PNG image files are allowed."
        )

    # Read content with 10MB limit
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 10MB limit.")

    # Ensure upload directory exists
    os.makedirs(settings.AVATAR_UPLOAD_DIR, exist_ok=True)

    # Save unique file
    filename = f"user_{current_user.id}_{uuid.uuid4().hex[:10]}{ext}"
    file_path = os.path.join(str(settings.AVATAR_UPLOAD_DIR), filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    # Update user in database
    avatar_path = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_path
    db.commit()
    db.refresh(current_user)

    return {
        "message": "Profile photo updated successfully.",
        "avatar_url": current_user.avatar_url,
        "user": current_user
    }

@router.delete("/avatar")
def remove_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.avatar_url = None
    db.commit()
    db.refresh(current_user)
    return {
        "message": "Profile photo removed successfully.",
        "avatar_url": None,
        "user": current_user
    }

@router.post("/register/student")
def register_public_student(req: PublicStudentRegister, db: Session = Depends(get_db)):
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    clean_email = req.email.strip().lower()
    clean_roll = req.roll_number.strip()

    existing_email = db.query(User).filter(User.email == clean_email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    existing_roll = db.query(StudentProfile).filter(StudentProfile.roll_number == clean_roll).first()
    if existing_roll:
        raise HTTPException(status_code=400, detail="Student ID / Roll Number already registered.")

    dept = db.query(Department).filter(Department.id == req.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Selected department does not exist.")

    try:
        hashed_pwd = get_password_hash(req.password)
        user = User(
            email=clean_email,
            password_hash=hashed_pwd,
            full_name=req.full_name.strip(),
            role="student",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        student = StudentProfile(
            user_id=user.id,
            department_id=req.department_id,
            roll_number=clean_roll,
            semester_number=req.semester_number,
            gpa=3.5,
            target_gpa=3.8,
            cohort_year=req.cohort_year,
            phone=req.phone.strip() if req.phone else None
        )
        db.add(student)
        db.commit()
        db.refresh(student)

        # Auto-enroll student in department courses
        dept_courses = db.query(Course).filter(Course.department_id == req.department_id).all()
        for crs in dept_courses:
            db.add(Enrollment(student_id=student.id, course_id=crs.id, semester=req.semester_number, grade="N/A"))
        
        # Cache initial ML Risk prediction
        pred = risk_service.predict_risk(
            attendance_pct=85.0,
            avg_internal_marks_pct=80.0,
            assignment_completion_pct=90.0,
            previous_gpa=3.5,
            missed_assignments_count=0,
            study_hours_per_week=12.0,
            recent_trend_slope=2.0
        )
        db.add(RiskPrediction(
            student_id=student.id,
            risk_level=pred["risk_level"],
            risk_score=pred["risk_score"],
            key_factors_json=pred["key_factors"]
        ))

        db.commit()

        return {
            "message": "Student registration successful. You can now log in.",
            "user_id": user.id,
            "email": user.email
        }
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Database error during registration: {str(e)}")

@router.post("/register", response_model=UserOut)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    req_role = user_in.role.strip().lower()
    if req_role == "faculty":
        raise HTTPException(status_code=400, detail="Faculty accounts require administrator approval.")
    elif req_role == "admin":
        raise HTTPException(status_code=400, detail="Admin accounts can only be created by an authorized administrator.")
    elif req_role == "student":
        # Redirect to student registration flow if roll_number provided
        if not user_in.department_id or not user_in.roll_number:
            raise HTTPException(status_code=400, detail="Department and Roll Number are required for student registration.")
        
        existing = db.query(User).filter(User.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="User with this email already exists.")
        
        hashed_pwd = get_password_hash(user_in.password)
        user = User(
            email=user_in.email,
            password_hash=hashed_pwd,
            full_name=user_in.full_name,
            role="student",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        student = StudentProfile(
            user_id=user.id,
            department_id=user_in.department_id,
            roll_number=user_in.roll_number,
            semester_number=1
        )
        db.add(student)
        db.commit()
        return user
    else:
        raise HTTPException(status_code=400, detail="Invalid account role.")
