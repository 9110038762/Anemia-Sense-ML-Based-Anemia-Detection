import numpy as np
import pandas as pd
import os

def generate_anemia_dataset(num_samples=2500, random_seed=42):
    np.random.seed(random_seed)
    
    # Initialize empty lists for columns
    ages = []
    genders = []
    hemoglobins = []
    rbc_counts = []
    hematocrits = []
    mcvs = []
    mchs = []
    mchcs = []
    anemia_labels = []
    anemia_types = []  # 0: Healthy, 1: Microcytic, 2: Macrocytic, 3: Normocytic
    
    # Generate samples
    for i in range(num_samples):
        # Age: 1 to 90 years
        age = np.random.randint(1, 91)
        # Gender: 0 = Female, 1 = Male
        gender = np.random.choice([0, 1])
        
        # Decide if this sample will represent an anemic patient
        # We target a 50/50 balance for optimal machine learning training
        is_anemic = np.random.choice([0, 1], p=[0.45, 0.55])
        
        if not is_anemic:
            # HEALTHY PATIENT
            # Normal Hb ranges: Female (12.0 - 15.5), Male (13.5 - 17.5)
            if gender == 0:  # Female
                hb = np.random.normal(13.8, 0.9)
                hb = max(12.0, min(hb, 16.5)) # Ensure healthy female Hb is >= 12.0
                rbc = np.random.normal(4.6, 0.3)
                rbc = max(4.1, min(rbc, 5.4))
                hct = np.random.normal(41.0, 2.0)
                hct = max(36.0, min(hct, 48.0))
            else:  # Male
                hb = np.random.normal(15.5, 1.0)
                hb = max(13.5, min(hb, 18.0)) # Ensure healthy male Hb is >= 13.5
                rbc = np.random.normal(5.2, 0.4)
                rbc = max(4.5, min(rbc, 6.2))
                hct = np.random.normal(46.0, 2.5)
                hct = max(41.0, min(hct, 53.0))
                
            # Normal red blood cell indices
            mcv = np.random.normal(90.0, 4.0)
            mcv = max(80.0, min(mcv, 100.0))
            mch = np.random.normal(30.0, 1.5)
            mch = max(27.0, min(mch, 33.0))
            mchc = np.random.normal(34.0, 1.0)
            mchc = max(32.0, min(mchc, 36.0))
            
            anemia_label = 0
            a_type = 0  # Healthy
            
        else:
            # ANEMIC PATIENT
            # Randomly select type of anemia:
            # 1: Microcytic (e.g., Iron Deficiency) - 60%
            # 2: Macrocytic (e.g., Vitamin B12/Folate Deficiency) - 20%
            # 3: Normocytic (e.g., Chronic disease, acute blood loss) - 20%
            a_type = np.random.choice([1, 2, 3], p=[0.60, 0.20, 0.20])
            
            if a_type == 1:  # Microcytic Anemia
                mcv = np.random.normal(70.0, 5.0)
                mcv = min(mcv, 79.9)  # Must be microcytic
                mcv = max(55.0, mcv)
                
                mch = np.random.normal(22.0, 2.0)
                mch = min(mch, 26.5)
                mch = max(15.0, mch)
                
                mchc = np.random.normal(29.5, 1.5)
                mchc = min(mchc, 31.9)
                mchc = max(24.0, mchc)
                
                # Hb is low
                if gender == 0:  # Female
                    hb = np.random.normal(9.5, 1.0)
                    hb = min(hb, 11.9) # Must be anemic
                    hb = max(6.0, hb)
                    rbc = np.random.normal(3.8, 0.4)
                    hct = hb * 3.0 + np.random.normal(0, 1.0)
                else:  # Male
                    hb = np.random.normal(10.5, 1.2)
                    hb = min(hb, 13.4) # Must be anemic
                    hb = max(7.0, hb)
                    rbc = np.random.normal(4.3, 0.4)
                    hct = hb * 3.1 + np.random.normal(0, 1.2)
                    
            elif a_type == 2:  # Macrocytic Anemia
                mcv = np.random.normal(110.0, 6.0)
                mcv = max(mcv, 100.1)  # Must be macrocytic
                mcv = min(125.0, mcv)
                
                mch = np.random.normal(36.0, 2.0)
                mch = max(mch, 33.5)
                mch = min(42.0, mch)
                
                mchc = np.random.normal(33.5, 0.8) # MCHC is typically normal in macrocytic
                mchc = max(32.0, min(mchc, 35.5))
                
                # Hb is low, RBC is significantly low
                if gender == 0:  # Female
                    hb = np.random.normal(9.8, 1.2)
                    hb = min(hb, 11.9)
                    hb = max(6.5, hb)
                    rbc = np.random.normal(2.7, 0.3)
                    rbc = max(1.8, rbc)
                    hct = hb * 2.8 + np.random.normal(0, 1.0)
                else:  # Male
                    hb = np.random.normal(10.8, 1.3)
                    hb = min(hb, 13.4)
                    hb = max(7.5, hb)
                    rbc = np.random.normal(3.1, 0.3)
                    rbc = max(2.0, rbc)
                    hct = hb * 2.9 + np.random.normal(0, 1.1)
                    
            else:  # Normocytic Anemia
                mcv = np.random.normal(90.0, 3.5)
                mcv = max(80.0, min(mcv, 100.0)) # Normal size
                
                mch = np.random.normal(30.0, 1.2)
                mch = max(27.0, min(mch, 33.0)) # Normal content
                
                mchc = np.random.normal(34.0, 1.0)
                mchc = max(32.0, min(mchc, 36.0)) # Normal concentration
                
                # Hb is low, RBC and HCT are low proportionally
                if gender == 0:  # Female
                    hb = np.random.normal(10.0, 1.0)
                    hb = min(hb, 11.9)
                    hb = max(7.0, hb)
                    rbc = np.random.normal(3.3, 0.3)
                    hct = hb * 3.0 + np.random.normal(0, 0.8)
                else:  # Male
                    hb = np.random.normal(11.2, 1.1)
                    hb = min(hb, 13.4)
                    hb = max(8.0, hb)
                    rbc = np.random.normal(3.8, 0.4)
                    hct = hb * 3.0 + np.random.normal(0, 0.9)
            
            anemia_label = 1
            
        ages.append(age)
        genders.append(gender)
        hemoglobins.append(round(hb, 2))
        rbc_counts.append(round(rbc, 2))
        hematocrits.append(round(hct, 1))
        mcvs.append(round(mcv, 1))
        mchs.append(round(mch, 1))
        mchcs.append(round(mchc, 1))
        anemia_labels.append(anemia_label)
        anemia_types.append(a_type)
        
    df = pd.DataFrame({
        'Patient_ID': [f'PT{10000+i}' for i in range(num_samples)],
        'Age': ages,
        'Gender': genders, # 0: Female, 1: Male
        'Hemoglobin': hemoglobins,
        'RBC_Count': rbc_counts,
        'Hematocrit': hematocrits,
        'MCV': mcvs,
        'MCH': mchs,
        'MCHC': mchcs,
        'Anemia': anemia_labels,
        'Anemia_Type': anemia_types # Auxiliary column, not a feature
    })
    
    return df

if __name__ == '__main__':
    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)
    
    print("Generating synthetic patient hematology dataset...")
    df = generate_anemia_dataset(num_samples=3000)
    
    # Save the dataset
    data_path = os.path.join('data', 'anemia_dataset.csv')
    df.to_csv(data_path, index=False)
    print(f"Dataset saved to {data_path}")
    print(f"Total samples: {len(df)}")
    print(f"Healthy samples: {len(df[df['Anemia'] == 0])}")
    print(f"Anemic samples: {len(df[df['Anemia'] == 1])}")
    print("Anemia type distribution:")
    print(df['Anemia_Type'].value_counts().rename({0: 'Healthy', 1: 'Microcytic', 2: 'Macrocytic', 3: 'Normocytic'}))
