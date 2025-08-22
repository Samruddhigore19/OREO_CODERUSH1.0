This branch is the test branch. The final code will be updated on the main branch.

Data Source: NASA OMNIWeb
The model is trained on historical hourly data obtained from the NASA OMNIWeb service. This dataset provides a comprehensive record of solar wind, plasma, and interplanetary magnetic field (IMF) parameters as measured by 
satellites at the L1 Lagrange point.
The data file (omni_data_cleaned.txt) contains one year of hourly measurements, with each row representing one hour and each column representing a specific physical parameter.

Model Prediction Logic
The model is a RandomForestRegressor that predicts a single target value (Solar Wind Speed) based on multiple input features. A sudden, high predicted speed is used as a strong indicator of a potential CME impact, which thet 
triggers an alert.

Input Features (X)
The model uses the following six parameters from the OMNI data file as inputs to make its forecast. The column indices are 0-based.
Proton Density (Column 38): The number of solar wind protons per cubic centimeter.
IMF Total Field (Bt) (Column 49): The total magnitude of the interplanetary magnetic field.
IMF Bz Component (Column 40): The north-south direction of the IMF. A strong negative Bz is a key indicator of geomagnetic storms.
IMF Bx Component (Column 13): The sun-earth component of the IMF.
IMF By Component (Column 14): The east-west component of the IMF.
Proton Temperature (Column 42): The temperature of the solar wind plasma in Kelvin.

Target Variable (y)
The model is trained to predict the following single value:
Solar Wind Speed (Column 41): The bulk speed of the solar wind in km/s. This is the value the model forecasts.
