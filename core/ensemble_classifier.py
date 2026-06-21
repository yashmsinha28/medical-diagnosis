"""
Clinical heterogeneous ensemble classifier.

Primary backend models:
- Random Forest
- XGBoost
- SVM (RBF)
- Logistic Regression

The ensemble is designed for the 132-feature symptom space from SDPD-class
datasets and supports class-balancing through SMOTE plus balanced weights.
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pickle
import warnings

import numpy as np
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.svm import SVC
from sklearn.utils.class_weight import compute_sample_weight

warnings.filterwarnings("ignore")

try:
    import xgboost as xgb
except ImportError:  # pragma: no cover - environment-dependent
    xgb = None


class EnsembleClassifierBuilder:
    """Train, evaluate, save, and load the requested clinical ensemble."""

    def __init__(self, random_state: int = 42):
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.smote: Optional[SMOTE] = None
        self.models: Dict[str, object] = {}
        self.ensemble: Optional[VotingClassifier] = None
        self.feature_names: List[str] = []
        self.class_names: List[str] = []
        self.specialist_mapping: Dict[str, List[str]] = {}
        self.metrics: Dict[str, Dict[str, float]] = {}

    def _encode_labels(self, y) -> np.ndarray:
        return self.label_encoder.fit_transform(np.asarray(y).astype(str))

    def _fit_scaler_and_resample(self, X_train, y_train, use_smote: bool) -> Tuple[np.ndarray, np.ndarray]:
        X_scaled = self.scaler.fit_transform(X_train)

        if not use_smote:
            self.smote = None
            return X_scaled, y_train

        class_counts = np.bincount(y_train)
        min_class_count = int(class_counts[class_counts > 0].min()) if np.any(class_counts > 0) else 0
        if min_class_count < 2:
            print("⚠️  SMOTE skipped because at least one class has fewer than 2 samples.")
            self.smote = None
            return X_scaled, y_train

        k_neighbors = min(5, min_class_count - 1)
        self.smote = SMOTE(random_state=self.random_state, k_neighbors=k_neighbors)
        X_balanced, y_balanced = self.smote.fit_resample(X_scaled, y_train)
        print(f"✅ SMOTE applied: {len(y_train)} -> {len(y_balanced)} samples")
        return X_balanced, y_balanced

    def build_individual_models(self, X_train, y_train, use_smote: bool = True):
        """Fit the four requested backend models."""
        y_encoded = self._encode_labels(y_train)
        self.class_names = self.label_encoder.classes_.tolist()
        X_processed, y_processed = self._fit_scaler_and_resample(X_train, y_encoded, use_smote)

        sample_weight = compute_sample_weight(class_weight="balanced", y=y_processed)

        self.models["RandomForest"] = RandomForestClassifier(
            n_estimators=400,
            max_depth=None,
            min_samples_leaf=1,
            class_weight="balanced_subsample",
            random_state=self.random_state,
            n_jobs=-1,
        )
        self.models["RandomForest"].fit(X_processed, y_processed)

        if xgb is None:
            raise ImportError(
                "xgboost is required for the ensemble backend but is not installed in this environment."
            )

        self.models["XGBoost"] = xgb.XGBClassifier(
            n_estimators=350,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="multi:softprob",
            eval_metric="mlogloss",
            num_class=len(self.class_names),
            random_state=self.random_state,
            n_jobs=-1,
        )
        self.models["XGBoost"].fit(X_processed, y_processed, sample_weight=sample_weight)

        self.models["SVM"] = SVC(
            kernel="rbf",
            C=2.0,
            gamma="scale",
            probability=True,
            class_weight="balanced",
            random_state=self.random_state,
        )
        self.models["SVM"].fit(X_processed, y_processed)

        self.models["LogisticRegression"] = LogisticRegression(
            C=1.0,
            max_iter=2500,
            class_weight="balanced",
            solver="lbfgs",
            multi_class="auto",
            random_state=self.random_state,
        )
        self.models["LogisticRegression"].fit(X_processed, y_processed)

        return X_processed, y_processed

    def build_ensemble(self, voting: str = "soft"):
        if not self.models:
            raise ValueError("Individual models must be trained before building the ensemble.")

        self.ensemble = VotingClassifier(
            estimators=[
                ("rf", self.models["RandomForest"]),
                ("xgb", self.models["XGBoost"]),
                ("svm", self.models["SVM"]),
                ("lr", self.models["LogisticRegression"]),
            ],
            voting=voting,
            n_jobs=-1,
        )
        return self.ensemble

    def _evaluate_classifier(self, model, X_test_scaled, y_test) -> Dict[str, float]:
        y_pred = model.predict(X_test_scaled)
        probabilities = model.predict_proba(X_test_scaled)

        metrics = {
            "accuracy": accuracy_score(y_test, y_pred),
            "precision": precision_score(y_test, y_pred, average="weighted", zero_division=0),
            "recall": recall_score(y_test, y_pred, average="weighted", zero_division=0),
            "f1": f1_score(y_test, y_pred, average="weighted", zero_division=0),
        }

        try:
            metrics["roc_auc"] = roc_auc_score(
                y_test,
                probabilities,
                multi_class="ovr",
                average="weighted",
            )
        except Exception:
            metrics["roc_auc"] = 0.0

        return metrics

    def evaluate_models(self, X_test, y_test) -> Dict[str, Dict[str, float]]:
        y_encoded = self.label_encoder.transform(np.asarray(y_test).astype(str))
        X_test_scaled = self.scaler.transform(X_test)

        results: Dict[str, Dict[str, float]] = {}
        for name, model in self.models.items():
            results[name] = self._evaluate_classifier(model, X_test_scaled, y_encoded)

        if self.ensemble is not None:
            results["Ensemble"] = self._evaluate_classifier(self.ensemble, X_test_scaled, y_encoded)

        self.metrics = results
        return results

    def predict_with_consensus(
        self,
        X,
        top_k: int = 3,
        specialist_mapping: Optional[Dict[str, List[str]]] = None,
    ):
        X_scaled = self.scaler.transform(X)
        mapping = specialist_mapping or self.specialist_mapping
        predictions = []
        confidences = []

        for row in X_scaled:
            sample = row.reshape(1, -1)
            model_votes = {}
            model_probabilities = {}

            for name, model in self.models.items():
                pred_index = int(model.predict(sample)[0])
                disease = self.label_encoder.inverse_transform([pred_index])[0]
                model_votes[name] = disease

                probabilities = model.predict_proba(sample)[0]
                label_probabilities = {
                    self.label_encoder.inverse_transform([index])[0]: float(probability)
                    for index, probability in enumerate(probabilities)
                }
                model_probabilities[name] = label_probabilities

            consensus = {}
            for disease in sorted(set(model_votes.values())):
                votes = sum(1 for vote in model_votes.values() if vote == disease)
                avg_probability = float(
                    np.mean([prob_map.get(disease, 0.0) for prob_map in model_probabilities.values()])
                )
                consensus_score = (votes / len(self.models)) * 0.65 + avg_probability * 0.35
                consensus[disease] = {
                    "disease": disease,
                    "class": disease,
                    "votes": votes,
                    "avg_probability": avg_probability,
                    "consensus_score": consensus_score,
                    "confidence_percent": consensus_score * 100,
                    "recommended_specialists": mapping.get(disease, []),
                }

            top_predictions = sorted(
                consensus.values(),
                key=lambda item: item["consensus_score"],
                reverse=True,
            )[:top_k]

            predictions.append(top_predictions)
            confidences.append(top_predictions[0]["confidence_percent"] if top_predictions else 0.0)

        return predictions, confidences

    def validate_prediction_ready(self) -> bool:
        if not self.models or not self.feature_names:
            return False
        try:
            sample = np.zeros((1, len(self.feature_names)), dtype=float)
            self.predict_with_consensus(sample, top_k=1)
            return True
        except Exception as exc:
            print(f"⚠️  Ensemble compatibility validation failed: {exc}")
            return False

    def save_models(self, path: str | Path):
        output_dir = Path(path)
        output_dir.mkdir(parents=True, exist_ok=True)
        payload = {
            "ensemble": self.ensemble,
            "models": self.models,
            "scaler": self.scaler,
            "smote": self.smote,
            "label_encoder": self.label_encoder,
            "feature_names": self.feature_names,
            "class_names": self.class_names,
            "specialist_mapping": self.specialist_mapping,
            "metrics": self.metrics,
        }
        with (output_dir / "ensemble_models.pkl").open("wb") as handle:
            pickle.dump(payload, handle)
        print(f"✅ Models saved to {output_dir / 'ensemble_models.pkl'}")

    def load_models(self, path: str | Path):
        model_path = Path(path)
        if model_path.is_dir():
            model_path = model_path / "ensemble_models.pkl"

        with model_path.open("rb") as handle:
            payload = pickle.load(handle)

        self.ensemble = payload.get("ensemble")
        self.models = payload.get("models", {})
        self.scaler = payload.get("scaler", StandardScaler())
        self.smote = payload.get("smote")
        self.label_encoder = payload.get("label_encoder", LabelEncoder())
        self.feature_names = payload.get("feature_names", [])
        self.class_names = payload.get("class_names", [])
        self.specialist_mapping = payload.get("specialist_mapping", {})
        self.metrics = payload.get("metrics", {})

        if (not self.models) and self.ensemble is not None:
            named_estimators = getattr(self.ensemble, "named_estimators_", None)
            if named_estimators:
                alias_map = {
                    "rf": "RandomForest",
                    "xgb": "XGBoost",
                    "svm": "SVM",
                    "lr": "LogisticRegression",
                    "knn": "KNN",
                    "nb": "NaiveBayes",
                }
                self.models = {
                    alias_map.get(name, name): estimator
                    for name, estimator in named_estimators.items()
                }

        if len(getattr(self.label_encoder, "classes_", [])) == 0 and self.class_names:
            self.label_encoder.fit(self.class_names)

        print(f"✅ Models loaded from {model_path}")
