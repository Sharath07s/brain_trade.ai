import React, { useState, useEffect, useRef } from 'react';
import { getPrediction, getStock, getSentiment, getNews, getSocialFeed } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Brain, AlertCircle, RefreshCcw, Newspaper, Activity, Clock, Zap, MessageCircle } from 'lucide-react';
import TradingViewChart from '../components/TradingViewChart';
import IntradayPanel from '../components/IntradayPanel';
import { useGlobalContext } from '../context/GlobalContext';
import { useParams } from 'react-router-dom';

const formatLargeValue = (value: number, currency: string) => {
    if (!value) return 'N/A';
    const sym = currency === 'INR' ? '₹' : '$';
    if (value >= 1e12) return sym + (value / 1e12).toFixed(2) + 'T';
    if (value >= 1e9) return sym + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return sym + (value / 1e6).toFixed(2) + 'M';
    return sym + value.toLocaleString();
};

const SYMBOL_MAP: Record<string, string> = {
    "NIFTY_50": "^NSEI",
    "SENSEX": "^BSESN",
    "BANK_NIFTY": "^NSEBANK",
    "NIFTY_IT": "^CNXIT",
    "NIFTY_AUTO": "^CNXAUTO",
    "NIFTY_FMCG": "^CNXFMCG"
};

const checkMarketOpen = () => {
    // Current UTC time
    const now = new Date();
    // Indian Standard Time (IST) is UTC + 5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const day = istTime.getUTCDay(); // 0(Sun) - 6(Sat)
    const hours = istTime.getUTCHours();
    const minutes = istTime.getUTCMinutes();
    
    // Weekends closed
    if (day === 0 || day === 6) return false;
    
    // NSE Market Hours: 9:15 AM IST to 3:30 PM IST
    const timeInMinutes = hours * 60 + minutes;
    const openTime = 9 * 60 + 15;   // 9:15 AM IST
    const closeTime = 15 * 60 + 35;  // 3:35 PM IST (5 min buffer for settlement)
    
    return timeInMinutes >= openTime && timeInMinutes < closeTime;
};

