// -------------------------------------------------------------
// Anemia Sense — Client-Side Application Logic (Professional UI Edition)
// -------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // Current date display in header
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // Tab Navigation
    const navItems = document.querySelectorAll('.sidebar-menu .nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const tabTitle = document.getElementById('current-tab-title');
    const tabDesc = document.getElementById('current-tab-desc');

    const tabInfo = {
        'dashboard-tab': {
            title: 'Diagnostic Hub Dashboard',
            desc: 'Overview of clinical screenings, ML model performance metrics, and hematological indicators weights.'
        },
        'single-test-tab': {
            title: 'Patient Diagnosis & Reporting',
            desc: 'Input patient hematology biomarkers to perform supervised machine learning classification.'
        },
        'bulk-test-tab': {
            title: 'Batch Diagnostic Screening',
            desc: 'High-throughput diagnostic analyzer for uploading and screening patient records in bulk.'
        },
        'reference-tab': {
            title: 'Clinical Diagnostic Guidelines',
            desc: 'Medical reference resources regarding red blood cell indices and morphologic anemias.'
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Toggle sidebar active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Switch Tab Content
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(targetTab).classList.add('active');

            // Update Top Bar Text
            tabTitle.textContent = tabInfo[targetTab].title;
            tabDesc.textContent = tabInfo[targetTab].desc;
        });
    });

    // Sub-tab toggling on dashboard (Comparison vs Importance)
    const subTabs = document.querySelectorAll('.sub-tab');
    subTabs.forEach(sub => {
        sub.addEventListener('click', () => {
            const container = sub.closest('.tab-container');
            const targetId = sub.getAttribute('data-sub');
            
            container.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
            sub.classList.add('active');

            container.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // -------------------------------------------------------------
    // History / Recent Screenings Manager (Real-time Database)
    // -------------------------------------------------------------
    const defaultHistory = [
        { patient_id: 'PT10842', timestamp: '2026-07-23 14:15', gender: 'Female', age: 28, hemoglobin: 11.2, mcv: 74.5, classification: 'Microcytic Hypochromic Anemia', risk_level: 'Moderate', is_anemic: 1 },
        { patient_id: 'PT10841', timestamp: '2026-07-23 11:30', gender: 'Male', age: 52, hemoglobin: 14.8, mcv: 90.2, classification: 'Normal Hematological Profile', risk_level: 'Low', is_anemic: 0 },
        { patient_id: 'PT10840', timestamp: '2026-07-23 09:45', gender: 'Female', age: 65, hemoglobin: 9.8, mcv: 112.4, classification: 'Macrocytic Anemia', risk_level: 'Moderate', is_anemic: 1 },
        { patient_id: 'PT10839', timestamp: '2026-07-22 16:20', gender: 'Male', age: 41, hemoglobin: 12.1, mcv: 88.0, classification: 'Normocytic Normochromic Anemia', risk_level: 'Moderate', is_anemic: 1 }
    ];

    function getHistory() {
        const history = localStorage.getItem('anemia_sense_history');
        if (!history) {
            localStorage.setItem('anemia_sense_history', JSON.stringify(defaultHistory));
            return defaultHistory;
        }
        return JSON.parse(history);
    }

    function saveToHistory(record) {
        const history = getHistory();
        history.unshift(record);
        if (history.length > 15) history.pop(); // Keep last 15 records
        localStorage.setItem('anemia_sense_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = getHistory();
        const tbody = document.getElementById('recent-screenings-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        
        history.forEach(item => {
            const tr = document.createElement('tr');
            const badgeClass = item.is_anemic === 1 ? 'anemic' : 'healthy';
            const badgeLabel = item.is_anemic === 1 ? 'Anemic' : 'Healthy';
            
            let riskClass = '';
            if (item.is_anemic === 1) {
                const rClass = item.risk_level.toLowerCase(); // moderate, high, critical
                riskClass = `style="color: var(--state-${rClass === 'moderate' ? 'mod' : (rClass === 'high' ? 'high' : 'critical')}); font-weight:700;"`;
            }
            
            tr.innerHTML = `
                <td><strong>${item.patient_id}</strong></td>
                <td><span style="font-size:0.75rem; color:var(--text-muted); font-weight:500;">${item.timestamp}</span></td>
                <td><span style="font-size:0.8rem; color:var(--text-secondary);">${item.gender}, Age ${item.age}</span></td>
                <td>${item.hemoglobin.toFixed(1)} g/dL</td>
                <td>${item.mcv.toFixed(1)} fL</td>
                <td>
                    <span class="bulk-badge ${badgeClass}">${badgeLabel}</span>
                    <div style="font-size:0.72rem; color:var(--text-muted); margin-top:0.15rem; font-weight: 500">${item.classification}</div>
                </td>
                <td ${riskClass}>${item.is_anemic === 1 ? item.risk_level : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Initial render of history
    renderHistory();

    // -------------------------------------------------------------
    // Dynamic Slider Ranges & Instant Medical Feedback
    // -------------------------------------------------------------
    const genderSelect = document.getElementById('gender');
    const sliders = {
        hemoglobin: {
            input: document.getElementById('hemoglobin'),
            valueSpan: document.getElementById('val-hemoglobin'),
            statusSpan: document.getElementById('lbl-status-hemoglobin'),
            getRange: (gender) => gender === 1 ? { min: 13.5, max: 17.5 } : { min: 12.0, max: 15.5 },
            getLabels: (val, r) => val < r.min ? 'Low (Anemic)' : (val > r.max ? 'High' : 'Normal')
        },
        rbc_count: {
            input: document.getElementById('rbc_count'),
            valueSpan: document.getElementById('val-rbc_count'),
            statusSpan: document.getElementById('lbl-status-rbc_count'),
            getRange: (gender) => gender === 1 ? { min: 4.5, max: 5.9 } : { min: 4.1, max: 5.1 },
            getLabels: (val, r) => val < r.min ? 'Low' : (val > r.max ? 'High' : 'Normal')
        },
        hematocrit: {
            input: document.getElementById('hematocrit'),
            valueSpan: document.getElementById('val-hematocrit'),
            statusSpan: document.getElementById('lbl-status-hematocrit'),
            getRange: (gender) => gender === 1 ? { min: 41.0, max: 50.0 } : { min: 36.0, max: 48.0 },
            getLabels: (val, r) => val < r.min ? 'Low' : (val > r.max ? 'High' : 'Normal')
        },
        mcv: {
            input: document.getElementById('mcv'),
            valueSpan: document.getElementById('val-mcv'),
            statusSpan: document.getElementById('lbl-status-mcv'),
            getRange: () => ({ min: 80.0, max: 100.0 }),
            getLabels: (val, r) => val < r.min ? 'Microcytic' : (val > r.max ? 'Macrocytic' : 'Normocytic')
        },
        mch: {
            input: document.getElementById('mch'),
            valueSpan: document.getElementById('val-mch'),
            statusSpan: document.getElementById('lbl-status-mch'),
            getRange: () => ({ min: 27.0, max: 33.0 }),
            getLabels: (val, r) => val < r.min ? 'Low' : (val > r.max ? 'High' : 'Normal')
        },
        mchc: {
            input: document.getElementById('mchc'),
            valueSpan: document.getElementById('val-mchc'),
            statusSpan: document.getElementById('lbl-status-mchc'),
            getRange: () => ({ min: 32.0, max: 36.0 }),
            getLabels: (val, r) => val < r.min ? 'Hypochromic' : (val > r.max ? 'Hyperchromic' : 'Normochromic')
        }
    };

    function updateSliderUI(key) {
        const sliderObj = sliders[key];
        const val = parseFloat(sliderObj.input.value);
        const gender = parseInt(genderSelect.value);
        const range = sliderObj.getRange(gender);
        const label = sliderObj.getLabels(val, range);

        // Update text labels
        sliderObj.valueSpan.textContent = val.toFixed(key === 'rbc_count' ? 2 : 1);
        sliderObj.statusSpan.textContent = label;

        // Color coding markers
        sliderObj.statusSpan.className = 'status-marker';
        if (label === 'Normal' || label === 'Normocytic' || label === 'Normochromic') {
            sliderObj.statusSpan.classList.add('normal');
        } else if (label.includes('Low') || label === 'Microcytic' || label === 'Hypochromic') {
            sliderObj.statusSpan.classList.add('low');
        } else {
            sliderObj.statusSpan.classList.add('high');
        }
    }

    // Attach listeners to all range sliders
    Object.keys(sliders).forEach(key => {
        sliders[key].input.addEventListener('input', () => updateSliderUI(key));
    });

    // Re-verify normal values if gender flips
    genderSelect.addEventListener('change', () => {
        ['hemoglobin', 'rbc_count', 'hematocrit'].forEach(key => updateSliderUI(key));
    });

    // Initial update on page load
    Object.keys(sliders).forEach(key => updateSliderUI(key));

    // -------------------------------------------------------------
    // Fetch and Render ML Model Metadata / Stats
    // -------------------------------------------------------------
    let modelMetadataGlobal = null;

    async function loadDashboardStats() {
        try {
            const response = await fetch('/api/metadata');
            if (!response.ok) throw new Error('Failed to retrieve model metadata.');
            
            const metadata = await response.json();
            modelMetadataGlobal = metadata;
            
            // Active model name in sidebar footer
            document.getElementById('active-model-name').textContent = metadata.best_model_name.replace(/_/g, ' ');

            // Demographics & Dataset summary
            const summary = metadata.dataset_summary;
            document.getElementById('stats-total-samples').textContent = summary.total_samples.toLocaleString();
            document.getElementById('stats-anemic-cases').textContent = summary.anemic_samples.toLocaleString();
            document.getElementById('stats-healthy-cases').textContent = summary.healthy_samples.toLocaleString();

            const anemicPercent = ((summary.anemic_samples / summary.total_samples) * 100).toFixed(1);
            const healthyPercent = ((summary.healthy_samples / summary.total_samples) * 100).toFixed(1);
            document.getElementById('stats-anemic-percent').innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${anemicPercent}% Prevalence`;
            document.getElementById('stats-healthy-percent').innerHTML = `<i class="fa-solid fa-check"></i> ${healthyPercent}% Baseline`;

            // Comparison table
            const comparison = metadata.model_comparison;
            const tableBody = document.getElementById('model-comparison-table-body');
            tableBody.innerHTML = '';

            let bestAcc = 0;
            let bestF1 = 0;
            
            Object.keys(comparison).forEach(modelName => {
                const metrics = comparison[modelName];
                const cleanName = modelName.replace(/_/g, ' ');
                const isBest = modelName === metadata.best_model_name;

                const tr = document.createElement('tr');
                if (isBest) tr.style.backgroundColor = 'var(--accent-light)';

                tr.innerHTML = `
                    <td>
                        <strong>${cleanName}</strong>
                        ${isBest ? ' <span class="bulk-badge healthy" style="font-size: 0.65rem">Active</span>' : ''}
                    </td>
                    <td>${(metrics.accuracy * 100).toFixed(2)}%</td>
                    <td>${(metrics.precision * 100).toFixed(2)}%</td>
                    <td>${(metrics.recall * 100).toFixed(2)}%</td>
                    <td>${(metrics.f1_score * 100).toFixed(2)}%</td>
                    <td>${metrics.auc.toFixed(3)}</td>
                `;
                tableBody.appendChild(tr);

                if (isBest) {
                    bestAcc = metrics.accuracy;
                    bestF1 = metrics.f1_score;
                }
            });

            document.getElementById('stats-model-accuracy').textContent = `${(bestAcc * 100).toFixed(1)}%`;
            document.getElementById('stats-model-f1').textContent = `F1 Score: ${(bestF1 * 100).toFixed(1)}%`;

            // Feature Importance list
            const importance = metadata.feature_importance;
            const importanceContainer = document.getElementById('features-importance-container');
            importanceContainer.innerHTML = '';

            Object.keys(importance).forEach(feature => {
                const val = importance[feature];
                const group = document.createElement('div');
                group.className = 'importance-bar-group';
                group.innerHTML = `
                    <div class="bar-label-row">
                        <span class="bar-label">${feature.replace(/_/g, ' ')}</span>
                        <span class="bar-val">${(val * 100).toFixed(1)}%</span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${(val * 100).toFixed(1)}%"></div>
                    </div>
                `;
                importanceContainer.appendChild(group);
            });

            // Confusion Matrix
            const cm = metadata.confusion_matrix;
            document.getElementById('cm-tn').querySelector('.cm-value').textContent = cm.tn.toLocaleString();
            document.getElementById('cm-fp').querySelector('.cm-value').textContent = cm.fp.toLocaleString();
            document.getElementById('cm-fn').querySelector('.cm-value').textContent = cm.fn.toLocaleString();
            document.getElementById('cm-tp').querySelector('.cm-value').textContent = cm.tp.toLocaleString();

            // Calculate confusion metrics in text
            const sensitivity = cm.tp / (cm.tp + cm.fn);
            const specificity = cm.tn / (cm.tn + cm.fp);
            const insightsText = `Validated on testing split. Sensitivity (Recall) is <strong>${(sensitivity*100).toFixed(2)}%</strong> (ability to identify anemic cases), with a Specificity of <strong>${(specificity*100).toFixed(2)}%</strong> (ability to classify healthy patients).`;
            document.getElementById('cm-insights-text').innerHTML = insightsText;

            // Draw SVG ROC curve
            drawRocCurve(comparison[metadata.best_model_name].roc_curve, comparison[metadata.best_model_name].auc);

        } catch (err) {
            console.error('Error fetching statistics: ', err);
        }
    }

    function drawRocCurve(rocData, aucValue) {
        const svg = document.getElementById('roc-svg');
        const path = document.getElementById('roc-path');
        const aucLabel = document.getElementById('roc-auc-label');
        
        if (!rocData || !rocData.fpr || !rocData.tpr) return;

        aucLabel.textContent = `Active Model (AUC: ${aucValue.toFixed(3)})`;

        // SVG Coordinate system runs from: x: [50, 450] and y: [450, 50] (y is inverted)
        // Math coordinates are: fpr: [0, 1] and tpr: [0, 1]
        let pathD = "M 50 450"; // start at origin (0.0, 0.0) in ROC

        for (let i = 0; i < rocData.fpr.length; i++) {
            const fprVal = rocData.fpr[i];
            const tprVal = rocData.tpr[i];

            // map values
            const x = 50 + (fprVal * 400);
            const y = 450 - (tprVal * 400); // invert y axis

            pathD += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        }

        path.setAttribute('d', pathD);
    }

    // Call stats load
    loadDashboardStats();

    // -------------------------------------------------------------
    // Single Diagnosis Form Submission
    // -------------------------------------------------------------
    const singleForm = document.getElementById('single-predict-form');
    const resultsPlaceholder = document.getElementById('results-placeholder');
    const resultsOutput = document.getElementById('results-output');
    
    singleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Disable diagnose button
        const diagnoseBtn = document.getElementById('btn-diagnose');
        const originalText = diagnoseBtn.innerHTML;
        diagnoseBtn.disabled = true;
        diagnoseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

        const payload = {
            Age: parseInt(document.getElementById('age').value),
            Gender: parseInt(document.getElementById('gender').value),
            Hemoglobin: parseFloat(document.getElementById('hemoglobin').value),
            RBC_Count: parseFloat(document.getElementById('rbc_count').value),
            Hematocrit: parseFloat(document.getElementById('hematocrit').value),
            MCV: parseFloat(document.getElementById('mcv').value),
            MCH: parseFloat(document.getElementById('mch').value),
            MCHC: parseFloat(document.getElementById('mchc').value)
        };

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('API server returned error.');

            const result = await response.json();

            // Populate Results Panel
            resultsPlaceholder.classList.add('hidden');
            resultsOutput.classList.remove('hidden');

            // Generate diagnostic patient metadata
            const patientId = 'PT' + Math.floor(10000 + Math.random() * 90000);
            const genderLabel = payload.Gender === 1 ? 'Male' : 'Female';
            const timestampStr = new Date().toISOString().slice(0, 16).replace('T', ' ');

            // Populate Patient Chart Metadata in UI
            document.getElementById('report-patient-id').textContent = patientId;
            document.getElementById('report-patient-sex').textContent = genderLabel;
            document.getElementById('report-patient-age').textContent = `${payload.Age} yrs`;
            document.getElementById('report-patient-date').textContent = timestampStr;

            // Set Classification and Risk Class
            const riskCard = document.getElementById('report-risk-card');
            const classHeader = document.getElementById('report-classification');
            const riskBadge = document.getElementById('report-risk-badge');
            
            classHeader.textContent = result.classification;
            
            // Reset risk classes
            riskCard.className = 'report-card glass';
            
            if (result.is_anemic === 1) {
                const risk = result.risk_level.toLowerCase(); // moderate, high, critical
                riskCard.classList.add(`risk-${risk}`);
                riskBadge.textContent = `${result.risk_level} Risk`;
            } else {
                riskCard.classList.add('risk-low');
                riskBadge.textContent = 'Low Risk';
            }

            // Probability meter
            const probPercent = (result.anemia_probability * 100).toFixed(0);
            document.getElementById('report-prob-value').textContent = `${probPercent}%`;
            document.getElementById('report-prob-fill').style.width = `${probPercent}%`;

            // Clinical notes
            document.getElementById('report-clinical-notes').textContent = result.clinical_notes;

            // Comparison table list
            const compList = document.getElementById('reference-comparison-list');
            compList.innerHTML = '';

            Object.keys(result.reference_comparison).forEach(key => {
                const item = result.reference_comparison[key];
                const statusClass = item.status.toLowerCase(); // low, high, normal

                const div = document.createElement('div');
                div.className = 'ref-item';
                div.innerHTML = `
                    <span class="ref-item-name">${key}</span>
                    <span class="ref-item-value">${item.value.toFixed(1)}</span>
                    <span class="ref-item-status ${statusClass}">${item.status}</span>
                    <span class="ref-item-range">${item.range}</span>
                `;
                compList.appendChild(div);
            });

            // Save this screening to history database
            saveToHistory({
                patient_id: patientId,
                timestamp: timestampStr,
                gender: genderLabel,
                age: payload.Age,
                hemoglobin: payload.Hemoglobin,
                mcv: payload.MCV,
                classification: result.classification,
                risk_level: result.is_anemic === 1 ? result.risk_level : 'Low',
                is_anemic: result.is_anemic
            });

        } catch (err) {
            alert('Error running diagnostics: ' + err.message);
        } finally {
            diagnoseBtn.disabled = false;
            diagnoseBtn.innerHTML = originalText;
        }
    });

    // Reset single patient form
    document.getElementById('btn-reset-form').addEventListener('click', () => {
        singleForm.reset();
        // Reset inputs
        document.getElementById('age').value = 35;
        document.getElementById('gender').value = 0;
        document.getElementById('hemoglobin').value = 14.0;
        document.getElementById('rbc_count').value = 4.8;
        document.getElementById('hematocrit').value = 42.0;
        document.getElementById('mcv').value = 90.0;
        document.getElementById('mch').value = 30.0;
        document.getElementById('mchc').value = 34.0;

        // trigger change event to reset labels
        Object.keys(sliders).forEach(key => updateSliderUI(key));
        
        // Hide panel
        resultsOutput.classList.add('hidden');
        resultsPlaceholder.classList.remove('hidden');
    });

    // Print single diagnostic report
    document.getElementById('btn-print-report').addEventListener('click', () => {
        window.print();
    });

    // -------------------------------------------------------------
    // Bulk Diagnostic Screening (CSV Upload)
    // -------------------------------------------------------------
    const dropzone = document.getElementById('csv-dropzone');
    const bulkInput = document.getElementById('bulk-csv-input');
    const processBulkBtn = document.getElementById('btn-process-bulk');
    const bulkResultsSection = document.getElementById('bulk-results-section');
    const bulkTableBody = document.getElementById('bulk-table-body');
    let selectedFile = null;
    let bulkResultsGlobal = null; // Store results for exporting

    // Handle Dropzone click
    dropzone.addEventListener('click', () => bulkInput.click());

    // Highlight dropzone on drag/drop events
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
        }, false);
    });

    // Handle file drop
    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Handle standard browse selection
    bulkInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Invalid file format. Please upload a CSV file.');
            return;
        }
        selectedFile = file;
        
        // Update UI
        dropzone.querySelector('.dropzone-icon').className = 'fa-solid fa-file-csv dropzone-icon';
        dropzone.querySelector('.dropzone-icon').style.color = 'var(--accent-primary)';
        dropzone.querySelector('.dropzone-main-text').innerHTML = `File selected: <strong>${file.name}</strong>`;
        dropzone.querySelector('.dropzone-sub-text').textContent = `Size: ${(file.size / 1024).toFixed(1)} KB. Click 'Process Batch Diagnostics' below to run the screening.`;
        
        processBulkBtn.classList.remove('hidden');
    }

    // Process bulk diagnostics API call
    processBulkBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        processBulkBtn.disabled = true;
        processBulkBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Screening patient batch...';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/predict_bulk', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to process CSV file.');
            }

            const results = await response.json();
            bulkResultsGlobal = results;

            // Show results
            bulkResultsSection.classList.remove('hidden');
            
            // Populate stats
            const summary = results.summary;
            document.getElementById('bulk-summary-count').textContent = summary.total_processed;
            document.getElementById('bulk-anemia-rate').textContent = `${summary.anemia_rate}%`;
            document.getElementById('bulk-micro-count').textContent = summary.classification_breakdown.Microcytic;
            document.getElementById('bulk-macro-count').textContent = summary.classification_breakdown.Macrocytic;
            document.getElementById('bulk-norm-count').textContent = summary.classification_breakdown.Normocytic;

            // Populate table rows
            bulkTableBody.innerHTML = '';
            results.predictions.forEach(pred => {
                const tr = document.createElement('tr');
                const badgeClass = pred.is_anemic === 1 ? 'anemic' : 'healthy';
                const badgeLabel = pred.is_anemic === 1 ? 'Anemic' : 'Healthy';

                let riskClass = '';
                if (pred.is_anemic === 1) {
                    riskClass = `style="color: var(--state-${pred.risk_level.toLowerCase() === 'moderate' ? 'mod' : (pred.risk_level.toLowerCase() === 'high' ? 'high' : 'critical')}); font-weight:600;"`;
                }

                tr.innerHTML = `
                    <td><strong>${pred.patient_id}</strong></td>
                    <td>
                        <span class="patient-demographics">${pred.gender}, Age ${pred.age}</span>
                    </td>
                    <td>${pred.hemoglobin.toFixed(1)} g/dL</td>
                    <td>${pred.mcv.toFixed(1)} fL</td>
                    <td>
                        <span class="bulk-badge ${badgeClass}">${badgeLabel}</span>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.15rem">${pred.classification}</div>
                    </td>
                    <td ${riskClass}>${pred.is_anemic === 1 ? pred.risk_level : '-'}</td>
                    <td>${(pred.anemia_probability * 100).toFixed(0)}%</td>
                `;
                bulkTableBody.appendChild(tr);
            });

            // Smooth scroll to table
            bulkResultsSection.scrollIntoView({ behavior: 'smooth' });

        } catch (err) {
            alert('Batch diagnostic failed: ' + err.message);
        } finally {
            processBulkBtn.disabled = false;
            processBulkBtn.innerHTML = '<i class="fa-solid fa-circle-play"></i> Process Batch Diagnostics';
        }
    });

    // Download CSV template
    document.getElementById('btn-download-template').addEventListener('click', (e) => {
        e.preventDefault();
        
        const csvContent = 
            "Patient_ID,Age,Gender,Hemoglobin,RBC_Count,Hematocrit,MCV,MCH,MCHC\n" +
            "PT10950,45,1,15.2,5.1,46.2,88.5,30.1,34.0\n" +
            "PT10951,32,0,9.2,3.6,28.0,71.2,21.5,29.5\n" +
            "PT10952,58,0,10.1,2.8,29.5,108.0,35.5,33.0\n" +
            "PT10953,24,1,11.0,3.8,33.0,91.0,29.8,33.8\n" +
            "PT10954,67,1,16.5,5.4,49.0,94.2,31.2,34.5\n" +
            "PT10955,19,0,13.8,4.5,41.2,89.5,30.5,34.2\n";
            
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "anemia_bulk_template.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Export screened results back to CSV
    document.getElementById('btn-export-bulk-csv').addEventListener('click', () => {
        if (!bulkResultsGlobal || !bulkResultsGlobal.predictions) return;

        let csv = "Patient_ID,Age,Gender,Hemoglobin,RBC_Count,Hematocrit,MCV,MCH,MCHC,Prediction,Probability,Anemia_Type,Risk_Level\n";

        bulkResultsGlobal.predictions.forEach(pred => {
            csv += `${pred.patient_id},${pred.age},${pred.gender},${pred.hemoglobin},${pred.rbc_count},${pred.hematocrit},${pred.mcv},${pred.mch},${pred.mchc},${pred.is_anemic === 1 ? 'Anemic' : 'Healthy'},${(pred.anemia_probability).toFixed(3)},"${pred.classification}",${pred.risk_level}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "anemia_screened_results.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
