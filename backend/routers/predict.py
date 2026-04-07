from fastapi import APIRouter
from services.stock_data import get_real_time_stock
from services.news_data import fetch_and_analyze_news
from services.social_data import fetch_social_sentiment
from services.ai_engine import predict_stock_movement

router = APIRouter()

@router.get("/{symbol:path}")
def get_prediction(symbol: str):
    symbol = symbol.upper()
    
    # 1. Gather all required data
    price_data = get_real_time_stock(symbol)
    news_data = fetch_and_analyze_news(symbol)
    social_data = fetch_social_sentiment(symbol)
    
    # 2. Feed into AI Engine
    prediction = predict_stock_movement(symbol, price_data, news_data, social_data)
    
    return prediction
