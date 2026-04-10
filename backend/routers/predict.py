from fastapi import APIRouter
from services.stock_data import get_real_time_stock
from services.news_data import fetch_and_analyze_news
from services.macro_news import fetch_macro_news
from services.social_data import fetch_reddit_sentiment
from services.smart_sentiment import analyze_macro_factors
from services.ai_engine import predict_stock_movement
import concurrent.futures

router = APIRouter()

# Curated watchlist for alerts
ALERT_WATCHLIST = [
    "TCS", "RELIANCE", "INFY", "HDFCBANK", "TATAMOTORS",
    "BAJFINANCE", "ITC", "SBIN"
]

def _run_prediction_for_alert(symbol: str) -> dict:
    """Runs the full AI prediction pipeline for a single symbol and formats as alert."""
    try:
        price_data = get_real_time_stock(symbol)
        if price_data.get("error"):
            return None
            
        traditional_news = fetch_and_analyze_news(symbol)
        macro_news = fetch_macro_news(symbol)
        social_data = fetch_reddit_sentiment(symbol)
        macro_insights = analyze_macro_factors(macro_news, social_data)
        
        prediction = predict_stock_movement(
            symbol=symbol,
            price_data=price_data,
            news_data=traditional_news,
            social_data=social_data,
            macro_insights=macro_insights
        )
        
        # Map prediction to alert type
        trade_signal = prediction.get("trade_signal", "HOLD")
        if "BUY" in trade_signal:
            alert_type = "BUY"
        elif "SELL" in trade_signal:
            alert_type = "SELL"
        else:
            alert_type = "PRICE"
        
        # Get stock name from price data
        stock_name = price_data.get("name", symbol)
        current_price = price_data.get("current_price", 0)
        open_price = price_data.get("open", current_price)
        price_change = ((current_price - open_price) / open_price * 100) if open_price else 0
        
        # Build header
        if alert_type == "BUY":
            header = f"🟢 BUY {symbol}"
        elif alert_type == "SELL":
            header = f"🔴 SELL {symbol}"
        else:
            direction = "SURGE" if price_change >= 0 else "DROP"
            header = f"{'📈' if price_change >= 0 else '📉'} PRICE {direction} – {symbol}"
        
        # Build news catalysts from real news
        news_catalysts = []
        for n in traditional_news[:2]:
            news_catalysts.append({
                "id": hash(n.get("title", "")),
                "title": n.get("title", "No headline"),
                "sentiment": n.get("sentiment_label", "Neutral")
            })
        
        # Build tags
        tags = []
        overall_sentiment = "Neutral"
        if prediction.get("shap_features", {}).get("News Sentiment", "").startswith("+"):
            overall_sentiment = "Positive"
        elif not prediction.get("shap_features", {}).get("News Sentiment", "").startswith("+"):
            sentiment_val = prediction.get("shap_features", {}).get("News Sentiment", "0")
            try:
                if float(sentiment_val) < -0.05:
                    overall_sentiment = "Negative"
            except:
                pass
        
        sent_colors = {
            "Positive": "text-green-400 bg-green-500/10 border-green-500/20",
            "Negative": "text-red-400 bg-red-500/10 border-red-500/20",
            "Neutral": "text-gray-400 bg-gray-500/10 border-gray-500/20"
        }
        tags.append({"label": f"Sentiment: {overall_sentiment}", "color": sent_colors.get(overall_sentiment, sent_colors["Neutral"])})
        
        confidence = prediction.get("confidence", 50)
        if confidence > 80:
            tags.append({"label": "Impact: High ⚡", "color": "text-orange-400 bg-orange-500/10 border-orange-500/20"})
        elif confidence > 65:
            tags.append({"label": "Impact: Medium", "color": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"})
        else:
            tags.append({"label": "Impact: Low", "color": "text-gray-400 bg-gray-500/10 border-gray-500/20"})
        
        tags.append({"label": "Type: AI Engine", "color": "text-blue-400 bg-blue-500/10 border-blue-500/20"})
        
        # Build reason from explanations
        reason = " ".join(prediction.get("explanations", ["AI analysis in progress."]))
        
        return {
            "id": hash(symbol) % 10000,
            "type": alert_type,
            "symbol": symbol,
            "stock_name": stock_name,
            "header": header,
            "time": "Live",
            "confidence": confidence,
            "reason": reason,
            "price": current_price,
            "price_change_pct": round(price_change, 2),
            "trade_signal": trade_signal,
            "prediction": prediction.get("prediction", "NEUTRAL"),
            "news": news_catalysts,
            "tags": tags
        }
    except Exception as e:
        print(f"Alert prediction error for {symbol}: {e}")
        return None


@router.get("/alerts")
def get_alerts():
    """Returns AI alerts for the curated watchlist."""
    alerts = []
    
    # Run predictions concurrently for speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(_run_prediction_for_alert, sym): sym for sym in ALERT_WATCHLIST}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                alerts.append(result)
    
    # Sort by confidence descending
    alerts.sort(key=lambda x: x.get("confidence", 0), reverse=True)
    
    return {"alerts": alerts, "watchlist": ALERT_WATCHLIST}


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
