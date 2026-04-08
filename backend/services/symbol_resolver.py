"""
Smart symbol resolver for Indian (NSE) and global stocks.
Auto-detects NSE stocks and appends .NS suffix for Yahoo Finance.
"""

import json
import os

# Path to the NSE stock list
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
NSE_JSON_PATH = os.path.join(DATA_DIR, "nse_stocks.json")

# In-memory NSE symbol set for O(1) lookups
_nse_symbols: set = set()


def _load_nse_symbols():
    """Load NSE symbols into a set for instant lookups."""
    global _nse_symbols
    if _nse_symbols:
        return

    try:
        with open(NSE_JSON_PATH, "r", encoding="utf-8") as f:
            stocks = json.load(f)
            _nse_symbols = {s["symbol"].upper() for s in stocks}
        print(f"✅ Symbol resolver loaded {len(_nse_symbols)} NSE symbols")
    except Exception as e:
        print(f"⚠️  Could not load NSE symbols for resolver: {e}")


# Load on import
_load_nse_symbols()


def is_nse_stock(symbol: str) -> bool:
    """Check if a symbol belongs to the NSE stock list."""
    return symbol.upper() in _nse_symbols


def resolve_yahoo_symbol(symbol: str) -> str:
    """
    Convert a user-facing symbol to a Yahoo Finance compatible symbol.
    
    Examples:
        RELIANCE → RELIANCE.NS
        TCS → TCS.NS
        INFY → INFY.NS
        TSLA → TSLA (US stock, no change)
        AAPL → AAPL (US stock, no change)
        RELIANCE.NS → RELIANCE.NS (already has suffix)
        RELIANCE.BO → RELIANCE.BO (BSE, keep as-is)
    """
    symbol = symbol.strip().upper()

    # Already has an exchange suffix — don't modify
    if "." in symbol:
        return symbol

    # If it's in the NSE list, append .NS
    if is_nse_stock(symbol):
        return f"{symbol}.NS"

    # Otherwise it's a global stock (US/etc) — keep as-is
    return symbol


def get_display_symbol(yahoo_symbol: str) -> str:
    """
    Convert Yahoo Finance symbol back to display symbol.
    
    Examples:
        RELIANCE.NS → RELIANCE
        TCS.NS → TCS
        TSLA → TSLA
    """
    if yahoo_symbol.endswith(".NS") or yahoo_symbol.endswith(".BO"):
        return yahoo_symbol.rsplit(".", 1)[0]
    return yahoo_symbol
