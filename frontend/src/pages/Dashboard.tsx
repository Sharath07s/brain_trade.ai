import React, { useState, useEffect, useRef } from 'react';
import { getPrediction, getStock, getSentiment, getNews } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Brain, AlertCircle, RefreshCcw, Newspaper, Activity, Clock } from 'lucide-react';
import TradingViewChart from '../components/TradingViewChart';
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
    
    // Open exactly after 10:00 AM IST, close at 3:30 PM (15:30) IST
    const timeInMinutes = hours * 60 + minutes;
    const openTime = 10 * 60; // 10:00 AM
    const closeTime = 15 * 60 + 30; // 3:30 PM
    
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
  
  const [timeframe, setTimeframe] = useState('1M');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const isMarketOpenRef = useRef(isMarketOpen);
  
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

  const fetchData = async (sym: string, tf: string = '1M') => {
    setLoading(true);
    setError('');
    try {
      const [predData, stockData, sentData, newsData] = await Promise.all([
        getPrediction(sym),
        getStock(sym, tf),
        getSentiment(sym),
        getNews(sym)
      ]);
      
      if (stockData.error) throw new Error(stockData.error);
      
      setPrediction(predData);
      setStock(stockData);
      setSentiment(sentData);
      setNews(newsData.news || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchStockOnly = async () => {
      if (!symbol && !routeSymbol) return;
      const targetSymbol = routeSymbol || symbol || 'TSLA';
      try {
          const stockData = await getStock(targetSymbol, timeframe);
          if (!stockData.error) {
              setStock(stockData);
          }
      } catch (e) {
          console.error("Live update failed", e);
      }
  };

  // Polling logic
  useEffect(() => {
      let intervalId: any;
      if (isLiveMode && isMarketOpenRef.current) {
          intervalId = setInterval(() => {
              fetchStockOnly();
          }, 10000); // 10 seconds polling
      }
      return () => {
          if (intervalId) clearInterval(intervalId);
      }
  }, [isLiveMode, isMarketOpen, symbol, routeSymbol, timeframe]);

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
            className="glass border-red-500/50 p-6 rounded-2xl flex items-center gap-4 text-red-400 w-full"
            >
            <AlertCircle />
            <p>{error}</p>
            </motion.div>
        ) : (
            <motion.div
            key="content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full"
            >
            
            {/* Headers / Price */}
            <div className="lg:col-span-3 flex justify-between items-end glass p-6 rounded-3xl">
                <div>
                <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-3xl font-bold text-white">{stock.name} <span className="text-neutral font-medium text-lg">({stock.symbol})</span></h2>
                    {isMarketOpen ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bullish/10 border border-bullish/30">
                            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse"></span>
                            <span className="text-xs font-bold text-bullish tracking-wider uppercase">Live Market</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral/10 border border-neutral/30">
                            <Clock size={12} className="text-neutral" />
                            <span className="text-xs font-bold text-neutral tracking-wider uppercase">Market Closed</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <motion.span 
                        key={stock.current_price} // Triggers animation on price change
                        initial={{ color: stock.current_price >= stock.open ? '#00ff88' : '#ff3366' }}
                        animate={{ color: '#ffffff' }}
                        transition={{ duration: 1.5 }}
                        className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral"
                    >
                    {stock.currency === 'INR' ? '₹' : '$'}{stock.current_price?.toFixed(2) || '0.00'}
                    </motion.span>
                    {stock.open && (
                        <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-md ${stock.current_price >= stock.open ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                        {stock.current_price >= stock.open ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                        {(((stock.current_price - stock.open)/stock.open)*100).toFixed(2)}%
                        </span>
                    )}
                </div>
                </div>
                
                <div className="flex items-center gap-6">
                    {/* Live Mode Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-neutral">Live Mode</span>
                        <button 
                            onClick={() => setIsLiveMode(!isLiveMode)}
                            className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${isLiveMode ? 'bg-accent' : 'bg-white/10'}`}
                        >
                            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${isLiveMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>

                    {/* Gauge simple representation */}
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
                        
                        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                            {['1D', '5D', '1M'].map(tf => (
                                <button 
                                    key={tf}
                                    onClick={() => setTimeframe(tf)}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeframe === tf ? 'bg-accent/20 text-accent' : 'text-neutral hover:text-white'}`}
                                >
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 w-full z-10 h-full">
                        <TradingViewChart data={stock.history || []} />
                    </div>
                </div>
                
                {/* News Section */}
                <div className="glass p-6 rounded-3xl">
                    <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><Newspaper size={18} className="text-accent"/> Recent News</h3>
                    <div className="space-y-4">
                    {news?.slice(0,3).map((item: any, i: number) => (
                        <div key={i} className="group p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs text-neutral">{item.source}</span>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${item.sentiment_label === 'Positive' ? 'bg-bullish/20 text-bullish' : item.sentiment_label === 'Negative' ? 'bg-bearish/20 text-bearish' : 'bg-neutral/20 text-neutral'}`}>
                                {item.sentiment_label}
                                </span>
                            </div>
                            <p className="text-sm text-white group-hover:text-accent transition-colors">{item.title}</p>
                        </div>
                    ))}
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
                    <div className="p-2 bg-accent/20 rounded-lg">
                        <Brain className="text-accent" size={24} />
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
