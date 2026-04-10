"""
Live Global Macro Data Fetcher
Fetches real-time data for global indices, currencies, commodities, and bonds
using yfinance. Results are cached briefly to avoid API hammering.
"""

import yfinance as yf
import threading
import time

_global_cache = {}
_global_lock = threading.Lock()
GLOBAL_CACHE_TTL = 30  # 30 second cache for global cues

# Yahoo Finance symbols for global macro instruments
GLOBAL_SYMBOLS = {
    "NASDAQ":    "^IXIC",
    "SP500":     "^GSPC",
    "DOW":       "^DJI",
    "NIKKEI":    "^N225",
    "USD_INR":   "USDINR=X",
    "CRUDE_OIL": "CL=F",
    "GOLD":      "GC=F",
    "US10Y":     "^TNX",       # 10-Year US Treasury Yield
    "VIX":       "^VIX",       # Volatility Index
}


def _fetch_single(symbol_key: str, yahoo_sym: str) -> dict:
    """Fetch latest price + change for a single global instrument."""
    try:
        ticker = yf.Ticker(yahoo_sym)
        hist = ticker.history(period="2d")
        if hist.empty:
            return {"symbol": symbol_key, "price": 0, "change_pct": 0, "error": True}

        current = float(hist['Close'].iloc[-1])
        if len(hist) >= 2:
            prev = float(hist['Close'].iloc[-2])
        else:
            prev = float(hist['Open'].iloc[-1])

        change_pct = ((current - prev) / prev * 100) if prev != 0 else 0

        return {
            "symbol": symbol_key,
            "yahoo": yahoo_sym,
            "price": round(current, 4),
            "prev_close": round(prev, 4),
            "change_pct": round(change_pct, 4),
            "error": False
        }
    except Exception as e:
        print(f"[GlobalData] Error fetching {symbol_key}: {e}")
        return {"symbol": symbol_key, "price": 0, "change_pct": 0, "error": True}


def fetch_global_macro_data() -> dict:
    """
    Returns a dict of all global macro instruments with live prices and % changes.
    Cached for GLOBAL_CACHE_TTL seconds.
    """
    cache_key = "global_macro_all"
    with _global_lock:
        cached = _global_cache.get(cache_key)
        if cached and time.time() - cached["ts"] < GLOBAL_CACHE_TTL:
            return cached["data"]

    results = {}
    for key, sym in GLOBAL_SYMBOLS.items():
        results[key] = _fetch_single(key, sym)

    with _global_lock:
        _global_cache[cache_key] = {"ts": time.time(), "data": results}

    return results


