import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, roc_curve, auc
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

def train_and_evaluate():
    # Make sure directories exist
    os.makedirs('models', exist_ok=True)
    os.makedirs('data', exist_ok=True)
    
    # 1. Check if dataset exists, if not generate it
    data_path = 'data/anemia_dataset.csv'
    if not os.path.exists(data_path):
        print("Dataset not found. Generating realistic clinical dataset...")
        from data_generator import generate_anemia_dataset
        df = generate_anemia_dataset(num_samples=3000)
        df.to_csv(data_path, index=False)
    else:
        df = pd.read_csv(data_path)
        
    print(f"Loaded dataset with {len(df)} records.")
    
    # 2. Prepare Features and Targets
    feature_cols = ['Age', 'Gender', 'Hemoglobin', 'RBC_Count', 'Hematocrit', 'MCV', 'MCH', 'MCHC']
    X = df[feature_cols]
    y = df['Anemia']
    
    # 3. Train-Test Split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # 4. Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 5. Define Models to evaluate
    models = {
        'Logistic_Regression': LogisticRegression(random_state=42, max_iter=1000),
        'Random_Forest': RandomForestClassifier(random_state=42, n_estimators=100, max_depth=8),
        'Gradient_Boosting': GradientBoostingClassifier(random_state=42, n_estimators=100, learning_rate=0.1, max_depth=4),
        'Support_Vector_Machine': SVC(random_state=42, probability=True, C=1.0, kernel='rbf')
    }
    
    results = {}
    best_model_name = None
    best_f1 = 0
    best_model = None
    
    # 6. Train and Evaluate each model
    for name, model in models.items():
        print(f"Training {name}...")
        model.fit(X_train_scaled, y_train)
        
        # Predictions
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        
        # ROC Curve
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        roc_auc = auc(fpr, tpr)
        
        results[name] = {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'auc': float(roc_auc),
            # Sample some points from ROC curve for the web interface
            'roc_curve': {
                'fpr': [float(x) for x in fpr[::max(1, len(fpr)//50)]], # limit size
                'tpr': [float(y) for y in tpr[::max(1, len(tpr)//50)]]
            }
        }
        
        print(f"{name} Results -> F1: {f1:.4f} | Recall: {rec:.4f} | Accuracy: {acc:.4f}")
        
        # In medicine, Recall (sensitivity) is extremely important, but we balance with F1
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model = model
            
    print(f"\nBest Model selected: {best_model_name} (F1 Score: {best_f1:.4f})")
    
    # 7. Extract detailed metrics for the best model
    best_model_pred = best_model.predict(X_test_scaled)
    best_model_prob = best_model.predict_proba(X_test_scaled)[:, 1]
    
    cm = confusion_matrix(y_test, best_model_pred)
    tn, fp, fn, tp = cm.ravel()
    
    # Calculate Feature Importances for the best model
    feature_importance = {}
    if hasattr(best_model, 'feature_importances_'):
        importances = best_model.feature_importances_
        for col, val in zip(feature_cols, importances):
            feature_importance[col] = float(val)
    elif hasattr(best_model, 'coef_'):
        # For Logistic Regression, use absolute coefficients as importance proxy
        importances = np.abs(best_model.coef_[0])
        importances = importances / np.sum(importances) # normalize
        for col, val in zip(feature_cols, importances):
            feature_importance[col] = float(val)
    else:
        # Fallback or for SVM (RBF kernel doesn't have direct feature weights)
        # We can calculate permuted importances or default to a baseline
        feature_importance = {col: 1.0 / len(feature_cols) for col in feature_cols}
        
    # Sort feature importances
    feature_importance = dict(sorted(feature_importance.items(), key=lambda item: item[1], reverse=True))
    
    # Save the best model package (model + scaler + feature columns)
    model_package = {
        'model': best_model,
        'scaler': scaler,
        'feature_cols': feature_cols,
        'model_name': best_model_name
    }
    
    model_package_path = 'models/anemia_model.joblib'
    joblib.dump(model_package, model_package_path)
    print(f"Best model package saved to {model_package_path}")
    
    # 8. Export metadata JSON for the frontend
    metadata = {
        'best_model_name': best_model_name,
        'features': feature_cols,
        'model_comparison': results,
        'confusion_matrix': {
            'tn': int(tn),
            'fp': int(fp),
            'fn': int(fn),
            'tp': int(tp)
        },
        'feature_importance': feature_importance,
        'dataset_summary': {
            'total_samples': len(df),
            'anemic_samples': int(df['Anemia'].sum()),
            'healthy_samples': int(len(df) - df['Anemia'].sum()),
            'female_samples': int((df['Gender'] == 0).sum()),
            'male_samples': int((df['Gender'] == 1).sum())
        }
    }
    
    metadata_path = 'models/model_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=4)
    print(f"Model evaluation metadata saved to {metadata_path}")

if __name__ == '__main__':
    train_and_evaluate()
