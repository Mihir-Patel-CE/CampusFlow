from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date
from app.core.database import get_db
from app.core.security import require_role
from app.models.domain import (
    User, StudentProfile, FacultyProfile, Enrollment, Course, Attendance, InternalMark,
    Assignment, AssignmentSubmission, Exam, Timetable, Announcement, Goal, StudyPlan
)
from app.services.risk_ml import risk_service
from app.services.daily_actions import DailyActionsService
from app.services.growth_score import GrowthScoreService
from app.services.study_planner import StudyPlannerService
from app.schemas.pydantic_models import StudyPlannerRequest, SubmissionCreate

router = APIRouter()

def _get_student_profile(user: User, db: Session) -> StudentProfile:
    student = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found for current user.")
    return student

@router.get("/dashboard")
def get_student_dashboard(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)

    # 1. Enrolled Courses for student's department + semester
    dept_sem_courses = db.query(Course).filter(
        Course.department_id == student.department_id,
        Course.semester_number == student.semester_number
    ).all()
    existing_enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    enrolled_cids = {en.course_id for en in existing_enrollments}
    
    new_added = False
    for dc in dept_sem_courses:
        if dc.id not in enrolled_cids:
            g = "A" if student.gpa > 3.6 else ("B" if student.gpa > 3.0 else "C")
            db.add(Enrollment(student_id=student.id, course_id=dc.id, semester=student.semester_number, grade=g))
            new_added = True
    if new_added:
        db.commit()
        existing_enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()

    # Filter to show current semester courses
    semester_enrollments = [en for en in existing_enrollments if en.course.department_id == student.department_id and en.course.semester_number == student.semester_number]
    enrollments = semester_enrollments if semester_enrollments else existing_enrollments

    courses_data = []
    avg_marks_list: List[float] = []
    total_att_present = 0
    total_att_count = 0

    for en in enrollments:
        c = en.course
        c_att_total = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.course_id == c.id).count()
        c_att_present = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.course_id == c.id, Attendance.status == "present").count()
        att_pct = round((c_att_present / c_att_total * 100.0), 1) if c_att_total > 0 else 100.0

        total_att_present += c_att_present
        total_att_count += c_att_total

        # Recent marks
        marks = db.query(InternalMark).filter(InternalMark.student_id == student.id, InternalMark.course_id == c.id).all()
        avg_mark = round(sum(float(getattr(m, 'score')) / float(getattr(m, 'max_score')) * 100.0 for m in marks) / len(marks), 1) if marks else 80.0
        avg_marks_list.append(avg_mark)

        courses_data.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "credits": c.credits,
            "attendance_pct": att_pct,
            "avg_mark_pct": avg_mark,
            "grade": en.grade or "N/A"
        })

    st_id: int = getattr(student, 'id')
    st_gpa: float = getattr(student, 'gpa')
    overall_attendance = round((total_att_present / total_att_count * 100.0), 1) if total_att_count > 0 else 85.0

    # 2. Risk ML Assessment
    avg_marks_all = (sum(avg_marks_list, 0.0) / float(len(avg_marks_list))) if avg_marks_list else 80.0
    risk_info = risk_service.predict_risk(
        attendance_pct=overall_attendance,
        avg_internal_marks_pct=avg_marks_all,
        assignment_completion_pct=85.0,
        previous_gpa=st_gpa,
        missed_assignments_count=db.query(Assignment).count() - db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == st_id).count(),
        study_hours_per_week=12.0,
        recent_trend_slope=3.5
    )

    # 3. Growth Score
    growth_info = GrowthScoreService.calculate_growth_score(st_id, db)

    # 4. Daily Actions
    daily_actions = DailyActionsService.generate_daily_actions(st_id, db)

    # 5. Upcoming Exams
    exams = db.query(Exam).filter(Exam.exam_date >= datetime.now()).order_by(Exam.exam_date.asc()).limit(3).all()
    exams_data = [{
        "id": ex.id,
        "title": ex.title,
        "course_code": ex.course.code,
        "exam_date": ex.exam_date.strftime("%b %d, %Y - %I:%M %p"),
        "room": ex.room
    } for ex in exams]

    # 6. Targeted Announcements (matching student's role, department, semester)
    ann_query = db.query(Announcement).filter(
        Announcement.target_role.in_(["all", "student"]),
        (Announcement.department_id == None) | (Announcement.department_id == student.department_id),
        (Announcement.semester_number == None) | (Announcement.semester_number == student.semester_number)
    ).order_by(Announcement.created_at.desc()).limit(6)
    announcements = ann_query.all()
    ann_data = [{
        "id": a.id,
        "title": a.title,
        "content": a.content,
        "created_at": a.created_at.strftime("%b %d")
    } for a in announcements]

    return {
        "student_info": {
            "name": current_user.full_name,
            "roll_number": student.roll_number,
            "department": student.department.name,
            "gpa": student.gpa,
            "target_gpa": student.target_gpa,
            "semester": student.semester_number,
            "avatar_url": current_user.avatar_url
        },
        "stats": {
            "overall_attendance": overall_attendance,
            "gpa": student.gpa,
            "growth_score": growth_info["overall_score"],
            "risk_level": risk_info["risk_level"],
            "courses_enrolled": len(courses_data)
        },
        "courses": courses_data,
        "risk_assessment": risk_info,
        "growth_score_detail": growth_info,
        "daily_actions": daily_actions[:5],
        "upcoming_exams": exams_data,
        "announcements": ann_data
    }

