"""
WSGI entry point for Waitress production server.
"""
from app_flask import app, load_artifacts
import threading

# Load artifacts in background on startup
loader_thread = threading.Thread(target=load_artifacts, daemon=True)
loader_thread.start()

if __name__ == "__main__":
    from waitress import serve
    print("🚀 Starting Waitress production server on http://127.0.0.1:5000")
    print("⏳ Artifacts loading in background...")
    # 4 threads for concurrent requests, 120 second timeout
    serve(app, host='127.0.0.1', port=5000, threads=4, _quiet=False)
