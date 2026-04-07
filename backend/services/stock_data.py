import yfinance as yf
from datetime import datetime, timedelta

def get_real_time_stock(symbol: str) -> dict:
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period="1d")
        if data.empty:
            return {"error": "No data found for symbol"}
        
        current_price = float(data['Close'].iloc[-1])
        volume = int(data['Volume'].iloc[-1])
        open_price = float(data['Open'].iloc[-1])
        high_price = float(data['High'].iloc[-1])
        low_price = float(data['Low'].iloc[-1])
        
        info = ticker.info
        name = info.get('longName', symbol)
        
        # Get historical 7 days
        hist_data = ticker.history(period="7d")
        history = []
        for index, row in hist_data.iterrows():
            history.append({
                "date": index.strftime("%Y-%m-%d"),
                "close": float(row['Close']),
                "volume": int(row['Volume'])
            })
            
        return {
            "symbol": symbol,
            "name": name,
            "current_price": current_price,
            "open": open_price,
            "high": high_price,
            "low": low_price,
            "volume": volume,
            "history": history
        }
    except Exception as e:
        return {"error": str(e)}
