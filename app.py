from flask import Flask, request, jsonify, render_template
import pandas as pd
import joblib
import numpy as np
import random

app = Flask(__name__)

# Load the trained model and scaler
model = joblib.load('logistic_stress_model.pkl')
scaler = joblib.load('scaler.pkl')

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

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Extract features in the correct order
        features = [
            float(data['HR']),
            float(data['EDA']),
            float(data['TEMP']),
            float(data['ACC_X']),
            float(data['ACC_Y']),
            float(data['ACC_Z']),
            float(data['BVP']),
            float(data['IBI'])
        ]
        
        # Convert to numpy array and reshape for prediction
        features_array = np.array(features).reshape(1, -1)
        
        # Scale the features
        features_scaled = scaler.transform(features_array)
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        prediction_proba = model.predict_proba(features_scaled)[0]
        
        # Get confidence score
        confidence = max(prediction_proba) * 100
        
        return jsonify({
            'prediction': prediction,
            'confidence': round(confidence, 2),
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 400

@app.route('/random_sample', methods=['GET'])
def get_random_sample():
    try:
        # Randomly select one of the three stress level datasets
        stress_level = random.choice(['high', 'moderate', 'low'])
        selected_dataset = stress_datasets[stress_level]
        
        # Get a random row from the selected dataset
        random_row = selected_dataset.sample(n=1).iloc[0]
        
        # Generate BVP value based on stress level and other parameters
        # BVP tends to be lower during stress due to vasoconstriction
        if stress_level == 'high':
            bvp_base = random.uniform(0.6, 0.8)  # Lower BVP for high stress
        elif stress_level == 'moderate':
            bvp_base = random.uniform(0.7, 0.85)  # Moderate BVP
        else:  # low stress
            bvp_base = random.uniform(0.8, 0.95)  # Higher BVP for low stress
        
        # Adjust BVP based on HR (higher HR often correlates with lower BVP)
        hr_factor = 1 - (float(random_row['HR']) - 60) / 100  # Normalize HR effect
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
            'actual_label': stress_level,  # Store the stress level for reference
            'dataset_source': stress_level  # Additional info about which dataset was used
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
