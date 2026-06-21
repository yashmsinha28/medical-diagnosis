"""
Clinical dataset ingestion utilities.

This module replaces the old single-demo-CSV assumptions with a dataset bundle:
- Symptom-Disease Prediction Dataset (structured symptom features)
- Disease-to-specialist mapping table
- Optional MIMIC-III note + diagnosis joins for narrative/NLP work
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import json
import re

import numpy as np
import pandas as pd
import yaml


TARGET_COLUMN_ALIASES = (
    "prognosis",
    "disease",
    "diagnosis",
    "label",
    "target",
)

DISEASE_COLUMN_ALIASES = (
    "disease",
    "diagnosis",
    "prognosis",
    "condition",
    "label",
)

SPECIALIST_COLUMN_ALIASES = (
    "specialist",
    "specialists",
    "specialty",
    "speciality",
    "medical_specialty",
    "department",
)

MIMIC_NOTE_COLUMN_ALIASES = (
    "text",
    "note_text",
    "clinical_note",
    "note",
)

ID_COLUMN_ALIASES = ("subject_id", "hadm_id")


def normalize_column_name(name: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9]+", "_", str(name).strip().lower())
    return re.sub(r"_+", "_", value).strip("_")


def normalize_label(value: str) -> str:
    value = str(value).strip()
    value = re.sub(r"\s+", " ", value)
    return value


def _read_table(path: Path) -> pd.DataFrame:
    suffix = path.suffix.lower()
    if suffix in {".csv", ".gz"}:
        return pd.read_csv(path)
    if suffix in {".tsv", ".txt"}:
        return pd.read_csv(path, sep="\t")
    if suffix in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    raise ValueError(f"Unsupported dataset format: {path}")


def _first_matching_column(columns: Iterable[str], aliases: Iterable[str]) -> Optional[str]:
    alias_set = {normalize_column_name(alias) for alias in aliases}
    normalized = {normalize_column_name(column): column for column in columns}
    for alias in alias_set:
        if alias in normalized:
            return normalized[alias]
    return None


def _coerce_binary_value(value) -> int:
    if pd.isna(value):
        return 0
    if isinstance(value, (int, np.integer, float, np.floating)):
        return int(float(value) > 0)
    cleaned = str(value).strip().lower()
    if cleaned in {"1", "true", "yes", "y", "present", "positive"}:
        return 1
    if cleaned in {"0", "false", "no", "n", "absent", "negative", ""}:
        return 0
    try:
        return int(float(cleaned) > 0)
    except ValueError:
        return 1


@dataclass
class StructuredClinicalDataset:
    dataframe: pd.DataFrame
    feature_names: List[str]
    target_column: str


@dataclass
class ClinicalDatasetBundle:
    structured: StructuredClinicalDataset
    disease_specialists: Dict[str, List[str]]
    disease_descriptions: Dict[str, str]
    disease_precautions: Dict[str, str]
    mimic_notes: Optional[pd.DataFrame]
    config: Dict


def load_symptom_disease_dataset(
    path: str | Path,
    target_column: Optional[str] = None,
) -> StructuredClinicalDataset:
    dataset_path = Path(path)
    if not dataset_path.exists():
        raise FileNotFoundError(f"Structured dataset not found: {dataset_path}")

    df = _read_table(dataset_path)
    df = df.loc[:, ~df.columns.astype(str).str.startswith("Unnamed")]
    df = df.rename(columns={column: normalize_column_name(column) for column in df.columns})

    detected_target = target_column or _first_matching_column(df.columns, TARGET_COLUMN_ALIASES)
    if not detected_target:
        raise ValueError(
            "Unable to find target column in structured dataset. "
            f"Tried aliases: {', '.join(TARGET_COLUMN_ALIASES)}"
        )

    df[detected_target] = df[detected_target].map(normalize_label)

    symptom_slot_columns = [
        column for column in df.columns if column != detected_target and column.startswith("symptom_")
    ]
    if symptom_slot_columns:
        normalized_slots = df[symptom_slot_columns].apply(
            lambda column: (
                column.fillna("")
                .astype(str)
                .str.strip()
                .str.lower()
                .str.replace(r"[^a-z0-9]+", "_", regex=True)
                .str.replace(r"_+", "_", regex=True)
                .str.strip("_")
            )
        )
        symptoms = sorted(
            {
                symptom
                for symptom in normalized_slots.to_numpy().ravel()
                if symptom
            }
        )
        encoded = pd.DataFrame(0, index=df.index, columns=symptoms, dtype=np.int8)
        for column in symptom_slot_columns:
            active = normalized_slots[column]
            for idx, symptom in active.items():
                if symptom:
                    encoded.at[idx, symptom] = 1
        encoded.insert(0, detected_target, df[detected_target].values)
        df = encoded

    feature_names = [column for column in df.columns if column != detected_target]
    if not feature_names:
        raise ValueError("Structured dataset has no symptom feature columns.")

    for feature in feature_names:
        df[feature] = df[feature].map(_coerce_binary_value).astype(np.int8)

    df = df.dropna(subset=[detected_target]).reset_index(drop=True)

    return StructuredClinicalDataset(
        dataframe=df,
        feature_names=feature_names,
        target_column=detected_target,
    )


def load_disease_specialist_mapping(path: str | Path) -> Dict[str, List[str]]:
    mapping_path = Path(path)
    if not mapping_path.exists():
        raise FileNotFoundError(f"Specialist mapping dataset not found: {mapping_path}")

    df = _read_table(mapping_path)
    df = df.rename(columns={column: normalize_column_name(column) for column in df.columns})

    disease_column = _first_matching_column(df.columns, DISEASE_COLUMN_ALIASES)
    specialist_column = _first_matching_column(df.columns, SPECIALIST_COLUMN_ALIASES)

    if not disease_column or not specialist_column:
        raise ValueError(
            "Specialist mapping dataset must contain a disease column and a "
            "specialist/specialty column."
        )

    grouped: Dict[str, List[str]] = {}
    for row in df[[disease_column, specialist_column]].dropna().itertuples(index=False):
        disease = normalize_label(row[0])
        raw_specialists = re.split(r"[|,;/]", str(row[1]))
        specialists = [normalize_label(item) for item in raw_specialists if str(item).strip()]
        if disease not in grouped:
            grouped[disease] = []
        for specialist in specialists:
            if specialist and specialist not in grouped[disease]:
                grouped[disease].append(specialist)

    return grouped


def load_disease_descriptions(path: str | Path) -> Dict[str, str]:
    source_path = Path(path)
    if not source_path.exists():
        raise FileNotFoundError(f"Description dataset not found: {source_path}")

    df = _read_table(source_path)
    df = df.rename(columns={column: normalize_column_name(column) for column in df.columns})
    disease_column = _first_matching_column(df.columns, DISEASE_COLUMN_ALIASES)
    description_column = _first_matching_column(df.columns, ("description", "details", "summary"))
    if not disease_column or not description_column:
        raise ValueError("Description dataset must contain disease and description columns.")

    return {
        normalize_label(row[0]): str(row[1]).strip()
        for row in df[[disease_column, description_column]].dropna().itertuples(index=False)
    }


def load_disease_precautions(path: str | Path) -> Dict[str, str]:
    source_path = Path(path)
    if not source_path.exists():
        raise FileNotFoundError(f"Precaution dataset not found: {source_path}")

    df = _read_table(source_path)
    df = df.rename(columns={column: normalize_column_name(column) for column in df.columns})
    disease_column = _first_matching_column(df.columns, DISEASE_COLUMN_ALIASES)
    precaution_columns = [column for column in df.columns if column.startswith("precaution_")]
    if not disease_column or not precaution_columns:
        raise ValueError("Precaution dataset must contain disease and precaution columns.")

    precautions = {}
    for row in df[[disease_column] + precaution_columns].itertuples(index=False):
        disease = normalize_label(row[0])
        items = [str(item).strip() for item in row[1:] if str(item).strip() and str(item).strip().lower() != "nan"]
        precautions[disease] = "; ".join(items)
    return precautions


def merge_mimic_notes_with_diagnoses(
    noteevents_path: str | Path,
    diagnoses_path: str | Path,
) -> pd.DataFrame:
    notes_path = Path(noteevents_path)
    diagnoses_path = Path(diagnoses_path)

    if not notes_path.exists() or not diagnoses_path.exists():
        missing = [str(path) for path in (notes_path, diagnoses_path) if not path.exists()]
        raise FileNotFoundError(f"MIMIC-III files not found: {', '.join(missing)}")

    notes = _read_table(notes_path)
    diagnoses = _read_table(diagnoses_path)

    notes = notes.rename(columns={column: normalize_column_name(column) for column in notes.columns})
    diagnoses = diagnoses.rename(
        columns={column: normalize_column_name(column) for column in diagnoses.columns}
    )

    note_text_column = _first_matching_column(notes.columns, MIMIC_NOTE_COLUMN_ALIASES)
    subject_column = _first_matching_column(notes.columns, ("subject_id",))
    hadm_column = _first_matching_column(notes.columns, ("hadm_id",))
    icd_column = _first_matching_column(diagnoses.columns, ("icd9_code", "icd_code"))

    if not all([note_text_column, subject_column, hadm_column, icd_column]):
        raise ValueError(
            "MIMIC-III files must expose SUBJECT_ID, HADM_ID, TEXT, and ICD9_CODE-equivalent columns."
        )

    diagnosis_agg = (
        diagnoses[[subject_column, hadm_column, icd_column]]
        .dropna(subset=[icd_column])
        .groupby([subject_column, hadm_column])[icd_column]
        .agg(lambda codes: sorted({str(code).strip() for code in codes if str(code).strip()}))
        .reset_index(name="icd9_codes")
    )

    merged = notes.merge(
        diagnosis_agg,
        on=[subject_column, hadm_column],
        how="inner",
    )
    merged = merged.dropna(subset=[note_text_column]).reset_index(drop=True)
    merged = merged.rename(columns={note_text_column: "clinical_note"})
    return merged


def build_disease_descriptions(
    structured_dataset: StructuredClinicalDataset,
    top_n_symptoms: int = 12,
) -> Dict[str, str]:
    df = structured_dataset.dataframe
    feature_names = structured_dataset.feature_names
    target_column = structured_dataset.target_column

    descriptions: Dict[str, str] = {}
    for disease, group in df.groupby(target_column):
        prevalence = group[feature_names].mean().sort_values(ascending=False)
        selected = prevalence[prevalence > 0].head(top_n_symptoms).index.tolist()
        descriptions[str(disease)] = " ".join(selected)

    return descriptions


def load_dataset_bundle(config_path: str | Path = "config/config.yaml") -> ClinicalDatasetBundle:
    config_file = Path(config_path)
    if not config_file.exists():
        raise FileNotFoundError(f"Dataset config not found: {config_file}")

    with config_file.open("r") as handle:
        config = yaml.safe_load(handle) or {}

    dataset_cfg = config.get("datasets", {})
    structured_cfg = dataset_cfg.get("symptom_disease_prediction", {})
    mapping_cfg = dataset_cfg.get("specialist_mapping", {})
    description_cfg = dataset_cfg.get("disease_descriptions", {})
    precaution_cfg = dataset_cfg.get("disease_precautions", {})
    mimic_cfg = dataset_cfg.get("mimic_iii", {})

    structured = load_symptom_disease_dataset(
        structured_cfg.get("path", "data/clinical/symptom_disease_prediction.csv"),
        target_column=structured_cfg.get("target_column"),
    )

    disease_specialists = {}
    mapping_path = mapping_cfg.get("path")
    if mapping_path:
        try:
            disease_specialists = load_disease_specialist_mapping(mapping_path)
        except Exception:
            disease_specialists = {}

    disease_descriptions = build_disease_descriptions(structured)
    description_path = description_cfg.get("path")
    if description_path:
        try:
            disease_descriptions.update(load_disease_descriptions(description_path))
        except Exception:
            pass

    disease_precautions = {}
    precaution_path = precaution_cfg.get("path")
    if precaution_path:
        try:
            disease_precautions = load_disease_precautions(precaution_path)
        except Exception:
            disease_precautions = {}

    mimic_notes = None
    if mimic_cfg.get("enabled"):
        notes_path = mimic_cfg.get("noteevents_path")
        diagnoses_path = mimic_cfg.get("diagnoses_path")
        if notes_path and diagnoses_path:
            mimic_notes = merge_mimic_notes_with_diagnoses(notes_path, diagnoses_path)

    return ClinicalDatasetBundle(
        structured=structured,
        disease_specialists=disease_specialists,
        disease_descriptions=disease_descriptions,
        disease_precautions=disease_precautions,
        mimic_notes=mimic_notes,
        config=config,
    )


def save_specialist_mapping(mapping: Dict[str, List[str]], path: str | Path) -> None:
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w") as handle:
        json.dump(mapping, handle, indent=2, sort_keys=True)
