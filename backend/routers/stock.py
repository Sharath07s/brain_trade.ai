from fastapi import APIRouter, Query
from services.stock_data import get_real_time_stock

router = APIRouter()

@router.get("/{symbol:path}")
def get_stock(symbol: str, timeframe: str = Query("1M", description="Timeframe for history (1D, 5D, 1M)")):
    data = get_real_time_stock(symbol.upper(), timeframe)
    return data
