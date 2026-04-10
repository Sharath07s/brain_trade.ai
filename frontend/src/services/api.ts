const API_BASE = "http://localhost:8000";

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

export const getGeneralNews = async () => {
  const res = await fetch(`${API_BASE}/news/general`);
  if (!res.ok) throw new Error("Failed to fetch general news");
  return res.json();
};

export const getAlerts = async () => {
  const res = await fetch(`${API_BASE}/predict/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
};

export const searchStocks = async (query: string) => {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Failed to search stocks");
  return res.json();
};

export const getMarketIndices = async () => {
  const res = await fetch(`${API_BASE}/stock/indices`);
  if (!res.ok) throw new Error("Failed to fetch market indices");
  return res.json();
};

export const getIndianGrowthStocks = async () => {
  const res = await fetch(`${API_BASE}/stock/indian-growth`);
  if (!res.ok) throw new Error("Failed to fetch top indian growth stocks");
  return res.json();
};

export const getSocialFeed = async (symbol: string) => {
  const res = await fetch(`${API_BASE}/social/social-feed/${symbol}`);
  if (!res.ok) throw new Error("Failed to fetch social feed");
  return res.json();
};
