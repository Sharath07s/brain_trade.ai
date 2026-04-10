from fastapi import APIRouter
from services.stock_data import get_real_time_stock
from services.news_data import fetch_and_analyze_news
from services.macro_news import fetch_macro_news
from services.social_data import fetch_reddit_sentiment
from services.smart_sentiment import analyze_macro_factors
from services.ai_engine import predict_stock_movement
from services.global_data import fetch_global_macro_data, compute_macro_scores
import concurrent.futures

router = APIRouter()

# Curated watchlist for alerts
ALERT_WATCHLIST = [
    "TCS", "RELIANCE", "INFY", "HDFCBANK", "TATAMOTORS",
    "BAJFINANCE", "ITC", "SBIN"
]

# Module-level global data cache for alerts batch processing
_cached_global_data = None

def _run_prediction_for_alert(symbol: str) -> dict:
    """Runs the full AI prediction pipeline for a single symbol and formats as alert."""
    global _cached_global_data
    try:
        price_data = get_real_time_stock(symbol)
        if price_data.get("error"):
            return None
            
        traditional_news = fetch_and_analyze_news(symbol)
        macro_news = fetch_macro_news(symbol)
        social_data = fetch_reddit_sentiment(symbol)
        macro_insights = analyze_macro_factors(macro_news, social_data)
        
        # Use cached global data for batch alert processing
        global_raw = _cached_global_data or fetch_global_macro_data()
        global_macro = compute_macro_scores(symbol, global_raw)
        
        prediction = predict_stock_movement(
            symbol=symbol,
            price_data=price_data,
            news_data=traditional_news,
            social_data=social_data,
            macro_insights=macro_insights,
            global_macro=global_macro
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
    global _cached_global_data
    alerts = []
    
    # Fetch global data once, share across all alert computations
    _cached_global_data = fetch_global_macro_data()
    
    # Run predictions concurrently for speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(_run_prediction_for_alert, sym): sym for sym in ALERT_WATCHLIST}
        for future in concurrent.futures.as_completed(futures):
            result = future.result()
            if result:
                alerts.append(result)
    
    _cached_global_data = None  # Clear after batch
    
    # Sort by confidence descending
    alerts.sort(key=lambda x: x.get("confidence", 0), reverse=True)
    
    return {"alerts": alerts, "watchlist": ALERT_WATCHLIST}


@router.get("/{symbol:path}")
def get_prediction(symbol: str):
    symbol = symbol.upper()
    print(f"\n{'='*60}")
    print(f"[BrainTrade Engine] Computing prediction for: {symbol}")
    print(f"{'='*60}")
    
    # 1. Gather all required data
    price_data = get_real_time_stock(symbol)
    
    # 2. Fetch news and social
    traditional_news = fetch_and_analyze_news(symbol)
    macro_news = fetch_macro_news(symbol)
    social_data = fetch_reddit_sentiment(symbol)
    
    # 3. Extract LLM Macro Insights (legacy)
    macro_insights = analyze_macro_factors(macro_news, social_data)
    
    # 4. Fetch LIVE global macro data (NASDAQ, S&P500, USD/INR, Crude, Bonds)
    global_raw = fetch_global_macro_data()
    global_macro = compute_macro_scores(symbol, global_raw)
    
    print(f"[BrainTrade Engine] Global macro scores: bull={global_macro.get('macro_bull')}, bear={global_macro.get('macro_bear')}")
    print(f"[BrainTrade Engine] Catalysts: {global_macro.get('catalysts', [])}")
    
    # 5. Feed into AI Engine v3
    prediction = predict_stock_movement(
        symbol=symbol, 
        price_data=price_data, 
        news_data=traditional_news, 
        social_data=social_data,
        macro_insights=macro_insights,
        global_macro=global_macro
    )
    
    print(f"[BrainTrade Engine] Result: {prediction.get('prediction')} @ {prediction.get('confidence')}% confidence")
    print(f"[BrainTrade Engine] Bull: {prediction.get('bull_confidence')}% | Bear: {prediction.get('bear_confidence')}%")
    print(f"{'='*60}\n")
    
    return prediction
