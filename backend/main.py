from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stock, news, social, sentiment, predict, search

app = FastAPI(title="BrainTrade AI API", description="Real-time AI Trading Intelligence")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock.router, prefix="/stock", tags=["Stock Data"])
app.include_router(news.router, prefix="/news", tags=["News Data"])
app.include_router(social.router, prefix="/social", tags=["Social Data"])
app.include_router(sentiment.router, prefix="/sentiment", tags=["Sentiment Aggregation"])
app.include_router(predict.router, prefix="/predict", tags=["AI Prediction"])
app.include_router(search.router, prefix="/search", tags=["Stock Search"])

@app.get("/")
def root():
    return {"message": "Welcome to BrainTrade AI backend!"}
