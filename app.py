from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import joblib
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# Load model and encoders
model = joblib.load('travel_model_api/model.pkl')
le_location = joblib.load('travel_model_api/le_location.pkl')
le_package = joblib.load('travel_model_api/le_package.pkl')
le_travel_companion = joblib.load('travel_model_api/le_travel_companion.pkl')

# Load dataset
df = pd.read_excel('Trip_Dataset_VZero.xlsx')
logging.info(f"Dataset columns: {df.columns}")

# Input schema
class TripInput(BaseModel):
    locations: list
    package: str
    total_days: int
    rating_range: str
    travel_companion: str

# Prepare features for prediction
def prepare_input_for_prediction(X_filtered, model):
    model_features = model.get_booster().feature_names
    for feature in model_features:
        if feature not in X_filtered.columns:
            X_filtered[feature] = 0
    return X_filtered[model_features]

# Prediction logic
def predict_budget_multiple_options(locations, package, total_days, rating_range, travel_companion_encoded, df, model, le_location, le_package, le_travel_companion, max_options=3):
    try:
        location_values = le_location.transform(locations)
        package_value = le_package.transform([package])[0]
        logging.info(f"Encoded travel_companion: {travel_companion_encoded}")
        logging.info(f"Encoded package: {package_value}")
        logging.info(f"Available travel_companion classes: {le_travel_companion.classes_}")

        # ✅ Use correct column name
        X_filtered = df[df['Package_Type'] == package]
        
        if X_filtered.empty:
            raise HTTPException(status_code=404, detail="No matching data found for given package.")

        X_filtered = X_filtered.copy()
        X_filtered['location'] = location_values[0]  # Set to one for now (can enhance later)
        X_filtered['travel_companion'] = travel_companion_encoded
        X_filtered['total_days'] = total_days
        X_filtered['rating_range'] = rating_range

        X_prepared = prepare_input_for_prediction(X_filtered, model)
        predictions = model.predict(X_prepared)
        return predictions[:max_options]

    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {e}")

# Endpoint
@app.post("/predict")
async def predict_trip(input_data: TripInput):
    logging.info(f"Received input: locations={input_data.locations}, package={input_data.package}, total_days={input_data.total_days}, rating_range={input_data.rating_range}, travel_companion={input_data.travel_companion}")
    
    try:
        travel_companion_encoded = le_travel_companion.transform([input_data.travel_companion])[0]

        result = predict_budget_multiple_options(
            locations=input_data.locations,
            package=input_data.package,
            total_days=input_data.total_days,
            rating_range=input_data.rating_range,
            travel_companion_encoded=travel_companion_encoded,
            df=df,
            model=model,
            le_location=le_location,
            le_package=le_package,
            le_travel_companion=le_travel_companion
        )
        return {"predicted_budget": result.tolist()}
    except Exception as e:
        logging.error(f"Error during prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {e}")

# To run directly with `python app.py`
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
