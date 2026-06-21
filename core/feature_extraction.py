from __future__ import annotations

from typing import Iterable, List
import re

import numpy as np


def normalize_symptom_text(value: str) -> str:
    cleaned = str(value).strip().lower().replace("_", " ").replace("-", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def symptoms_to_vector(user_symptoms: List[str], symptom_columns: List[str]) -> np.ndarray:
    normalized_inputs = {normalize_symptom_text(symptom) for symptom in user_symptoms}
    vector = np.zeros(len(symptom_columns), dtype=int)

    for index, column in enumerate(symptom_columns):
        if normalize_symptom_text(column) in normalized_inputs:
            vector[index] = 1

    return vector


def active_symptoms_from_dict(symptoms: dict) -> List[str]:
    return [name for name, value in symptoms.items() if bool(value)]
