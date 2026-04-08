const API_BASE = "http://127.0.0.1:8000";

export const getPrediction = async (symbol: string) => {
  const res = await fetch(`${API_BASE}/predict/${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch prediction");
  return res.json();
};

export const getStock = async (symbol: string, timeframe: string = "1M") => {
  const res = await fetch(`${API_BASE}/stock/${symbol}?timeframe=${timeframe}`);
  if (!res.ok) throw new Error("Failed to fetch stock data");
  return res.json();
};

export const getSentiment = async (symbol: string) => {
  const res = await fetch(`${API_BASE}/sentiment/${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch sentiment");
  return res.json();
};

export const getNews = async (symbol: string) => {
  const res = await fetch(`${API_BASE}/news/${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch news");
  return res.json();
};

export const searchStocks = async (query: string) => {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search stocks");
  return res.json();
};
