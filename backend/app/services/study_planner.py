from datetime import date, timedelta
from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.domain import Course, InternalMark

class StudyPlannerService:
    @staticmethod
    def generate_schedule(
        exam_title: str,
        exam_date: date,
        available_hours_per_day: float,
        subject_ids: List[int],
        prep_levels: Dict[int, str],  # {course_id: "Low" | "Medium" | "High"}
        db: Session
    ) -> dict:
        today = date.today()
        days_until_exam = (exam_date - today).days
        if days_until_exam <= 0:
            days_until_exam = 1

        total_study_hours = float(days_until_exam * available_hours_per_day)

        courses = db.query(Course).filter(Course.id.in_(subject_ids)).all()
        if not courses:
            courses = db.query(Course).limit(4).all()

        # Calculate subject weights based on credits, prep level, and current performance
        subject_weights = {}
        total_weight = 0.0

        for c in courses:
            c_id: int = getattr(c, 'id')
            c_credits: int = getattr(c, 'credits')
            prep_level = prep_levels.get(c_id, "Medium")
            prep_multiplier = {"Low": 2.0, "Medium": 1.2, "High": 0.8}.get(prep_level, 1.0)
            
            # Fetch avg mark for this course
            marks = db.query(InternalMark).filter(InternalMark.course_id == c_id).all()
            avg_score = (sum(float(getattr(m, 'score')) for m in marks) / float(len(marks))) if marks else 70.0
            mark_factor = 1.5 if avg_score < 60 else (1.2 if avg_score < 75 else 1.0)

            weight = float(c_credits * prep_multiplier * mark_factor)
            subject_weights[c_id] = weight
            total_weight += weight

        # Distribute hours
        subject_allocations = {}
        for c in courses:
            c_id: int = getattr(c, 'id')
            c_code: str = getattr(c, 'code')
            c_title: str = getattr(c, 'title')
            c_credits: int = getattr(c, 'credits')

            share = subject_weights[c_id] / total_weight if total_weight > 0 else (1.0 / len(courses))
            hours = round(float(share * total_study_hours), 1)
            subject_allocations[c_id] = {
                "course_code": c_code,
                "course_title": c_title,
                "credits": c_credits,
                "allocated_hours": hours,
                "prep_level": prep_levels.get(c_id, "Medium"),
                "priority_label": "High Focus" if hours > (total_study_hours / len(courses)) else "Standard Revision"
            }

        # Build day-by-day study roadmap
        daily_roadmap = []
        current_date = today

        course_list = list(subject_allocations.values())
        course_index = 0

        for day in range(1, min(days_until_exam + 1, 14)): # up to 14 days preview
            day_schedule = []
            hours_assigned = 0.0
            
            while hours_assigned < available_hours_per_day:
                target_course = course_list[course_index % len(course_list)]
                slot_duration = min(2.0, available_hours_per_day - hours_assigned)
                
                day_schedule.append({
                    "course_code": target_course["course_code"],
                    "course_title": target_course["course_title"],
                    "topic": f"Module {(day % 4) + 1} Deep Dive & Practice Problems",
                    "duration_hours": slot_duration,
                    "focus": target_course["priority_label"]
                })
                hours_assigned += slot_duration
                course_index += 1

            daily_roadmap.append({
                "day_number": day,
                "date": current_date.strftime("%Y-%m-%d"),
                "day_name": current_date.strftime("%A"),
                "daily_hours": available_hours_per_day,
                "sessions": day_schedule
            })
            current_date += timedelta(days=1)

        return {
            "exam_title": exam_title,
            "exam_date": exam_date.strftime("%Y-%m-%d"),
            "total_days": days_until_exam,
            "total_study_hours": round(total_study_hours, 1),
            "available_hours_per_day": available_hours_per_day,
            "subject_breakdown": list(subject_allocations.values()),
            "daily_roadmap": daily_roadmap
        }
