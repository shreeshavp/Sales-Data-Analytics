from transformers import pipeline
import mysql.connector
from decouple import config

# Initialize sentiment analysis pipeline
sentiment_analyzer = pipeline("sentiment-analysis")

def analyze_sentiment(text):
    result = sentiment_analyzer(text)
    return result[0]['score']

def update_reviews_sentiment():
    # Connect to database
    db = mysql.connector.connect(
        host=config('DB_HOST'),
        user=config('DB_USER'),
        password=config('DB_PASSWORD'),
        database=config('DB_NAME')
    )
    cursor = db.cursor()

    # Get unanalyzed reviews
    cursor.execute("SELECT id, feedback FROM reviews WHERE sentiment_score IS NULL")
    reviews = cursor.fetchall()

    for review_id, feedback in reviews:
        sentiment_score = analyze_sentiment(feedback)
        
        # Update review with sentiment score
        cursor.execute(
            "UPDATE reviews SET sentiment_score = %s WHERE id = %s",
            (sentiment_score, review_id)
        )
    
    db.commit()
    db.close()

if __name__ == "__main__":
    update_reviews_sentiment()