"""
Agentic Microservice Flask Integration
======================================

Exposes agentic AI agents as REST endpoints.
Independent microservice communicating with core backend.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import json
import os

# Import agentic pipeline
try:
    from core.agentic_microservice import (
        AgenticPipeline,
        SymptomPredictionAgent,
        SpecialistMappingAgent,
        HospitalSearchAgent,
        ClinicalAnalysisAgent
    )
    AGENTIC_AVAILABLE = True
except ImportError:
    AGENTIC_AVAILABLE = False

# Create blueprint
agentic_bp = Blueprint('agentic', __name__, url_prefix='/api/agentic')

# Global pipeline instance
pipeline = None


def initialize_pipeline():
    """Initialize agentic pipeline"""
    global pipeline
    if AGENTIC_AVAILABLE:
        try:
            pipeline = AgenticPipeline()
            print("[OK] Agentic Pipeline initialized")
            return True
        except Exception as e:
            print(f"❌ Agentic Pipeline initialization failed: {e}")
            return False
    return False


def get_pipeline():
    """Return the shared agentic pipeline instance."""
    return pipeline


@agentic_bp.route('/status', methods=['GET'])
def agentic_status():
    """
    Get status of all agentic agents.
    
    Returns:
    {
        'status': 'available' | 'unavailable',
        'agents': {
            'agent_name': {
                'status': 'active' | 'inactive',
                'capabilities': [...]
            }
        }
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'unavailable',
            'message': 'Agentic pipeline not available',
            'timestamp': datetime.now().isoformat()
        }), 503
    
    try:
        agent_status = pipeline.get_agent_status()
        return jsonify({
            'status': 'available',
            'pipeline_id': agent_status['pipeline_id'],
            'agents': agent_status['agents'],
            'total_pipelines_executed': agent_status['total_pipelines_executed'],
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500


@agentic_bp.route('/symptom-prediction', methods=['POST'])
def symptom_prediction_agent():
    """
    Symptom Prediction Agent endpoint.
    
    Request:
    {
        'symptoms': {
            'fever': true,
            'cough': true,
            'fatigue': true
        }
    }
    
    Response:
    {
        'agent_id': 'symptom_prediction_agent_v1',
        'predictions': [
            {
                'disease': 'Influenza',
                'confidence': 0.92,
                'votes': 6,
                'reasoning': 'All 6 models in consensus'
            },
            ...
        ],
        'status': 'success'
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'error',
            'error': 'Agentic pipeline not available'
        }), 503
    
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', {})
        
        # Get symptom prediction agent
        agent = pipeline.agents['symptom_prediction']
        result = agent.predict(symptoms)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400


@agentic_bp.route('/specialist-mapping', methods=['POST'])
def specialist_mapping_agent():
    """
    Specialist Mapping Agent endpoint.
    
    Request:
    {
        'diseases': ['Influenza', 'Pneumonia']
    }
    
    Response:
    {
        'agent_id': 'specialist_mapping_agent_v1',
        'specialists': [
            {
                'disease': 'Influenza',
                'recommended_specialists': ['Infectious Disease Specialist', 'General Practitioner'],
                'priority': 1
            },
            ...
        ],
        'status': 'success'
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'error',
            'error': 'Agentic pipeline not available'
        }), 503
    
    try:
        data = request.get_json()
        diseases = data.get('diseases', [])
        
        # Get specialist mapping agent
        agent = pipeline.agents['specialist_mapping']
        result = agent.map_specialists(diseases)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400


@agentic_bp.route('/hospital-search', methods=['POST'])
def hospital_search_agent():
    """
    Hospital Search Agent endpoint.
    
    Request:
    {
        'location': {'lat': 37.7749, 'lng': -122.4194},
        'specialists': ['Cardiologist', 'Pulmonologist'],
        'radius_km': 10
    }
    
    Response:
    {
        'agent_id': 'hospital_search_agent_v1',
        'hospitals': [
            {
                'name': 'City Medical Center',
                'location': {'lat': ..., 'lng': ...},
                'specialists': [...],
                'distance_km': 2.5,
                'rating': 4.8
            },
            ...
        ],
        'total_results': 5,
        'status': 'success'
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'error',
            'error': 'Agentic pipeline not available'
        }), 503
    
    try:
        data = request.get_json()
        location = data.get('location')
        specialists = data.get('specialists', [])
        radius_km = data.get('radius_km', 10)
        
        # Get hospital search agent
        agent = pipeline.agents['hospital_search']
        result = agent.search_hospitals(
            location=location,
            specialists=specialists,
            radius_km=radius_km
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400


@agentic_bp.route('/clinical-analysis', methods=['POST'])
def clinical_analysis_agent():
    """
    Clinical Analysis Agent endpoint.
    
    Request:
    {
        'narrative': 'Patient reports high fever and persistent cough for 3 days...'
    }
    
    Response:
    {
        'agent_id': 'clinical_analysis_agent_v1',
        'analysis': {
            'symptoms': ['fever', 'cough'],
            'severity': 'moderate',
            'duration': '3 days',
            'clinical_summary': '...',
            'potential_diseases': [...]
        },
        'status': 'success'
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'error',
            'error': 'Agentic pipeline not available'
        }), 503
    
    try:
        data = request.get_json()
        narrative = data.get('narrative', '')
        
        # Get clinical analysis agent
        agent = pipeline.agents['clinical_analysis']
        result = agent.analyze_narrative(narrative)
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400


