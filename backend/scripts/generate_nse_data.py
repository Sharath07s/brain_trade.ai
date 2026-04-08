"""
Converts NSE official stock CSV into a clean JSON file for our search engine.
Run: python scripts/generate_nse_data.py
"""
import csv
import json
import os

CSV_PATH = "/tmp/nse_stocks.csv"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "nse_stocks.json")

def clean_name(name: str) -> str:
    """Clean up company name for better display."""
    return name.strip().title() if name else ""

def main():
    stocks = []
    seen_symbols = set()
    
    with open(CSV_PATH, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            symbol = row.get("SYMBOL", "").strip()
            name = row.get("NAME OF COMPANY", "").strip()
            series = row.get(" SERIES", "").strip()
            isin = row.get(" ISIN NUMBER", "").strip()
            
            if not symbol or symbol in seen_symbols:
                continue
            
            # Only include EQ series (regular equities)
            if series and series != "EQ":
                continue
                
            seen_symbols.add(symbol)
            stocks.append({
                "symbol": symbol,
                "name": name,
                "exchange": "NSE",
                "isin": isin,
                "type": "EQUITY"
            })
    
    # Sort alphabetically by symbol
    stocks.sort(key=lambda x: x["symbol"])
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(stocks, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Generated {len(stocks)} NSE stocks → {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
