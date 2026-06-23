import json
from pathlib import Path

import pandas as pd
import yaml
from flask import Flask, jsonify, render_template, request, session, send_from_directory
from datetime import datetime, timedelta
import os
import threading

from core.clinical_data import load_dataset_bundle

from core.feature_extraction import symptoms_to_vector
from core.model_handler import load_model, load_symptom_columns


app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = 'disease-prediction-app-secret-key-change-in-production'
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_COOKIE_SECURE'] = False  # Allow over HTTP for localhost
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

DEFAULT_MODEL_PATH = "models/disease_prediction_model.pkl"
DEFAULT_SYMPTOM_COLUMNS_PATH = "models/symptom_columns.pkl"
CONFIG_PATH = "config/config.yaml"
ADVICE_PATH = "config/advice.json"

model = None
symptom_columns = []
disease_descriptions = {}
disease_precautions = {}
dataset_status = {}
dashboard_summary = {}
artifacts_ready = False


def load_runtime_config():
    config_file = Path(CONFIG_PATH)
    if not config_file.exists():
        return {}
    with config_file.open("r") as handle:
        return yaml.safe_load(handle) or {}


def collect_dataset_status(config):
    datasets_cfg = config.get("datasets", {})
    structured_path = datasets_cfg.get("symptom_disease_prediction", {}).get(
        "path", "data/clinical/dataset.csv"
    )
    description_path = datasets_cfg.get("disease_descriptions", {}).get(
        "path", "data/clinical/symptom_Description.csv"
    )
    precaution_path = datasets_cfg.get("disease_precautions", {}).get(
        "path", "data/clinical/symptom_precaution.csv"
    )

    return {
        "structured_dataset_path": structured_path,
        "structured_dataset_present": Path(structured_path).exists(),
        "description_dataset_path": description_path,
        "description_dataset_present": Path(description_path).exists(),
        "precaution_dataset_path": precaution_path,
        "precaution_dataset_present": Path(precaution_path).exists(),
    }


def load_artifacts():
    global model, symptom_columns, disease_descriptions, disease_precautions, dataset_status
    global dashboard_summary, artifacts_ready

    try:
        config = load_runtime_config()
        dataset_status = collect_dataset_status(config)
        model_cfg = config.get("models", {})

        model_path = model_cfg.get("baseline_model_path", DEFAULT_MODEL_PATH)
        symptom_columns_path = model_cfg.get("symptom_columns_path", DEFAULT_SYMPTOM_COLUMNS_PATH)

        model = load_model(model_path)
        symptom_columns = load_symptom_columns(symptom_columns_path)

        bundle = load_dataset_bundle(CONFIG_PATH)
        disease_descriptions = bundle.disease_descriptions
        # Load CSV-based precautions as the base, then layer advice.json on top
        disease_precautions = bundle.disease_precautions

        advice_file = Path(ADVICE_PATH)
        if advice_file.exists():
            try:
                with advice_file.open("r") as handle:
                    advice_overrides = json.load(handle)
                    disease_precautions.update(advice_overrides)
            except Exception:
                pass

        structured = bundle.structured
        df = structured.dataframe
        disease_counts = (
            df[structured.target_column]
            .astype(str)
            .value_counts()
            .sort_values(ascending=False)
        )
        symptom_frequency = (
            df[structured.feature_names]
            .sum()
            .sort_values(ascending=False)
        )

        dashboard_summary = {
            "kpis": {
                "patient_records": int(len(df)),
                "symptom_features": int(len(structured.feature_names)),
                "disease_classes": int(df[structured.target_column].nunique()),
                "model_type": type(model).__name__ if model is not None else "Unavailable",
            },
            "top_diseases": [
                {"label": disease, "value": int(count)}
                for disease, count in disease_counts.head(10).items()
            ],
            "top_symptoms": [
                {"label": symptom.replace("_", " "), "value": int(count)}
                for symptom, count in symptom_frequency.head(10).items()
            ],
            "disease_proportion": [
                {"label": disease, "value": int(count)}
                for disease, count in disease_counts.head(30).items()
            ],
            "disease_percentage": [
                {"label": disease, "value": round((count / len(df)) * 100, 2)}
                for disease, count in disease_counts.head(30).items()
            ],
            "age_distribution": [
                {"label": str(age), "value": int(count)}
                for age, count in df["age"].value_counts().sort_index().items()
            ] if "age" in df.columns else [],
            "dataset_overview": {
                "target_column": structured.target_column,
                "training_source": dataset_status.get("structured_dataset_path"),
            },
        }

        artifacts_ready = True
        print("[OK] Artifacts loaded successfully (background thread)")
    except Exception as exc:
        artifacts_ready = False
        print(f"[WARNING] Failed to load artifacts in background: {exc}")


