from fastapi import APIRouter
from services.news_data import fetch_and_analyze_news

router = APIRouter()

@router.get("/{symbol:path}")
def get_news(symbol: str):
    data = fetch_and_analyze_news(symbol.upper())
    return {"symbol": symbol.upper(), "news": data}
