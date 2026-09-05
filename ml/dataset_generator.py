import csv
import random
import os

def generate_synthetic_dataset(output_path="ml/dataset.csv", num_samples=2500):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    headers = [
        "attendance_pct",
        "avg_internal_marks_pct",
        "assignment_completion_pct",
        "previous_gpa",
        "missed_assignments_count",
        "study_hours_per_week",
        "recent_trend_slope",
        "risk_level"  # 0: Low, 1: Medium, 2: High
    ]

    records = []
    random.seed(42)

    for _ in range(num_samples):
        # Generate base features
        attendance = round(random.uniform(50.0, 100.0), 1)
        internal_marks = round(random.uniform(40.0, 98.0), 1)
        assignment_completion = round(random.uniform(30.0, 100.0), 1)
        prev_gpa = round(random.uniform(2.0, 4.0), 2)
        study_hours = round(random.uniform(2.0, 35.0), 1)
        recent_trend = round(random.uniform(-25.0, 25.0), 1)
        
        # Derived missed assignments count inversely proportional to completion
        missed_assignments = max(0, int((100 - assignment_completion) / 15 + random.randint(-1, 2)))

        # Rule-informed ground truth synthesis with realistic variance
        risk_score = 0.0
        
        if attendance < 75.0:
            risk_score += (75.0 - attendance) * 0.025
        if internal_marks < 60.0:
            risk_score += (60.0 - internal_marks) * 0.02
        if assignment_completion < 70.0:
            risk_score += (70.0 - assignment_completion) * 0.015
        if missed_assignments >= 3:
            risk_score += missed_assignments * 0.08
        if prev_gpa < 2.8:
            risk_score += (2.8 - prev_gpa) * 0.3
        if study_hours < 8.0:
            risk_score += (8.0 - study_hours) * 0.025
        if recent_trend < -5.0:
            risk_score += abs(recent_trend) * 0.015

        # Add noise
        risk_score += random.gauss(0, 0.05)

        # Categorize into Low (0), Medium (1), High (2)
        if risk_score > 0.45:
            risk_level = 2
        elif risk_score > 0.20:
            risk_level = 1
        else:
            risk_level = 0

        records.append([
            attendance,
            internal_marks,
            assignment_completion,
            prev_gpa,
            missed_assignments,
            study_hours,
            recent_trend,
            risk_level
        ])

    with open(output_path, mode="w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(records)

    print(f"Dataset successfully created at {output_path} with {num_samples} samples.")

if __name__ == "__main__":
    generate_synthetic_dataset()