@app.route("/")
def index():
    return render_template("index.html", symptoms=symptom_columns)


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify(
        {
            "status": "ok",
            "model_loaded": model is not None,
            "symptom_count": len(symptom_columns),
            "dataset_status": dataset_status,
            "artifacts_ready": artifacts_ready,
        }
    )


@app.route("/api/symptoms", methods=["GET"])
def get_symptoms():
    return jsonify({"symptoms": symptom_columns, "count": len(symptom_columns)})


@app.route("/api/dashboard-summary", methods=["GET"])
def get_dashboard_summary():
    return jsonify(dashboard_summary)


@app.route("/api/predict", methods=["POST"])
def predict():
    data = request.json or {}
    symptoms = data.get("symptoms", [])
    patient_data = data.get("patient_data", {})
    disease_details = data.get("disease_details", {})

    if not symptoms:
        return jsonify({"error": "No symptoms provided"}), 400

    # If artifacts still loading, return a 503 so the client can retry without hanging
    if not artifacts_ready or model is None:
        return jsonify({"error": "Service initializing, model/artifacts are still loading. Try again shortly."}), 503

    try:
        input_vec = symptoms_to_vector(symptoms, symptom_columns)
        if int(input_vec.sum()) == 0:
            return jsonify(
                {
                    "error": "None of the submitted symptoms matched the trained dataset vocabulary."
                }
            ), 400

        input_df = pd.DataFrame([input_vec], columns=symptom_columns)
        probabilities = model.predict_proba(input_df)[0]
        classes = model.classes_

        top_indices = probabilities.argsort()[::-1][:3]
        predictions = []
        for index in top_indices:
            disease = str(classes[index])
            predictions.append(
                {
                    "disease": disease,
                    "confidence": round(float(probabilities[index] * 100), 2),
                    "description": disease_descriptions.get(
                        disease, "Description not available for this disease."
                    ),
                    "advice": disease_precautions.get(
                        disease, "Consult a healthcare provider for further evaluation."
                    ),
                }
            )

        # Store to session for report
        session['report_data'] = {
            'timestamp': datetime.now().isoformat(),
            'patient_data': patient_data,
            'disease_details': disease_details,
            'symptoms': symptoms,
            'predictions': predictions
        }

        return jsonify({"predictions": predictions, "matched_symptoms": int(input_vec.sum())})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/medical-history", methods=["POST"])
def save_medical_history():
    data = request.json or {}
    session['medical_history'] = data
    print("Medical history saved to session:", data)
    return jsonify({"status": "success", "received": data})


@app.route("/api/report", methods=["GET"])
def get_report():
    report_data = session.get('report_data', {})
    report_data['medical_history'] = session.get('medical_history', {})
    report_data['timestamp'] = report_data.get('timestamp', datetime.now().isoformat())
    return jsonify(report_data)