@agentic_bp.route('/full-pipeline', methods=['POST'])
def full_pipeline_execution():
    """
    Execute full coordinated pipeline through all agents.
    
    Request:
    {
        'symptoms': {
            'fever': true,
            'cough': true,
            'fatigue': true
        },
        'narrative': 'Patient reports...',  # optional
        'location': {'lat': 37.7749, 'lng': -122.4194}  # optional
    }
    
    Response:
    {
        'pipeline_id': 'pipeline_20260403_143022',
        'agents_executed': [
            {
                'agent_id': 'clinical_analysis_agent_v1',
                'timestamp': '2026-04-03T14:30:22.123456',
                'analysis': {...}
            },
            ...
        ],
        'final_recommendations': {
            'predicted_diseases': ['Influenza', 'Pneumonia'],
            'recommended_specialists': [...],
            'nearby_hospitals': [...],
            'clinical_notes': '...'
        },
        'execution_time_ms': 1234.56,
        'status': 'success'
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'error',
            'error': 'Agentic pipeline not available'
        }), 503
    
    try:
        data = request.get_json()
        symptoms = data.get('symptoms', {})
        narrative = data.get('narrative')
        location = data.get('location')
        
        # Execute full pipeline
        result = pipeline.execute_full_pipeline(
            symptoms=symptoms,
            narrative=narrative,
            location=location
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400


@agentic_bp.route('/execution-history', methods=['GET'])
def execution_history():
    """
    Get recent pipeline execution history.
    
    Query params:
    - limit: number of recent executions to return (default: 10)
    
    Response:
    {
        'total_executions': 25,
        'recent_executions': [
            {
                'pipeline_id': '...',
                'timestamp': '...',
                'status': 'success' | 'error',
                'execution_time_ms': 1234.56
            },
            ...
        ]
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'status': 'error',
            'error': 'Agentic pipeline not available'
        }), 503
    
    try:
        limit = request.args.get('limit', 10, type=int)
        history = pipeline.get_execution_history(limit=limit)
        
        return jsonify({
            'total_executions': len(pipeline.execution_history),
            'recent_executions': [
                {
                    'pipeline_id': h.get('pipeline_id'),
                    'timestamp': h.get('timestamp'),
                    'status': h.get('status'),
                    'execution_time_ms': h.get('execution_time_ms'),
                    'agents_count': len(h.get('agents_executed', []))
                }
                for h in history
            ]
        })
    
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 400


@agentic_bp.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint for microservice monitoring.
    
    Response:
    {
        'service': 'agentic_microservice',
        'status': 'healthy' | 'degraded' | 'unhealthy',
        'agents_active': 4,
        'agents_inactive': 0,
        'timestamp': '...'
    }
    """
    if not AGENTIC_AVAILABLE or pipeline is None:
        return jsonify({
            'service': 'agentic_microservice',
            'status': 'unhealthy',
            'error': 'Pipeline not initialized',
            'timestamp': datetime.now().isoformat()
        }), 503
    
    try:
        agent_status = pipeline.get_agent_status()
        agents = agent_status.get('agents', {})
        
        active_count = sum(
            1 for a in agents.values()
            if a.get('status') == 'active'
        )
        inactive_count = len(agents) - active_count
        
        status = 'healthy' if inactive_count == 0 else 'degraded'
        
        return jsonify({
            'service': 'agentic_microservice',
            'status': status,
            'agents_active': active_count,
            'agents_inactive': inactive_count,
            'total_agents': len(agents),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        return jsonify({
            'service': 'agentic_microservice',
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500
