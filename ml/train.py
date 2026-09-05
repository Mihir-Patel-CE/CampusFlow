import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def train_academic_risk_model(dataset_path="ml/dataset.csv", model_output_path="ml/model.joblib"):
    if not os.path.exists(dataset_path):
        try:
            from ml.dataset_generator import generate_synthetic_dataset
        except ImportError:
            from dataset_generator import generate_synthetic_dataset
        generate_synthetic_dataset(output_path=dataset_path)

    df = pd.read_csv(dataset_path)
    X = df.drop(columns=["risk_level"])
    y = df["risk_level"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Model Training Complete. Accuracy: {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Low Risk", "Medium Risk", "High Risk"]))

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump({
        "model": model,
        "feature_names": list(X.columns)
    }, model_output_path)
    print(f"Model saved to {model_output_path}")

if __name__ == "__main__":
    train_academic_risk_model()
