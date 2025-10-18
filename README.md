# Samsung Innovation Campus - Stress Detection Web App

## 📌 Project Overview
This project implements a **machine learning-based stress detection system** using physiological data from wearable devices. The system was upgraded from a basic Logistic Regression model to an **ensemble-based Random Forest model** with advanced feature engineering, achieving 98% accuracy on the **synthetic dataset**.  

The goal is to provide **real-time stress detection**, assist in **stress management**, and serve as a **research and educational tool**.

---

## 🔄 Model Evolution: Before vs After

### Original Model (Logistic Regression)
- **Algorithm**: Logistic Regression
- **Accuracy**: 89%
- **Features**: 8 physiological features (HR, EDA, TEMP, ACC_X/Y/Z, BVP, IBI)
- **Scaling**: StandardScaler
- **Limitations**:  
  - Limited features, no engineered features  
  - Linear model, less effective for complex patterns  
  - Sensitive to outliers

### Improved Model (Random Forest)
- **Algorithm**: Random Forest Classifier
- **Accuracy**: 98% on the synthetic dataset  
- **Features**: 14 features (8 original + 6 engineered)
- **Scaling**: RobustScaler
- **Improvements**:  
  - Advanced feature engineering  
  - Multiple algorithms tested  
  - Hyperparameter tuning using GridSearchCV  
  - Robust preprocessing  
  - Feature importance analysis  

---

## 🧠 Technical Deep Dive

### 1. Feature Engineering

#### Original Features (8)
- HR (Heart Rate), EDA (Electrodermal Activity), TEMP (Temperature)  
- ACC_X/Y/Z (Accelerometer), BVP (Blood Volume Pulse), IBI (Inter-Beat Interval)  

#### Engineered Features (6)
1. **HRV (Heart Rate Variability)** – derived from IBI  
2. **Stress_Index** – `(HR × EDA) / 100`  
3. **Activity_Level** – `√(ACC_X² + ACC_Y² + ACC_Z²)`  
4. **Physiological_Arousal** – `(HR × EDA × TEMP) / 1000`  
5. **BVP_Stress_Indicator** – `1 / (BVP + 0.1)`  
6. **Temp_Deviation** – `|TEMP - 36.5|`  

---

### 2. Machine Learning Algorithms

#### Logistic Regression (Original)
- **Type**: Linear classifier  
- **Pros**: Simple, interpretable, fast  
- **Cons**: Assumes linear relationships, limited complexity handling  

#### Random Forest (Improved)
- **Type**: Ensemble of decision trees  
- **How it works**: Trains multiple trees on random subsets of data and features, combines predictions via majority voting  
- **Pros**: Handles non-linear relationships, robust to noise/outliers, feature importance  
- **Cons**: Less interpretable than single trees  

---

### 3. Data Preprocessing
- **Original**: StandardScaler – sensitive to outliers  
- **Improved**: RobustScaler – uses median and IQR, less sensitive to outliers  

---

### 4. Model Training Process
- **Cross-validation**: 5-fold CV for reliable performance estimate  
- **Hyperparameter Tuning (GridSearchCV)**:  
  - `n_estimators`: [50, 100, 200]  
  - `max_depth`: [None, 10, 20, 30]  
  - `min_samples_split`: [2, 5, 10]  
  - `min_samples_leaf`: [1, 2, 4]  
  - `class_weight`: [None, 'balanced']  

---

### 5. Evaluation Metrics
- **Accuracy**: Correct predictions / Total predictions  
- **Original**: 89%  
- **Improved**: 98% (on synthetic data)  
- **Other metrics**: Precision, Recall, F1-Score, ROC Curve & AUC  

---

## ⚠️ Challenges & Observations

1. **Synthetic Dataset Limitations**:  
   - The model was trained on **synthetic/generated data**, not real-world measurements.  
   - The dataset had very few **No-Stress samples**, causing imbalance.  

2. **98% Accuracy Issue**:  
   - Perfect accuracy is suspicious and indicates **overfitting**.  
   - The model may **memorize the synthetic data** rather than learn general patterns.  
   - It may **perform poorly on real-world data**, which is noisy and variable.  

3. **Feature Limitations**:  
   - Current features capture generic physiological patterns but may not reflect **individual stress variability**.

---

## 🚀 Performance Comparison

| Metric | Original | Improved | Improvement |
|--------|---------|----------|-------------|
| Accuracy | 89% | 98% | +10% |
| Features | 8 | 14 | +75% |
| Algorithms Tested | 1 | 4 | +300% |
| Cross-Validation | No | Yes | +∞ |
| Hyperparameter Tuning | No | Yes | +∞ |

---

## 🔧 Technical Implementation

### File Structure
├── app.py
├── improved_app.py
├── train_model.ipynb
├── improved_train_model.ipynb
├── improved_stress_model.pkl
├── improved_scaler.pkl
├── feature_info.pkl
├── logistic_stress_model.pkl
├── scaler.pkl
├── Datasets.csv
└── templates/
└── index.html
