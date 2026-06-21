import joblib
from typing import List
import numpy as np

def save_model(model, path: str):
    joblib.dump(model, path)

def load_model(path: str):
    model = joblib.load(path)
    # Ensure model does not use all CPU cores at inference time which can lock the machine
    try:
        if hasattr(model, 'n_jobs'):
            model.n_jobs = 1
    except Exception:
        pass
    return model

def save_symptom_columns(columns: List[str], path: str):
    joblib.dump(columns, path)

def load_symptom_columns(path: str) -> List[str]:
    return joblib.load(path)

def predict(model, input_vector: np.ndarray):
    probs = model.predict_proba([input_vector])[0]
    classes = model.classes_
    top_idx = probs.argsort()[::-1]
    return [(classes[i], float(probs[i])) for i in top_idx]
