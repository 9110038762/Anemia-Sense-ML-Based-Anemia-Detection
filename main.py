import os
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import io

app = FastAPI(
    title="Anemia Sense API",
    description="ML-Based Clinical Anemia Detection & Classification Service",
    version="1.0.0"
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold model package
model_package = None
model_metadata = None

def load_model_and_metadata():
    global model_package, model_metadata
    model_path = 'models/anemia_model.joblib'
    metadata_path = 'models/model_metadata.json'
    
    # If model doesn't exist, run the training script
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        print("Model or metadata not found. Training model now...")
        from train import train_and_evaluate
        train_and_evaluate()
        
    model_package = joblib.load(model_path)
    with open(metadata_path, 'r') as f:
        model_metadata = json.load(f)
    print("Model and metadata loaded successfully.")

# Startup event
@app.on_event("startup")
def startup_event():
    load_model_and_metadata()

# Pydantic Schemas for validation
class PatientInput(BaseModel):
    Age: int = Field(..., ge=1, le=120, description="Age of the patient in years")
    Gender: int = Field(..., ge=0, le=1, description="Gender (0 = Female, 1 = Male)")
    Hemoglobin: float = Field(..., ge=3.0, le=25.0, description="Hemoglobin (Hb) level in g/dL")
    RBC_Count: float = Field(..., ge=1.0, le=10.0, description="Red Blood Cell count in million/mcL")
    Hematocrit: float = Field(..., ge=10.0, le=75.0, description="Hematocrit (HCT) percentage")
    MCV: float = Field(..., ge=40.0, le=150.0, description="Mean Corpuscular Volume in fL")
    MCH: float = Field(..., ge=10.0, le=50.0, description="Mean Corpuscular Hemoglobin in pg")
    MCHC: float = Field(..., ge=20.0, le=45.0, description="Mean Corpuscular Hemoglobin Concentration in g/dL")

class DiagnosisResponse(BaseModel):
    is_anemic: int
    anemia_probability: float
    risk_level: str
    classification: str
    clinical_notes: str
    reference_comparison: dict

# Clinical analysis function
def classify_anemia_type(hb: float, mcv: float, mch: float, mchc: float, gender: int) -> dict:
    """
    Classify the type of anemia based on red blood cell indices.
    Standard medical thresholds:
    - MCV < 80 fL: Microcytic (Iron deficiency, Thalassemia)
    - MCV 80 - 100 fL: Normocytic (Chronic disease, blood loss)
    - MCV > 100 fL: Macrocytic (B12 / Folate deficiency)
    """
    # Reference ranges
    ref_hb_min = 13.5 if gender == 1 else 12.0
    ref_hb_max = 17.5 if gender == 1 else 15.5
    ref_rbc_min = 4.5 if gender == 1 else 4.1
    ref_rbc_max = 5.9 if gender == 1 else 5.1
    ref_hct_min = 41.0 if gender == 1 else 36.0
    ref_hct_max = 50.0 if gender == 1 else 48.0
    
    comparisons = {
        'Hemoglobin': {
            'value': hb,
            'range': f"{ref_hb_min} - {ref_hb_max} g/dL",
            'status': 'Normal' if ref_hb_min <= hb <= ref_hb_max else ('Low' if hb < ref_hb_min else 'High')
        },
        'MCV': {
            'value': mcv,
            'range': "80 - 100 fL",
            'status': 'Normal' if 80 <= mcv <= 100 else ('Low' if mcv < 80 else 'High')
        },
        'MCH': {
            'value': mch,
            'range': "27 - 33 pg",
            'status': 'Normal' if 27 <= mch <= 33 else ('Low' if mch < 27 else 'High')
        },
        'MCHC': {
            'value': mchc,
            'range': "32 - 36 g/dL",
            'status': 'Normal' if 32 <= mchc <= 36 else ('Low' if mchc < 32 else 'High')
        }
    }
    
    # Check if clinically anemic (by hemoglobin standards)
    clinically_anemic = hb < ref_hb_min
    
    if not clinically_anemic:
        return {
            'is_anemic': 0,
            'classification': "Normal Hematological Profile",
            'risk_level': "Low",
            'clinical_notes': "Patient's hemoglobin levels are within the normal reference range. No anemia detected.",
            'reference_comparison': comparisons
        }
    
    # Diagnose type of anemia
    if mcv < 80:
        if mchc < 32 or mch < 27:
            classification = "Microcytic Hypochromic Anemia"
            notes = "Commonly indicates Iron Deficiency Anemia (IDA), Thalassemia Trait, or Anemia of Chronic Disease. Recommended: Iron Profile (Serum Iron, Ferritin, TIBC) and Hemoglobin Electrophoresis."
        else:
            classification = "Microcytic Anemia"
            notes = "Indicates reduced red blood cell size. Likely early-stage iron deficiency or chronic inflammatory conditions. Recommended: Serum Ferritin test."
        risk_level = "Moderate" if hb >= 10.0 else ("High" if hb >= 7.0 else "Critical")
        
    elif mcv > 100:
        classification = "Macrocytic Anemia"
        notes = "Suggests Megaloblastic Anemia, typically caused by Vitamin B12 or Folate Deficiency. Can also be associated with liver disease or hypothyroidism. Recommended: Serum Vitamin B12 and Folate levels."
        risk_level = "Moderate" if hb >= 10.0 else ("High" if hb >= 7.0 else "Critical")
        
    else:
        classification = "Normocytic Normochromic Anemia"
        notes = "Red blood cells are normal in size and color, but count is low. Often associated with acute blood loss, hemolytic anemia, kidney disease, or chronic systemic infections/inflammation. Recommended: Reticulocyte Count and Renal Function tests."
        risk_level = "Moderate" if hb >= 10.0 else ("High" if hb >= 7.0 else "Critical")
        
    # Override risk if Hb is extremely low
    if hb < 7.0:
        risk_level = "Critical"
        notes += " WARNING: Severe anemia detected. Immediate clinical assessment and blood transfusion evaluation are highly recommended."
        
    return {
        'is_anemic': 1,
        'classification': classification,
        'risk_level': risk_level,
        'clinical_notes': notes,
        'reference_comparison': comparisons
    }

@app.get("/api/metadata")
def get_metadata():
    if model_metadata is None:
        load_model_and_metadata()
    return model_metadata

@app.post("/api/predict", response_model=DiagnosisResponse)
def predict_single(patient: PatientInput):
    if model_package is None:
        load_model_and_metadata()
        
    # Extract features in the correct order
    features = [
        patient.Age,
        patient.Gender,
        patient.Hemoglobin,
        patient.RBC_Count,
        patient.Hematocrit,
        patient.MCV,
        patient.MCH,
        patient.MCHC
    ]
    
    # Scale and predict
    features_arr = np.array([features])
    features_scaled = model_package['scaler'].transform(features_arr)
    
    # ML Model Prediction
    pred = int(model_package['model'].predict(features_scaled)[0])
    prob = float(model_package['model'].predict_proba(features_scaled)[0][1])
    
    # Clinical rule-based overlay to enrich diagnostics
    clinical_analysis = classify_anemia_type(
        patient.Hemoglobin,
        patient.MCV,
        patient.MCH,
        patient.MCHC,
        patient.Gender
    )
    
    # Use ML model predictions as the baseline, but cross-reference with clinical rules
    # If ML says anemic but Hb is perfectly normal, or vice-versa, we use clinical rules for safety,
    # and provide the ML probability score.
    final_anemia_pred = pred
    # If there's discrepancy between Hb levels and ML, we alert or align with clinical definitions:
    if patient.Hemoglobin >= (13.5 if patient.Gender == 1 else 12.0):
        # Clinically healthy
        final_anemia_pred = 0
        
    return DiagnosisResponse(
        is_anemic=final_anemia_pred,
        anemia_probability=prob,
        risk_level=clinical_analysis['risk_level'] if final_anemia_pred == 1 else "Low",
        classification=clinical_analysis['classification'],
        clinical_notes=clinical_analysis['clinical_notes'],
        reference_comparison=clinical_analysis['reference_comparison']
    )

@app.post("/api/predict_bulk")
def predict_bulk(file: UploadFile = File(...)):
    if model_package is None:
        load_model_and_metadata()
        
    try:
        # Read uploaded CSV
        contents = file.file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Verify columns
        required_cols = ['Age', 'Gender', 'Hemoglobin', 'RBC_Count', 'Hematocrit', 'MCV', 'MCH', 'MCHC']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400, 
                detail=f"CSV is missing required hematology columns: {', '.join(missing_cols)}"
            )
            
        # Optional Patient ID mapping
        patient_ids = df['Patient_ID'].tolist() if 'Patient_ID' in df.columns else [f'UPT-{i}' for i in range(len(df))]
        
        # Extract features and scale
        X_bulk = df[required_cols]
        X_bulk_scaled = model_package['scaler'].transform(X_bulk)
        
        # Batch Predict
        preds = model_package['model'].predict(X_bulk_scaled)
        probs = model_package['model'].predict_proba(X_bulk_scaled)[:, 1]
        
        results = []
        anemic_count = 0
        microcytic_count = 0
        macrocytic_count = 0
        normocytic_count = 0
        
        for idx, row in df.iterrows():
            hb = float(row['Hemoglobin'])
            mcv = float(row['MCV'])
            mch = float(row['MCH'])
            mchc = float(row['MCHC'])
            gender = int(row['Gender'])
            
            # Clinical mapping
            analysis = classify_anemia_type(hb, mcv, mch, mchc, gender)
            
            # ML alignment
            pred = int(preds[idx])
            prob = float(probs[idx])
            
            if hb >= (13.5 if gender == 1 else 12.0):
                pred = 0
                
            is_anemic = pred
            
            # Categorize counts
            if is_anemic == 1:
                anemic_count += 1
                if "Microcytic" in analysis['classification']:
                    microcytic_count += 1
                elif "Macrocytic" in analysis['classification']:
                    macrocytic_count += 1
                else:
                    normocytic_count += 1
                    
            results.append({
                'patient_id': patient_ids[idx],
                'age': int(row['Age']),
                'gender': 'Male' if gender == 1 else 'Female',
                'hemoglobin': hb,
                'rbc_count': float(row['RBC_Count']),
                'hematocrit': float(row['Hematocrit']),
                'mcv': mcv,
                'mch': mch,
                'mchc': mchc,
                'is_anemic': is_anemic,
                'anemia_probability': prob,
                'classification': analysis['classification'],
                'risk_level': analysis['risk_level'] if is_anemic == 1 else 'Low'
            })
            
        summary = {
            'total_processed': len(df),
            'anemic_cases': anemic_count,
            'healthy_cases': len(df) - anemic_count,
            'anemia_rate': round((anemic_count / len(df)) * 100, 2) if len(df) > 0 else 0.0,
            'classification_breakdown': {
                'Microcytic': microcytic_count,
                'Macrocytic': macrocytic_count,
                'Normocytic': normocytic_count
            }
        }
        
        return {
            'summary': summary,
            'predictions': results
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process CSV file: {str(e)}")

# Mount static files for the frontend if they exist
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
