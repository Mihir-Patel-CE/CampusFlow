from fastapi import APIRouter
from pydantic import BaseModel
from app.services.risk_ml import risk_service

router = APIRouter()

class RiskCustomPredictRequest(BaseModel):
    attendance_pct: float
    avg_internal_marks_pct: float
    assignment_completion_pct: float
    previous_gpa: float
    missed_assignments_count: int
    study_hours_per_week: float
    recent_trend_slope: float

@router.post("/predict-risk")
def predict_risk_custom(req: RiskCustomPredictRequest):
    return risk_service.predict_risk(
        attendance_pct=req.attendance_pct,
        avg_internal_marks_pct=req.avg_internal_marks_pct,
        assignment_completion_pct=req.assignment_completion_pct,
        previous_gpa=req.previous_gpa,
        missed_assignments_count=req.missed_assignments_count,
        study_hours_per_week=req.study_hours_per_week,
        recent_trend_slope=req.recent_trend_slope
    )
