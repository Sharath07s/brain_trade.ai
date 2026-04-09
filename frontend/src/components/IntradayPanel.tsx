import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, TrendingUp, TrendingDown, RefreshCcw, ChevronDown, Brain } from 'lucide-react';
import { getMarketIndices, getStock } from '../services/api';
import TradingViewChart from './TradingViewChart';
import BrainTradeEngineModal from './BrainTradeEngineModal';

import DisclaimerModal from './DisclaimerModal';

const INDICES_CONFIG = [
  { id: 'NIFTY 50', symbol: '^NSEI' },
  { id: 'SENSEX', symbol: '^BSESN' },
  { id: 'BANKNIFTY', symbol: '^NSEBANK' },
  { id: 'BANKEX', symbol: 'BSE-BANK.BO' } // Using Yahoo Finance symbol
];

const IntradayPanel = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isEngineModalOpen, setIsEngineModalOpen] = useState(false);
    const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
    const [indices, setIndices] = useState<any[]>([]);
    
    // View state
    const [selectedSymbol, setSelectedSymbol] = useState('^NSEI');
    const [selectedName, setSelectedName] = useState('NIFTY 50');
    const [timeframe, setTimeframe] = useState('1m');
    const [chartData, setChartData] = useState<any[]>([]);
    const [loadingChart, setLoadingChart] = useState(false);
    
    // Live mode simulation state
    const [liveTickPrice, setLiveTickPrice] = useState<number | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);
    const [flashColor, setFlashColor] = useState<string | null>(null);
    const [isMarketOpen, setIsMarketOpen] = useState(true);

    const checkMarketOpen = () => {
        const now = new Date();
        const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        const day = istTime.getDay();
        const hours = istTime.getHours();
        const minutes = istTime.getMinutes();
        const timeInMinutes = hours * 60 + minutes;
        
        // NSE/BSE Hours: Mon-Fri, 9:15 AM (555) to 3:30 PM (930)
        return day >= 1 && day <= 5 && timeInMinutes >= 555 && timeInMinutes <= 930;
    };

    useEffect(() => {
        setIsMarketOpen(checkMarketOpen());
        const interval = setInterval(() => setIsMarketOpen(checkMarketOpen()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Load Indices background task
    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const data = await getMarketIndices();
                if (data && data.indices && data.indices.length > 0) {
                    setIndices(data.indices);
                }
            } catch (err) {
                console.error("Failed to load indices", err);
            }
        };
        fetchIndices();
        const idxInterval = setInterval(fetchIndices, 10000); // 10s poll
        return () => clearInterval(idxInterval);
    }, []);

    // Chart Data Loader
    useEffect(() => {
        if (!isExpanded) return;
        
        const loadChart = async () => {
            setLoadingChart(true);
            try {
                const data = await getStock(selectedSymbol, timeframe);
                if (data && data.history) {
                    setChartData(data.history);
                    setCurrentPrice(data.current_price);
                    setLiveTickPrice(data.current_price);
                }
            } catch (err) {
                console.error("Failed to load chart", err);
            } finally {
                setLoadingChart(false);
            }
        };
        loadChart();
    }, [selectedSymbol, timeframe, isExpanded]);

    // Live Heartbeat Simulation Loop (Syncs with Market Hours)
    // Runs every 1-2 seconds to wiggle the chart dynamically and price
    useEffect(() => {
        if (!isExpanded || !isMarketOpen || !currentPrice) return;
        
        const simInterval = setInterval(() => {
             // Wiggle by ±0.01%
             const randomDelta = 1 + (Math.random() - 0.5) * 0.0002;
             
             setCurrentPrice((prevPrice) => {
                 if (!prevPrice) return prevPrice;
                 const newPrice = prevPrice * randomDelta;
                 
                 // Flashes
                 if (newPrice > prevPrice) {
                    setFlashColor('text-bullish drop-shadow-[0_0_15px_rgba(0,255,136,0.5)]');
                 } else {
                    setFlashColor('text-bearish drop-shadow-[0_0_15px_rgba(255,51,102,0.5)]');
                 }
                 setTimeout(() => setFlashColor(null), 400);
                 
                 setLiveTickPrice(newPrice);
                 
                 return newPrice;
             });
             
        }, 1200);
        
        return () => clearInterval(simInterval);
    }, [isExpanded, isMarketOpen, selectedSymbol, currentPrice !== null]); // Dep slightly modified to trigger on first currentPrice hit

    return (
        <div className="w-full mt-8 flex flex-col items-center">
            {/* Toggle Button */}
            {!isExpanded ? (
                <button 
                  onClick={() => setIsExpanded(true)}
                  className="group relative flex items-center gap-3 px-8 py-4 bg-[#161b22] border border-white/10 rounded-2xl hover:bg-[#1f2530] hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Activity className="w-6 h-6 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-lg font-bold text-white group-hover:text-blue-100 tracking-wide">Enter Intraday Terminal</span>
                </button>
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-7xl bg-[#0d1117] border border-white/5 rounded-[24px] overflow-hidden shadow-2xl relative"
                >
                    {/* Inner Ambient Glow */}
                    {isMarketOpen && (
                        <div className="absolute inset-0 bg-green-500/5 blur-[120px] pointer-events-none" />
                    )}

                    {/* Top Ticker Row (Mirroring Groww) */}
                    <div className="flex items-center overflow-x-auto hide-scrollbar bg-[#161b22] border-b border-white/10 p-3 sm:px-6 relative z-10">
                        {indices.length === 0 ? (
                           <div className="text-sm text-gray-400 flex items-center gap-2 py-1"><RefreshCcw className="w-4 h-4 animate-spin"/> Loading Intraday Feeds...</div>
                        ) : (
                            <div className="flex gap-8 whitespace-nowrap">
                                {indices.map((idx) => {
                                    const isUp = idx.change >= 0;
                                    const isSelected = selectedSymbol === idx.symbol;
                                    return (
                                        <div 
                                            key={idx.symbol}
                                            onClick={() => {
                                                setSelectedSymbol(idx.symbol);
                                                setSelectedName(idx.name);
                                            }}
                                            className={`flex flex-col cursor-pointer px-4 py-2 rounded-xl transition-all ${isSelected ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{idx.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-base font-medium ${isSelected ? (flashColor || 'text-white') : 'text-gray-100'} transition-all duration-300`}>
                                                    {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                                <span className={`text-xs font-semibold ${isUp ? 'text-bullish' : 'text-bearish'}`}>
                                                    {isUp ? '+' : ''}{idx.change.toFixed(2)} ({isUp ? '+' : ''}{idx.change_percent.toFixed(2)}%)
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <div className="ml-auto pl-4">
                            <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <ChevronDown className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Chart Header & Controls */}
                    <div className="p-6 pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-end relative z-10 gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-white tracking-tight">{selectedName}</h2>
                                {isMarketOpen ? (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] sm:text-xs font-bold text-green-400 tracking-wider">LIVE</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-500/10 border border-gray-500/20">
                                        <Clock className="w-3 h-3 text-gray-400" />
                                        <span className="text-[10px] sm:text-xs font-bold text-gray-400 tracking-wider">CLOSED</span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-3xl font-medium tracking-tight">
                                {currentPrice ? (
                                    <span className={`${flashColor || 'text-white'} transition-all duration-300`}>
                                        {currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                ) : (
                                    <span className="text-gray-500">...</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Brain Engine Button */}
                            <button 
                                onClick={() => setIsDisclaimerOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded-lg transition-all text-blue-400 hover:text-blue-300 font-bold tracking-wide relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                                <Brain className="w-4 h-4" />
                                <span className="text-sm">Brain Trade Engine</span>
                            </button>

                            {/* Intraday Timeframes */}
                            <div className="flex p-1 bg-[#161b22] border border-white/10 rounded-lg">
                                {['1m', '5m', '15m'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                                            timeframe === tf 
                                                ? 'bg-[#21262d] text-white shadow-sm' 
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="p-6 h-[400px] sm:h-[500px] w-full relative z-10">
                        {loadingChart ? (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-400">
                                <RefreshCcw className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="font-medium tracking-wide">Loading Intraday Ticks...</span>
                            </div>
                        ) : chartData.length > 0 ? (
                            <TradingViewChart 
                                data={chartData} 
                                liveTickPrice={liveTickPrice}
                                colors={{
                                    backgroundColor: 'transparent',
                                    textColor: '#8b949e'
                                }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                No intraday data available for {selectedName}.
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <BrainTradeEngineModal 
                isOpen={isEngineModalOpen}
                onClose={() => setIsEngineModalOpen(false)}
                symbol={selectedSymbol}
                stockName={selectedName}
                isMarketOpen={isMarketOpen}
            />

            <DisclaimerModal 
                isOpen={isDisclaimerOpen}
                onAccept={() => {
                    setIsDisclaimerOpen(false);
                    setIsEngineModalOpen(true);
                }}
                onCancel={() => setIsDisclaimerOpen(false)}
            />
        </div>
    );
};

export default IntradayPanel;
