from fastapi import APIRouter
from services.stock_data import get_real_time_stock

router = APIRouter()

@router.get("/{symbol:path}")
def get_stock(symbol: str):
    data = get_real_time_stock(symbol.upper())
    return data
