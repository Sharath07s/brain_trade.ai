import yfinance as yf
from datetime import datetime
import threading
import time
from services.symbol_resolver import resolve_yahoo_symbol

# Simple in-memory cache
_stock_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 60  # Cache for 60 seconds

def get_real_time_stock(symbol: str) -> dict:
    original_symbol = symbol
    yahoo_symbol = resolve_yahoo_symbol(symbol)
    
    with _cache_lock:
        cached = _stock_cache.get(yahoo_symbol)
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
        
        # Get historical 7 days
        hist_data = ticker.history(period="7d")
        history = []
        for index, row in hist_data.iterrows():
            history.append({
                "date": index.strftime("%Y-%m-%d"),
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
            _stock_cache[yahoo_symbol] = {
                'timestamp': time.time(),
                'data': result
            }
            
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}
