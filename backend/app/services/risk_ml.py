import os
import joblib
import pandas as pd
import numpy as np

MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml/model.joblib"))

class RiskPredictionService:
    def __init__(self):
        self.model = None
        self.feature_names = [
            "attendance_pct",
            "avg_internal_marks_pct",
            "assignment_completion_pct",
            "previous_gpa",
            "missed_assignments_count",
            "study_hours_per_week",
            "recent_trend_slope"
        ]
        self._load_model()

    def _load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                data = joblib.load(MODEL_PATH)
                self.model = data["model"]
                self.feature_names = data.get("feature_names", self.feature_names)
            except Exception as e:
                print(f"Warning: Could not load trained model artifact: {e}")
                self.model = None

    def predict_risk(
        self,
        attendance_pct: float,
        avg_internal_marks_pct: float,
        assignment_completion_pct: float,
        previous_gpa: float,
        missed_assignments_count: int,
        study_hours_per_week: float,
        recent_trend_slope: float
    ) -> dict:
        features = [
            attendance_pct,
            avg_internal_marks_pct,
            assignment_completion_pct,
            previous_gpa,
            missed_assignments_count,
            study_hours_per_week,
            recent_trend_slope
        ]

        if self.model is not None:
            X = pd.DataFrame([features], columns=self.feature_names)
            pred_class = int(self.model.predict(X)[0])
            probs = self.model.predict_proba(X)[0]
            risk_score = float(probs[pred_class] if pred_class > 0 else 1.0 - probs[0])
        else:
            # Fallback heuristic calculation if model not present
            calc = 0.0
            if attendance_pct < 75: calc += 0.3
            if avg_internal_marks_pct < 60: calc += 0.3
            if missed_assignments_count >= 2: calc += 0.25
            if recent_trend_slope < -5: calc += 0.15
            
            risk_score = min(1.0, calc)
            if risk_score > 0.45: pred_class = 2
            elif risk_score > 0.20: pred_class = 1
            else: pred_class = 0

        risk_labels = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
        risk_level = risk_labels[pred_class]

        # Generate Human-Readable Contributing Factors
        factors = []
        if attendance_pct < 75.0:
            factors.append(f"Overall attendance is {attendance_pct:.1f}% (Below institutional 75% target).")
        if avg_internal_marks_pct < 60.0:
            factors.append(f"Average internal assessment marks score is {avg_internal_marks_pct:.1f}% (Below 60% standard).")
        if missed_assignments_count > 0:
            factors.append(f"Currently has {missed_assignments_count} overdue/missed assignment(s).")
        if recent_trend_slope < -3.0:
            factors.append(f"Recent academic trajectory is declining by {abs(recent_trend_slope):.1f}%.")
        if study_hours_per_week < 8.0:
            factors.append(f"Reported study time ({study_hours_per_week:.1f} hrs/week) is lower than recommended.")
        if previous_gpa < 3.0:
            factors.append(f"Previous semester GPA ({previous_gpa:.2f}) indicates need for study reinforcement.")

        if not factors:
            factors.append("Strong attendance, regular assignment completion, and positive performance trend.")

        return {
            "risk_level": risk_level,
            "risk_score": round(risk_score, 2),
            "key_factors": factors
        }

risk_service = RiskPredictionService()
