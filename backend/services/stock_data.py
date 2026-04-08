import yfinance as yf
from datetime import datetime
import threading
import time
from services.symbol_resolver import resolve_yahoo_symbol

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

def get_market_indices() -> list:
    """Fetches real-time summary for core Indian Indices."""
    indices = [
        {"symbol": "^NSEI", "name": "NIFTY 50"},
        {"symbol": "^BSESN", "name": "SENSEX"},
        {"symbol": "^NSEBANK", "name": "BANKNIFTY"},
        {"symbol": "BSE-BANK.BO", "name": "BANKEX"}
    ]
    
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
                'data': results
            }
        return results
    except Exception as e:
        print(f"Batch index error: {e}")
        return []
