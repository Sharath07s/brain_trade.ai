from fastapi import APIRouter
from services.news_data import fetch_and_analyze_news
from services.social_data import fetch_social_sentiment

router = APIRouter()

@router.get("/{symbol:path}")
def get_sentiment(symbol: str):
    news = fetch_and_analyze_news(symbol.upper())
    social = fetch_social_sentiment(symbol.upper())
    
    avg_news = sum(n.get("sentiment_score", 0) for n in news) / max(len(news), 1)
    avg_social = sum(s.get("sentiment_score", 0) for s in social) / max(len(social), 1)
    
    overall = (avg_news + avg_social) / 2
    
    if overall > 0.1:
        label = "Bullish"
    elif overall < -0.1:
        label = "Bearish"
    else:
        label = "Neutral"

    return {
        "symbol": symbol.upper(),
        "overall_sentiment_score": round(overall, 2),
        "overall_sentiment_label": label,
        "news_avg": round(avg_news, 2),
        "social_avg": round(avg_social, 2)
    }