def compute_macro_scores(symbol: str, global_data: dict) -> dict:
    """
    Given a target symbol and the global macro snapshot, compute
    sector-specific macro bullish/bearish scores.

    Returns:
        {
            "macro_bull": float 0-1,
            "macro_bear": float 0-1,
            "usd_inr_change": float,
            "nasdaq_change": float,
            "crude_change": float,
            "bond_yield": float,
            "vix": float,
            "catalysts": [str, str, str]
        }
    """
    sym = symbol.upper()

    nasdaq = global_data.get("NASDAQ", {})
    sp500 = global_data.get("SP500", {})
    dow = global_data.get("DOW", {})
    usd_inr = global_data.get("USD_INR", {})
    crude = global_data.get("CRUDE_OIL", {})
    us10y = global_data.get("US10Y", {})
    vix = global_data.get("VIX", {})

    nasdaq_chg = nasdaq.get("change_pct", 0)
    sp500_chg = sp500.get("change_pct", 0)
    dow_chg = dow.get("change_pct", 0)
    usd_inr_chg = usd_inr.get("change_pct", 0)
    crude_chg = crude.get("change_pct", 0)
    us10y_val = us10y.get("price", 4.0)
    us10y_chg = us10y.get("change_pct", 0)
    vix_val = vix.get("price", 15)
    vix_chg = vix.get("change_pct", 0)

    bull_points = 0.0
    bear_points = 0.0
    catalysts = []

    # --- Classify asset ---
    is_bank = any(k in sym for k in ["BANK", "NSEBANK", "HDFC", "ICICI", "KOTAK", "SBI", "AXISBANK"])
    is_it = any(k in sym for k in ["CNXIT", "NIFTYIT", "IT", "INFY", "TCS", "WIPRO", "TECHM", "HCLTECH", "LTIM"])
    is_auto = any(k in sym for k in ["AUTO", "CNXAUTO", "TATAMOTORS", "MARUTI", "BAJAJ", "EICHER", "HEROMOTOCO"])
    is_broad = any(k in sym for k in ["NSEI", "BSESN", "NIFTY", "SENSEX"])

    # ---- GLOBAL EQUITY CUES ----
    global_avg = (nasdaq_chg + sp500_chg + dow_chg) / 3.0
    if global_avg > 0.3:
        bull_points += 0.15
        catalysts.append(f"Global equities rallying (avg +{round(global_avg, 2)}%)")
    elif global_avg < -0.3:
        bear_points += 0.15
        catalysts.append(f"Global equities under pressure (avg {round(global_avg, 2)}%)")

    # ---- NASDAQ (extra weight for IT) ----
    if is_it:
        if nasdaq_chg > 0.2:
            bull_points += 0.25
            catalysts.append(f"NASDAQ uptrend (+{round(nasdaq_chg, 2)}%) boosting IT sector outlook")
        elif nasdaq_chg < -0.2:
            bear_points += 0.25
            catalysts.append(f"NASDAQ weakness ({round(nasdaq_chg, 2)}%) dragging IT sentiment")

    # ---- USD/INR (critical for IT, inverse for importers) ----
    if is_it:
        if usd_inr_chg > 0.1:  # Rupee weakening = good for IT exports
            bull_points += 0.15
            catalysts.append(f"Weak INR (USD/INR +{round(usd_inr_chg, 2)}%) favorable for IT export earnings")
        elif usd_inr_chg < -0.1:
            bear_points += 0.10
            catalysts.append(f"Strengthening INR may compress IT margins")
    elif is_auto:
        if usd_inr_chg > 0.15:
            bear_points += 0.10
            catalysts.append(f"Rising USD/INR increases import costs for auto sector")

    # ---- BOND YIELDS (critical for banks) ----
    if is_bank:
        if us10y_chg > 0.5:
            bull_points += 0.20
            catalysts.append(f"Rising bond yields ({round(us10y_val, 2)}%, +{round(us10y_chg, 2)}%) widen banking NIMs")
        elif us10y_chg < -0.5:
            bear_points += 0.15
            catalysts.append(f"Falling yields compress bank margins")
        else:
            catalysts.append(f"Bond yields stable at {round(us10y_val, 2)}% — neutral for banking")

    # ---- CRUDE OIL ----
    if crude_chg > 1.0:
        bear_points += 0.10
        if is_auto:
            bear_points += 0.15
            catalysts.append(f"Crude oil surge (+{round(crude_chg, 2)}%) severely impacts auto demand")
        else:
            catalysts.append(f"Rising crude oil (+{round(crude_chg, 2)}%) adding inflationary pressure")
    elif crude_chg < -1.0:
        bull_points += 0.08
        if is_auto:
            bull_points += 0.12
            catalysts.append(f"Falling crude ({round(crude_chg, 2)}%) reduces fuel costs — auto positive")
        else:
            catalysts.append(f"Easing crude prices ({round(crude_chg, 2)}%) reduce input costs")

    # ---- VIX (Fear gauge) ----
    if vix_val > 25:
        bear_points += 0.12
        catalysts.append(f"Elevated VIX ({round(vix_val, 1)}) indicates elevated fear — risk-off regime")
    elif vix_val < 15:
        bull_points += 0.08
        catalysts.append(f"Low VIX ({round(vix_val, 1)}) signals complacency — favorable for risk-on")
    
    if vix_chg > 5:
        bear_points += 0.08
    elif vix_chg < -5:
        bull_points += 0.06

    # Ensure at least 3 catalysts
    if len(catalysts) < 1:
        catalysts.append("Global macro conditions within normal parameters")
    if len(catalysts) < 2:
        catalysts.append(f"VIX at {round(vix_val, 1)} — market volatility {'elevated' if vix_val > 20 else 'contained'}")
    if len(catalysts) < 3:
        catalysts.append(f"US 10Y yield at {round(us10y_val, 2)}% — {'restrictive' if us10y_val > 4.5 else 'accommodative'} monetary backdrop")

    return {
        "macro_bull": round(min(bull_points, 1.0), 4),
        "macro_bear": round(min(bear_points, 1.0), 4),
        "usd_inr_change": round(usd_inr_chg, 4),
        "nasdaq_change": round(nasdaq_chg, 4),
        "crude_change": round(crude_chg, 4),
        "bond_yield": round(us10y_val, 4),
        "bond_yield_change": round(us10y_chg, 4),
        "vix": round(vix_val, 2),
        "vix_change": round(vix_chg, 2),
        "catalysts": catalysts[:5]
    }
