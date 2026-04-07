import sys
sys.path.append('backend')
from services.stock_data import fetch_stock_data

try:
    print(fetch_stock_data("PAYTM.NS"))
except Exception as e:
    import traceback
    traceback.print_exc()
