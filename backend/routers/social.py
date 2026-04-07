from fastapi import APIRouter
from services.social_data import fetch_social_sentiment

router = APIRouter()

@router.get("/{symbol:path}")
def get_social(symbol: str):
    data = fetch_social_sentiment(symbol.upper())
    return {"symbol": symbol.upper(), "social": data}
