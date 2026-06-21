"""
Clinical NLP preprocessing pipeline.

Updated for:
- Bio_ClinicalBERT tokenization/embeddings with 512-token padding + truncation
- SciSpaCy NER for biomedical entities when the model is available
- Dataset-backed symptom vocabularies instead of hardcoded demo diseases
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional
import re
import warnings

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

warnings.filterwarnings("ignore")

try:
    import torch
    from transformers import AutoModel, AutoTokenizer
except ImportError:  # pragma: no cover - environment-dependent
    torch = None
    AutoModel = None
    AutoTokenizer = None

try:
    import spacy
except ImportError:  # pragma: no cover - environment-dependent
    spacy = None


def _safe_mean_pool(last_hidden_state, attention_mask):
    masked_embeddings = last_hidden_state * attention_mask.unsqueeze(-1)
    token_counts = attention_mask.sum(dim=1, keepdim=True).clamp(min=1)
    return masked_embeddings.sum(dim=1) / token_counts


class MedicalTextPreprocessor:
    """Text cleaning focused on clinical narratives and note fragments."""

    def __init__(self):
        self.medical_spell_corrections = {
            "feaver": "fever",
            "headach": "headache",
            "tummy ache": "abdominal pain",
            "stomach ache": "abdominal pain",
            "sob": "shortness of breath",
            "mi": "myocardial infarction",
        }
        self.clinical_noise_patterns = [
            r"\b(?:mrn|dob|attending|dictated by|signed by)\b[:\s]*",
            r"\b(?:discharge summary|history of present illness|chief complaint)\b[:\s]*",
            r"\[(?:\*\*.*?\*\*)\]",
        ]

    def spell_correct(self, text: str) -> str:
        normalized = text
        for typo, replacement in self.medical_spell_corrections.items():
            normalized = re.sub(
                rf"\b{re.escape(typo)}\b",
                replacement,
                normalized,
                flags=re.IGNORECASE,
            )
        return normalized

    def remove_clinical_noise(self, text: str) -> str:
        cleaned = text
        for pattern in self.clinical_noise_patterns:
            cleaned = re.sub(pattern, " ", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"http\S+|www\S+|\S+@\S+", " ", cleaned)
        return cleaned

    def normalize_whitespace(self, text: str) -> str:
        text = re.sub(r"[^a-zA-Z0-9\s.,;:/\-()]+", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    def tokenize(self, text: str) -> List[str]:
        return [token for token in re.split(r"\s+", text) if token]

    def clean_text(self, text: str) -> str:
        text = self.spell_correct(text or "")
        text = self.remove_clinical_noise(text)
        text = self.normalize_whitespace(text).lower()
        return text


class BiomedicalNER:
    """
    Biomedical entity extraction with SciSpaCy + rule-based symptom matching.

    The BC5CDR model emits DISEASE and CHEMICAL labels. Symptoms are recovered
    via a symptom catalog so the pipeline remains useful for symptom triage.
    """

    def __init__(
        self,
        model_name: str = "en_ner_bc5cdr_md",
        symptom_catalog: Optional[Iterable[str]] = None,
    ):
        self.model_name = model_name
        self.symptom_catalog = sorted(
            {self._normalize_keyword(item) for item in (symptom_catalog or []) if item}
        )
        self.fallback_symptoms = {
            "fever",
            "cough",
            "fatigue",
            "headache",
            "nausea",
            "vomiting",
            "diarrhea",
            "chest pain",
            "shortness of breath",
            "rash",
        }
        self.nlp_biomedical = None

        if spacy is not None:
            try:
                self.nlp_biomedical = spacy.load(model_name)
            except Exception as exc:  # pragma: no cover - environment-dependent
                print(f"⚠️  SciSpaCy model unavailable ({model_name}): {exc}")

    @staticmethod
    def _normalize_keyword(value: str) -> str:
        return re.sub(r"\s+", " ", str(value).strip().lower().replace("_", " "))

    def set_symptom_catalog(self, symptom_catalog: Iterable[str]) -> None:
        self.symptom_catalog = sorted(
            {self._normalize_keyword(item) for item in symptom_catalog if item}
        )

    def _extract_symptoms(self, text: str) -> List[str]:
        text_lower = text.lower()
        candidates = self.symptom_catalog or sorted(self.fallback_symptoms)
        matches = []
        for symptom in candidates:
            if re.search(rf"\b{re.escape(symptom)}\b", text_lower):
                matches.append(symptom)
        return matches

    def extract_entities(self, text: str) -> Dict:
        entities = {
            "DISEASE": [],
            "SYMPTOM": [],
            "MEDICATION": [],
            "ANATOMY": [],
            "raw_entities": [],
        }

        if self.nlp_biomedical is not None:
            doc = self.nlp_biomedical(text)
            for ent in doc.ents:
                entity_text = ent.text.lower().strip()
                if ent.label_ == "DISEASE":
                    entities["DISEASE"].append(entity_text)
                elif ent.label_ == "CHEMICAL":
                    entities["MEDICATION"].append(entity_text)

                entities["raw_entities"].append(
                    {
                        "text": entity_text,
                        "label": ent.label_,
                        "confidence": 0.9,
                    }
                )

        symptoms = self._extract_symptoms(text)
        for symptom in symptoms:
            if symptom not in entities["SYMPTOM"]:
                entities["SYMPTOM"].append(symptom)
                entities["raw_entities"].append(
                    {"text": symptom, "label": "SYMPTOM", "confidence": 0.85}
                )

        for key in ("DISEASE", "SYMPTOM", "MEDICATION", "ANATOMY"):
            entities[key] = sorted(dict.fromkeys(entities[key]))

        return entities


class UMLSNormalizer:
    """Rule-based concept normalization with a configurable symptom vocabulary."""

    def __init__(self, vocabulary: Optional[Iterable[str]] = None):
        self.vocabulary = {
            self._normalize_value(item): str(item).replace(" ", "_")
            for item in (vocabulary or [])
        }
        self.umls_mappings = {
            "tummy ache": "abdominal pain",
            "stomach ache": "abdominal pain",
            "belly ache": "abdominal pain",
            "body ache": "myalgia",
            "sob": "shortness of breath",
            "high temperature": "fever",
            "runny nose": "rhinorrhea",
            "throat pain": "sore throat",
        }

    @staticmethod
    def _normalize_value(value: str) -> str:
        return re.sub(r"\s+", " ", str(value).strip().lower().replace("_", " "))

    def normalize(self, symptom: str) -> str:
        symptom_key = self._normalize_value(symptom)
        mapped = self.umls_mappings.get(symptom_key, symptom_key)
        if mapped in self.vocabulary:
            return self.vocabulary[mapped]
        return mapped.replace(" ", "_")

    def normalize_list(self, symptoms: List[str]) -> List[str]:
        normalized = [self.normalize(symptom) for symptom in symptoms]
        return list(dict.fromkeys(normalized))


class ContextFeatureExtractor:
    """Extract severity, duration, and simple demographics from narratives."""

    def __init__(self):
        self.severity_keywords = {
            "mild": 1,
            "slight": 1,
            "moderate": 2,
            "severe": 3,
            "extreme": 3,
            "acute": 3,
        }
        self.duration_patterns = {
            r"(\d+)\s*minute": ("minutes", 1 / 60),
            r"(\d+)\s*hour": ("hours", 1),
            r"(\d+)\s*day": ("days", 24),
            r"(\d+)\s*week": ("weeks", 24 * 7),
            r"(\d+)\s*month": ("months", 24 * 30),
            r"(\d+)\s*year": ("years", 24 * 365),
        }
        self.age_pattern = r"(\d+)\s*(?:year old|years old|yo|yr old)"
        self.gender_patterns = {
            r"\b(?:male|man|boy|he|him)\b": "male",
            r"\b(?:female|woman|girl|she|her)\b": "female",
        }

    def extract_severity(self, text: str) -> Dict:
        severity_score = 0
        for keyword, score in self.severity_keywords.items():
            if re.search(rf"\b{re.escape(keyword)}\b", text.lower()):
                severity_score = max(severity_score, score)

        level = {0: "unspecified", 1: "mild", 2: "moderate", 3: "severe"}[severity_score]
        return {
            "severity_level": level,
            "severity_score": severity_score,
            "raw_text": text,
        }

    def extract_duration(self, text: str) -> Dict:
        durations = []
        for pattern, (unit, hours) in self.duration_patterns.items():
            for match in re.finditer(pattern, text.lower()):
                value = int(match.group(1))
                durations.append(
                    {
                        "value": value,
                        "unit": unit,
                        "hours_equivalent": value * hours,
                    }
                )

        return {
            "duration_detected": bool(durations),
            "durations": durations,
            "primary_duration": durations[0] if durations else None,
        }

    def extract_demographics(self, text: str) -> Dict:
        demographics = {"age": None, "gender": None}
        age_match = re.search(self.age_pattern, text.lower())
        if age_match:
            demographics["age"] = int(age_match.group(1))

        for pattern, gender in self.gender_patterns.items():
            if re.search(pattern, text.lower()):
                demographics["gender"] = gender
                break

        return demographics

    def extract_all_features(self, text: str) -> Dict:
        return {
            "severity": self.extract_severity(text),
            "duration": self.extract_duration(text),
            "demographics": self.extract_demographics(text),
        }


@dataclass
class ClinicalBERTEncoder:
    model_name: str = "emilyalsentzer/Bio_ClinicalBERT"
    max_token_length: int = 512

    def __post_init__(self):
        self.tokenizer = None
        self.model = None
        self.embedding_dim = 768

        if AutoTokenizer is None or AutoModel is None or torch is None:
            print("⚠️  transformers/torch not installed; ClinicalBERT disabled")
            return

        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModel.from_pretrained(self.model_name)
            self.model.eval()
        except Exception as exc:  # pragma: no cover - environment-dependent
            print(f"⚠️  Error loading ClinicalBERT model {self.model_name}: {exc}")
            self.tokenizer = None
            self.model = None

    @property
    def available(self) -> bool:
        return self.tokenizer is not None and self.model is not None and torch is not None

    def tokenize(self, text: str) -> Dict:
        if not self.available:
            raise ValueError("ClinicalBERT tokenizer/model not available")

        encoded = self.tokenizer(
            text,
            max_length=self.max_token_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        input_ids = encoded["input_ids"]
        attention_mask = encoded["attention_mask"]

        return {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "num_tokens": int(attention_mask.sum().item()),
            "max_token_length": self.max_token_length,
            "was_truncated": int(attention_mask.sum().item()) >= self.max_token_length,
        }

    def encode(self, text: str) -> np.ndarray:
        encoded = self.tokenize(text)
        with torch.no_grad():
            outputs = self.model(
                input_ids=encoded["input_ids"],
                attention_mask=encoded["attention_mask"],
            )
            pooled = _safe_mean_pool(outputs.last_hidden_state, encoded["attention_mask"])
        return pooled.squeeze(0).cpu().numpy()


class HybridVectorizer:
    """TF-IDF + Bio_ClinicalBERT hybrid vectorization."""

    def __init__(
        self,
        model_name: str = "emilyalsentzer/Bio_ClinicalBERT",
        max_features: int = 2000,
        max_token_length: int = 512,
    ):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=max_features,
            lowercase=True,
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.98,
        )
        self.tfidf_fitted = False
        self.bert_encoder = ClinicalBERTEncoder(
            model_name=model_name,
            max_token_length=max_token_length,
        )
        self.embedding_dim = self.bert_encoder.embedding_dim

    def fit_tfidf(self, texts: List[str]) -> None:
        corpus = [text for text in texts if text]
        if not corpus:
            return
        self.tfidf_vectorizer.fit(corpus)
        self.tfidf_fitted = True
        print(f"✅ TF-IDF fitted on {len(corpus)} documents")

    def get_tfidf_vector(self, text: str) -> np.ndarray:
        if not self.tfidf_fitted:
            raise ValueError("TF-IDF vectorizer not fitted. Call fit_tfidf first.")
        return self.tfidf_vectorizer.transform([text]).toarray().flatten()

    def get_semantic_embedding(self, text: str) -> np.ndarray:
        return self.bert_encoder.encode(text)

    def get_tokenization_details(self, text: str) -> Dict:
        encoded = self.bert_encoder.tokenize(text)
        return {
            "num_tokens": encoded["num_tokens"],
            "max_token_length": encoded["max_token_length"],
            "was_truncated": encoded["was_truncated"],
        }

    def get_hybrid_vector(
        self,
        text: str,
        tfidf_weight: float = 0.35,
        semantic_weight: float = 0.65,
    ) -> np.ndarray:
        tfidf_vector = self.get_tfidf_vector(text)
        if len(tfidf_vector) < self.embedding_dim:
            tfidf_vector = np.pad(tfidf_vector, (0, self.embedding_dim - len(tfidf_vector)))
        else:
            tfidf_vector = tfidf_vector[: self.embedding_dim]

        tfidf_norm = np.linalg.norm(tfidf_vector)
        if tfidf_norm:
            tfidf_vector = tfidf_vector / tfidf_norm

        semantic_vector = self.get_semantic_embedding(text)
        semantic_norm = np.linalg.norm(semantic_vector)
        if semantic_norm:
            semantic_vector = semantic_vector / semantic_norm

        return tfidf_weight * tfidf_vector + semantic_weight * semantic_vector


class SemanticSearchEngine:
    """Cosine-similarity search over disease descriptions."""

    def __init__(self, vectorizer: HybridVectorizer):
        self.vectorizer = vectorizer
        self.disease_database: Dict[str, str] = {}
        self.disease_vectors: Dict[str, np.ndarray] = {}

    def build_disease_database(self, diseases: Dict[str, str]) -> None:
        self.disease_database = diseases
        self.disease_vectors = {}

        for disease_name, symptoms in diseases.items():
            try:
                self.disease_vectors[disease_name] = self.vectorizer.get_hybrid_vector(symptoms)
            except Exception as exc:
                print(f"⚠️  Error vectorizing disease {disease_name}: {exc}")

        print(f"✅ Built disease database with {len(self.disease_vectors)} diseases")

    def search_similar_diseases(self, user_symptoms: str, top_k: int = 3) -> List:
        try:
            user_vector = self.vectorizer.get_hybrid_vector(user_symptoms)
        except Exception as exc:
            print(f"⚠️  Error vectorizing user input: {exc}")
            return []

        similarities = {}
        for disease_name, disease_vector in self.disease_vectors.items():
            denominator = np.linalg.norm(user_vector) * np.linalg.norm(disease_vector) + 1e-8
            similarities[disease_name] = float(np.dot(user_vector, disease_vector) / denominator)

        return sorted(similarities.items(), key=lambda item: item[1], reverse=True)[:top_k]


class MedicalNLPPipeline:
    """End-to-end clinical NLP pipeline."""

    def __init__(
        self,
        model_name: str = "emilyalsentzer/Bio_ClinicalBERT",
        disease_corpus: Optional[Dict[str, str]] = None,
        symptom_catalog: Optional[Iterable[str]] = None,
    ):
        self.preprocessor = MedicalTextPreprocessor()
        self.ner = BiomedicalNER(symptom_catalog=symptom_catalog)
        self.normalizer = UMLSNormalizer(vocabulary=symptom_catalog)
        self.context_extractor = ContextFeatureExtractor()
        self.vectorizer = HybridVectorizer(model_name=model_name)
        self.search_engine = SemanticSearchEngine(self.vectorizer)
        self.symptom_catalog = list(symptom_catalog or [])

        corpus = disease_corpus or {}
        if corpus:
            self.vectorizer.fit_tfidf(list(corpus.values()))
            self.search_engine.build_disease_database(corpus)

    def update_search_corpus(
        self,
        disease_corpus: Dict[str, str],
        symptom_catalog: Optional[Iterable[str]] = None,
    ) -> None:
        if symptom_catalog is not None:
            self.symptom_catalog = list(symptom_catalog)
            self.ner.set_symptom_catalog(self.symptom_catalog)
            self.normalizer = UMLSNormalizer(vocabulary=self.symptom_catalog)

        if disease_corpus:
            self.vectorizer.fit_tfidf(list(disease_corpus.values()))
            self.search_engine.build_disease_database(disease_corpus)

    def process_narrative(self, text: str) -> Dict:
        cleaned_text = self.preprocessor.clean_text(text)
        entities = self.ner.extract_entities(cleaned_text)
        normalized_symptoms = self.normalizer.normalize_list(entities.get("SYMPTOM", []))

        result = {
            "raw_input": text,
            "preprocessing": {
                "cleaned_text": cleaned_text,
                "tokens": self.preprocessor.tokenize(cleaned_text),
            },
            "entity_extraction": entities,
            "normalization": {
                "raw_symptoms": entities.get("SYMPTOM", []),
                "normalized_symptoms": normalized_symptoms,
                "diseases": entities.get("DISEASE", []),
                "medications": entities.get("MEDICATION", []),
                "anatomy": entities.get("ANATOMY", []),
            },
            "context_features": self.context_extractor.extract_all_features(cleaned_text),
            "tokenization": {},
            "vectorization": {},
        }

        try:
            result["tokenization"] = self.vectorizer.get_tokenization_details(cleaned_text)
            tfidf_vector = self.vectorizer.get_tfidf_vector(cleaned_text)
            semantic_vector = self.vectorizer.get_semantic_embedding(cleaned_text)
            hybrid_vector = self.vectorizer.get_hybrid_vector(cleaned_text)
            result["vectorization"] = {
                "tfidf_vector_shape": tfidf_vector.shape,
                "semantic_vector_shape": semantic_vector.shape,
                "hybrid_vector_shape": hybrid_vector.shape,
                "semantic_vector": semantic_vector[:10].tolist(),
                "hybrid_vector": hybrid_vector[:10].tolist(),
            }
        except Exception as exc:
            result["vectorization"] = {"error": str(exc)}

        return result

    def find_matching_diseases(self, text: str, top_k: int = 3) -> List:
        return self.search_engine.search_similar_diseases(text, top_k=top_k)
