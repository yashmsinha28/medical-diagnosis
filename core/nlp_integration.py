"""
Dataset-backed NLP integration layer.

This module removes the old hardcoded disease/symptom mini-database and uses
the configured clinical datasets as the source of truth for:
- symptom validation
- disease semantic search
- specialist mapping
- optional MIMIC-III narrative corpora
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import warnings

from core.advanced_preprocessing import MedicalNLPPipeline
from core.clinical_data import ClinicalDatasetBundle, load_dataset_bundle
from core.feature_extraction import normalize_symptom_text

warnings.filterwarnings("ignore")


class MedicalDiagnosisAssistant:
    """Narrative-processing assistant backed by the configured clinical datasets."""

    def __init__(
        self,
        config_path: str = "config/nlp_config.json",
        dataset_config_path: str = "config/config.yaml",
    ):
        self.config_path = config_path
        self.dataset_config_path = dataset_config_path
        self.config = self._load_config()
        self.dataset_bundle: Optional[ClinicalDatasetBundle] = None
        self.symptom_catalog: List[str] = []
        self.disease_database: Dict[str, str] = {}
        self.specialist_mapping: Dict[str, List[str]] = {}
        self.mimic_notes = None

        self._load_dataset_bundle()

        model_name = (
            self.config.get("models", {})
            .get("transformers", {})
            .get("clinicalbert_model_name", "emilyalsentzer/Bio_ClinicalBERT")
        )

        self.nlp_pipeline = MedicalNLPPipeline(
            model_name=model_name,
            disease_corpus=self.disease_database,
            symptom_catalog=self.symptom_catalog,
        )

        print("[OK] Medical Diagnosis Assistant initialized")

    def _load_config(self) -> Dict:
        try:
            with Path(self.config_path).open("r") as handle:
                return json.load(handle)
        except FileNotFoundError:
            print(f"⚠️  Config file not found: {self.config_path}")
            return {}

    def _load_dataset_bundle(self) -> None:
        try:
            bundle = load_dataset_bundle(self.dataset_config_path)
        except Exception as exc:
            print(f"⚠️  Dataset bundle unavailable: {exc}")
            return

        self.dataset_bundle = bundle
        self.symptom_catalog = bundle.structured.feature_names
        self.disease_database = bundle.disease_descriptions
        self.specialist_mapping = bundle.disease_specialists
        self.mimic_notes = bundle.mimic_notes

    def process_patient_narrative(self, narrative: str) -> Dict:
        return self.nlp_pipeline.process_narrative(narrative)

    def extract_symptoms_from_narrative(self, narrative: str) -> Dict:
        result = self.nlp_pipeline.process_narrative(narrative)
        return {
            "raw_symptoms": result["entity_extraction"].get("SYMPTOM", []),
            "normalized_symptoms": result["normalization"]["normalized_symptoms"],
            "confidence_scores": [
                entity.get("confidence", 0.8)
                for entity in result["entity_extraction"].get("raw_entities", [])
                if entity.get("label") == "SYMPTOM"
            ],
            "tokenization": result.get("tokenization", {}),
        }

    def extract_contextual_severity(self, narrative: str) -> Dict:
        result = self.nlp_pipeline.process_narrative(narrative)
        return result["context_features"]

    def find_potential_diseases(self, narrative: str, top_k: int = 3) -> List[Tuple]:
        try:
            return self.nlp_pipeline.find_matching_diseases(narrative, top_k)
        except Exception as exc:
            print(f"⚠️  Error finding diseases: {exc}")
            return []

    def create_clinical_summary(self, narrative: str) -> Dict:
        result = self.nlp_pipeline.process_narrative(narrative)
        potential_diagnoses = self.find_potential_diseases(narrative, top_k=5)

        structured_diagnoses = []
        for disease, similarity in potential_diagnoses:
            structured_diagnoses.append(
                {
                    "disease": disease,
                    "similarity": float(similarity),
                    "specialists": self.specialist_mapping.get(disease, []),
                }
            )

        return {
            "raw_input": narrative,
            "processed_text": result["preprocessing"]["cleaned_text"],
            "extracted_entities": {
                "symptoms": result["entity_extraction"].get("SYMPTOM", []),
                "diseases": result["entity_extraction"].get("DISEASE", []),
                "medications": result["entity_extraction"].get("MEDICATION", []),
                "anatomical_locations": result["entity_extraction"].get("ANATOMY", []),
            },
            "normalized_symptoms": result["normalization"]["normalized_symptoms"],
            "contextual_features": {
                "severity": result["context_features"]["severity"]["severity_level"],
                "severity_score": result["context_features"]["severity"]["severity_score"],
                "duration": result["context_features"]["duration"].get("primary_duration"),
                "patient_age": result["context_features"]["demographics"].get("age"),
                "patient_gender": result["context_features"]["demographics"].get("gender"),
            },
            "tokenization": result.get("tokenization", {}),
            "potential_diagnoses": structured_diagnoses,
        }

    def enhance_ml_predictions(self, ml_predictions: List[Dict], narrative: str) -> List[Dict]:
        nlp_results = self.create_clinical_summary(narrative)
        nlp_diseases = {
            item["disease"].lower(): item["similarity"] for item in nlp_results["potential_diagnoses"]
        }
        severity_score = nlp_results["contextual_features"]["severity_score"]
        duration = nlp_results["contextual_features"]["duration"]

        enhanced_predictions = []
        for prediction in ml_predictions:
            disease_name = prediction.get("disease", "")
            confidence = float(prediction.get("confidence", 0))
            severity_boost = max(severity_score - 1, 0) * 0.03
            similarity_boost = nlp_diseases.get(disease_name.lower(), 0) * 0.15
            enhanced_confidence = min(confidence + severity_boost + similarity_boost, 0.99)

            enhanced_predictions.append(
                {
                    **prediction,
                    "enhanced_confidence": enhanced_confidence,
                    "severity_adjusted": severity_score > 1,
                    "nlp_validated": disease_name.lower() in nlp_diseases,
                    "specialists": self.specialist_mapping.get(disease_name, []),
                    "contextual_factors": {
                        "severity": nlp_results["contextual_features"]["severity"],
                        "duration": duration,
                    },
                }
            )

        enhanced_predictions.sort(key=lambda item: item["enhanced_confidence"], reverse=True)
        return enhanced_predictions

    def get_symptom_suggestions(self, partial_narrative: str) -> List[str]:
        normalized_partial = normalize_symptom_text(partial_narrative)
        if not normalized_partial:
            return []

        matches = []
        for symptom in self.symptom_catalog:
            normalized_symptom = normalize_symptom_text(symptom)
            if normalized_symptom.startswith(normalized_partial) or normalized_partial in normalized_symptom:
                matches.append(symptom)

        return matches[:10]

    def validate_symptom_list(self, symptoms: List[str]) -> Dict:
        normalized_catalog = {
            normalize_symptom_text(symptom): symptom for symptom in self.symptom_catalog
        }

        result = {
            "raw_symptoms": symptoms,
            "normalized_symptoms": [],
            "validation_status": [],
            "unknown_symptoms": [],
        }

        for symptom in symptoms:
            normalized = normalize_symptom_text(symptom)
            resolved = normalized_catalog.get(normalized, normalized.replace(" ", "_"))
            found = normalized in normalized_catalog
            result["normalized_symptoms"].append(resolved)
            result["validation_status"].append(
                {
                    "symptom": symptom,
                    "normalized": resolved,
                    "found_in_database": found,
                }
            )
            if not found:
                result["unknown_symptoms"].append(symptom)

        return result
