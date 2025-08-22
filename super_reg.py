import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import numpy as np
import joblib
import os

# --- Final Column Configuration ---
# Based on the data inspection, these are the correct columns for the model.
# Python counts from 0, so the first column is 0, the second is 1, etc.
PROTON_DENSITY_COL = 38
SOLAR_WIND_SPEED_COL = 41  # This is the target variable we want to predict
IMF_TOTAL_COL = 49
IMF_BZ_COL = 40


def train_and_evaluate_model(file_path):
    """
    Trains a supervised model using the final, correct column configuration,
    evaluates its performance, and saves the trained model to a file.
    """
    try:
        # Define values that should be treated as missing or "Not a Number"
        missing_values = [
            "99.99", "999.9", "999.99", "9999.99", "99999.9",
            "999999.9", "9999999."
        ]
        
        # Read the space-separated data file using pandas
        df = pd.read_csv(file_path, sep=r'\s+', header=None, na_values=missing_values, engine='python')

        # Rename the columns we need with meaningful names
        df.rename(columns={
            PROTON_DENSITY_COL: 'Proton_Density_cm3',
            SOLAR_WIND_SPEED_COL: 'Solar_Wind_Speed_km_s',
            IMF_TOTAL_COL: 'IMF_Total_nT',
            IMF_BZ_COL: 'IMF_Bz_nT'
        }, inplace=True)

        # Select only the columns we need for the model
        df_selected = df[['Proton_Density_cm3', 'Solar_Wind_Speed_km_s', 'IMF_Total_nT', 'IMF_Bz_nT']]
        
        # Remove any rows that have missing data in these specific columns
        df_selected.dropna(inplace=True)

        if df_selected.empty:
            print("Error: After cleaning the data, the dataframe is empty. Please double-check the column numbers.")
            return

        print(f"Data loaded and cleaned successfully. Found {len(df_selected)} valid rows for training.")

        # Define the features (X) and the target variable (y)
        # Features are the inputs we use to make a prediction.
        X = df_selected[['Proton_Density_cm3', 'IMF_Total_nT', 'IMF_Bz_nT']]
        # The target is the value we are trying to predict.
        y = df_selected['Solar_Wind_Speed_km_s']

        # Split the data: 80% for training the model, 20% for testing its performance
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Initialize and train the Random Forest Regressor model
        print("Training the model...")
        model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1) # Use all available CPU cores
        model.fit(X_train, y_train)
        print("Model training complete.")

        # Use the trained model to make predictions on the unseen test data
        y_pred = model.predict(X_test)

        # Calculate and print the model's performance metrics
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        print("\n--- Model Performance ---")
        print(f"Accuracy (R-squared): {r2:.2f}")
        print(f"Mean Squared Error (MSE): {mse:.2f}")
        print("-------------------------")

        # Save the trained model to a file for later use in your web app or other projects
        output_filename = 'supervised_forecaster.joblib'
        joblib.dump(model, output_filename)
        print(f"\nModel successfully trained and saved to '{os.path.abspath(output_filename)}'")

    except FileNotFoundError:
        print(f"Error: The data file was not found at '{file_path}'. Please ensure the path is correct.")
    except KeyError:
        print("Error: One of the specified column numbers does not exist in the data file. Please check the column configuration.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Define the path to the data file relative to the script's location
    data_file = 'data_csv/omni_data_cleaned.txt'
    train_and_evaluate_model(data_file)
