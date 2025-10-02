from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import joblib
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import requests
import json
from collections import Counter
import mysql.connector
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score, TimeSeriesSplit
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import io
import base64
from io import BytesIO
from scipy.ndimage import gaussian_filter1d
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error
import matplotlib.pyplot as plt
import traceback
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'feedback_system'
}

# Load the sentiment analysis model and vectorizer
try:
    sentiment_model = load_model('sentiment_model_v3.h5')
    vectorizer = joblib.load('vectorizer_v3.pkl')
    sentiment_labels = ['Positive', 'Neutral', 'Negative']
except Exception as e:
    print(f"Error loading models: {e}")

class ProductImprovementSystem:
    def __init__(self, api_key):
        self.api_key = api_key
        self.gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        self.headers = {'Content-Type': 'application/json'}

    def analyze_reviews(self, reviews):
        combined_reviews = " ".join(reviews)
        prompt = f"""
         Analyze the following customer reviews and provide precise, actionable improvement suggestions. For each issue identified, respond in the following format:

        **Issue**: [Brief description of the problem]
        **Improvement**: [Specific action or improvement]

        Ensure the following:
        - Focus on the most common and critical issues.
        - Provide concise and realistic suggestions.
        - Avoid unnecessary explanations or fluff.


        Reviews: {combined_reviews}
        """
        return self.get_suggestion_from_api(prompt)



    def get_suggestion_from_api(self, prompt):
        data = {
            "contents": [{"parts": [{"text": prompt}]}]
        }
        try:
            response = requests.post(
                f"{self.gemini_api_url}?key={self.api_key}",
                headers=self.headers,
                data=json.dumps(data)
            )
            if response.status_code == 200:
                response_json = response.json()
                suggestion = response_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", None)
                return suggestion.strip() if suggestion else "No actionable suggestion generated."
            else:
                return f"Error: {response.status_code} - {response.text}"
        except requests.exceptions.RequestException as e:
            return f"An error occurred: {e}"

# Initialize the Product Improvement System
api_key = "AIzaSyD7mPGem7KTtks2bOZ0cIeoxYNWhchDnPk"  
improvement_system = ProductImprovementSystem(api_key)

def get_db_connection():
    try:
        return mysql.connector.connect(**db_config)
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        return None

def predict_sentiment(review):
    try:
        review = review.lower().strip()
        review_tfidf = vectorizer.transform([review])
        prediction = sentiment_model.predict(review_tfidf)
        max_index = np.argmax(prediction)
        return sentiment_labels[max_index]
    except Exception as e:
        print(f"Error in sentiment prediction: {e}")
        return "Neutral"

def extract_common_problems(reviews):
    common_keywords = {
        "quality": ["poor", "bad", "low", "inconsistent"],
        "price": ["expensive", "costly", "overpriced"],
        "delivery": ["late", "delayed", "slow"],
        "durability": ["broke", "broken", "weak", "fragile"],
        "customer service": ["unhelpful", "rude", "unresponsive"],
        "usability": ["difficult", "complicated", "confusing"],
        "performance": ["slow", "laggy", "inefficient"]
    }
    
    problems = []
    for review in reviews:
        review_lower = review.lower()
        for category, keywords in common_keywords.items():
            if any(keyword in review_lower for keyword in keywords):
                problems.append(category)
    
    problem_counts = Counter(problems)
    return problem_counts.most_common(5)

def to_python_type(obj):
    """Convert numpy types to Python native types"""
    if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
        np.int16, np.int32, np.int64, np.uint8,
        np.uint16, np.uint32, np.uint64)):
        return int(obj)
    elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
        return float(obj)
    elif isinstance(obj, (np.bool_)):
        return bool(obj)
    elif isinstance(obj, (np.ndarray,)):
        return obj.tolist()
    return obj

