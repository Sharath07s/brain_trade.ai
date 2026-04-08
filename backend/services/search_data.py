import requests

def fetch_search_results(query: str) -> list:
    """
    Queries Yahoo Finance's blazing fast internal autocomplete API.
    Handles global equities, indices, and automatically maps NSE/BSE stocks.
    """
    if not query.strip():
        return []

    url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=10&newsCount=0"
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=5)
        response.raise_for_status()
        data = response.json()
        
        quotes = data.get("quotes", [])
        
        formatted_results = []
        for quote in quotes:
            # We filter for Equity/ETF to avoid polluting with obscure mutual funds or options
            quote_type = quote.get("quoteType", "")
            if quote_type not in ["EQUITY", "ETF", "INDEX"]:
                continue
                
            formatted_results.append({
                "symbol": quote.get("symbol"),
                "name": quote.get("shortname", quote.get("longname", quote.get("symbol"))),
                "exchange": quote.get("exchange", "Unknown"),
                "type": quote_type
            })
            
        # Prioritize Indian stocks (.NS and .BO)
        formatted_results.sort(key=lambda x: 0 if x["symbol"].endswith('.NS') or x["symbol"].endswith('.BO') else 1)
            
        return formatted_results
    except Exception as e:
        print(f"Search API Error: {e}")
        return []
