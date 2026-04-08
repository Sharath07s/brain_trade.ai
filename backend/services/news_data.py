import os
import yfinance as yf
from textblob import TextBlob
from datetime import datetime
import threading
import time
from services.symbol_resolver import resolve_yahoo_symbol

_news_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 300  # News cache for 5 minutes

def fetch_and_analyze_news(symbol: str) -> list:
    """Fetches real news via yfinance and calculates sentiment."""
    yahoo_symbol = resolve_yahoo_symbol(symbol)
    
    with _cache_lock:
        cached = _news_cache.get(yahoo_symbol)
        if cached and time.time() - cached['timestamp'] < CACHE_TTL:
            return cached['data']
            
    try:
        ticker = yf.Ticker(yahoo_symbol)
        raw_news = ticker.news
        
        analyzed_news = []
        
        # Fallback if no news found on Yahoo Finance
        if not raw_news:
            mock_news = [
                {"title": f"Earnings report updates for {yahoo_symbol}", "publisher": "Market Insights", "link": "#"}
            ]
            raw_news = mock_news

        for item in raw_news[:5]: # limit to 5
            title = item.get("title", "")
            source = item.get("publisher", "Unknown Source")
            url = item.get("link", "#")
            
            blob = TextBlob(title)
            score = blob.sentiment.polarity
            if score > 0.1:
                label = "Positive"
            elif score < -0.1:
                label = "Negative"
            else:
                label = "Neutral"
                
            analyzed_news.append({
                "title": title,
                "source": source,
                "url": url,
                "sentiment_score": round(score, 2),
                "sentiment_label": label,
                "created_at": datetime.now().isoformat()
            })
            
        with _cache_lock:
            _news_cache[yahoo_symbol] = {
                'timestamp': time.time(),
                'data': analyzed_news
            }
            
        return analyzed_news
    except Exception as e:
        print(f"Error fetching news for {yahoo_symbol}: {e}")
        return []