@app.route('/api/reviews/<int:product_id>', methods=['GET'])
def get_product_reviews(product_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.*, u.username 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.product_id = %s
        """, (product_id,))
        reviews = cursor.fetchall()
        return jsonify(reviews)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/analyze-product-reviews/<int:product_id>', methods=['GET'])
def analyze_product_reviews(product_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        # Fetch reviews for the specific product
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT r.feedback, r.rating, r.created_at, p.name as product_name
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            WHERE r.product_id = %s
        """, (product_id,))
        reviews = cursor.fetchall()

        if not reviews:
            return jsonify({
                'sentiment_analysis': {
                    'positive': 0,
                    'neutral': 0,
                    'negative': 0,
                    'total_reviews': 0
                },
                'common_problems': [],
                'improvement_suggestion': "No reviews available for analysis.",
                'analysis_timestamp': datetime.now().isoformat()
            }), 200  

        # Extract review texts
        review_texts = [review['feedback'] for review in reviews if review['feedback']]

        if not review_texts:
            return jsonify({
                'sentiment_analysis': {
                    'positive': 0,
                    'neutral': 0,
                    'negative': 0,
                    'total_reviews': 0
                },
                'common_problems': [],
                'improvement_suggestion': "No text reviews available for analysis.",
                'analysis_timestamp': datetime.now().isoformat()
            }), 200

        # Analyze sentiments
        sentiments = [predict_sentiment(review) for review in review_texts]
        sentiment_counts = Counter(sentiments)

        # Extract common problems
        common_problems = extract_common_problems(review_texts)
        problems_formatted = [f"{problem}: {count} mentions" for problem, count in common_problems]

        # Get improvement suggestions
        suggestion = improvement_system.analyze_reviews(review_texts)

        # Prepare detailed response
        response = {
            'product_name': reviews[0]['product_name'] if reviews else 'Unknown Product',
            'sentiment_analysis': {
                'positive': sentiment_counts['Positive'],
                'neutral': sentiment_counts['Neutral'],
                'negative': sentiment_counts['Negative'],
                'total_reviews': len(review_texts)
            },
            'common_problems': problems_formatted,
            'improvement_suggestion': suggestion,
            'analysis_timestamp': datetime.now().isoformat()
        }

        return jsonify(response), 200

    except Exception as e:
        print(f"Error in analyze_product_reviews: {str(e)}")  
        return jsonify({
            'error': str(e),
            'message': 'An error occurred during analysis'
        }), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

_LAST_PREDICTIONS = {}
_MODEL_CACHE = {}
_BASE_PREDICTIONS = {}

def get_cached_model(key, params):
    """Get or create a model with consistent random state"""
    if key not in _MODEL_CACHE:
        _MODEL_CACHE[key] = GradientBoostingRegressor(**params)
    return _MODEL_CACHE[key]

def feature_engineering(data):
    # Create a complete date range without gaps
    date_range = pd.date_range(start=data['date'].min(), end=data['date'].max(), freq='D')
    complete_data = pd.DataFrame({'date': date_range})
    data = pd.merge(complete_data, data, on='date', how='left')
    
    # Fill missing values in categorical columns
    if 'brand' in data.columns:
        data['brand'].fillna(method='ffill', inplace=True)
    if 'model' in data.columns:
        data['model'].fillna(method='ffill', inplace=True)
    
    # Basic time features
    data['day_of_year'] = data['date'].dt.dayofyear
    data['month'] = data['date'].dt.month
    data['day_of_week'] = data['date'].dt.dayofweek
    data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
    
    # Holiday features (expanded list)
    holidays = pd.to_datetime([
        '2024-01-01',  # New Year's Day
        '2024-01-26',  # Republic Day
        '2024-08-15',  # Independence Day
        '2024-10-02',  # Gandhi Jayanti
        '2024-12-25'   # Christmas
    ])
    data['is_holiday'] = data['date'].isin(holidays).astype(int)
    
    # Handle missing values in quantity_sold using linear interpolation
    data['quantity_sold'] = data['quantity_sold'].fillna(method='ffill').fillna(method='bfill')
    data['quantity_sold'] = data['quantity_sold'].interpolate(method='linear')
    
    # Advanced features
    data['rolling_mean_7d'] = data['quantity_sold'].rolling(window=7, min_periods=1, center=True).mean()
    data['rolling_mean_30d'] = data['quantity_sold'].rolling(window=30, min_periods=1, center=True).mean()
    data['rolling_std_7d'] = data['quantity_sold'].rolling(window=7, min_periods=1, center=True).std()
    data['rolling_std_30d'] = data['quantity_sold'].rolling(window=30, min_periods=1, center=True).std()
    
    # Trend features
    data['trend'] = np.arange(len(data))
    data['trend_normalized'] = (data['trend'] - data['trend'].mean()) / data['trend'].std()
    
    # Seasonal features
    data['month_sin'] = np.sin(2 * np.pi * data['month']/12)
    data['month_cos'] = np.cos(2 * np.pi * data['month']/12)
    data['day_sin'] = np.sin(2 * np.pi * data['day_of_year']/365)
    data['day_cos'] = np.cos(2 * np.pi * data['day_of_year']/365)
    
    # Lag features
    for lag in [1, 3, 7, 14, 30]:
        data[f'lag_{lag}'] = data['quantity_sold'].shift(lag)
        data[f'lag_{lag}'].fillna(data['rolling_mean_7d'], inplace=True)
    
    return data




