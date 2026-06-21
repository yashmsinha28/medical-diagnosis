/* ═══════════════════════════════════════════════════════════
   MEDICAL DIAGNOSIS WORKSPACE — Enhanced JavaScript
   ═══════════════════════════════════════════════════════════ */

/* ── Chart Instances ── */
let diseaseChart = null;
let symptomChart = null;
let ageHistogram = null;
let diseaseHistogram = null;
let diseasePieChart = null;
let outlierScatterChart = null;
let featureImportanceChart = null;

/* ── Chart.js Global Theme ── */
Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#64748b';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.elements.bar.borderRadius = 6;
Chart.defaults.elements.bar.borderSkipped = false;

/* ══════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ══════════════════════════════════════ */
const TOAST_ICONS = {
    info: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    success: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    warning: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => toast.remove());
    }, duration);
}

/* ══════════════════════════════════════
   SYMPTOM SELECTOR (Search + Tags)
   ══════════════════════════════════════ */
let allSymptoms = [];
let selectedSymptoms = new Set();

function initSymptomSelector() {
    const searchInput = document.getElementById('symptomSearch');
    const dropdown = document.getElementById('symptomDropdown');

    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        renderSymptomDropdown(query);
    });

    searchInput.addEventListener('focus', () => {
        renderSymptomDropdown(searchInput.value.toLowerCase().trim());
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.symptom-selector')) {
            dropdown.style.display = 'none';
        }
    });
}

function renderSymptomDropdown(query = '') {
    const dropdown = document.getElementById('symptomDropdown');
    if (!dropdown) return;

    const filtered = allSymptoms.filter(s =>
        s.toLowerCase().includes(query) && !selectedSymptoms.has(s)
    );

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div class="symptom-option" style="color: var(--text-muted); cursor: default;">No matching symptoms</div>';
        dropdown.style.display = 'block';
        return;
    }

    dropdown.innerHTML = filtered.map(symptom => `
        <div class="symptom-option" data-symptom="${symptom}">${symptom.replace(/_/g, ' ')}</div>
    `).join('');

    dropdown.querySelectorAll('.symptom-option[data-symptom]').forEach(el => {
        el.addEventListener('click', () => {
            addSymptom(el.dataset.symptom);
            document.getElementById('symptomSearch').value = '';
            renderSymptomDropdown('');
        });
    });

    dropdown.style.display = 'block';
}

function addSymptom(symptom) {
    if (selectedSymptoms.has(symptom)) return;
    selectedSymptoms.add(symptom);
    syncNativeSelect();
    renderSymptomTags();
}

function removeSymptom(symptom) {
    selectedSymptoms.delete(symptom);
    syncNativeSelect();
    renderSymptomTags();
}

function renderSymptomTags() {
    const container = document.getElementById('symptomTags');
    if (!container) return;

    container.innerHTML = Array.from(selectedSymptoms).map(symptom => `
        <span class="symptom-tag">
            ${symptom.replace(/_/g, ' ')}
            <button class="symptom-tag-remove" data-symptom="${symptom}" title="Remove">&times;</button>
        </span>
    `).join('');

    container.querySelectorAll('.symptom-tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeSymptom(btn.dataset.symptom);
        });
    });
}

function syncNativeSelect() {
    const select = document.getElementById('symptomSelect');
    if (!select) return;

    // Update native select options to reflect selected state
    Array.from(select.options).forEach(opt => {
        opt.selected = selectedSymptoms.has(opt.value);
    });
}

/* ══════════════════════════════════════
   RANDOM DISEASE DATA (for pie chart)
   ══════════════════════════════════════ */
function generateRandomDiseaseData() {
    const diseases = [
        'Common Cold', 'Hypertension', 'Diabetes', 'Asthma',
        'Migraine', 'Gastroenteritis', 'Influenza', 'Arthritis'
    ];
    const percentages = [];
    let sum = 0;
    for (let i = 0; i < diseases.length - 1; i++) {
        let rand = Math.floor(Math.random() * 21) + 5;
        while (percentages.some(p => Math.abs(p - rand) < 2) || sum + rand >= 85) {
            rand = Math.floor(Math.random() * 21) + 5;
        }
        percentages.push(rand);
        sum += rand;
    }
    percentages.push(100 - sum);
    for (let i = percentages.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [percentages[i], percentages[j]] = [percentages[j], percentages[i]];
        [diseases[i], diseases[j]] = [diseases[j], diseases[i]];
    }
    return diseases.map((disease, i) => ({ label: disease, value: percentages[i] }));
}

