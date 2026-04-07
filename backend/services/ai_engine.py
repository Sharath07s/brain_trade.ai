import random

def predict_stock_movement(symbol: str, price_data: dict, news_data: list, social_data: list) -> dict:
    """
    Simulates an XGBoost & FinBERT prediction engine.
    Fully loading FinBERT & XGBoost takes significant memory. We simulate the feature extraction
    and prediction logic here for hackathon speed & reliability, outputting SHAP-like explanations.
    """
    
    # 1. Feature Engineering
    avg_news_sentiment = sum(n.get("sentiment_score", 0) for n in news_data) / max(len(news_data), 1)
    avg_social_sentiment = sum(s.get("sentiment_score", 0) for s in social_data) / max(len(social_data), 1)
    
    price_trend = 0
    if price_data and not price_data.get("error"):
        hist = price_data.get("history", [])
        if len(hist) > 1:
            first_close = hist[0]["close"]
            last_close = hist[-1]["close"]
            price_trend = (last_close - first_close) / first_close
            
    # 2. Mock Prediction (Simulating XGBoost)
    # The more positive the engineered features, the higher the UP probability
    score = (avg_news_sentiment * 0.4) + (avg_social_sentiment * 0.3) + (price_trend * 10 * 0.3)
    
    # Base confidence around 60-95%
    confidence = min(max(0.55 + abs(score), 0.55), 0.98)
    
    threshold = 0.05
    if score > threshold:
        prediction = "UP"
    elif score < -threshold:
        prediction = "DOWN"
    else:
        prediction = "NEUTRAL"
        
    # 3. SHAP-style Explanations
    reasons = {
        "News Sentiment": f"+{round(avg_news_sentiment, 2)}" if avg_news_sentiment > 0 else f"{round(avg_news_sentiment, 2)}",
        "Social Sentiment": f"+{round(avg_social_sentiment, 2)}" if avg_social_sentiment > 0 else f"{round(avg_social_sentiment, 2)}",
        "Price Trend": f"+{round(price_trend*100, 2)}%" if price_trend > 0 else f"{round(price_trend*100, 2)}%",
    }
    
    explanations = []
    if avg_news_sentiment > 0.1:
        explanations.append(f"Positive news coverage contributes heavily to upward momentum (+{round(avg_news_sentiment, 2)} impact).")
    elif avg_news_sentiment < -0.1:
        explanations.append(f"Negative news headlines are driving the score down ({round(avg_news_sentiment, 2)} impact).")
        
    if avg_social_sentiment > 0.2:
        explanations.append(f"Strong bullish retail presence on Reddit/Social (+{round(avg_social_sentiment, 2)}).")
    elif avg_social_sentiment < -0.2:
        explanations.append(f"Bearish sentiment observed among retail traders ({round(avg_social_sentiment, 2)}).")
    
    if price_trend > 0.02:
        explanations.append(f"Recent uptrend of {round(price_trend*100, 2)}% adds positive technical weight.")
    elif price_trend < -0.02:
        explanations.append(f"Recent downtrend of {round(price_trend*100, 2)}% brings technical pressure.")
        
    if not explanations:
        explanations.append("Mixed signals across technicals and sentiment resulting in low momentum.")

    return {
        "symbol": symbol,
        "prediction": prediction,
        "confidence": round(confidence * 100, 1),
        "score_internal": round(score, 3),
        "shap_features": reasons,
        "explanations": explanations
    }
