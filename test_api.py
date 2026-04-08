import urllib.request
import json
import urllib.error

key = "e0e184a19e7445ef8e801f4a4619c421"

apis = {
    "TwelveData": f"https://api.twelvedata.com/time_series?symbol=AAPL&interval=1min&apikey={key}",
    "Finnhub": f"https://finnhub.io/api/v1/quote?symbol=AAPL&token={key}",
    "AlphaVantage": f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=AAPL&apikey={key}",
    "FMP": f"https://financialmodelingprep.com/api/v3/quote/AAPL?apikey={key}",
    "Marketstack": f"http://api.marketstack.com/v1/tickers/AAPL/intraday/latest?access_key={key}"
}

for name, url in apis.items():
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            print(f"{name}: {response.getcode()}")
            if response.getcode() == 200:
                print(f"Data: {response.read().decode('utf-8')[:100]}")
    except urllib.error.HTTPError as e:
        print(f"{name}: {e.code}")
    except Exception as e:
        print(f"{name}: Error {e}")
