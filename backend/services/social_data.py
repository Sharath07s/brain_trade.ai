import os
from textblob import TextBlob
from datetime import datetime

def fetch_social_sentiment(symbol: str) -> list:
    """Fetches social posts and calculates basic sentiment (real or mock)."""
    
    mock_posts = [
        {"platform": "reddit", "text": f"Just bought 100 shares of {symbol}, holding to the moon! 🚀🚀", "sentiment_score": 0.8},
        {"platform": "reddit", "text": f"I don't know, {symbol} looks overvalued at this price point.", "sentiment_score": -0.4},
        {"platform": "reddit", "text": f"{symbol} earnings report was fairly standard today.", "sentiment_score": 0.0},
        {"platform": "reddit", "text": f"Selling {symbol} before the dip.", "sentiment_score": -0.6},
        {"platform": "reddit", "text": f"Cannot wait for {symbol} to break resistance!", "sentiment_score": 0.7},
    ]
    
    analyzed_social = []
    
    for item in mock_posts:
        blob = TextBlob(item["text"])
        # Override with mock score for demonstration if needed, or use blob text
        score = blob.sentiment.polarity
        
        # Combine blob and mock logic for richer variance
        if score == 0.0:
            score = item["sentiment_score"]
            
        if score > 0.1:
            label = "Positive"
        elif score < -0.1:
            label = "Negative"
        else:
            label = "Neutral"
            
        analyzed_social.append({
            "platform": item["platform"],
            "text": item["text"],
            "sentiment_score": round(score, 2),
            "sentiment_label": label,
            "created_at": datetime.now().isoformat()
        })
        
    return analyzed_social
