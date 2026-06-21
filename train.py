"""
Baseline structured-model training for the Flask `/api/predict` endpoint.

This script now trains from the configured symptom-disease dataset instead of
the removed demo CSV.
"""

from __future__ import annotations

from pathlib import Path

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from core.clinical_data import load_dataset_bundle
from core.model_handler import save_model, save_symptom_columns


MODELS_DIR = Path("models")


def main():
    bundle = load_dataset_bundle("config/config.yaml")
    structured = bundle.structured
    df = structured.dataframe

    X = df[structured.feature_names]
    y = df[structured.target_column].astype(str)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    model = RandomForestClassifier(
        n_estimators=300,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print(classification_report(y_test, y_pred, zero_division=0))

    MODELS_DIR.mkdir(exist_ok=True)
    save_model(model, MODELS_DIR / "disease_prediction_model.pkl")
    save_symptom_columns(structured.feature_names, MODELS_DIR / "symptom_columns.pkl")
    print(f"Saved baseline model to {MODELS_DIR / 'disease_prediction_model.pkl'}")


if __name__ == "__main__":
    main()
