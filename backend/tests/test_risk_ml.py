from app.services.risk_ml import risk_service

def test_risk_ml_low_risk():
    res = risk_service.predict_risk(
        attendance_pct=95.0,
        avg_internal_marks_pct=92.0,
        assignment_completion_pct=100.0,
        previous_gpa=3.9,
        missed_assignments_count=0,
        study_hours_per_week=18.0,
        recent_trend_slope=6.0
    )
    assert res["risk_level"] in ["Low Risk", "Medium Risk"]
    assert "key_factors" in res

def test_risk_ml_high_risk():
    res = risk_service.predict_risk(
        attendance_pct=58.0,
        avg_internal_marks_pct=45.0,
        assignment_completion_pct=40.0,
        previous_gpa=2.2,
        missed_assignments_count=4,
        study_hours_per_week=4.0,
        recent_trend_slope=-12.0
    )
    assert res["risk_level"] == "High Risk"
    assert len(res["key_factors"]) > 0
