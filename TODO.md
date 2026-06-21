# Project Loading Fix TODO

## Steps to complete:

- [x] Step 1: Create Python virtual environment (venv created; install deps manually: .\venv\Scripts\Activate.ps1 && pip install -r minimal_requirements.txt)
- [x] Step 2: Update requirements.txt (remove deprecated pickle5)
- [x] Step 3: Update app_flask.py (configurable port, better load_artifacts error handling)
- [x] Step 4: Test project loading with `python app_flask.py` and verify /health endpoint

Current progress: All steps complete ✅

**Verification:**
- App loads successfully: http://127.0.0.1:5000
- Artifacts (models/datasets) loaded without errors.
- Graceful error handling added for future issues.

**To test endpoints (new terminal):**
```
curl http://127.0.0.1:5000/api/health
curl http://127.0.0.1:5000/api/symptoms
curl -X POST http://127.0.0.1:5000/api/predict -H "Content-Type: application/json" -d "{\"symptoms\": [\"vomiting\", \"fatigue\"]}"
```
Open http://127.0.0.1:5000 in browser.

Current progress: Starting Step 1