def create_lstm_model(input_shape):
    model = tf.keras.models.Sequential()
    model.add(tf.keras.layers.LSTM(units=50, return_sequences=True, input_shape=input_shape))
    model.add(tf.keras.layers.Dropout(0.2))
    model.add(tf.keras.layers.LSTM(units=50, return_sequences=False))
    model.add(tf.keras.layers.Dropout(0.2))
    model.add(tf.keras.layers.Dense(units=1))  # Prediction of the sales
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

def aggregate_data(data, period='W'):
    df = pd.DataFrame(data)
    df['date'] = pd.to_datetime(df['date'])
    
    if 'predicted_sales' in df.columns:
        df = df.rename(columns={'predicted_sales': 'sales'})
    elif 'actual_sales' in df.columns:
        df = df.rename(columns={'actual_sales': 'sales'})
    
    # Group by period
    if period == 'W':
        grouped = df.resample('W', on='date').agg({
            'sales': ['sum', 'mean', 'std']
        }).reset_index()
    else:  # Monthly
        grouped = df.resample('M', on='date').agg({
            'sales': ['sum', 'mean', 'std']
        }).reset_index()
    
    grouped.columns = ['date', 'total', 'average', 'std']
    
    # Handle NaN values
    grouped['total'] = grouped['total'].fillna(0)
    grouped['average'] = grouped['average'].fillna(0)
    grouped['std'] = grouped['std'].fillna(0)
    
    # Calculate growth rates
    grouped['growth_rate'] = grouped['total'].pct_change() * 100
    grouped['growth_rate'] = grouped['growth_rate'].fillna(0)
    
    # Calculate confidence intervals
    grouped['lower'] = (grouped['average'] - 1.96 * grouped['std']).clip(lower=0)
    grouped['upper'] = grouped['average'] + 1.96 * grouped['std']
    
    # Convert to records and handle NaN values
    records = []
    for record in grouped.to_dict('records'):
        # Ensure all numeric values are finite
        cleaned_record = {}
        for key, value in record.items():
            if key == 'date':
                cleaned_record[key] = value.strftime('%Y-%m-%d')
            else:
                # Replace NaN, inf, -inf with 0
                cleaned_record[key] = 0 if not np.isfinite(float(value)) else float(value)
        records.append(cleaned_record)
    
    return records

