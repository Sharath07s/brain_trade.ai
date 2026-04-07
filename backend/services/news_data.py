import os
import requests
from textblob import TextBlob
from datetime import datetime

NEWS_API_KEY = os.getenv("NEWS_API_KEY")

def fetch_and_analyze_news(symbol: str) -> list:
    """Fetches news and calculates basic sentiment (real or mock)."""
    # If no key, we return some plausible mock news for the hackathon MVP
    # In a real scenario, use:
    # url = f"https://newsapi.org/v2/everything?q={symbol}&apiKey={NEWS_API_KEY}"
    
    mock_news = [
        {"title": f"{symbol} surges on new product announcement", "source": "Finance Weekly", "sentiment": "Positive"},
        {"title": f"Analysts upgrade {symbol} to Strong Buy ahead of earnings", "source": "Wall St Journal", "sentiment": "Positive"},
        {"title": f"Supply chain issues may affect {symbol} Q3 output", "source": "Tech Crunch", "sentiment": "Negative"},
        {"title": f"Market reacts to {symbol}'s recent structural changes", "source": "Bloomberg", "sentiment": "Neutral"},
    ]
    
    analyzed_news = []
    
    # TextBlob logic to determine score
    for item in mock_news:
        blob = TextBlob(item["title"])
        score = blob.sentiment.polarity
        if score > 0.1:
            label = "Positive"
        elif score < -0.1:
            label = "Negative"
        else:
            label = "Neutral"
            
        analyzed_news.append({
            "title": item["title"],
            "source": item["source"],
            "url": "#",
            "sentiment_score": round(score, 2),
            "sentiment_label": label,
            "created_at": datetime.now().isoformat()
        })
        
    return analyzed_news
