from fastapi import WebSocket
from typing import Dict, List
import asyncio
import json
from services.stock_data import get_real_time_stock
from services.ai_engine import predict_stock_movement
from services.news_data import fetch_and_analyze_news
from services.social_data import fetch_reddit_sentiment
from services.macro_news import fetch_macro_news
from services.smart_sentiment import analyze_macro_factors

class ConnectionManager:
    def __init__(self):
        # Maps symbol to list of websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Track whether background polling task is running for a symbol
        self.active_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, symbol: str):
        await websocket.accept()
        symbol = symbol.upper()
        
        if symbol not in self.active_connections:
            self.active_connections[symbol] = []
        
        self.active_connections[symbol].append(websocket)
        
        # Start a broadcast task for this symbol if not already running
        if symbol not in self.active_tasks or self.active_tasks[symbol].done():
            self.active_tasks[symbol] = asyncio.create_task(self._poll_and_broadcast(symbol))

    def disconnect(self, websocket: WebSocket, symbol: str):
        symbol = symbol.upper()
        if symbol in self.active_connections:
            if websocket in self.active_connections[symbol]:
                self.active_connections[symbol].remove(websocket)
            
            # If no more connections for this symbol, cancel background task
            if len(self.active_connections[symbol]) == 0:
                if symbol in self.active_tasks:
                    self.active_tasks[symbol].cancel()
                    del self.active_tasks[symbol]
                del self.active_connections[symbol]

    async def _poll_and_broadcast(self, symbol: str):
        """Background continuous task polling the market safely to push to clients."""
        try:
            while True:
                # Do not poll too aggressively to avoid Yahoo Finance IP ban
                await asyncio.sleep(5)  # Fetch every 5 seconds
                
                # Double check connections still exist
                if symbol not in self.active_connections or len(self.active_connections[symbol]) == 0:
                    break
                    
                # 1. Fetch Real-time Stock Data
                stock_data = get_real_time_stock(symbol)
                
                # 2. Fetch dependencies
                if not stock_data.get("error"):
                    news_data = fetch_and_analyze_news(symbol)
                    social_data = fetch_reddit_sentiment(symbol)
                    macro_news = fetch_macro_news(symbol)
                    macro_insights = analyze_macro_factors(macro_news, social_data)
                    prediction = predict_stock_movement(symbol, stock_data, news_data, social_data, macro_insights)
                    
                    # Compute quick sentiment summary for UI
                    avg_sentiment_score = sum(n.get("sentiment_score", 0) for n in news_data) / max(len(news_data), 1)
                    sentiment_summary = {
                        "symbol": symbol,
                        "overall_sentiment_score": avg_sentiment_score,
                        "overall_sentiment_label": "Bullish" if avg_sentiment_score > 0.1 else "Bearish" if avg_sentiment_score < -0.1 else "Neutral"
                    }
                else:
                    news_data = []
                    prediction = None
                    sentiment_summary = None
                    
                message = {
                    "type": "update",
                    "symbol": symbol,
                    "stock": stock_data,
                    "news": news_data,
                    "sentiment": sentiment_summary,
                    "prediction": prediction
                }
                
                # Broadcast
                await self._broadcast_to_symbol(symbol, message)
                
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"WebSocket Poll Error for {symbol}: {e}")

    async def _broadcast_to_symbol(self, symbol: str, message: dict):
        """Sends payload to all clients connected to this symbol channel."""
        if symbol in self.active_connections:
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    # Client probably dropped ungracefully
                    pass

manager = ConnectionManager()