@app.route('/api/sales/forecast', methods=['POST'])
def sales_forecast():
    try:
        data = request.get_json()
        if not data or 'sales_data' not in data:
            return jsonify({'error': 'No sales data provided'}), 400

        print("Received data:", data)
        
        # Convert to DataFrame and ensure proper date parsing
        df = pd.DataFrame(data['sales_data'])
        print("Initial DataFrame:", df.head().to_dict())
        
        if 'date' not in df.columns:
            return jsonify({'error': 'Missing date column in sales data'}), 400
            
        # Try parsing dates with multiple formats, starting with YYYY-MM-DD
        try:
            # First try YYYY-MM-DD format
            df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%d')
        except ValueError:
            try:
                # Then try with mixed format
                df['date'] = pd.to_datetime(df['date'], format='mixed')
            except Exception as e:
                return jsonify({'error': f'Failed to parse dates. Expected format YYYY-MM-DD: {str(e)}'}), 400
        
        print("Date parsing successful. Sample dates:", df['date'].head().tolist())
        
        # Sort by date
        df = df.sort_values('date')
        
        # Check for missing or invalid dates
        if df['date'].isnull().any():
            return jsonify({'error': 'Invalid dates found in data'}), 400

        # Rename quantity_sold to actual_sales if needed
        if 'quantity_sold' in df.columns:
            df = df.rename(columns={'quantity_sold': 'actual_sales'})

        # Ensure we have actual_sales column
        if 'actual_sales' not in df.columns:
            return jsonify({'error': 'Sales data column not found. Expected "quantity_sold" or "actual_sales"'}), 400

        # Convert actual_sales to numeric, replacing any non-numeric values with NaN
        df['actual_sales'] = pd.to_numeric(df['actual_sales'], errors='coerce')
        print("Sales data conversion:", df['actual_sales'].head().tolist())
        
        # Remove any rows with NaN values
        df = df.dropna()
        print("Data after cleaning:", len(df), "rows remaining")

        if len(df) == 0:
            return jsonify({'error': 'No valid data after cleaning'}), 400

        if len(df) < 7:
            return jsonify({'error': 'Not enough data points for prediction. Need at least 7 days of sales data.'}), 400
        
        # Calculate time span for forecasting period
        min_date = df['date'].min()
        max_date = df['date'].max()
        time_span_months = (max_date.year - min_date.year) * 12 + max_date.month - min_date.month
        print("Time span months:", time_span_months)
        if time_span_months > 15:
            try:
                # For data more than 4 months, predict for 2 years (730 days)
                forecast_days = 730
                # Use LSTM for long-term predictions
                df['quantity_sold'] = df['actual_sales'].values
                df = df[['date', 'quantity_sold']]
                
                # Create LSTM input with smaller sequence length
                scaler = MinMaxScaler(feature_range=(0, 1))
                scaled_data = scaler.fit_transform(df[['quantity_sold']])
                
                # Use smaller sequence length based on data size
                sequence_length = min(30, len(scaled_data) // 2)  # Use half of data length or 30, whichever is smaller
                if sequence_length < 5:  # If we have very few data points, fall back to Gradient Boosting
                    raise ValueError("Not enough data points for LSTM, falling back to Gradient Boosting")

                train_data = scaled_data[:-forecast_days] if len(scaled_data) > forecast_days else scaled_data
                
                # Prepare training data for LSTM
                X_train, y_train = [], []
                for i in range(sequence_length, len(train_data)):
                    X_train.append(train_data[i-sequence_length:i, 0])
                    y_train.append(train_data[i, 0])
                
                X_train = np.array(X_train)
                y_train = np.array(y_train)

                # Reshaping for LSTM input
                X_train = np.reshape(X_train, (X_train.shape[0], X_train.shape[1], 1))

                # Create and train LSTM model
                model = create_lstm_model((sequence_length, 1))
                model.fit(X_train, y_train, epochs=20, batch_size=32)

                # Prepare last sequence for prediction
                last_sequence = scaled_data[-sequence_length:]
                future_predictions = []

                # Generate predictions one by one
                current_sequence = last_sequence.reshape((1, sequence_length, 1))
                for _ in range(forecast_days):
                    next_pred = model.predict(current_sequence)[0]
                    future_predictions.append(next_pred)
                    # Update sequence for next prediction
                    current_sequence = np.roll(current_sequence, -1)
                    current_sequence[0, -1, 0] = next_pred

                # Convert predictions back to original scale
                future_predictions = np.array(future_predictions).reshape(-1, 1)
                predicted_sales = scaler.inverse_transform(future_predictions)

                # Prepare response
                future_dates = pd.date_range(start=max_date + pd.Timedelta(days=1), 
                                           periods=forecast_days, freq='D')
                forecast_data = [{
                    'date': date.strftime('%Y-%m-%d'),
                    'predicted_sales': float(0 if not np.isfinite(sales) else sales)
                } for date, sales in zip(future_dates, predicted_sales)]

                # Prepare historical data
                historical_data = [{
                    'date': date.strftime('%Y-%m-%d'),
                    'actual_sales': float(sales)
                } for date, sales in zip(df['date'], df['quantity_sold'])]

                # Determine aggregation period based on forecast length
                period = 'W' if forecast_days <= 45 else 'M'
                
                # Aggregate both historical and forecast data
                aggregated_historical = aggregate_data(historical_data, period)
                aggregated_forecast = aggregate_data(forecast_data, period)

                response = {
                    'forecast_data': forecast_data,
                    'historical_data': historical_data,
                    'aggregated_data': {
                        'period': 'weekly' if period == 'W' else 'monthly',
                        'historical': aggregated_historical,
                        'forecast': aggregated_forecast
                    },
                    'forecast_period': '45 days' if forecast_days <= 45 else '2 years',
                    'accuracy': {
                        'r2_score': float(0),
                        'mean_absolute_error': float(0)
                    }
                }

                return jsonify(response)

            except Exception as e:
                print(f"LSTM Error: {str(e)}, falling back to Gradient Boosting")
                # Fall back to Gradient Boosting if LSTM fails
                forecast_days = 45
                # Use Gradient Boosting for short-term predictions
                df['Year'] = df['date'].dt.year
                df['Month'] = df['date'].dt.month
                df['Day'] = df['date'].dt.day
                df['Weekday'] = df['date'].dt.weekday
                df['Week'] = df['date'].dt.isocalendar().week
                df['Quarter'] = df['date'].dt.quarter

                categorical_columns = [
                    "brand", "model", "vehicle_type", "fuel_type", "city", "dealer_type", 
                    "customer_age_group", "customer_gender", "occupation_of_buyer", "payment_mode", 
                    "festive_season_purchase", "advertisement_type", "service_availability", 
                    "weather_condition", "road_conditions"
                ]
                
                numerical_columns = [
                    "engine_capacity_cc", "price_inr", "petrol_price_at_purchase", 
                    "competitor_brand_presence", "discounts_offers", "stock_on_date"
                ]

                # Handle categorical columns
                label_encoders = {}
                for col in categorical_columns:
                    if col in df.columns:
                        df[col] = df[col].astype(str)
                        label_encoders[col] = LabelEncoder()
                        df[col] = label_encoders[col].fit_transform(df[col])

                # Handle numerical columns
                scaler = MinMaxScaler()
                numerical_cols_present = [col for col in numerical_columns if col in df.columns]
                if numerical_cols_present:
                    df[numerical_cols_present] = scaler.fit_transform(df[numerical_cols_present])

                # Add rolling averages for smoothing
                df['MA7'] = df['actual_sales'].rolling(window=7, min_periods=1).mean()
                df['MA30'] = df['actual_sales'].rolling(window=30, min_periods=1).mean()
                
                # Prepare features
                feature_columns = ['Year', 'Month', 'Day', 'Weekday', 'Week', 'Quarter']
                feature_columns.extend([col for col in categorical_columns if col in df.columns])
                feature_columns.extend([col for col in numerical_cols_present if col in df.columns])

                X = df[feature_columns]
                y = df['actual_sales']

                # Train model with same parameters as notebook
                model = GradientBoostingRegressor(
                    n_estimators=200,
                    learning_rate=0.1,
                    max_depth=4,
                    random_state=42
                )
                model.fit(X, y)

                # Generate future dates
                last_date = df['date'].max()
                future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), 
                                           periods=forecast_days, freq='D')

                # Prepare future data
                future_data = pd.DataFrame()
                future_data['date'] = future_dates
                future_data['Year'] = future_data['date'].dt.year
                future_data['Month'] = future_data['date'].dt.month
                future_data['Day'] = future_data['date'].dt.day
                future_data['Weekday'] = future_data['date'].dt.weekday
                future_data['Week'] = future_data['date'].dt.isocalendar().week
                future_data['Quarter'] = future_data['date'].dt.quarter

                # Copy last known values for categorical and numerical columns
                last_entry = df.iloc[-1]
                for col in feature_columns:
                    if col not in future_data.columns:
                        future_data[col] = last_entry[col]

                # Ensure columns match training data
                future_data = future_data[feature_columns]

                # Make predictions
                predictions = model.predict(future_data)
                predictions = np.round(predictions, 2)

                # Calculate accuracy metrics
                y_pred = model.predict(X)
                r2 = r2_score(y, y_pred)
                mae = mean_absolute_error(y, y_pred)

                # Prepare response
                response = {
                    'forecast_data': [{
                        'date': date.strftime('%Y-%m-%d'),
                        'predicted_sales': float(0 if not np.isfinite(sales) else sales)
                    } for date, sales in zip(future_dates, predictions)],
                    'historical_data': [{
                        'date': date.strftime('%Y-%m-%d'),
                        'actual_sales': float(sales),
                        'ma7': float(ma7),
                        'ma30': float(ma30)
                    } for date, sales, ma7, ma30 in zip(df['date'], 
                                                      df['actual_sales'],
                                                      df['MA7'],
                                                      df['MA30'])],
                    'accuracy': {
                        'r2_score': float(r2),
                        'mean_absolute_error': float(mae)
                    }
                }

                # Determine aggregation period based on forecast length
                period = 'W' if forecast_days <= 45 else 'M'
                
                # Aggregate both historical and forecast data
                aggregated_historical = aggregate_data(response['historical_data'], period)
                aggregated_forecast = aggregate_data(response['forecast_data'], period)

                response['aggregated_data'] = {
                    'period': 'weekly' if period == 'W' else 'monthly',
                    'historical': aggregated_historical,
                    'forecast': aggregated_forecast
                }

                return jsonify(response)

        else:
            # For data less than or equal to 6 months, predict for 45 days
            if time_span_months > 4:
                forecast_days = 730
            else:
                forecast_days = 45
            # Use Gradient Boosting for short-term predictions
            df['Year'] = df['date'].dt.year
            df['Month'] = df['date'].dt.month
            df['Day'] = df['date'].dt.day
            df['Weekday'] = df['date'].dt.weekday
            df['Week'] = df['date'].dt.isocalendar().week
            df['Quarter'] = df['date'].dt.quarter

            categorical_columns = [
                "brand", "model", "vehicle_type", "fuel_type", "city", "dealer_type", 
                "customer_age_group", "customer_gender", "occupation_of_buyer", "payment_mode", 
                "festive_season_purchase", "advertisement_type", "service_availability", 
                "weather_condition", "road_conditions"
            ]
            
            numerical_columns = [
                "engine_capacity_cc", "price_inr", "petrol_price_at_purchase", 
                "competitor_brand_presence", "discounts_offers", "stock_on_date"
            ]

            # Handle categorical columns
            label_encoders = {}
            for col in categorical_columns:
                if col in df.columns:
                    df[col] = df[col].astype(str)
                    label_encoders[col] = LabelEncoder()
                    df[col] = label_encoders[col].fit_transform(df[col])

            # Handle numerical columns
            scaler = MinMaxScaler()
            numerical_cols_present = [col for col in numerical_columns if col in df.columns]
            if numerical_cols_present:
                df[numerical_cols_present] = scaler.fit_transform(df[numerical_cols_present])

            # Add rolling averages for smoothing
            df['MA7'] = df['actual_sales'].rolling(window=7, min_periods=1).mean()
            df['MA30'] = df['actual_sales'].rolling(window=30, min_periods=1).mean()
            
            # Prepare features
            feature_columns = ['Year', 'Month', 'Day', 'Weekday', 'Week', 'Quarter']
            feature_columns.extend([col for col in categorical_columns if col in df.columns])
            feature_columns.extend([col for col in numerical_cols_present if col in df.columns])

            X = df[feature_columns]
            y = df['actual_sales']

            # Train model with same parameters as notebook
            model = GradientBoostingRegressor(
                n_estimators=200,
                learning_rate=0.1,
                max_depth=4,
                random_state=42
            )
            model.fit(X, y)

            # Generate future dates
            last_date = df['date'].max()
            future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), 
                                       periods=forecast_days, freq='D')

            # Prepare future data
            future_data = pd.DataFrame()
            future_data['date'] = future_dates
            future_data['Year'] = future_data['date'].dt.year
            future_data['Month'] = future_data['date'].dt.month
            future_data['Day'] = future_data['date'].dt.day
            future_data['Weekday'] = future_data['date'].dt.weekday
            future_data['Week'] = future_data['date'].dt.isocalendar().week
            future_data['Quarter'] = future_data['date'].dt.quarter

            # Copy last known values for categorical and numerical columns
            last_entry = df.iloc[-1]
            for col in feature_columns:
                if col not in future_data.columns:
                    future_data[col] = last_entry[col]

            # Ensure columns match training data
            future_data = future_data[feature_columns]

            # Make predictions
            predictions = model.predict(future_data)
            predictions = np.round(predictions, 2)

            # Calculate accuracy metrics
            y_pred = model.predict(X)
            r2 = r2_score(y, y_pred)
            mae = mean_absolute_error(y, y_pred)

            # Prepare response
            response = {
                'forecast_data': [{
                    'date': date.strftime('%Y-%m-%d'),
                    'predicted_sales': float(0 if not np.isfinite(sales) else sales)
                } for date, sales in zip(future_dates, predictions)],
                'historical_data': [{
                    'date': date.strftime('%Y-%m-%d'),
                    'actual_sales': float(sales),
                    'ma7': float(ma7),
                    'ma30': float(ma30)
                } for date, sales, ma7, ma30 in zip(df['date'], 
                                                  df['actual_sales'],
                                                  df['MA7'],
                                                  df['MA30'])],
                'accuracy': {
                    'r2_score': float(r2),
                    'mean_absolute_error': float(mae)
                }
            }

            # Determine aggregation period based on forecast length
            period = 'W' if forecast_days <= 45 else 'M'
            
            # Aggregate both historical and forecast data
            aggregated_historical = aggregate_data(response['historical_data'], period)
            aggregated_forecast = aggregate_data(response['forecast_data'], period)

            response['aggregated_data'] = {
                'period': 'weekly' if period == 'W' else 'monthly',
                'historical': aggregated_historical,
                'forecast': aggregated_forecast
            }

            return jsonify(response)

    except Exception as e:
        logging.error(f"Forecast error: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sales/demand-analysis', methods=['POST'])
def demand_analysis():
    try:
        data = request.json
        if not data or 'sales_data' not in data:
            return jsonify({'error': 'No sales data provided'}), 400

        df = pd.DataFrame(data['sales_data'])
        df['date'] = pd.to_datetime(df['date'])
        df['quantity_sold'] = pd.to_numeric(df['quantity_sold'], errors='coerce').fillna(0)
        
        if df.empty:
            return jsonify({'error': 'Empty sales data provided'}), 400

        # Calculate metrics
        stats = {
            'avg_sales': to_python_type(df['quantity_sold'].mean()),
            'median_sales': to_python_type(df['quantity_sold'].median()),
            'max_sales': to_python_type(df['quantity_sold'].max()),
            'min_sales': to_python_type(df['quantity_sold'].min()),
            'std_dev': to_python_type(df['quantity_sold'].std()),
            'total_sales': to_python_type(df['quantity_sold'].sum())
        }

        # Calculate daily trends
        daily_sales = df.groupby('date')['quantity_sold'].sum().reset_index()
        daily_sales['date'] = daily_sales['date'].dt.strftime('%Y-%m-%d')
        
        # Calculate moving averages
        df['MA7'] = df['quantity_sold'].rolling(window=7, min_periods=1).mean()
        df['MA30'] = df['quantity_sold'].rolling(window=30, min_periods=1).mean()

        trend_data = [{
            'date': row['date'].strftime('%Y-%m-%d'),
            'sales': to_python_type(row['quantity_sold']),
            'MA7': to_python_type(row['MA7']),
            'MA30': to_python_type(row['MA30'])
        } for _, row in df.iterrows()]

        return jsonify({
            'statistics': stats,
            'trend_data': trend_data,
            'daily_sales': daily_sales.to_dict('records')
        })

    except Exception as e:
        logging.error(f"Demand analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sales/stockout-prediction', methods=['POST'])
def stockout_prediction():
    try:
        data = request.json
        if not data or 'sales_data' not in data:
            return jsonify({'error': 'No sales data provided'}), 400

        df = pd.DataFrame(data['sales_data'])
        if df.empty:
            return jsonify({'error': 'Empty sales data provided'}), 400

        df['date'] = pd.to_datetime(df['date'])
        df['quantity_sold'] = pd.to_numeric(df['quantity_sold'], errors='coerce').fillna(0)
        
        current_stock = int(data.get('current_stock', 0))
        lead_time = int(data.get('lead_time', 7))

        # Ensure we have enough data points
        if len(df) < 3:
            return jsonify({
                'stockout_risk': 'high',
                'days_until_stockout': 0,
                'safety_stock': 0,
                'reorder_point': current_stock,
                'stock_projections': []
            }), 200

        # Calculate metrics
        avg_daily_sales = to_python_type(df['quantity_sold'].mean())
        max_daily_sales = to_python_type(df['quantity_sold'].max())
        std_dev = to_python_type(df['quantity_sold'].std())

        # Calculate safety stock and reorder point
        safety_stock = to_python_type(2 * std_dev * np.sqrt(lead_time))
        reorder_point = to_python_type((avg_daily_sales * lead_time) + safety_stock)

        # Calculate days until stockout
        days_until_stockout = to_python_type(current_stock / avg_daily_sales if avg_daily_sales > 0 else float('inf'))
        
        # Determine stockout risk
        if days_until_stockout <= lead_time:
            stockout_risk = 'high'
        elif days_until_stockout <= lead_time * 2:
            stockout_risk = 'medium'
        else:
            stockout_risk = 'low'

        # Calculate stock projections
        dates = pd.date_range(start=df['date'].max(), periods=lead_time * 2, freq='D')
        stock_projections = []
        
        for i, date in enumerate(dates):
            avg_case_stock = to_python_type(current_stock - (avg_daily_sales * (i + 1)))
            worst_case_stock = to_python_type(current_stock - (max_daily_sales * (i + 1)))
            
            stock_projections.append({
                'date': date.strftime('%Y-%m-%d'),
                'avg_case_stock': to_python_type(max(avg_case_stock, 0)),
                'worst_case_stock': to_python_type(max(worst_case_stock, 0))
            })

        return jsonify({
            'metrics': {
                'current_stock': current_stock,
                'avg_daily_sales': avg_daily_sales,
                'max_daily_sales': max_daily_sales,
                'safety_stock': safety_stock,
                'reorder_point': reorder_point,
                'days_until_stockout': days_until_stockout
            },
            'stockout_risk': stockout_risk,
            'stock_projections': stock_projections,
            'alert': current_stock <= reorder_point
        })

    except Exception as e:
        logging.error(f"Stockout prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/analysis', methods=['POST'])
def analyze_sales():
    try:
        data = request.json
        sales_data = pd.DataFrame(data['salesData'])
        current_stock = int(data.get('currentStock', 50))
        
        # Generate sales forecast
        forecast_data = sales_forecast(sales_data)
        demand_stats = demand_analysis(sales_data)
        stock_analysis = stockout_prediction(sales_data, current_stock)
        
        response = {
            'salesForecast': [
                {
                    'date': date.strftime('%Y-%m-%d %H:%M:%S'),
                    'predicted_sales': to_python_type(sales)
                }
                for date, sales in forecast_data['predicted_sales'].items()
            ],
            'demandAnalysis': {
                'statistics': [
                    {'metric': 'Average Sales', 'value': to_python_type(demand_stats['average_sales'])},
                    {'metric': 'Median Sales', 'value': to_python_type(demand_stats['median_sales'])},
                    {'metric': 'Maximum Sales', 'value': to_python_type(demand_stats['max_sales'])},
                    {'metric': 'Minimum Sales', 'value': to_python_type(demand_stats['min_sales'])},
                    {'metric': 'Standard Deviation', 'value': to_python_type(demand_stats['std_dev'])},
                    {'metric': 'Total Sales', 'value': to_python_type(demand_stats['total_sales'])}
                ],
                'movingAverages': [
                    {
                        'date': date.strftime('%Y-%m-%d %H:%M:%S'),
                        'sales': to_python_type(row['sales']),
                        '7day_ma': to_python_type(row['7day_ma']) if pd.notna(row['7day_ma']) else None,
                        '30day_ma': to_python_type(row['30day_ma']) if pd.notna(row['30day_ma']) else None
                    }
                    for date, row in demand_stats['moving_averages'].iterrows()
                ]
            },
            'stockAnalysis': {
                'metrics': [
                    {'metric': 'Current Stock', 'value': to_python_type(current_stock)},
                    {'metric': 'Average Daily Sales', 'value': to_python_type(demand_stats['average_sales'])},
                    {'metric': 'Maximum Daily Sales', 'value': to_python_type(demand_stats['max_sales'])},
                    {'metric': 'Safety Stock', 'value': to_python_type(stock_analysis['safety_stock'])},
                    {'metric': 'Reorder Point', 'value': to_python_type(stock_analysis['reorder_point'])},
                    {'metric': 'Days until Stockout (Avg Case)', 'value': to_python_type(stock_analysis['days_until_stockout'])},
                    {'metric': 'Days until Stockout (Worst Case)', 'value': to_python_type(stock_analysis['days_until_stockout'])}
                ],
                'projections': [
                    {
                        'day': day,
                        'average_case': to_python_type(avg_case),
                        'worst_case': to_python_type(worst_case)
                    }
                    for day, (avg_case, worst_case) in enumerate(stock_analysis['stock_projections'])
                ]
            },
            'recommendations': [
                f" Stock level is {stock_analysis['stock_status']}",
                f"Next reorder in approximately {to_python_type(stock_analysis['days_until_reorder'])} days"
            ]
        }
        
        return jsonify(response)
    except Exception as e:
        logging.error(f"Analysis error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Add a test endpoint to verify the API is working
@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'API is working!'}), 200

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, port=5001) 