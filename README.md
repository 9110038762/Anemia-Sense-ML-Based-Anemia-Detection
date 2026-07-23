# Anemia Sense — ML-Based Anemia Detection & Diagnostics

Anemia Sense is a clinical-grade machine learning classifier and decision support tool developed to detect, risk-score, and classify anemia from patient hematological parameters. 

This project was built during a Smart Bridge ML internship to translate a healthcare diagnostic challenge into a practical, interactive clinical tool suitable for hospitals and diagnostic centers.

---

## 🚀 Key Features

* **ML Classifier Pipelines:** Evaluates and compares multiple algorithms (`Logistic Regression`, `Random Forest`, `Gradient Boosting`, `Support Vector Machines`) to select the optimal model.
* **Complete Blood Count (CBC) Support:** Utilizes patient gender, age, and 6 hematological biomarkers (`Hemoglobin`, `RBC Count`, `Hematocrit`, `MCV`, `MCH`, `MCHC`) for diagnostic screening.
* **Clinical Rule Overlay:** Automatically maps predictions to standard hematological classifications (e.g., *Microcytic Hypochromic Anemia*, *Macrocytic Anemia*, *Normocytic Anemia*) based on Wintrobe's red blood cell indices.
* **Batch Screening:** High-throughput screening that accepts patient CSV files and returns instant diagnostic predictions, statistics, and downloadable records.
* **Interactive Hospital Hub UI:** A premium dark-mode clinical dashboard built with native CSS, featuring live slider validations, interactive ROC curves (SVG), confusion matrix insights, and printable medical reports.

---

## 🔬 Hematology Biomarkers & Reference Ranges

The application incorporates gender-dependent standard reference ranges to evaluate patient metrics:

| Biomarker | Abbreviation | Normal Female Range | Normal Male Range | Diagnostic Purpose |
|---|---|---|---|---|
| **Hemoglobin** | Hb | 12.0 – 15.5 g/dL | 13.5 – 17.5 g/dL | Primary oxygen carrier; defines anemia status. |
| **Red Blood Cells** | RBC | 4.1 – 5.1 M/µL | 4.5 – 5.9 M/µL | Overall erythrocyte count. |
| **Hematocrit** | HCT | 36.0% – 48.0% | 41.0% – 50.0% | Volume percentage of red blood cells in blood. |
| **Mean Corpuscular Volume** | MCV | 80.0 – 100.0 fL | 80.0 – 100.0 fL | Average size of RBCs; classifies micro/macro/normocytic. |
| **Mean Corpuscular Hemoglobin** | MCH | 27.0 – 33.0 pg | 27.0 – 33.0 pg | Average mass of hemoglobin per RBC. |
| **MCHC** | MCHC | 32.0 – 36.0 g/dL | 32.0 – 36.0 g/dL | Average concentration of Hb per cell; defines color/chromicity. |

---

## 🛠️ Project Structure

```
├── data/
│   └── anemia_dataset.csv            # Synthetic clinical blood test records
├── models/
│   ├── anemia_model.joblib           # Serialized best model package (model + scaler)
│   └── model_metadata.json           # Evaluation metrics, confusion matrix, ROC coordinates
├── static/
│   ├── index.html                    # Dashboard and screening structure
│   ├── styles.css                    # Glassmorphism design system & print styles
│   └── app.js                        # Form validation, charts, and API logic
├── data_generator.py                 # Clinically realistic dataset generator
├── train.py                          # Model training & comparison pipeline
├── main.py                           # FastAPI uvicorn server serving backend & static frontend
└── README.md                         # Project documentation
```

---

## 💻 Setup & Execution

### Prerequisites
* Python 3.10 or higher installed.

### 1. Set Up Virtual Environment & Install Dependencies
Run the following commands in your shell to set up the python environment:
```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate

# Install requirements
pip install pandas numpy scikit-learn joblib fastapi uvicorn pydantic
```

### 2. Generate Data & Train Model
The training pipeline automatically builds a balanced dataset matching clinical distributions, compares algorithms, and saves evaluation metrics:
```bash
python train.py
```

### 3. Run the Clinical Server
Start the FastAPI server:
```bash
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### 4. Access the Prototype
Open your browser and navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📊 Evaluation & Metrics
* **Feature Weights:** `Hemoglobin` and `Gender` are identified as the leading indicators for base anemia diagnosis, reflecting clinical reality.
* **Sensitivity/Recall:** High sensitivity (100.0%) is achieved to ensure patients with anemia are not missed (minimizing false negatives).
* **Clinical Accuracy:** In case of discrepancy between model predictions and strict clinical thresholds (e.g. borderline cases), the clinical pipeline enforces patient-safe rules to ensure diagnostics accuracy.