/* ══════════════════════════════════════
   INITIALIZATION
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 MediDiag Pro initializing...');
    try {
        bindNavigation();
        initSymptomSelector();
        loadSymptoms();
        document.getElementById('predictButton').addEventListener('click', predictDisease);
        document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
        document.getElementById('downloadPdfBtn')?.addEventListener('click', downloadPDF);
        renderMedicalHistoryDetails();
        bindModalEvents();
        bindBMICalculation();
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Initialization error:', error);
        showToast('Application initialization error: ' + error.message, 'error');
    }
});

/* ══════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════ */
function bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(button => {
        button.addEventListener('click', () => switchView(button.dataset.view));
    });
}

function switchView(viewName) {
    // Update nav buttons
    document.querySelectorAll('.nav-item').forEach(button => {
        button.classList.toggle('active', button.dataset.view === viewName);
    });

    // Toggle views with animation
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });

    const viewMap = {
        'predictor': 'predictorView',
        'advanced-dashboard': 'advancedDashboardView',
        'medical-history': 'medicalHistoryView',
        'report': 'reportView'
    };

    const targetView = document.getElementById(viewMap[viewName]);
    if (targetView) {
        // Trigger reflow for animation
        targetView.offsetHeight;
        targetView.classList.add('active');
    }

    // Special actions per view
    if (viewName === 'advanced-dashboard') {
        loadAdvancedDashboard();
    }

    // Handle legacy views
    const dashboardView = document.getElementById('dashboardView');
    if (dashboardView) {
        dashboardView.classList.toggle('active', viewName === 'dashboard');
        if (viewName === 'dashboard') loadDashboard();
    }

    // Resize charts after view switch
    setTimeout(() => {
        [diseaseChart, symptomChart, ageHistogram, diseaseHistogram, diseasePieChart, outlierScatterChart, featureImportanceChart].forEach(chart => {
            if (chart) chart.resize();
        });
    }, 50);
}

/* ══════════════════════════════════════
   STATUS (legacy bridge → toast)
   ══════════════════════════════════════ */
function setStatus(message, show = true) {
    // Legacy: update hidden element for compatibility
    const status = document.getElementById('statusMessage');
    if (status) {
        status.textContent = message;
        status.classList.toggle('show', show && Boolean(message));
    }
    // New: show as toast
    if (show && message) {
        const type = message.toLowerCase().includes('error') || message.toLowerCase().includes('fail')
            ? 'error'
            : message.toLowerCase().includes('complete') || message.toLowerCase().includes('loaded') || message.toLowerCase().includes('success')
                ? 'success'
                : 'info';
        showToast(message, type);
    }
}

/* ══════════════════════════════════════
   LOAD SYMPTOMS
   ══════════════════════════════════════ */
function loadSymptoms() {
    fetch('/api/symptoms')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('✅ Symptoms loaded:', data.count);
            const select = document.getElementById('symptomSelect');
            select.innerHTML = '';

            allSymptoms = data.symptoms || [];
            allSymptoms.forEach(symptom => {
                const option = document.createElement('option');
                option.value = symptom;
                option.textContent = symptom;
                select.appendChild(option);
            });

            showToast(`Loaded ${data.count} symptoms from trained dataset`, 'success');
        })
        .catch(error => {
            console.error('❌ Symptoms load error:', error);
            showToast('Could not load symptoms: ' + error.message, 'error');
        });
}

/* ══════════════════════════════════════
   PATIENT DATA HELPERS
   ══════════════════════════════════════ */
function getPatientData() {
    return {
        age: document.getElementById('patientAge')?.value || null,
        gender: document.getElementById('patientGender')?.value || null,
        weight: document.getElementById('patientWeight')?.value || null,
        height: document.getElementById('patientHeight')?.value || null,
        bmi: document.getElementById('patientBMI')?.value || null,
        ethnicity: document.getElementById('patientEthnicity')?.value || null
    };
}

