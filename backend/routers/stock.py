from fastapi import APIRouter, Query
from services.stock_data import get_real_time_stock, get_market_indices

router = APIRouter()

@router.get("/indices")
def get_indices():
    return get_market_indices()

@router.get("/{symbol:path}")
def get_stock(symbol: str, timeframe: str = Query("1M", description="Timeframe for history (1D, 5D, 1M, 1m, 5m, 15m)")):
    data = get_real_time_stock(symbol.upper(), timeframe)
    return data