@app.route("/api/generate-pdf", methods=["POST"])
def generate_pdf():
    # Lazy import heavy PDF libs to avoid import cost on startup when endpoint not used
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib import colors
        from reportlab.lib.units import inch
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        from reportlab.lib.styles import ParagraphStyle as ParaStyle
    except Exception as e:
        return jsonify({"error": "PDF generation libraries not available: %s" % str(e)}), 500

    data = session.get('report_data', {})
    data['medical_history'] = session.get('medical_history', {})
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"reports/report_{timestamp}.pdf"
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    doc = SimpleDocTemplate(filename, pagesize=letter, rightMargin=72, leftMargin=72,
                                  topMargin=72, bottomMargin=18)
    # Custom styles
    styles = getSampleStyleSheet()
    title_style = ParaStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#0f4c81'),
        fontName='Helvetica-Bold'
    )
    heading2_style = ParaStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=12,
        alignment=TA_LEFT,
        textColor=colors.HexColor('#0f4c81'),
        fontName='Helvetica-Bold'
    )
    normal_style = ParaStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=11,
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica'
    )

    story = []
    # Header
    title = Paragraph("Medical Diagnosis Report", title_style)
    story.append(title)
    app_name = Paragraph("Powered by Disease Prediction Workspace", normal_style)
    story.append(app_name)
    story.append(Spacer(1, 20))
    ts_para = Paragraph(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", normal_style)
    story.append(ts_para)
    story.append(Spacer(1, 20))

    patient_data = data.get('patient_data', {})
    patient_name = patient_data.get('name', 'Anonymous Patient')
    story.append(Paragraph(f"Patient: {patient_name}", heading2_style))
    story.append(Spacer(1, 12))

    patient_table_data = [['Field', 'Value']]

    for k, v in patient_data.items():
        patient_table_data.append([k.replace('_', ' ').title(), v or 'N/A'])
    patient_table = Table(patient_table_data, colWidths=[2*inch, 4*inch])
    patient_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f4c81')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#0f4c81')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(patient_table)
    story.append(Spacer(1, 12))



    # Medical History
    mh = data.get('medical_history', {})
    story.append(Paragraph("Medical History", heading2_style))
    mh_table_data = [['Category', 'Details']]
    for k, v in mh.items():
        mh_table_data.append([k.replace('_', ' ').title(), v or 'N/A'])
    mh_table = Table(mh_table_data, colWidths=[2*inch, 4*inch])
    mh_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f4c81')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#0f4c81')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
    ]))
    story.append(mh_table)
    story.append(Spacer(1, 12))



    # Symptoms
    symptoms = data.get('symptoms', [])
    story.append(Paragraph("Reported Symptoms", heading2_style))
    symptoms_para = Paragraph(", ".join(symptoms) if symptoms else "None reported", normal_style)
    story.append(symptoms_para)
    story.append(Spacer(1, 12))

    # Predictions
    predictions = data.get('predictions', [])
    story.append(Paragraph("Prediction Results", heading2_style))
    heading3_style = ParaStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=8,
        textColor=colors.HexColor('#0f4c81'),
        fontName='Helvetica-Bold'
    )

    italic_style = ParaStyle(
        'CustomItalic',
        parent=styles['Italic'],
        fontSize=10,
        textColor=colors.darkblue
    )
    for i, pred in enumerate(predictions[:3], 1):
        pred_title = Paragraph(f"{i}. {pred['disease']} - Confidence: {pred['confidence']} %", heading3_style)
        story.append(pred_title)
        desc_para = Paragraph(f"Description: {pred['description']}", normal_style)
        story.append(desc_para)
        advice_para = Paragraph(f"Recommended Actions: {pred['advice']}", italic_style)
        story.append(advice_para)
        story.append(Spacer(1, 12))

    # Footer
    footer_style = ParaStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        spaceBefore=20,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    footer = Paragraph("This is an educational tool only. Consult a healthcare professional for diagnosis and treatment. © Disease Prediction Workspace", footer_style)
    story.append(footer)

    doc.build(story)

    return jsonify({"status": "success", "filename": os.path.basename(filename), "download_url": f"/reports/{os.path.basename(filename)}"})




@app.route('/reports/<filename>')
def serve_report(filename):
    return send_from_directory('reports', filename)


if __name__ == "__main__":
    # Start loading artifacts in background so the web server becomes responsive quickly.
    loader_thread = threading.Thread(target=load_artifacts, daemon=True)
    loader_thread.start()

    port = int(os.environ.get('PORT', 3000))
    print(f"Starting app on http://127.0.0.1:{port} (artifacts loading in background)")
    # Disable debugger and reloader for better performance and to avoid double process on Windows
    # Enable threaded mode so the server can handle concurrent requests while background loading occurs
    app.run(debug=False, use_reloader=False, threaded=True, port=port, host="127.0.0.1")