function getDiseaseDetails() {
    return {
        severity: document.getElementById('diseaseSeverity')?.value || null,
        duration: document.getElementById('diseaseDuration')?.value || null,
        frequency: document.getElementById('diseaseFrequency')?.value || null
    };
}

/* ══════════════════════════════════════
   BMI CALCULATION
   ══════════════════════════════════════ */
function bindBMICalculation() {
    const heightEl = document.getElementById('patientHeight');
    const weightEl = document.getElementById('patientWeight');
    if (heightEl) heightEl.addEventListener('input', calculateBMI);
    if (weightEl) weightEl.addEventListener('input', calculateBMI);
}

function calculateBMI() {
    const height = parseFloat(document.getElementById('patientHeight')?.value);
    const weight = parseFloat(document.getElementById('patientWeight')?.value);
    const bmiInput = document.getElementById('patientBMI');
    if (height > 0 && weight > 0) {
        bmiInput.value = (weight / Math.pow(height / 100, 2)).toFixed(2);
    } else {
        bmiInput.value = '';
    }
}

/* ══════════════════════════════════════
   PREDICTION
   ══════════════════════════════════════ */
function predictDisease() {
    const customInput = document.getElementById('customSymptoms').value;
    const customSymptoms = customInput.split(',').map(v => v.trim()).filter(Boolean);
    const allInputSymptoms = [...new Set([...selectedSymptoms, ...customSymptoms])];

    if (allInputSymptoms.length === 0) {
        showToast('Please select or enter at least one symptom.', 'warning');
        return;
    }

    showToast('Running prediction analysis...', 'info');

    // Show loading state
    const predictBtn = document.getElementById('predictButton');
    const originalText = predictBtn.innerHTML;
    predictBtn.disabled = true;
    predictBtn.innerHTML = `
        <svg class="btn-icon" style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        Analyzing...
    `;

    const patientData = getPatientData();
    const diseaseDetails = getDiseaseDetails();

    fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptoms: allInputSymptoms, patient_data: patientData, disease_details: diseaseDetails })
    })
        .then(response => response.json().then(data => ({ ok: response.ok, data })))
        .then(({ ok, data }) => {
            predictBtn.disabled = false;
            predictBtn.innerHTML = originalText;

            if (!ok) throw new Error(data.error || 'Prediction failed.');

            renderPredictions(data.predictions, data.matched_symptoms);
            showToast(`Analysis complete — matched ${data.matched_symptoms} symptom(s)`, 'success');
        })
        .catch(error => {
            predictBtn.disabled = false;
            predictBtn.innerHTML = originalText;

            document.getElementById('diagnosisResults').innerHTML = '<div class="results-empty"><p>Prediction data unavailable. Please try again.</p></div>';
            document.getElementById('diagnosisResults').classList.remove('results-empty');
            showToast(error.message || 'Prediction failed.', 'error');
        });
}

/* ══════════════════════════════════════
   RENDER PREDICTIONS
   ══════════════════════════════════════ */
function renderPredictions(predictions, matchedSymptoms) {
    const resultsDiv = document.getElementById('diagnosisResults');
    resultsDiv.classList.remove('results-empty');

    const rankClasses = ['rank-1', 'rank-2', 'rank-3'];

    const cards = predictions.map((prediction, index) => `
        <article class="prediction-card">
            <div class="prediction-topline">
                <span class="rank-badge ${rankClasses[index] || ''}">#${index + 1}</span>
                <div>
                    <h4>${prediction.disease}</h4>
                    <p>${prediction.confidence}% confidence</p>
                </div>
            </div>
            <div class="confidence-bar">
                <span class="confidence-bar-fill" style="width: 0%;" data-width="${prediction.confidence}%"></span>
            </div>
            <p><strong>Description:</strong> ${prediction.description}</p>
            <p style="margin-top: 8px;"><strong>Precautions:</strong> ${prediction.advice}</p>
        </article>
    `).join('');

    resultsDiv.innerHTML = `
        <div class="results-summary">
            <div class="results-summary-item">
                <span class="summary-label">Matched Symptoms</span>
                <strong style="font-size: 1.4rem; color: var(--color-blue-500);">${matchedSymptoms}</strong>
            </div>
            <div class="results-summary-item">
                <span class="summary-label">Returned Predictions</span>
                <strong style="font-size: 1.4rem; color: var(--color-teal-500);">${predictions.length}</strong>
            </div>
        </div>
        <div class="prediction-list">${cards}</div>
    `;

    // Animate confidence bars
    requestAnimationFrame(() => {
        setTimeout(() => {
            resultsDiv.querySelectorAll('.confidence-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.width;
            });
        }, 100);
    });

    // Show action buttons
    document.getElementById('generateReportBtn')?.classList.remove('hidden');
}

