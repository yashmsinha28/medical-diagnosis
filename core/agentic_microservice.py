"""
Agentic AI microservice layer.

Updated to use:
- trained ensemble artifacts for symptom prediction
- dataset-backed disease-to-specialist mappings
- the refactored NLP assistant for narrative analysis
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
import json

import numpy as np

from core.clinical_data import load_dataset_bundle
from core.ensemble_classifier import EnsembleClassifierBuilder
from core.feature_extraction import active_symptoms_from_dict, symptoms_to_vector
from core.nlp_integration import MedicalDiagnosisAssistant


class SymptomPredictionAgent:
    """Predict diseases from symptom flags using the saved ensemble artifact."""

    def __init__(self, model_path: str = "models/ensemble_models.pkl"):
        self.model_path = model_path
        self.agent_id = "symptom_prediction_agent_v1"
        self.builder = EnsembleClassifierBuilder()
        self.loaded = False
        self.model_available = Path(self.model_path).exists()

    def load_models(self):
        try:
            model_file = Path(self.model_path)
            if model_file.exists():
                self.builder.load_models(model_file)
                if self.builder.validate_prediction_ready():
                    self.loaded = True
                    self.model_available = True
                    print(f"[OK] {self.agent_id} initialized")
                else:
                    self.loaded = False
                    self.model_available = False
                    print(f"⚠️  {self.agent_id} model artifact is incompatible with this environment")
            else:
                print(f"⚠️  Model not found at {model_file}")
        except Exception as exc:
            print(f"❌ {self.agent_id} initialization failed: {exc}")

    def ensure_loaded(self):
        if not self.loaded:
            self.load_models()
        return self.loaded

    def predict(self, symptoms: Dict[str, Any]) -> Dict:
        if not self.ensure_loaded():
            return {
                "agent_id": self.agent_id,
                "status": "error",
                "error": "Models not loaded",
            }

        try:
            active_symptoms = active_symptoms_from_dict(symptoms)
            vector = symptoms_to_vector(active_symptoms, self.builder.feature_names)
            predictions, confidences = self.builder.predict_with_consensus(
                np.array([vector]),
                top_k=3,
                specialist_mapping=self.builder.specialist_mapping,
            )

            formatted_predictions = []
            for prediction in predictions[0]:
                formatted_predictions.append(
                    {
                        "disease": prediction["disease"],
                        "confidence": prediction["confidence_percent"] / 100.0,
                        "votes": prediction["votes"],
                        "reasoning": (
                            f"Consensus score {prediction['consensus_score']:.3f} "
                            f"from {prediction['votes']}/4 backend models"
                        ),
                        "recommended_specialists": prediction["recommended_specialists"],
                    }
                )

            return {
                "agent_id": self.agent_id,
                "timestamp": datetime.now().isoformat(),
                "input_symptoms": symptoms,
                "predictions": formatted_predictions,
                "overall_confidence": confidences[0],
                "status": "success",
            }
        except Exception as exc:
            return {
                "agent_id": self.agent_id,
                "status": "error",
                "error": str(exc),
                "timestamp": datetime.now().isoformat(),
            }

    def get_agent_metadata(self) -> Dict:
        return {
            "agent_id": self.agent_id,
            "type": "symptom_prediction",
            "status": "active" if (self.loaded or self.model_available) else "inactive",
            "capabilities": [
                "disease_prediction",
                "confidence_scoring",
                "ensemble_consensus",
            ],
        }


class SpecialistMappingAgent:
    """Map diseases to specialists using the dataset-backed mapping artifact."""

    def __init__(
        self,
        mapping_path: str = "models/disease_specialist_mapping.json",
        dataset_config_path: str = "config/config.yaml",
    ):
        self.agent_id = "specialist_mapping_agent_v1"
        self.mapping_path = Path(mapping_path)
        self.dataset_config_path = dataset_config_path
        self.specialist_map = self._load_mapping()

    def _load_mapping(self) -> Dict[str, List[str]]:
        if self.mapping_path.exists():
            with self.mapping_path.open("r") as handle:
                return json.load(handle)

        try:
            bundle = load_dataset_bundle(self.dataset_config_path)
            return bundle.disease_specialists
        except Exception:
            return {}

    def map_specialists(self, diseases: List[str]) -> Dict:
        specialists = []
        for priority, disease in enumerate(diseases, start=1):
            recommendations = self.specialist_map.get(disease, [])
            specialists.append(
                {
                    "disease": disease,
                    "recommended_specialists": recommendations,
                    "priority": priority,
                }
            )

        return {
            "agent_id": self.agent_id,
            "timestamp": datetime.now().isoformat(),
            "input_diseases": diseases,
            "specialists": specialists,
            "status": "success",
        }

    def get_agent_metadata(self) -> Dict:
        return {
            "agent_id": self.agent_id,
            "type": "specialist_mapping",
            "status": "active",
            "capabilities": [
                "disease_to_specialist_mapping",
                "specialist_recommendation",
                "priority_assignment",
            ],
        }


class HospitalSearchAgent:
    """Simple hospital search placeholder used after specialist mapping."""

    def __init__(self):
        self.agent_id = "hospital_search_agent_v1"

    def search_hospitals(
        self,
        location: Dict = None,
        specialists: List[str] = None,
        radius_km: int = 10,
    ) -> Dict:
        hospitals = [
            {
                "id": "hosp_001",
                "name": "City Medical Center",
                "location": location or {"lat": 0.0, "lng": 0.0},
                "specialists": specialists or [],
                "rating": 4.8,
                "distance_km": min(radius_km, 3.0),
            }
        ]

        return {
            "agent_id": self.agent_id,
            "timestamp": datetime.now().isoformat(),
            "search_params": {
                "location": location,
                "specialists": specialists,
                "radius_km": radius_km,
            },
            "hospitals": hospitals,
            "total_results": len(hospitals),
            "status": "success",
        }

    def get_agent_metadata(self) -> Dict:
        return {
            "agent_id": self.agent_id,
            "type": "hospital_search",
            "status": "active",
            "capabilities": [
                "hospital_search",
                "location_based_filtering",
                "specialist_availability_check",
            ],
        }


class ClinicalAnalysisAgent:
    """Use the NLP assistant for narrative extraction and disease search."""

    def __init__(self):
        self.agent_id = "clinical_analysis_agent_v1"
        self.assistant = None

    def ensure_assistant(self):
        if self.assistant is None:
            try:
                self.assistant = MedicalDiagnosisAssistant()
            except Exception as exc:
                print(f"⚠️  Clinical analysis assistant unavailable: {exc}")
                self.assistant = None
        return self.assistant

    def analyze_narrative(self, narrative: str) -> Dict:
        assistant = self.ensure_assistant()
        if assistant is None:
            return {
                "agent_id": self.agent_id,
                "timestamp": datetime.now().isoformat(),
                "input_narrative": narrative,
                "analysis": {
                    "symptoms": [],
                    "severity": "unknown",
                    "duration": None,
                    "clinical_summary": "NLP assistant unavailable",
                    "potential_diseases": [],
                },
                "status": "error",
            }

        summary = assistant.create_clinical_summary(narrative)
        return {
            "agent_id": self.agent_id,
            "timestamp": datetime.now().isoformat(),
            "input_narrative": narrative,
            "analysis": {
                "symptoms": summary["normalized_symptoms"],
                "severity": summary["contextual_features"]["severity"],
                "duration": summary["contextual_features"]["duration"],
                "clinical_summary": summary["processed_text"],
                "potential_diseases": summary["potential_diagnoses"],
            },
            "status": "success",
        }

    def get_agent_metadata(self) -> Dict:
        return {
            "agent_id": self.agent_id,
            "type": "clinical_analysis",
            "status": "active",
            "capabilities": [
                "narrative_processing",
                "symptom_extraction",
                "severity_assessment",
                "clinical_summarization",
            ],
        }


class AgenticPipeline:
    """Coordinate the autonomous agents into one diagnostic flow."""

    def __init__(self):
        self.agents = {
            "symptom_prediction": SymptomPredictionAgent(),
            "specialist_mapping": SpecialistMappingAgent(),
            "hospital_search": HospitalSearchAgent(),
            "clinical_analysis": ClinicalAnalysisAgent(),
        }
        self.pipeline_id = f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.execution_history: List[Dict] = []

    def execute_full_pipeline(
        self,
        symptoms: Dict,
        narrative: str = None,
        location: Dict = None,
    ) -> Dict:
        pipeline_start = datetime.now()
        results = {
            "pipeline_id": self.pipeline_id,
            "timestamp": pipeline_start.isoformat(),
            "agents_executed": [],
            "final_recommendations": {},
            "execution_time_ms": 0,
        }

        try:
            if narrative:
                clinical_result = self.agents["clinical_analysis"].analyze_narrative(narrative)
                results["agents_executed"].append(clinical_result)

            prediction_result = self.agents["symptom_prediction"].predict(symptoms)
            results["agents_executed"].append(prediction_result)
            predicted_diseases = [
                prediction["disease"] for prediction in prediction_result.get("predictions", [])
            ]

            specialist_result = self.agents["specialist_mapping"].map_specialists(predicted_diseases)
            results["agents_executed"].append(specialist_result)

            hospital_result = self.agents["hospital_search"].search_hospitals(
                location=location,
                specialists=[
                    specialist["recommended_specialists"][0]
                    for specialist in specialist_result.get("specialists", [])
                    if specialist.get("recommended_specialists")
                ],
            )
            results["agents_executed"].append(hospital_result)

            results["final_recommendations"] = {
                "predicted_diseases": predicted_diseases,
                "recommended_specialists": [
                    specialist["recommended_specialists"]
                    for specialist in specialist_result.get("specialists", [])
                ],
                "nearby_hospitals": hospital_result.get("hospitals", []),
                "clinical_notes": narrative or "No clinical notes provided",
            }
            results["execution_time_ms"] = (datetime.now() - pipeline_start).total_seconds() * 1000
            results["status"] = "success"
        except Exception as exc:
            results["status"] = "error"
            results["error"] = str(exc)

        self.execution_history.append(results)
        return results

    def get_agent_status(self) -> Dict:
        return {
            "pipeline_id": self.pipeline_id,
            "agents": {
                name: agent.get_agent_metadata()
                for name, agent in self.agents.items()
            },
            "total_pipelines_executed": len(self.execution_history),
        }

    def get_execution_history(self, limit: int = 10) -> List[Dict]:
        return self.execution_history[-limit:]
