from sqlalchemy.orm import Session
from app.models.domain import StudentProfile, Attendance, InternalMark, AssignmentSubmission, Assignment

class GrowthScoreService:
    @staticmethod
    def calculate_growth_score(student_id: int, db: Session) -> dict:
        # 1. Attendance Score Factor (Weight: 30%)
        total_att = db.query(Attendance).filter(Attendance.student_id == student_id).count()
        present_att = db.query(Attendance).filter(
            Attendance.student_id == student_id,
            Attendance.status == "present"
        ).count()
        
        att_pct = (float(present_att) / float(total_att) * 100.0) if total_att > 0 else 85.0
        att_score = float(min(100.0, att_pct))

        # 2. Internal Marks Score Factor (Weight: 35%)
        marks = db.query(InternalMark).filter(InternalMark.student_id == student_id).all()
        if marks:
            total_scored_pct = float(sum((float(getattr(m, 'score')) / float(getattr(m, 'max_score')) * 100.0) for m in marks) / float(len(marks)))
        else:
            total_scored_pct = 75.0
        marks_score = float(min(100.0, total_scored_pct))

        # 3. Assignment Completion Factor (Weight: 25%)
        total_assignments = db.query(Assignment).count()
        submitted_count = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.student_id == student_id
        ).count()
        
        assign_pct = (float(submitted_count) / float(total_assignments) * 100.0) if total_assignments > 0 else 90.0
        assign_score = float(min(100.0, assign_pct))

        # 4. Consistency & Momentum Bonus Factor (Weight: 10%)
        student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
        gpa = float(getattr(student, 'gpa')) if student else 3.5
        gpa_score = float((gpa / 4.0) * 100.0)

        # Weighted score formula
        composite_val: float = (
            (att_score * 0.30) +
            (marks_score * 0.35) +
            (assign_score * 0.25) +
            (gpa_score * 0.10)
        )
        composite_score = int(composite_val)

        overall_score = max(0, min(100, composite_score))

        if overall_score >= 88:
            grade_tier = "Academic Excellence"
        elif overall_score >= 75:
            grade_tier = "High Performer"
        elif overall_score >= 60:
            grade_tier = "Steady Progress"
        else:
            grade_tier = "Requires Support"

        tips = []
        if att_score < 80:
            tips.append("Focus on improving class attendance to reach 85%+")
        if marks_score < 70:
            tips.append("Review mid-term feedback to boost internal assessment scores")
        if assign_score < 85:
            tips.append("Submit upcoming assignments ahead of deadline for full completion points")
        if not tips:
            tips.append("Outstanding academic momentum! Keep maintaining regular study habits.")

        return {
            "overall_score": overall_score,
            "grade_tier": grade_tier,
            "breakdown": {
                "attendance": round(att_score, 1),
                "internal_marks": round(marks_score, 1),
                "assignment_completion": round(assign_score, 1),
                "academic_consistency": round(gpa_score, 1)
            },
            "tips": tips
        }