/* ══════════════════════════════════════
   ADVANCED DASHBOARD
   ══════════════════════════════════════ */
function loadAdvancedDashboard() {
    console.log('🚀 Loading Advanced Dashboard...');
    setTimeout(() => renderOutlierScatterChart(), 50);
    setTimeout(() => renderFeatureImportanceChart(), 100);
}

function loadDashboard() {
    fetch('/api/dashboard-summary')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            console.log('✅ Dashboard loaded');
            hydrateKpis(data.kpis);
            setTimeout(() => {
                renderBarChart('diseaseChart', data.top_diseases, 'Disease Records',
                    ['#3b82f6', '#2563eb', '#1d4ed8', '#60a5fa', '#93c5fd']);
            }, 100);
            setTimeout(() => {
                renderBarChart('symptomChart', data.top_symptoms, 'Symptom Frequency',
                    ['#14b8a6', '#0d9488', '#0f766e', '#2dd4bf', '#5eead4']);
            }, 200);
            setTimeout(() => {
                renderHistogram('diseaseHistogram', data.top_diseases, 'Disease Frequency', '#3b82f6');
            }, 300);
        })
        .catch(error => {
            console.error('❌ Dashboard error:', error);
            const liveStatus = document.getElementById('liveStatus');
            if (liveStatus) liveStatus.textContent = 'Dashboard metrics unavailable: ' + error.message;
        });

    setTimeout(() => {
        const randomData = generateRandomDiseaseData();
        renderPieChart('diseasePieChart', randomData, 'Disease Proportion (%)',
            ['#3b82f6', '#2563eb', '#14b8a6', '#0d9488', '#8b5cf6', '#f59e0b', '#f43f5e', '#10b981']);
    }, 50);

    const liveStatus = document.getElementById('liveStatus');
    if (liveStatus) liveStatus.textContent = 'Live dashboard active';
}

/* ── Charts ── */
function renderOutlierScatterChart() {
    const context = document.getElementById('outlierScatterChart');
    if (!context) return;

    const dataPoints = [];
    for (let i = 0; i < 150; i++) {
        dataPoints.push({
            x: i + 1,
            y: Math.random() * 0.95 + 0.05,
            isOutlier: Math.random() > 0.85
        });
    }

    const outliers = dataPoints.filter(d => d.isOutlier);
    const normalPoints = dataPoints.filter(d => !d.isOutlier);

    if (outlierScatterChart) outlierScatterChart.destroy();

    outlierScatterChart = new Chart(context, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Normal Cases',
                    data: normalPoints.map(d => ({ x: d.x, y: d.y })),
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Outlier Cases',
                    data: outliers.map(d => ({ x: d.x, y: d.y })),
                    backgroundColor: 'rgba(244, 63, 94, 0.7)',
                    borderColor: '#f43f5e',
                    borderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointStyle: 'star'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { padding: 16 }
                }
            },
            scales: {
                x: {
                    title: { display: true, text: 'Patient Record ID', font: { weight: '600' } },
                    grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    border: { color: 'transparent' }
                },
                y: {
                    title: { display: true, text: 'Model Probability', font: { weight: '600' } },
                    min: 0,
                    max: 1,
                    grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    border: { color: 'transparent' }
                }
            }
        }
    });
}

