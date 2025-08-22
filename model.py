# import pandas as pd
# from sklearn.ensemble import IsolationForest
# import joblib
# import numpy as np

# # 1. Load the data from your CSV file
# df = pd.read_csv('data_csv')
# df['time'] = pd.to_datetime(df['time'])

# # 2. Engineer features for the model using the flux data
# # We'll use a few representative flux channels as features for simplicity.
# # You can experiment with more channels later.
# flux_channels = ['integrated_flux_mod_10', 'integrated_flux_mod_25', 'integrated_flux_mod_40']

# # Create delta and rolling standard deviation features for each selected channel
# for channel in flux_channels:
#     df[f'{channel}_delta'] = df[channel].diff().fillna(0)
#     df[f'{channel}_std'] = df[channel].rolling(window=10).std().fillna(0)

# # 3. Select all the new features for training
# features = [f'{c}_delta' for c in flux_channels] + [f'{c}_std' for c in flux_channels]

# # 4. Train the Isolation Forest model on your unlabeled data
# model = IsolationForest(contamination=0.01, random_state=42)
# model.fit(df[features])

# # 5. Make predictions and save the model
# df['anomaly_prediction'] = model.predict(df[features])
# df['anomaly_score'] = model.decision_function(df[features])

# # Save the trained model for your web app to use
# joblib.dump(model, 'ml_model/anomaly_detector.joblib')
# print("Isolation Forest model trained and saved successfully.")

# # Save the processed data for visualization in your dashboard
# df.to_csv('data_out/processed_data.csv', index=False)


import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib
import numpy as np
import os

def train_and_save_model(input_path, output_data_dir, output_model_path):
    """
    Loads data, engineers features, trains an IsolationForest model,
    and saves the model and processed data to specified paths.
    """
    try:
        # Create the output directories if they don't exist
        os.makedirs(output_data_dir, exist_ok=True)
        os.makedirs(os.path.dirname(output_model_path), exist_ok=True)

        # 1. Load the data from your CSV file
        df = pd.read_csv(input_path)
        df['time'] = pd.to_datetime(df['time'])

        # 2. Engineer features for the model using the flux data
        flux_columns = [col for col in df.columns if 'integrated_flux_mod_' in col]
        df[flux_columns] = df[flux_columns].fillna(0)
        
        features_for_model = []
        for channel in flux_columns:
            df[f'{channel}_delta'] = df[channel].diff().fillna(0)
            df[f'{channel}_std'] = df[channel].rolling(window=5, min_periods=1).std().fillna(0)
            features_for_model.extend([f'{channel}_delta', f'{channel}_std'])

        # 3. Train the Isolation Forest model
        model = IsolationForest(contamination=0.01, random_state=42)
        model.fit(df[features_for_model])

        # 4. Make predictions and save the model
        df['anomaly_prediction'] = model.predict(df[features_for_model])
        df['anomaly_score'] = model.decision_function(df[features_for_model])

        joblib.dump(model, output_model_path)
        print(f"Isolation Forest model trained and saved to {output_model_path}")
        
        output_data_path = os.path.join(output_data_dir, 'processed_data.csv')
        df.to_csv(output_data_path, index=False)
        print(f"Processed data with predictions saved to {output_data_path}")

    except FileNotFoundError:
        print("Error: The input CSV file was not found.")
        print(f"Please ensure your CSV file is located at: {input_path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Define your paths relative to the script's location
    input_csv_folder = 'data_csv'
    input_csv_file = 'AL1_ASW91_L2_TH2_20250819_UNP_9999_999999_V02.csv'
    
    # Construct the full path to the input CSV
    input_path = os.path.join(input_csv_folder, input_csv_file)
    
    # Define the output directories and file paths
    output_data_dir = 'data_out'
    output_model_dir = 'ml_model'
    output_model_path = os.path.join(output_model_dir, 'anomaly_detector.joblib')
    
    # Run the function with the new paths
    train_and_save_model(input_path, output_data_dir, output_model_path)