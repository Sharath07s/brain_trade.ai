from fastapi import APIRouter, Query
from services.search_data import fetch_search_results

router = APIRouter()

@router.get("/")
def search_stocks(q: str = Query(..., min_length=1)):
    results = fetch_search_results(q)
    return {"query": q, "results": results}
