import yfinance as yf
from datetime import datetime
import threading
import time
import os
import requests
from dotenv import load_dotenv
from services.symbol_resolver import resolve_yahoo_symbol

load_dotenv()

# Simple in-memory cache
_stock_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 5  # Cache for 5 seconds for live polling

def get_real_time_stock(symbol: str, timeframe: str = "1M") -> dict:
    original_symbol = symbol
    yahoo_symbol = resolve_yahoo_symbol(symbol)
    cache_key = f"{yahoo_symbol}_{timeframe}"
    
    with _cache_lock:
        cached = _stock_cache.get(cache_key)
        if cached and time.time() - cached['timestamp'] < CACHE_TTL:
            return cached['data']
            
    try:
        ticker = yf.Ticker(yahoo_symbol)
        # Try to get fast history to check if symbol is valid
        data = ticker.history(period="1d")
        
        if data.empty and not yahoo_symbol.endswith('.NS'):
            # Fallback for Indian stocks that missed the resolver
            yahoo_symbol = f"{symbol}.NS"
            ticker = yf.Ticker(yahoo_symbol)
            data = ticker.history(period="1d")

        if data.empty:
            return {"error": "No data found for symbol. Please check the ticker."}
        
        current_price = float(data['Close'].iloc[-1])
        volume = int(data['Volume'].iloc[-1])
        open_price = float(data['Open'].iloc[-1])
        high_price = float(data['High'].iloc[-1])
        low_price = float(data['Low'].iloc[-1])
        
        info = ticker.fast_info if hasattr(ticker, 'fast_info') else {}
        ticker_info = ticker.info if hasattr(ticker, 'info') else {}
        name = ticker_info.get('longName', ticker_info.get('shortName', yahoo_symbol))
        
        # Get richer data
        market_cap = ticker_info.get('marketCap')
        trailing_pe = ticker_info.get('trailingPE')
        fifty_two_high = ticker_info.get('fiftyTwoWeekHigh')
        fifty_two_low = ticker_info.get('fiftyTwoWeekLow')
        sector = ticker_info.get('sector', 'N/A')
        industry = ticker_info.get('industry', 'N/A')
        exchange = ticker_info.get('exchange', '')
        
        # Determine currency
        currency = ticker_info.get('currency', 'USD')
        if yahoo_symbol.endswith('.NS') or yahoo_symbol.endswith('.BO') or exchange == 'NSI':
            currency = 'INR'
        
        # Get historical OHLC for chart
        if timeframe == '1m':
            period, interval = "1d", "1m"
        elif timeframe == '5m':
            period, interval = "1d", "5m" # Yahoo finance might throw issues if too many days on 1m/5m, 1d/5d is safe
        elif timeframe == '15m':
            period, interval = "5d", "15m"
        elif timeframe == '1D':
            period, interval = "1d", "1m"
        elif timeframe == '5D':
            period, interval = "5d", "15m"
        else: # 1M default
            period, interval = "1mo", "1d"
            
        hist_data = ticker.history(period=period, interval=interval)

        history = []
        for index, row in hist_data.iterrows():
            if 'm' in interval or 'h' in interval:
                t_val = int(index.timestamp()) # UNIX timestamp (seconds) for TradingView intraday
            else:
                t_val = index.strftime("%Y-%m-%d") # string for daily

            history.append({
                "time": t_val,
                "open": float(row['Open']),
                "high": float(row['High']),
                "low": float(row['Low']),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
            
        result = {
            "symbol": original_symbol,
            "yahoo_symbol": yahoo_symbol,
            "name": name,
            "current_price": current_price,
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "volume": volume,
            "market_cap": market_cap,
            "pe_ratio": trailing_pe,
            "52_week_high": fifty_two_high,
            "52_week_low": fifty_two_low,
            "sector": sector,
            "industry": industry,
            "currency": currency,
            "exchange": "NSE" if yahoo_symbol.endswith('.NS') else exchange,
            "history": history
        }
        
        with _cache_lock:
            _stock_cache[cache_key] = {
                'timestamp': time.time(),
                'data': result
            }
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

def get_market_indices() -> dict:
    """Fetches real-time summary for core Indian Indices and evaluates market status."""
    indices = [
        {"symbol": "^NSEI", "name": "NIFTY 50"},
        {"symbol": "^BSESN", "name": "SENSEX"},
        {"symbol": "^NSEBANK", "name": "BANK NIFTY"},
        {"symbol": "^CNXIT", "name": "NIFTY IT"},
        {"symbol": "^CNXAUTO", "name": "NIFTY AUTO"},
        {"symbol": "^CNXFMCG", "name": "NIFTY FMCG"}
    ]
    
    # Determine if market is currently open (roughly) in IST (UTC+5:30)
    # Market hours: 03:45 UTC to 10:00 UTC, Mon-Fri
    now_utc = datetime.utcnow()
    is_weekday = now_utc.weekday() < 5
    current_time_minutes = now_utc.hour * 60 + now_utc.minute
    market_open = is_weekday and (225 <= current_time_minutes <= 600)
    
    cache_key = "market_indices_batch"
    with _cache_lock:
        cached = _stock_cache.get(cache_key)
        if cached and time.time() - cached['timestamp'] < CACHE_TTL * 2: # Cache indices a bit longer (10s)
            return cached['data']
            
    results = []
    try:
        # Loop sequentially for reliability, fast enough for 4 indices
        for idx in indices:
            sym = idx['symbol']
            try:
                ticker = yf.Ticker(sym)
                data = ticker.history(period="1d")
                if not data.empty:
                    current = float(data['Close'].iloc[-1])
                    previous_close = float(ticker.info.get('previousClose', data['Open'].iloc[0]))
                    change = current - previous_close
                    change_percent = (change / previous_close) * 100
                    results.append({
                        "id": idx['name'],
                        "symbol": sym,
                        "name": idx['name'],
                        "price": current,
                        "change": change,
                        "change_percent": change_percent
                    })
            except Exception as e:
                print(f"Failed to fetch index {sym}: {e}")

        with _cache_lock:
            _stock_cache[cache_key] = {
                'timestamp': time.time(),
                'data': {
                    "market_status": "OPEN" if market_open else "CLOSED",
                    "indices": results
                }
            }
        return {
            "market_status": "OPEN" if market_open else "CLOSED",
            "indices": results
        }
    except Exception as e:
        print(f"Batch index error: {e}")
        return {"market_status": "UNKNOWN", "indices": []}

def get_indian_growth_stocks() -> dict:
    """Calculates top Indian growth stocks natively using a pre-defined liquid universe."""
    
    INDIAN_UNIVERSE = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "ICICIBANK.NS", "BHARTIARTL.NS",
        "INFY.NS", "ITC.NS", "SBIN.NS", "L&TFH.NS", "BAJFINANCE.NS",
        "ADANIENT.NS", "M&M.NS", "TATAMOTORS.NS", "SUNPHARMA.NS", "NTPC.NS",
        "KOTAKBANK.NS", "ZOMATO.NS", "TRENT.NS", "HAL.NS", "JIOFIN.NS"
    ]
    
    cache_key = "indian_growth_stocks"
    with _cache_lock:
        cached = _stock_cache.get(cache_key)
        if cached and time.time() - cached['timestamp'] < 15: # 15s cache
            return cached['data']
            
    try:
        tickers = yf.Tickers(" ".join(INDIAN_UNIVERSE))
        stock_data = []
        
        for sym in INDIAN_UNIVERSE:
            try:
                t = tickers.tickers[sym]
                hist = t.history(period="1d")
                if hist.empty:
                    continue
                current = float(hist['Close'].iloc[-1])
                # In fast_info or fallback to open
                try:
                    prev_close = float(t.fast_info.get('previous_close', hist['Open'].iloc[0]))
                except:
                    prev_close = float(hist['Open'].iloc[0])
                    
                change = current - prev_close
                change_percent = (change / prev_close) * 100
                vol = int(hist['Volume'].iloc[-1] if 'Volume' in hist else 0)
                
                # Default AI tags
                trend = "neutral"
                tag = ""
                if change_percent > 3:
                    trend = "bullish"
                    tag = "Breakout"
                elif change_percent > 1:
                    trend = "bullish"
                    tag = "High Growth"
                elif change_percent < -2:
                    trend = "bearish"
                    tag = "Oversold?"
                else:
                    trend = "neutral"
                    tag = "Stable"
                    
                stock_data.append({
                    "sym": sym.split('.')[0], # Remove .NS
                    "name": sym.split('.')[0] + " Ltd", # Fallback name
                    "price": current,
                    "change": change,
                    "change_amount": change,
                    "change_percentage": change_percent,
                    "vol": 'High' if vol > 5000000 else 'Medium',
                    "trend": trend,
                    "tag": tag
                })
            except Exception as e:
                print(f"Skipping {sym}: {e}")
                
        # Sort by % change descending to find 'Top Growth'
        stock_data.sort(key=lambda x: x['change_percentage'], reverse=True)
        top_growth = stock_data[:8]
        
        result = {
            "top_growth": top_growth,
            "all_evaluated": len(stock_data)
        }
        
        with _cache_lock:
            _stock_cache[cache_key] = {
                'timestamp': time.time(),
                'data': result
            }
        return result
    except Exception as e:
        print(f"Indian growth error: {e}")
        return {"error": str(e)}

def get_market_movers() -> dict:
    """Fetches top gainers, losers, and most active using Alpha Vantage."""
    api_key = os.getenv("ALPHA_VANTAGE_API_KEY")
    if not api_key:
        return {"error": "Alpha Vantage API key not found"}
        
    cache_key = "market_movers"
    with _cache_lock:
        cached = _stock_cache.get(cache_key)
        # Cache for 5 minutes since this endpoint doesn't need to be highly real-time
        if cached and time.time() - cached['timestamp'] < 300:
            return cached['data']
            
    url = f"https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey={api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        
        if "Information" in data and "rate limit" in data["Information"].lower():
            return {"error": "Alpha Vantage rate limit reached"}
            
        result = {
            "top_gainers": data.get("top_gainers", []),
            "top_losers": data.get("top_losers", []),
            "most_actively_traded": data.get("most_actively_traded", [])
        }
        
        with _cache_lock:
            _stock_cache[cache_key] = {
                'timestamp': time.time(),
                'data': result
            }
        return result
    except Exception as e:
        print(f"Market Movers error: {e}")
        return {"error": str(e)}
