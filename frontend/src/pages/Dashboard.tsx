import React, { useState, useEffect } from 'react';
import { getPrediction, getStock, getSentiment, getNews } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Brain, AlertCircle, RefreshCcw, Newspaper } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

const Dashboard = () => {
  const { symbol: routeSymbol } = useParams();
  const { symbol, setSymbol } = useGlobalContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [prediction, setPrediction] = useState<any>(null);
  const [stock, setStock] = useState<any>(null);
  const [sentiment, setSentiment] = useState<any>(null);
  const [news, setNews] = useState<any>(null);

  const fetchData = async (sym: string) => {
    setLoading(true);
    setError('');
    try {
      const [predData, stockData, sentData, newsData] = await Promise.all([
        getPrediction(sym),
        getStock(sym),
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

  useEffect(() => {
    // If URL has a symbol, sync it to global context and fetch
    // If routeSymbol is undefined, it defaults to the context symbol
    const targetSymbol = routeSymbol || symbol || 'TSLA';
    if (routeSymbol && routeSymbol !== symbol) {
      setSymbol(routeSymbol);
    }
    fetchData(targetSymbol);
  }, [routeSymbol, symbol, setSymbol]);

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
                <h2 className="text-3xl font-bold text-white mb-2">{stock.name} <span className="text-neutral font-medium text-lg ml-2">({stock.symbol})</span></h2>
                <div className="flex items-center gap-4">
                    <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral">
                    {stock.currency === 'INR' ? '₹' : '$'}{stock.current_price?.toFixed(2) || '0.00'}
                    </span>
                    {stock.open && (
                        <span className={`flex items-center text-sm font-semibold px-2 py-1 rounded-md ${stock.current_price >= stock.open ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'}`}>
                        {stock.current_price >= stock.open ? <TrendingUp size={16} className="mr-1"/> : <TrendingDown size={16} className="mr-1"/>}
                        {(((stock.current_price - stock.open)/stock.open)*100).toFixed(2)}%
                        </span>
                    )}
                </div>
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

            {/* Left Area: Chart */}
            <div className="lg:col-span-2 space-y-6">
                <div className="glass p-6 rounded-3xl h-[400px] flex flex-col relative overflow-hidden group">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
                    <h3 className="font-semibold text-white mb-4 z-10">7-Day Price Trend</h3>
                    <div className="flex-1 w-full z-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stock.history || []}>
                            <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={stock.current_price >= stock.open ? '#00ff88' : '#ff3366'} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={stock.current_price >= stock.open ? '#00ff88' : '#ff3366'} stopOpacity={0}/>
                            </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="date" stroke="#8892b0" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis domain={['auto', 'auto']} stroke="#8892b0" fontSize={12} tickFormatter={(val) => `${stock.currency === 'INR' ? '₹' : '$'}${val}`} axisLine={false} tickLine={false} />
                            <Tooltip 
                            contentStyle={{ backgroundColor: '#13141f', borderColor: '#ffffff20', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="close" stroke={stock.current_price >= stock.open ? '#00ff88' : '#ff3366'} strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                        </AreaChart>
                    </ResponsiveContainer>
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
