from fastapi import APIRouter
from services.news_data import fetch_and_analyze_news, fetch_general_market_news

router = APIRouter()

@router.get("/general")
def get_general_news():
    """Returns aggregated market news for a curated set of major stocks."""
    data = fetch_general_market_news()
    return {"news": data}

@router.get("/{symbol:path}")
def get_news(symbol: str):
    data = fetch_and_analyze_news(symbol.upper())
    return {"symbol": symbol.upper(), "news": data}
