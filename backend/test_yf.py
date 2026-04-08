import yfinance as yf
tickers = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT', '^CNXAUTO', '^CNXMID', 'RELIANCE.NS']
for t in tickers:
    tick = yf.Ticker(t)
    hist = tick.history(period="1d")
    print(f"{t}: {'OK' if not hist.empty else 'FAILED'}")
