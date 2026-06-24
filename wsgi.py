"""
WSGI entry point for production server (Gunicorn on Render).
"""
from app_flask import app, load_artifacts
import sys

# Load artifacts SYNCHRONOUSLY before gunicorn starts serving requests.
# This ensures the model and symptom data are available in every worker process.
try:
    print("Loading ML artifacts...", flush=True)
    load_artifacts()
    print("ML artifacts loaded successfully.", flush=True)
except Exception as exc:
    print(f"FATAL: Failed to load artifacts: {exc}", file=sys.stderr, flush=True)

if __name__ == "__main__":
    from waitress import serve
    print("Starting Waitress production server on http://127.0.0.1:5000")
    # 4 threads for concurrent requests, 120 second timeout
    serve(app, host='127.0.0.1', port=5000, threads=4, _quiet=False)