@router.get("/daily-actions")
def get_daily_actions(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    st_id: int = getattr(student, 'id')
    return DailyActionsService.generate_daily_actions(st_id, db)

@router.get("/risk-status")
def get_risk_status(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    st_id: int = getattr(student, 'id')
    st_gpa: float = getattr(student, 'gpa')
    
    total_att = db.query(Attendance).filter(Attendance.student_id == st_id).count()
    present_att = db.query(Attendance).filter(Attendance.student_id == st_id, Attendance.status == "present").count()
    att_pct = (present_att / total_att * 100.0) if total_att > 0 else 85.0

    marks = db.query(InternalMark).filter(InternalMark.student_id == st_id).all()
    avg_marks = float(sum(float(getattr(m, 'score')) / float(getattr(m, 'max_score')) * 100.0 for m in marks) / len(marks)) if marks else 75.0

    total_assignments = db.query(Assignment).count()
    submitted = db.query(AssignmentSubmission).filter(AssignmentSubmission.student_id == st_id).count()
    missed = max(0, total_assignments - submitted)
    completion_pct = (submitted / total_assignments * 100.0) if total_assignments > 0 else 100.0

    return risk_service.predict_risk(
        attendance_pct=att_pct,
        avg_internal_marks_pct=avg_marks,
        assignment_completion_pct=completion_pct,
        previous_gpa=st_gpa,
        missed_assignments_count=missed,
        study_hours_per_week=12.0,
        recent_trend_slope=3.5
    )

@router.get("/growth-score")
def get_growth_score(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    st_id: int = getattr(student, 'id')
    return GrowthScoreService.calculate_growth_score(st_id, db)

@router.post("/study-plan/generate")
def generate_study_plan(
    req: StudyPlannerRequest,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    plan = StudyPlannerService.generate_schedule(
        exam_title=req.exam_title,
        exam_date=req.exam_date,
        available_hours_per_day=req.available_hours_per_day,
        subject_ids=req.subject_ids,
        prep_levels=req.preparation_levels,
        db=db
    )
    
    # Save plan
    sp = StudyPlan(
        student_id=student.id,
        exam_title=req.exam_title,
        plan_data_json=plan
    )
    db.add(sp)
    db.commit()

    return plan

@router.get("/attendance")
def get_student_attendance(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    
    course_breakdown = []
    for en in enrollments:
        c = en.course
        records = db.query(Attendance).filter(Attendance.student_id == student.id, Attendance.course_id == c.id).order_by(Attendance.date.desc()).all()
        present = sum(1 for r in records if r.status == "present")
        absent = sum(1 for r in records if r.status == "absent")
        total = len(records)
        pct = round(present / total * 100.0, 1) if total > 0 else 100.0

        course_breakdown.append({
            "course_id": c.id,
            "course_code": c.code,
            "course_title": c.title,
            "attendance_pct": pct,
            "total_classes": total,
            "present_count": present,
            "absent_count": absent,
            "logs": [{
                "id": r.id,
                "date": r.date.strftime("%Y-%m-%d"),
                "status": r.status
            } for r in records[:10]]
        })

    return course_breakdown

@router.get("/marks")
def get_student_marks(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    marks = db.query(InternalMark).filter(InternalMark.student_id == student.id).all()
    
    formatted = [{
        "id": m.id,
        "course_id": m.course_id,
        "course_code": m.course.code,
        "course_title": m.course.title,
        "title": m.title,
        "score": m.score,
        "max_score": m.max_score,
        "percentage": round(float(getattr(m, 'score')) / float(getattr(m, 'max_score')) * 100.0, 1),
        "weightage": m.weightage
    } for m in marks]

    return formatted

@router.get("/assignments")
def get_student_assignments(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    course_ids = [en.course_id for en in enrollments]
    assignments = db.query(Assignment).filter(Assignment.course_id.in_(course_ids)).all()
    
    result = []
    for a in assignments:
        sub = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.student_id == student.id
        ).first()

        result.append({
            "id": a.id,
            "course_code": a.course.code,
            "course_title": a.course.title,
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date.strftime("%Y-%m-%d %H:%M"),
            "max_score": a.max_score,
            "is_submitted": sub is not None,
            "submission_status": sub.status if sub else "pending",
            "submission_text": sub.submission_text if sub else None,
            "score": sub.score if sub else None,
            "feedback": sub.feedback if sub else None
        })

    return result

@router.post("/assignments/{id}/submit")
def submit_assignment(
    id: int,
    req: SubmissionCreate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    assign = db.query(Assignment).filter(Assignment.id == id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    sub = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == id,
        AssignmentSubmission.student_id == student.id
    ).first()

    if not sub:
        sub = AssignmentSubmission(
            assignment_id=id,
            student_id=student.id,
            submission_text=req.submission_text,
            status="submitted"
        )
        db.add(sub)
    else:
        sub.submission_text = req.submission_text
        sub.submitted_at = datetime.now()
        sub.status = "submitted"

    db.commit()
    db.refresh(sub)
    return {"message": "Assignment submitted successfully!", "submission_id": sub.id}

DAY_ORDER = {
    "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4,
    "Friday": 5, "Saturday": 6, "Sunday": 7
}

@router.get("/timetable")
def get_student_timetable(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    course_ids = [en.course_id for en in enrollments]

    # Also match student's department + semester courses
    if student.department_id and student.semester_number:
        dept_courses = db.query(Course).filter(
            Course.department_id == student.department_id,
            Course.semester_number == student.semester_number
        ).all()
        for dc in dept_courses:
            if dc.id not in course_ids:
                course_ids.append(dc.id)

    tt = db.query(Timetable).filter(Timetable.course_id.in_(course_ids)).all() if course_ids else []

    # Sort by day of week and start time
    tt_sorted = sorted(
        tt,
        key=lambda e: (DAY_ORDER.get(e.day_of_week, 8), e.start_time)
    )

    res = []
    for item in tt_sorted:
        c = item.course
        fac_name = "Department Faculty"
        if item.faculty_id:
            fac = db.query(FacultyProfile).filter(FacultyProfile.id == item.faculty_id).first()
            if fac and fac.user:
                fac_name = fac.user.full_name

        res.append({
            "id": item.id,
            "course_id": item.course_id,
            "day_of_week": item.day_of_week,
            "start_time": item.start_time,
            "end_time": item.end_time,
            "room": item.room,
            "course_code": c.code,
            "course_title": c.title,
            "semester_number": c.semester_number,
            "faculty_name": fac_name
        })

    return res

@router.get("/goals")
def get_goals(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    goals = db.query(Goal).filter(Goal.student_id == student.id).all()
    return goals

@router.post("/goals")
def create_goal(
    title: str,
    target_date: Optional[date] = None,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    goal = Goal(
        student_id=student.id,
        title=title,
        target_date=target_date
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.patch("/goals/{id}/toggle")
def toggle_goal(
    id: int,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    student = _get_student_profile(current_user, db)
    goal = db.query(Goal).filter(Goal.id == id, Goal.student_id == student.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found.")
    goal.is_completed = not goal.is_completed
    db.commit()
    return goal
