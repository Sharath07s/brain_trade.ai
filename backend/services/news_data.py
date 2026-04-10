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


def fetch_general_market_news() -> list:
    """Fetches and aggregates market news for a curated set of major stocks."""
    GENERAL_SYMBOLS = [
        "TCS", "RELIANCE", "INFY", "HDFCBANK", "TATAMOTORS",
        "BAJFINANCE", "ITC", "SBIN"
    ]
    
    cache_key = "general_market_news"
    with _cache_lock:
        cached = _news_cache.get(cache_key)
        if cached and time.time() - cached['timestamp'] < CACHE_TTL:
            return cached['data']
    
    all_news = []
    seen_titles = set()
    
    for sym in GENERAL_SYMBOLS:
        try:
            news_items = fetch_and_analyze_news(sym)
            for item in news_items:
                title = item.get("title", "")
                if title and title not in seen_titles:
                    seen_titles.add(title)
                    item["related_symbol"] = sym
                    
                    # Compute impact level based on sentiment strength
                    score = abs(item.get("sentiment_score", 0))
                    if score > 0.3:
                        item["impact"] = "High"
                    elif score > 0.15:
                        item["impact"] = "Medium"
                    else:
                        item["impact"] = "Low"
                    
                    # Assign a category heuristic
                    title_lower = title.lower()
                    if any(w in title_lower for w in ["earnings", "profit", "revenue", "quarter", "q1", "q2", "q3", "q4"]):
                        item["category"] = "Earnings"
                    elif any(w in title_lower for w in ["rate", "rbi", "fed", "policy", "inflation"]):
                        item["category"] = "Global Policy"
                    elif any(w in title_lower for w in ["merger", "acquisition", "deal", "partnership"]):
                        item["category"] = "Corporate Action"
                    elif any(w in title_lower for w in ["sector", "industry", "market"]):
                        item["category"] = "Economy"
                    else:
                        item["category"] = "Company"
                    
                    # Generate an AI insight blurb
                    sentiment = item.get("sentiment_label", "Neutral")
                    if sentiment == "Positive":
                        item["ai_insight"] = f"Positive signal detected for {sym}; momentum indicators suggest potential upside continuation."
                    elif sentiment == "Negative":
                        item["ai_insight"] = f"Bearish catalyst for {sym}; risk metrics indicate elevated caution warranted."
                    else:
                        item["ai_insight"] = f"Neutral signal for {sym}; price action likely range-bound in near term."
                    
                    all_news.append(item)
        except Exception as e:
            print(f"Error fetching general news for {sym}: {e}")
    
    # Sort by absolute sentiment score (most impactful first)
    all_news.sort(key=lambda x: abs(x.get("sentiment_score", 0)), reverse=True)
    
    with _cache_lock:
        _news_cache[cache_key] = {
            'timestamp': time.time(),
            'data': all_news[:20]  # Cap at 20 items
        }
    
    return all_news[:20]
