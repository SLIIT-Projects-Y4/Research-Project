import pandas as pd
from sklearn.preprocessing import LabelEncoder
import joblib
import xgboost as xgb

# Load your dataset (use the correct relative path to the dataset)
df = pd.read_excel('Trip_Dataset_VZero.xlsx')  # Assuming the dataset is in the same folder as the script

# Initialize label encoders for categorical features
le_location = LabelEncoder()
le_package = LabelEncoder()
le_travel_companion = LabelEncoder()

# Fit label encoders on the appropriate columns
le_location.fit(df['Location_ID'])  # Replace 'Location_ID' with your actual column name
le_package.fit(df['Package_Type'])  # Replace 'Package_Type' with your actual column name
le_travel_companion.fit(df['Travel_Companion'])  # Travel Companions (Solo, Couple, etc.)

# Save the label encoders to files in the 'travel_model_api' folder
joblib.dump(le_location, 'travel_model_api/le_location.pkl')
joblib.dump(le_package, 'travel_model_api/le_package.pkl')
joblib.dump(le_travel_companion, 'travel_model_api/le_travel_companion.pkl')

# Clean dataset by removing unnecessary columns
columns_to_drop = ['Budget (LKR)', 'Package_ID', 'Accommodation', 'Food & Transport', 'Rating_Range']
X = df.drop(columns=[col for col in columns_to_drop if col in df.columns])  # Drop columns only if they exist
y = df['Budget (LKR)']  # Assuming 'Budget (LKR)' is your target column

# Encode categorical features with label encoders
X['Location_ID'] = le_location.transform(X['Location_ID'])
X['Package_Type'] = le_package.transform(X['Package_Type'])
X['Travel_Companion'] = le_travel_companion.transform(X['Travel_Companion'])

# Handle 'Activities' and 'Location_Features' columns (apply label encoding for simplicity)
if 'Activities' in X.columns:
    X['Activities'] = X['Activities'].astype('category').cat.codes
else:
    print("Activities column is missing in the dataset")

if 'Location_Features' in X.columns:
    X['Location_Features'] = X['Location_Features'].astype('category').cat.codes
else:
    print("Location_Features column is missing in the dataset")

# Train an XGBoost model (adjust parameters based on your training process)
best_model = xgb.XGBRegressor()
best_model.fit(X, y)

# Save the trained model in the 'travel_model_api' folder
joblib.dump(best_model, 'travel_model_api/model.pkl')

print("Label Encoders and Model saved successfully.")
