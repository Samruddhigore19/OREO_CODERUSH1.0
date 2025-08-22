import joblib
import numpy as np
import os

# --- CONFIGURATION ---
# Define the path to your trained model file.
MODEL_FILE = 'supervised_forecaster.joblib'

# Define the alert threshold in km/s.
# Adjust this value based on your specific needs and research.
DANGEROUS_SPEED_THRESHOLD = 600.0 

# --- MODEL AND PREDICTION FUNCTIONS ---

def load_model(file_path):
    """
    Loads the trained model from the specified file.
    Returns the model object or None if the file is not found.
    """
    if not os.path.exists(file_path):
        print(f"Error: Model file not found at '{file_path}'")
        print("Please run the 'super_reg.py' script first to train and save the model.")
        return None
    
    print(f"Loading model from '{file_path}'...")
    try:
        model = joblib.load(file_path)
        print("Model loaded successfully.")
        return model
    except Exception as e:
        print(f"An error occurred while loading the model: {e}")
        return None

def make_prediction(model, proton_density, imf_total, imf_bz):
    """
    Uses the loaded model to predict solar wind speed based on new data.
    """
    if model is None:
        print("Cannot make a prediction because the model is not loaded.")
        return None

    # The input data must be a 2D array in the exact order the model was trained on:
    # [Proton_Density_cm3, IMF_Total_nT, IMF_Bz_nT]
    # Note: The order of features here MUST match the order in the training script's X variable.
    # Our training script used: df_selected[['Proton_Density_cm3', 'IMF_Total_nT', 'IMF_Bz_nT']]
    # So the order is correct.
    
    input_data = np.array([[proton_density, imf_total, imf_bz]])
    
    print(f"\nMaking prediction for input data: {input_data[0]}...")
    
    # Use the model to predict the outcome
    predicted_speed = model.predict(input_data)
    
    # The result is an array, so we extract the single value
    return predicted_speed[0]

def generate_alert(predicted_speed):
    """
    Compares the predicted speed to a threshold and prints an alert.
    """
    if predicted_speed is None:
        return

    print(f"--> Predicted Solar Wind Speed: {predicted_speed:.2f} km/s")

    if predicted_speed > DANGEROUS_SPEED_THRESHOLD:
        print("\n===================================================================")
        print("!!! ALERT: HIGH SOLAR WIND SPEED PREDICTED !!!")
        print(f"    Predicted speed ({predicted_speed:.2f} km/s) exceeds threshold ({DANGEROUS_SPEED_THRESHOLD} km/s).")
        print("    Potential for Coronal Mass Ejection (CME) impact.")
        print("===================================================================")
    else:
        print("\n-------------------------------------------------------------------")
        print("CONDITION: NORMAL")
        print(f"    Predicted speed ({predicted_speed:.2f} km/s) is within safe limits.")
        print("-------------------------------------------------------------------")


# --- MAIN EXECUTION ---
if __name__ == "__main__":
    # Load the trained model
    forecasting_model = load_model(MODEL_FILE)

    # This is where you would get your live, real-time data.
    # For this example, we will use sample data.
    # You can change these numbers to test different scenarios.
    
    # Scenario 1: Normal conditions
    print("\n--- Testing Scenario 1: Normal Conditions ---")
    live_proton_density_normal = 4.5
    live_imf_total_normal = 5.2
    live_imf_bz_normal = -1.3
    
    prediction_normal = make_prediction(forecasting_model, live_proton_density_normal, live_imf_total_normal, live_imf_bz_normal)
    generate_alert(prediction_normal)

    # Scenario 2: Potentially dangerous conditions
    print("\n--- Testing Scenario 2: High-Activity Conditions ---")
    live_proton_density_high = 18.2
    live_imf_total_high = 15.8
    live_imf_bz_high = -11.5

    prediction_high = make_prediction(forecasting_model, live_proton_density_high, live_imf_total_high, live_imf_bz_high)
    generate_alert(prediction_high)