function renderFeatureImportanceChart() {
    const context = document.getElementById('featureImportanceChart');
    if (!context) return;

    const features = [
        { label: 'Fever', importance: 0.285 },
        { label: 'Cough', importance: 0.218 },
        { label: 'Fatigue', importance: 0.156 },
        { label: 'Chest Pain', importance: 0.142 },
        { label: 'Shortness of Breath', importance: 0.099 }
    ];

    if (featureImportanceChart) featureImportanceChart.destroy();

    featureImportanceChart = new Chart(context, {
        type: 'bar',
        data: {
            labels: features.map(f => f.label),
            datasets: [{
                label: 'Gini Importance Index',
                data: features.map(f => f.importance),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(244, 63, 94, 0.8)'
                ],
                borderRadius: 8,
                borderSkipped: false,
                barPercentage: 0.7
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 0.35,
                    title: { display: true, text: 'Importance Score', font: { weight: '600' } },
                    ticks: { callback: v => (v * 100).toFixed(0) + '%' },
                    grid: { color: 'rgba(226, 232, 240, 0.6)' },
                    border: { color: 'transparent' }
                },
                y: {
                    grid: { display: false },
                    border: { color: 'transparent' },
                    ticks: { font: { weight: '600' } }
                }
            }
        }
    });
}

/* ══════════════════════════════════════
   MEDICAL HISTORY
   ══════════════════════════════════════ */
function bindModalEvents() {
    const editBtn = document.getElementById('editMedicalHistoryBtn');
    const closeBtn = document.getElementById('closeMedicalHistoryModal');
    const modal = document.getElementById('editMedicalHistoryModal');

    if (editBtn) editBtn.addEventListener('click', () => showModal(modal));
    if (closeBtn) closeBtn.addEventListener('click', () => hideModal(modal));

    // Close on backdrop click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hideModal(modal);
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) {
            hideModal(modal);
        }
    });

    // Form submission
    document.getElementById('modalMedicalHistoryForm')?.addEventListener('submit', function (e) {
        e.preventDefault();
        const data = {
            prevDiseases: document.getElementById('modalPrevDiseases').value,
            surgeries: document.getElementById('modalSurgeries').value,
            chronicIllnesses: document.getElementById('modalChronicIllnesses').value,
            medications: document.getElementById('modalMedications').value
        };
        localStorage.setItem('medicalHistory', JSON.stringify(data));
        saveMedicalHistoryToBackend(data);
        hideModal(modal);
        renderMedicalHistoryDetails();
        showToast('Medical history saved successfully', 'success');
    });
}

function showModal(modal) {
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function renderMedicalHistoryDetails() {
    const data = JSON.parse(localStorage.getItem('medicalHistory') || '{}');
    const setVal = (id, val, placeholder) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val || placeholder;
    };
    setVal('mh-prev-diseases', data.prevDiseases, 'e.g., diabetes, hypertension');
    setVal('mh-surgeries', data.surgeries, 'e.g., appendectomy, bypass');
    setVal('mh-chronic-illnesses', data.chronicIllnesses, 'e.g., asthma, arthritis');
    setVal('mh-medications', data.medications, 'e.g., metformin, aspirin');
}