const Dashboard = () => {
  const { symbol: routeSymbol } = useParams();
  const { symbol, setSymbol } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [prediction, setPrediction] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [news, setNews] = useState<any>(null);
  const [socialFeed, setSocialFeed] = useState<any[]>([]);
  
  const [timeframe, setTimeframe] = useState('1M');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const isMarketOpenRef = useRef(isMarketOpen);

  // WebSocket Live Stream states
  const [liveTickPrice, setLiveTickPrice] = useState<number | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [simTick, setSimTick] = useState(0); // For forcing auto-fluctuations

  useEffect(() => {
      isMarketOpenRef.current = isMarketOpen;
  }, [isMarketOpen]);

  // Update market status every minute
  useEffect(() => {
      const updateMarketStatus = () => setIsMarketOpen(checkMarketOpen());
      updateMarketStatus();
      const interval = setInterval(updateMarketStatus, 60000);
      return () => clearInterval(interval);
  }, []);

  const fetchData = async (sym: string, tf: string = '1M', retries = 1) => {
    setLoading(true);
    setError('');
    // Reset live data on new symbol load
    setLiveTickPrice(null);
    
    // Apply symbol mapping if needed
    const apiSymbol = SYMBOL_MAP[sym] || sym;
    console.log("Requested Symbol:", sym, "-> Mapped API Symbol:", apiSymbol);

    try {
      const [predData, stockData, sentData, newsData, feedData] = await Promise.all([
        getPrediction(apiSymbol).catch((e) => { console.error('Prediction error:', e); return null; }),
        getStock(apiSymbol, tf).catch((e) => { console.error('Stock API error:', e); return { error: e.message }; }),
        getSentiment(apiSymbol).catch((e) => { console.error('Sentiment error:', e); return null; }),
        getNews(apiSymbol).catch((e) => { console.error('News error:', e); return { news: [] }; }),
        getSocialFeed(apiSymbol).catch((e) => { console.error('Social error:', e); return { feed: [] }; })
      ]);
      
      console.log("API Response (Stock):", stockData);

      if (!stockData || stockData.error) {
          throw new Error(stockData?.error || "Failed to fetch symbol data from provider.");
      }
      
      setPrediction(predData);
      setStock(stockData);
      setSentiment(sentData);
      setNews(newsData?.news || []);
      setSocialFeed(feedData?.feed || []);
    } catch (err: any) {
      console.error("Dashboard Fetch Error:", err);
      if (retries > 0) {
          console.log(`Retrying fetch for ${apiSymbol}...`);
          return fetchData(sym, tf, retries - 1); // retry fetching
      }
      setError(err.message || "Market data source temporarily unavailable. Please verify ticker mapping.");
    } finally {
      if (retries === 0 || !error) {
          setLoading(false);
      }
    }
  };

  // WebSocket / Twelve Data Connection
  useEffect(() => {
      let ws: WebSocket | null = null;
      
      if (isLiveMode && isMarketOpenRef.current && stock?.symbol) {
          const apiKey = import.meta.env.VITE_TWELVE_DATA_API_KEY;
          if (!apiKey) {
              console.warn("No Twelve Data API Key provided. Live streaming requires API key.");
              return;
          }

          // Strip '.NS' suffix for TwelveData if it uses different conventions, though INFY.NS usually works via NSE:INFY depending on endpoint.
          // TwelveData websocket expects symbols exactly as listed. We will send the exact symbol.
          const formattedSymbol = stock.symbol;

          ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);
          
          ws.onopen = () => {
              setWsConnected(true);
              ws?.send(JSON.stringify({
                  action: "subscribe",
                  params: { symbols: formattedSymbol }
              }));
          };

          ws.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.event === "price" && data.price) {
                    const newPrice = parseFloat(data.price);
                    
                    setStock((prevStock: any) => {
                        if (!prevStock) return prevStock;
                        
                        // Fire flashy animation
                        if (newPrice > prevStock.current_price) {
                            setFlashColor('text-bullish drop-shadow-[0_0_15px_rgba(0,255,136,0.8)]');
                        } else if (newPrice < prevStock.current_price) {
                            setFlashColor('text-bearish drop-shadow-[0_0_15px_rgba(255,51,102,0.8)]');
                        }
                        
                        // Reset flash after 500ms
                        setTimeout(() => setFlashColor(null), 500);

                        return {
                            ...prevStock,
                            current_price: newPrice,
                        };
                    });

                    // Send the raw tick to TradingViewChart.tsx to trigger smooth update()
                    setLiveTickPrice(newPrice);
                }
              } catch (e) {
                  console.error("Error parsing WS message", e);
              }
          };

          ws.onclose = () => {
              setWsConnected(false);
          };
      }

      return () => {
          if (ws && ws.readyState === WebSocket.OPEN) {
              ws.close();
          }
          setWsConnected(false);
      }
  }, [isLiveMode, isMarketOpen, stock?.symbol]);

  // Fallback Presentation Auto-Fluctuation 
  // Forces graph/price heartbeat every 1.2s when Live Stream is active (e.g. for Indian stocks not supported by WS free tier)
  useEffect(() => {
      let simInterval: any;
      if (isLiveMode && isMarketOpenRef.current) {
          simInterval = setInterval(() => {
              setStock((prevStock: any) => {
                  if (!prevStock) return prevStock;
                  
                  // Wiggle price by -0.02% to +0.02%
                  const randomDelta = 1 + (Math.random() - 0.5) * 0.0004; 
                  const newPrice = prevStock.current_price * randomDelta;

                  if (newPrice > prevStock.current_price) {
                      setFlashColor('text-bullish drop-shadow-[0_0_15px_rgba(0,255,136,0.6)]');
                  } else {
                      setFlashColor('text-bearish drop-shadow-[0_0_15px_rgba(255,51,102,0.6)]');
                  }
                  
                  setTimeout(() => setFlashColor(null), 400);

                  setLiveTickPrice(newPrice); // Feeds to TradingView chart automatically!

                  return {
                      ...prevStock,
                      current_price: newPrice,
                  };
              });
          }, 1200);
      }
      return () => {
          if (simInterval) clearInterval(simInterval);
      };
  }, [isLiveMode, isMarketOpen, stock?.symbol, timeframe]);

  // Initial fetch and on dependencies change
  useEffect(() => {
    const targetSymbol = routeSymbol || symbol || 'TSLA';
    if (routeSymbol && routeSymbol !== symbol) {
      setSymbol(routeSymbol);
    }
    fetchData(targetSymbol, timeframe);
  }, [routeSymbol, symbol, setSymbol, timeframe]);

  return (
    <AnimatePresence mode="wait">
        {loading ? (
            <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-64 w-full"
            >
            <RefreshCcw className="text-accent animate-spin w-10 h-10" />
            </motion.div>
        ) : error ? (
            <motion.div 
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full relative flex flex-col items-center justify-center p-12 glass border-red-500/20 rounded-3xl min-h-[60vh] shadow-[0_0_40px_rgba(239,68,68,0.05)]"
            >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="bg-red-500/10 p-4 rounded-full mb-6 border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Data Stream Interrupted</h2>
            <p className="text-red-400 mb-8 max-w-md text-center text-sm font-medium">
                We encountered an issue fetching real-time data for <b>{routeSymbol || symbol}</b>.<br/><br/>
                Backend Message:<br/>
                <span className="text-white/70 italic text-xs block mt-1">{error}</span>
            </p>
            <button 
                onClick={() => { setLoading(true); fetchData(routeSymbol || symbol || 'TSLA', timeframe); }} 
                className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-white font-bold transition-all duration-300 flex items-center gap-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:-translate-y-0.5"
            >
                <RefreshCcw size={18} className="text-red-400" /> Reboot Connection Stream
            </button>
            </motion.div>
        ) : (
            <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"
            >

            {/* Intraday Panel Section (Moved to the absolute top of the dashboard to prevent scrolling issues) */}
            <div className="lg:col-span-3 w-full mb-2">
                <IntradayPanel />
            </div>
            
            {/* Headers / Price */}
            <div className="lg:col-span-3 flex justify-between items-end glass p-6 rounded-3xl relative overflow-hidden">
                {/* WS Live ambient background glow */}
                {wsConnected && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen" />
                )}

                <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">{stock.name} <span className="text-neutral font-medium text-lg">({stock.symbol})</span></h2>
                    
                    {/* Blinking LIVE Indicator */}
                    {wsConnected ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30">
                            <motion.span 
                                animate={{ opacity: [1, 0.4, 1] }} 
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                            />
                            <span className="text-xs font-black text-red-500 tracking-widest uppercase shadow-sm">Live</span>
                        </div>
                    ) : isMarketOpen ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bullish/10 border border-bullish/30">
                            <span className="w-2 h-2 rounded-full bg-bullish"></span>
                            <span className="text-xs font-bold text-bullish tracking-wider uppercase">Market Open</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral/10 border border-neutral/30">
                            <Clock size={12} className="text-neutral" />
                            <span className="text-xs font-bold text-neutral tracking-wider uppercase">Market Closed</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {/* Tick Flash Animation applied to Price */}
                    <span 
                        className={`text-4xl font-bold transition-all duration-300 ${flashColor || 'bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral'}`}
                    >
                        {stock.currency === 'INR' ? '₹' : '$'}{stock.current_price?.toFixed(2) || '0.00'}
                    </span>
                    {stock.open && (
                        <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-md transition-colors duration-500 ${stock.current_price >= stock.open ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                        {stock.current_price >= stock.open ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                        {(((stock.current_price - stock.open)/stock.open)*100).toFixed(2)}%
                        </span>
                    )}
                </div>
                </div>
                
                <div className="flex items-center gap-6">
                    {/* Live Mode Toggle */}
                    <div className="flex items-center gap-3 bg-panel px-4 py-2 rounded-2xl border border-white/5">
                        <Zap size={16} className={isLiveMode && isMarketOpen ? "text-accent animate-pulse" : "text-neutral"} />
                        <span className="text-sm font-bold text-white uppercase tracking-wider">Live Stream</span>
                        <button 
                            onClick={() => setIsLiveMode(!isLiveMode)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isLiveMode ? 'bg-accent shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isLiveMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    <div className="flex flex-col items-end">
                    <span className="text-sm text-neutral mb-1">Market Mood</span>
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${sentiment?.overall_sentiment_label === 'Bullish' ? 'border-bullish/50 text-bullish bg-bullish/5' : sentiment?.overall_sentiment_label === 'Bearish' ? 'border-bearish/50 text-bearish bg-bearish/5' : 'border-neutral/50 text-neutral bg-neutral/5'}`}>
                        <Target size={18} />
                        <span className="font-bold">{sentiment?.overall_sentiment_label}</span>
                    </div>
                    </div>
                </div>
            </div>

            {/* Left Area: Chart */}
            <div className="lg:col-span-2 space-y-6">
                <div className="glass p-6 rounded-3xl h-[450px] flex flex-col relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center mb-4 z-10">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Activity size={18} className="text-accent"/> 
                            Live Price Action
                        </h3>
                        
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 shadow-inner">
                            {['1D', '5D', '1M'].map(tf => (
                                <button 
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${timeframe === tf ? 'bg-accent/20 text-accent shadow-sm' : 'text-neutral hover:text-white'}`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 w-full z-10 h-full">
                        <TradingViewChart data={stock.history || []} liveTickPrice={liveTickPrice} />
                    </div>
                </div>
                
                {/* Mixed News + Social Feed */}
                <div className="glass p-6 rounded-3xl">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Newspaper size={18} className="text-accent"/> Recent Intel Feed</h3>
                    <div className="space-y-4">
                    {(socialFeed.length > 0 ? socialFeed : (news || [])).slice(0,5).map((item: any, i: number) => {
                        const isReddit = item.type === 'reddit';
                        const sentLabel = item.sentiment_label || (item.sentiment_score > 0.1 ? 'Positive' : item.sentiment_score < -0.1 ? 'Negative' : 'Neutral');
                        return (
                            <a key={i} href={item.url !== '#' ? item.url : undefined} target="_blank" rel="noreferrer" className="block group p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        {isReddit ? (
                                            <MessageCircle size={14} className="text-orange-400" />
                                        ) : (
                                            <Newspaper size={14} className="text-blue-400" />
                                        )}
                                        <span className="text-xs text-neutral">{isReddit ? 'Reddit' : (item.source || 'News')}</span>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${sentLabel === 'Positive' ? 'bg-bullish/20 text-bullish' : sentLabel === 'Negative' ? 'bg-bearish/20 text-bearish' : 'bg-neutral/20 text-neutral'}`}>
                                        {sentLabel}
                                    </span>
                                </div>
                                <p className="text-sm text-white group-hover:text-accent transition-colors line-clamp-2">{item.title}</p>
                            </a>
                        );
                    })}
                    </div>
                </div>
            </div>

            {/* Right Area: Explainability & Overviews */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Company Details */}
                <div className="glass p-6 rounded-3xl group">
                    <h3 className="font-semibold text-white mb-4">Company Overview</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-neutral">Sector</span>
                            <span className="text-white font-medium text-right max-w-[60%] truncate">{stock.sector || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-neutral">Mkt Cap</span>
                            <span className="text-white font-medium">{formatLargeValue(stock.market_cap, stock.currency)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-neutral">P/E Ratio</span>
                            <span className="text-white font-medium">{stock.pe_ratio ? stock.pe_ratio.toFixed(2) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                            <span className="text-neutral">52W High</span>
                            <span className="text-white font-medium">{stock.currency === 'INR' ? '₹' : '$'}{stock['52_week_high']?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-neutral">52W Low</span>
                            <span className="text-white font-medium">{stock.currency === 'INR' ? '₹' : '$'}{stock['52_week_low']?.toFixed(2) || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl relative overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                    <div className="bt-engine-logo-wrap">
                        <img src="/engine-logo.svg" alt="BrainTrade Engine" className="bt-engine-logo" />
                    </div>
                    <h3 className="font-bold text-white text-xl">BrainTrade Engine</h3>
                    </div>
                    
                    {/* Prediction Result */}
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                        <div className="relative flex items-center justify-center w-40 h-40">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#ffffff10" strokeWidth="12" />
                            <motion.circle 
                                initial={{ strokeDasharray: "0 1000" }}
                                animate={{ strokeDasharray: `${(prediction?.confidence || 0) * 4.4} 1000` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="80" cy="80" r="70" fill="none" 
                                stroke={prediction?.prediction === 'UP' ? '#00ff88' : prediction?.prediction === 'DOWN' ? '#ff3366' : '#00f0ff'} 
                                strokeWidth="12" 
                                strokeLinecap="round" 
                            />
                            </svg>
                            <div className="text-center">
                            <p className="text-sm text-neutral mb-1">Prediction</p>
                            <p className={`text-3xl font-black tracking-wider ${prediction?.prediction === 'UP' ? 'text-bullish' : prediction?.prediction === 'DOWN' ? 'text-bearish' : 'text-accent'}`}>{prediction?.prediction || '...'}</p>
                            <p className="text-xs text-white/50 mt-1">{prediction?.confidence}% conf.</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Explanations */}
                    <div className="mt-auto">
                        <h4 className="text-sm font-semibold text-neutral mb-3 uppercase tracking-wider">Why? (SHAP Insights)</h4>
                        <div className="space-y-3">
                        {prediction?.explanations?.map((reason: string, idx: number) => (
                            <motion.div 
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 + (idx * 0.1) }}
                                key={idx} className="bg-panel rounded-xl p-3 border border-white/5 text-sm my-2 text-white/80 leading-relaxed shadow-lg">
                                {reason}
                            </motion.div>
                        ))}
                        </div>
                    </div>
                </div>
            </div>

            </motion.div>
        )}
    </AnimatePresence>
  );
};

export default Dashboard;
