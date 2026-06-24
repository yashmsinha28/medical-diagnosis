"""
Clinical ensemble training pipeline.

Usage:
    python train_ensemble.py

Expected datasets are configured in config/config.yaml.
"""

from __future__ import annotations

import json
from pathlib import Path

from sklearn.model_selection import train_test_split

from core.clinical_data import load_dataset_bundle, save_specialist_mapping
from core.ensemble_classifier import EnsembleClassifierBuilder
from core.model_handler import save_model, save_symptom_columns


MODELS_DIR = Path("models")
REPORTS_DIR = Path("reports")


def print_dataset_summary(bundle) -> None:
    structured = bundle.structured
    df = structured.dataframe

    print("=" * 88)
    print("CLINICAL DATASET SUMMARY")
    print("=" * 88)
    print(f"Structured records:      {len(df)}")
    print(f"Symptom feature space:   {len(structured.feature_names)}")
    print(f"Target column:           {structured.target_column}")
    print(f"Disease classes:         {df[structured.target_column].nunique()}")
    print(f"Specialist mappings:     {len(bundle.disease_specialists)}")

    if bundle.mimic_notes is not None:
        print(f"MIMIC note+ICD rows:     {len(bundle.mimic_notes)}")
    else:
        print("MIMIC note+ICD rows:     not loaded")

    print("\nTop 10 class counts:")
    class_counts = df[structured.target_column].value_counts().head(10)
    for disease, count in class_counts.items():
        print(f"  {disease}: {count}")


def split_structured_dataset(bundle):
    structured = bundle.structured
    df = structured.dataframe

    X = df[structured.feature_names].values
    y = df[structured.target_column].astype(str).values

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )
    return X_train, X_test, y_train, y_test


def train_ensemble(bundle):
    X_train, X_test, y_train, y_test = split_structured_dataset(bundle)

    builder = EnsembleClassifierBuilder(random_state=42)
    builder.feature_names = bundle.structured.feature_names
    builder.specialist_mapping = bundle.disease_specialists

    X_processed, y_processed = builder.build_individual_models(
        X_train,
        y_train,
        use_smote=True,
    )

    ensemble = builder.build_ensemble(voting="soft")
    ensemble.fit(X_processed, y_processed)
    metrics = builder.evaluate_models(X_test, y_test)
    top_predictions, confidences = builder.predict_with_consensus(
        X_test[:5],
        top_k=3,
        specialist_mapping=bundle.disease_specialists,
    )

    return builder, metrics, X_test, y_test, top_predictions, confidences


def print_metrics(metrics):
    print("\n" + "=" * 88)
    print("MODEL EVALUATION")
    print("=" * 88)

    for model_name, values in metrics.items():
        print(f"\n{model_name}")
        print(f"  Accuracy:   {values['accuracy']:.4f}")
        print(f"  Precision:  {values['precision']:.4f}")
        print(f"  Recall:     {values['recall']:.4f}")
        print(f"  F1-Score:   {values['f1']:.4f}")
        print(f"  ROC-AUC:    {values['roc_auc']:.4f}")


def print_top_predictions(predictions, confidences):
    print("\n" + "=" * 88)
    print("TOP-3 CONSENSUS PREDICTIONS")
    print("=" * 88)

    for index, (prediction_group, confidence) in enumerate(zip(predictions, confidences), start=1):
        print(f"\nSample {index}: overall confidence {confidence:.2f}%")
        for rank, prediction in enumerate(prediction_group, start=1):
            specialists = ", ".join(prediction["recommended_specialists"]) or "No mapping available"
            print(
                f"  {rank}. {prediction['disease']} | "
                f"confidence={prediction['confidence_percent']:.2f}% | "
                f"votes={prediction['votes']}/{4} | "
                f"specialists={specialists}"
            )


def save_outputs(builder, bundle, metrics, predictions):
    MODELS_DIR.mkdir(exist_ok=True)
    REPORTS_DIR.mkdir(exist_ok=True)

    builder.save_models(MODELS_DIR)
    save_symptom_columns(bundle.structured.feature_names, MODELS_DIR / "symptom_columns.pkl")
    save_specialist_mapping(bundle.disease_specialists, MODELS_DIR / "disease_specialist_mapping.json")

    report_payload = {
        "metrics": metrics,
        "top_predictions": predictions,
        "structured_dataset": {
            "feature_count": len(bundle.structured.feature_names),
            "record_count": len(bundle.structured.dataframe),
            "class_count": int(bundle.structured.dataframe[bundle.structured.target_column].nunique()),
        },
        "mimic_note_rows": int(len(bundle.mimic_notes)) if bundle.mimic_notes is not None else 0,
    }

    with (REPORTS_DIR / "clinical_training_report.json").open("w") as handle:
        json.dump(report_payload, handle, indent=2)

    if bundle.mimic_notes is not None and not bundle.mimic_notes.empty:
        bundle.mimic_notes.head(250).to_csv(REPORTS_DIR / "mimic_join_preview.csv", index=False)

    print(f"\n[OK] Saved training report to {REPORTS_DIR / 'clinical_training_report.json'}")


def main():
    bundle = load_dataset_bundle("config/config.yaml")
    print_dataset_summary(bundle)
    builder, metrics, _X_test, _y_test, predictions, confidences = train_ensemble(bundle)
    print_metrics(metrics)
    print_top_predictions(predictions, confidences)
    save_outputs(builder, bundle, metrics, predictions)


if __name__ == "__main__":
    main()