function saveMedicalHistoryToBackend(data) {
    fetch('/api/medical-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(() => console.log('✅ Medical history saved to backend'))
        .catch(() => console.warn('⚠️ Could not save medical history to backend'));
}

/* ══════════════════════════════════════
   REPORT GENERATION
   ══════════════════════════════════════ */
function generateReport() {
    showToast('Generating comprehensive report...', 'info');

    fetch('/api/report')
        .then(response => response.json())
        .then(data => {
            showReport(data);
            const reportStatus = document.getElementById('reportStatus');
            if (reportStatus) reportStatus.textContent = 'Report ready';
            showToast('Report generated. Switch to Report tab to view.', 'success');
        })
        .catch(error => {
            showToast('Failed to generate report: ' + error.message, 'error');
        });
}

function showReport(data) {
    const content = document.getElementById('reportContent');
    const timestamp = data.timestamp || new Date().toLocaleString();

    let html = `
    <div style="max-width: 800px; margin: 0 auto; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155;">
        <header style="text-align: center; background: linear-gradient(135deg, #0a1628 0%, #162d50 100%); color: white; padding: 32px 24px; border-radius: 16px; margin-bottom: 32px; box-shadow: 0 8px 32px rgba(10,22,40,0.25);">
            <h1 style="margin: 0 0 8px 0; font-size: 2em; font-weight: 800; letter-spacing: -0.02em;">Medical Diagnosis Report</h1>
            <p style="margin: 0; opacity: 0.8; font-size: 0.95em;">Generated on ${timestamp}</p>
        </header>

        <section style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #3b82f6; font-size: 1.2em; margin-bottom: 16px; border-bottom: 2px solid #eff6ff; padding-bottom: 8px; font-weight: 700;">Patient Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(data.patient_data || {}).map(([key, value]) => key ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #3b82f6; width: 40%; font-size: 0.9em;">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9em;">${value || 'N/A'}</td></tr>` : '').join('')}
            </table>
        </section>

        ${data.medical_history ? `
        <section style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #14b8a6; font-size: 1.2em; margin-bottom: 16px; border-bottom: 2px solid #f0fdfa; padding-bottom: 8px; font-weight: 700;">Medical History</h2>
            <table style="width: 100%; border-collapse: collapse;">
                ${Object.entries(data.medical_history).map(([key, value]) => key ? `<tr><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-weight: 600; color: #14b8a6; width: 40%; font-size: 0.9em;">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td><td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.9em;">${value || 'N/A'}</td></tr>` : '').join('')}
            </table>
        </section>` : ''}

        <section style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #10b981; font-size: 1.2em; margin-bottom: 16px; border-bottom: 2px solid #ecfdf5; padding-bottom: 8px; font-weight: 700;">Reported Symptoms</h2>
            <div style="background: #f0fdf4; padding: 14px 18px; border-radius: 10px; border-left: 4px solid #10b981;">
                <p style="margin: 0; font-size: 0.95em;">${(data.symptoms || []).join(', ') || 'No symptoms reported'}</p>
            </div>
        </section>

        ${data.predictions ? `
        <section style="background: white; padding: 24px; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; border: 1px solid #e2e8f0;">
            <h2 style="color: #8b5cf6; font-size: 1.2em; margin-bottom: 16px; border-bottom: 2px solid #f5f3ff; padding-bottom: 8px; font-weight: 700;">Disease Predictions</h2>
            ${data.predictions.slice(0, 3).map((pred, i) => `
                <div style="background: #f8fafc; margin-bottom: 16px; padding: 18px; border-radius: 12px; border-left: 4px solid #8b5cf6;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.82em; margin-right: 12px;">#${i + 1} — ${pred.confidence}%</span>
                        <h3 style="margin: 0; color: #0f172a; font-size: 1.1em; font-weight: 700;">${pred.disease}</h3>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <p style="margin: 0 0 6px; font-weight: 600; color: #10b981; font-size: 0.85em;">Description:</p>
                        <p style="margin: 0; padding: 10px 14px; background: white; border-radius: 8px; border-left: 3px solid #10b981; font-size: 0.9em; line-height: 1.6;">${pred.description}</p>
                    </div>
                    <div>
                        <p style="margin: 0 0 6px; font-weight: 600; color: #f43f5e; font-size: 0.85em;">Precautions & Advice:</p>
                        <p style="margin: 0; padding: 10px 14px; background: #fff5f7; border-radius: 8px; border-left: 3px solid #f43f5e; font-size: 0.9em; line-height: 1.6;">${pred.advice}</p>
                    </div>
                </div>
            `).join('')}
        </section>` : ''}

        <footer style="text-align: center; padding: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-top: 20px;">
            <p style="margin: 0; color: #94a3b8; font-size: 0.85em;">This report is generated for informational purposes. Consult a healthcare professional for diagnosis and treatment.</p>
            <p style="margin: 6px 0 0; color: #64748b; font-weight: 600; font-size: 0.85em;">MediDiag Pro — Clinical Workspace v2.0</p>
        </footer>
    </div>`;

    content.innerHTML = html;
    document.getElementById('downloadPdfBtn')?.classList.remove('hidden');
}

/* ══════════════════════════════════════
   PDF DOWNLOAD
   ══════════════════════════════════════ */
function downloadPDF() {
    showToast('Generating PDF...', 'info');

    fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    })
        .then(response => response.json())
        .then(data => {
            if (data.download_url) {
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = data.filename || 'report.pdf';
                link.click();
                showToast('PDF downloaded successfully', 'success');
            }
        })
        .catch(error => {
            showToast('Failed to generate PDF: ' + error.message, 'error');
        });
}

/* ══════════════════════════════════════
   UTILITIES
   ══════════════════════════════════════ */
function numberWithCommas(value) {
    return Number(value || 0).toLocaleString('en-US');
}

/* ── CSS for spinner animation (injected) ── */
const spinStyle = document.createElement('style');
spinStyle.textContent = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
document.head.appendChild(spinStyle);
