from fastapi import APIRouter
from services.social_data import fetch_reddit_sentiment
from services.macro_news import fetch_macro_news
from datetime import datetime

router = APIRouter()

@router.get("/social-feed/{symbol:path}")
def get_social_feed(symbol: str):
    symbol = symbol.upper()
    reddit = fetch_reddit_sentiment(symbol)
    news = fetch_macro_news(symbol)
    
    mixed_feed = []
    
    for r in reddit:
        mixed_feed.append({
            "type": "reddit",
            "title": r.get("title", ""),
            "text": r.get("text", ""),
            "sentiment_label": r.get("sentiment_label", "Neutral"),
            "url": r.get("url", "#"),
            "published_at": r.get("created_at", datetime.utcnow().isoformat())
        })
        
    for n in news:
        mixed_feed.append({
            "type": "news",
            "title": n.get("title", ""),
            "text": n.get("description", ""),
            "source": n.get("source", "News"),
            "url": n.get("url", "#"),
            "published_at": n.get("published_at", datetime.utcnow().isoformat())
        })
        
    # Sort by published_at strictly descending
    mixed_feed.sort(key=lambda x: x["published_at"], reverse=True)
    
    return {"symbol": symbol, "feed": mixed_feed}

@router.get("/{symbol:path}")
def get_social(symbol: str):
    data = fetch_reddit_sentiment(symbol.upper())
    return {"symbol": symbol.upper(), "social": data}

