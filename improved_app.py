import pandas as pd
from flask import Flask, render_template, request, jsonify
import joblib
import random
import numpy as np

app = Flask(__name__)

# Load the improved trained model and scaler
try:
    model = joblib.load('improved_stress_model.pkl')
    scaler = joblib.load('improved_scaler.pkl')
    feature_info = joblib.load('feature_info.pkl')
    print("✅ Improved model loaded successfully!")
except FileNotFoundError:
    print("❌ Improved model files not found. Please run improved_train_model.ipynb first.")
    # Fallback to original model
    model = joblib.load('logistic_stress_model.pkl')
    scaler = joblib.load('scaler.pkl')
    feature_info = None
    print("⚠️ Using original model as fallback")

# Load datasets for random sample generation
high_stress_data = pd.read_csv('high_stress_session.csv')
moderate_stress_data = pd.read_csv('moderate_stress_session.csv')
low_stress_data = pd.read_csv('low_stress_session.csv')

# Store datasets with their stress levels
stress_datasets = {
    'high': high_stress_data,
    'moderate': moderate_stress_data,
    'low': low_stress_data
}

# Counter to track stress predictions for balanced generation
stress_counter = 0

def create_features_from_input(data):
    """Create enhanced features from input data"""
    # Convert to DataFrame for easier manipulation
    df = pd.DataFrame([data])
    
    # Create the same features as in training
    df['HRV'] = df['IBI']
    df['Stress_Index'] = (df['HR'] * df['EDA']) / 100
    df['Activity_Level'] = np.sqrt(df['ACC_X']**2 + df['ACC_Y']**2 + df['ACC_Z']**2)
    df['Physiological_Arousal'] = (df['HR'] * df['EDA'] * df['TEMP']) / 1000
    df['BVP_Stress_Indicator'] = 1 / (df['BVP'] + 0.1)
    df['Temp_Deviation'] = abs(df['TEMP'] - 36.5)
    
    # Return features in the same order as training
    if feature_info:
        return df[feature_info['feature_columns']].values
    else:
        # Fallback for original model
        return df[['HR', 'EDA', 'TEMP', 'ACC_X', 'ACC_Y', 'ACC_Z', 'BVP', 'IBI']].values

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Create enhanced features
        features = create_features_from_input(data)
        
        # Scale the input features
        scaled_features = scaler.transform(features)

        # Make prediction
        prediction_proba = model.predict_proba(scaled_features)
        prediction_label = model.predict(scaled_features)[0]
        
        # Get confidence for the predicted class
        confidence = np.max(prediction_proba) * 100

        return jsonify({
            'prediction': prediction_label,
            'confidence': round(confidence, 2),
            'status': 'success',
            'model_type': 'improved' if feature_info else 'original'
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400

@app.route('/random_sample', methods=['GET'])
def get_random_sample():
    global stress_counter
    try:
        # Implement balanced generation: after every 3 stress predictions, generate no-stress
        if stress_counter >= 3:
            # Force no-stress generation with truly no-stress parameters
            stress_level = 'no_stress'
            stress_counter = 0  # Reset counter
            
            # Generate truly no-stress data based on conservative ranges that work well with the model
            # Conservative no-stress characteristics: HR (70-85), EDA (0.20-0.40), IBI (0.80-0.90), TEMP (36.3-36.8)
            sample_data = {
                'HR': random.uniform(70, 85),  # Conservative heart rate range
                'EDA': random.uniform(0.20, 0.40),  # Conservative electrodermal activity range
                'TEMP': random.uniform(36.3, 36.8),  # Conservative temperature range
                'ACC_X': random.uniform(-0.05, 0.05),  # Very low activity
                'ACC_Y': random.uniform(-0.05, 0.05),  # Very low activity
                'ACC_Z': random.uniform(-0.05, 0.05),  # Very low activity
                'BVP': random.uniform(0.80, 0.90),  # Higher BVP range for no-stress
                'IBI': random.uniform(0.80, 0.90),  # Higher IBI range for no-stress
                'actual_label': 'no_stress',
                'dataset_source': 'generated_no_stress'
            }
        else:
            # Randomly select between high and low stress datasets
            stress_level = random.choice(['high', 'low'])
            stress_counter += 1  # Increment counter for stress generation
            
            selected_dataset = stress_datasets[stress_level]
            
            # Get a random row from the selected dataset
            random_row = selected_dataset.sample(n=1).iloc[0]
            
            # Generate BVP value based on stress level and other parameters
            if stress_level == 'high':
                bvp_base = random.uniform(0.6, 0.8)  # Lower BVP for high stress
            elif stress_level == 'moderate':
                bvp_base = random.uniform(0.7, 0.85)  # Moderate BVP
            else:  # low stress
                bvp_base = random.uniform(0.8, 0.95)  # Higher BVP for low stress
            
            # Adjust BVP based on HR
            hr_factor = 1 - (float(random_row['HR']) - 60) / 100
            bvp_value = max(0.5, min(1.0, bvp_base * hr_factor))
            
            # Map the dataset columns to our expected format
            sample_data = {
                'HR': float(random_row['HR']),
                'EDA': float(random_row['EDA']),
                'TEMP': float(random_row['TEMP']),
                'ACC_X': float(random_row['ACC_x']),  # Note: dataset uses lowercase 'x'
                'ACC_Y': float(random_row['ACC_y']),  # Note: dataset uses lowercase 'y'
                'ACC_Z': float(random_row['ACC_z']),  # Note: dataset uses lowercase 'z'
                'BVP': round(bvp_value, 2),
                'IBI': float(random_row['IBI']),
                'actual_label': stress_level,
                'dataset_source': stress_level
            }
        
        return jsonify({
            'sample': sample_data,
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400

@app.route('/model_info', methods=['GET'])
def get_model_info():
    """Get information about the current model"""
    try:
        if feature_info:
            return jsonify({
                'model_type': 'improved',
                'features': feature_info['feature_columns'],
                'new_features': feature_info['new_features'],
                'total_features': len(feature_info['feature_columns']),
                'status': 'success'
            })
        else:
            return jsonify({
                'model_type': 'original',
                'features': ['HR', 'EDA', 'TEMP', 'ACC_X', 'ACC_Y', 'ACC_Z', 'BVP', 'IBI'],
                'total_features': 8,
                'status': 'success'
            })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
