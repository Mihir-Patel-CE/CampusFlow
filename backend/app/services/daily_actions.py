from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session
from app.models.domain import Assignment, AssignmentSubmission, Attendance, Course, Exam, InternalMark

class DailyActionsService:
    @staticmethod
    def generate_daily_actions(student_id: int, db: Session) -> List[dict]:
        actions = []

        # 1. Overdue & Upcoming Pending Assignments
        pending_submissions = (
            db.query(Assignment)
            .join(Course)
            .filter(
                ~Assignment.id.in_(
                    db.query(AssignmentSubmission.assignment_id)
                    .filter(AssignmentSubmission.student_id == student_id)
                )
            )
            .all()
        )

        now = datetime.now()
        for assign in pending_submissions:
            days_left = (assign.due_date - now).days
            if days_left < 0:
                actions.append({
                    "id": f"assign-{assign.id}",
                    "title": f"Complete Overdue Assignment: {assign.title}",
                    "category": "Assignment",
                    "priority": "High",
                    "course_code": assign.course.code,
                    "action_type": "Submit Task",
                    "due_info": f"Overdue by {abs(days_left)} days"
                })
            elif days_left <= 3:
                actions.append({
                    "id": f"assign-{assign.id}",
                    "title": f"Finish Assignment: {assign.title}",
                    "category": "Assignment",
                    "priority": "High" if days_left <= 1 else "Medium",
                    "course_code": assign.course.code,
                    "action_type": "Submit Task",
                    "due_info": f"Due in {days_left} day(s)"
                })

        # 2. Attendance Warning check
        courses = db.query(Course).all()
        for course in courses:
            total_classes = db.query(Attendance).filter(
                Attendance.student_id == student_id,
                Attendance.course_id == course.id
            ).count()

            if total_classes > 0:
                p_count = db.query(Attendance).filter(
                    Attendance.student_id == student_id,
                    Attendance.course_id == course.id,
                    Attendance.status == "present"
                ).count()

                pct = (p_count / total_classes) * 100.0
                if pct < 75.0:
                    actions.append({
                        "id": f"att-{course.id}",
                        "title": f"Attendance Alert: {course.code} ({course.title}) is at {pct:.1f}%",
                        "category": "Attendance",
                        "priority": "High",
                        "course_code": course.code,
                        "action_type": "Attend Class",
                        "due_info": "Target 75% required"
                    })

        # 3. Upcoming Exams
        upcoming_exams = (
            db.query(Exam)
            .join(Course)
            .filter(Exam.exam_date >= now, Exam.exam_date <= now + timedelta(days=14))
            .order_by(Exam.exam_date.asc())
            .all()
        )

        for exam in upcoming_exams:
            days_to_exam = (exam.exam_date - now).days
            actions.append({
                "id": f"exam-{exam.id}",
                "title": f"Prepare for {exam.title} ({exam.course.code})",
                "category": "Exam Prep",
                "priority": "High" if days_to_exam <= 4 else "Medium",
                "course_code": exam.course.code,
                "action_type": "Study",
                "due_info": f"Exam on {exam.exam_date.strftime('%b %d')}"
            })

        # 4. Low Score Revision Recommendation
        low_marks = (
            db.query(InternalMark)
            .join(Course)
            .filter(InternalMark.student_id == student_id)
            .all()
        )
        for mark in low_marks:
            score_pct = (mark.score / mark.max_score) * 100.0
            if score_pct < 65.0:
                actions.append({
                    "id": f"rev-{mark.id}",
                    "title": f"Revise Unit Concepts for {mark.course.code} (Scored {score_pct:.0f}% in {mark.title})",
                    "category": "Revision",
                    "priority": "Medium",
                    "course_code": mark.course.code,
                    "action_type": "Review Concepts",
                    "due_info": "Improve internal mastery"
                })

        # Default fallback actions if student is completely caught up
        if not actions:
            actions.append({
                "id": "gen-1",
                "title": "Review lecture notes for upcoming week",
                "category": "Revision",
                "priority": "Low",
                "course_code": "ALL",
                "action_type": "Proactive Study",
                "due_info": "On Track"
            })

        # Sort actions by priority (High -> Medium -> Low)
        priority_weights = {"High": 0, "Medium": 1, "Low": 2}
        actions.sort(key=lambda x: priority_weights.get(x["priority"], 3))

        return actions
