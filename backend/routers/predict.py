from fastapi import APIRouter
from services.stock_data import get_real_time_stock
from services.news_data import fetch_and_analyze_news
from services.macro_news import fetch_macro_news
from services.social_data import fetch_reddit_sentiment
from services.smart_sentiment import analyze_macro_factors
from services.ai_engine import predict_stock_movement

router = APIRouter()

@router.get("/{symbol:path}")
def get_prediction(symbol: str):
    symbol = symbol.upper()
    
    # 1. Gather all required data
    price_data = get_real_time_stock(symbol)
    
    # We still fetch the basic news for display / traditional model, but add the macro news
    traditional_news = fetch_and_analyze_news(symbol)
    macro_news = fetch_macro_news(symbol)
    social_data = fetch_reddit_sentiment(symbol)
    
    # 2. Extract LLM Macro Insights
    macro_insights = analyze_macro_factors(macro_news, social_data)
    
    # 3. Feed into upgrated AI Engine
    prediction = predict_stock_movement(
        symbol=symbol, 
        price_data=price_data, 
        news_data=traditional_news, 
        social_data=social_data,
        macro_insights=macro_insights
    )
    
    return prediction
