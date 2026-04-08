import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Flame, Brain, Activity, BarChart2, Zap, LayoutGrid } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- MOCK DATA GENERATORS --- //
const generateSparkline = (points: number, trend: 'up'|'down'|'neutral') => {
    let current = 100;
    return Array.from({ length: points }).map((_, i) => {
        const drift = trend === 'up' ? 0.5 : trend === 'down' ? -0.5 : 0;
        const noise = (Math.random() - 0.5) * 5;
        current = current + drift + noise;
        return { val: current };
    });
};

const INDICES = [
    { name: 'NIFTY 50', val: 22450.15, change: 0.85, spark: generateSparkline(20, 'up') },
    { name: 'SENSEX', val: 73850.40, change: 0.92, spark: generateSparkline(20, 'up') },
    { name: 'BANK NIFTY', val: 47900.20, change: 1.10, spark: generateSparkline(20, 'up') },
    { name: 'NIFTY IT', val: 35120.85, change: -0.45, spark: generateSparkline(20, 'down') },
    { name: 'NIFTY AUTO', val: 21540.30, change: 0.25, spark: generateSparkline(20, 'up') },
    { name: 'MIDCAP', val: 51200.75, change: 1.45, spark: generateSparkline(20, 'up') },
];

const TRENDING_STOCKS = [
    { sym: 'RELIANCE', name: 'Reliance Industries', price: 2950.40, change: 2.15, vol: 'High', trend: 'bullish', spark: generateSparkline(30, 'up') },
    { sym: 'HDFCBANK', name: 'HDFC Bank', price: 1540.20, change: 1.85, vol: 'High', trend: 'bullish', spark: generateSparkline(30, 'up') },
    { sym: 'TCS', name: 'Tata Consultancy', price: 3950.10, change: -1.20, vol: 'Medium', trend: 'bearish', spark: generateSparkline(30, 'down') },
    { sym: 'INFY', name: 'Infosys', price: 1480.95, change: -0.85, vol: 'Medium', trend: 'bearish', spark: generateSparkline(30, 'down') },
    { sym: 'ICICIBANK', name: 'ICICI Bank', price: 1080.50, change: 0.95, vol: 'Medium', trend: 'bullish', spark: generateSparkline(30, 'up') },
    { sym: 'SBIN', name: 'State Bank of India', price: 760.30, change: 1.10, vol: 'High', trend: 'bullish', spark: generateSparkline(30, 'up') },
    { sym: 'TATAMOTORS', name: 'Tata Motors', price: 950.45, change: -0.30, vol: 'Low', trend: 'neutral', spark: generateSparkline(30, 'neutral') },
    { sym: 'ADANIENT', name: 'Adani Enterprises', price: 3240.60, change: -2.50, vol: 'High', trend: 'bearish', spark: generateSparkline(30, 'down') },
];

const SECTORS = [
    { name: 'Banking', change: 1.45 },
    { name: 'Energy', change: 1.20 },
    { name: 'Metal', change: 0.85 },
    { name: 'Auto', change: 0.25 },
    { name: 'FMCG', change: -0.15 },
    { name: 'Pharma', change: -0.40 },
    { name: 'IT', change: -0.95 }
];

const TOP_GAINERS = [
    { sym: 'ZOMATO', price: 185.40, change: 5.2 },
    { sym: 'TRENT', price: 4120.50, change: 4.8 },
    { sym: 'HAL', price: 3450.20, change: 3.9 },
    { sym: 'BHEL', price: 245.10, change: 3.5 },
];

const TOP_LOSERS = [
    { sym: 'PAYTM', price: 410.20, change: -4.5 },
    { sym: 'WIPRO', price: 480.50, change: -3.2 },
    { sym: 'ITC', price: 415.80, change: -2.1 },
    { sym: 'HINDUNILVR', price: 2250.40, change: -1.8 },
];

const Markets = () => {
    // Ticking logic to simulate live market data
    const [trendingData, setTrendingData] = useState(TRENDING_STOCKS);
    const [indicesData, setIndicesData] = useState(INDICES);
    
    useEffect(() => {
        const interval = setInterval(() => {
            setTrendingData(prev => prev.map(stock => ({
                ...stock,
                price: stock.price * (1 + (Math.random() - 0.5) * 0.001) // Wiggle by 0.1%
            })));
            setIndicesData(prev => prev.map(idx => ({
                ...idx,
                val: idx.val * (1 + (Math.random() - 0.5) * 0.0005)
            })));
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div className="w-full min-h-screen pb-20 space-y-8 font-sans">
            
            {/* --- SECTION 5: AI INSIGHT BAR (Placed at top for sleek intro) --- */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="w-full bg-[#161b22]/80 backdrop-blur-md border border-blue-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                        <Brain className="w-4 h-4" />
                        <span className="text-sm">AI Market Mood: Bullish 📈</span>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-gray-300 text-sm font-medium">
                        <Activity className="w-4 h-4 text-green-400" /> Trending Sector: <span className="text-white font-bold">Banking</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-2 text-gray-300 text-sm font-medium">
                        <Flame className="w-4 h-4 text-orange-400" /> Hot Stock: <span className="text-white font-bold">RELIANCE</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
                    <span className="text-gray-500">AI Signals:</span>
                    <span className="text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">RELIANCE / Buy</span>
                    <span className="text-gray-400 bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20">INFY / Hold</span>
                    <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">PAYTM / Sell</span>
                </div>
            </motion.div>

            {/* --- SECTION 1: INDIAN MARKET INDICES --- */}
            <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <h2 className="text-lg font-bold text-gray-300 mb-4 px-1 uppercase tracking-widest flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-accent" /> Benchmark Indices
                </h2>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                    {indicesData.map((idx, i) => {
                        const isUp = idx.change >= 0;
                        return (
                            <motion.div 
                                key={idx.name}
                                whileHover={{ scale: 1.02 }}
                                className={`min-w-[200px] flex-shrink-0 bg-[#0d1117] border rounded-2xl p-4 relative overflow-hidden transition-all duration-300 ${isUp ? 'border-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)]' : 'border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(255,51,102,0.1)]'}`}
                            >
                                {/* Background glow */}
                                <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full pointer-events-none ${isUp ? 'bg-green-500/10' : 'bg-red-500/10'}`} />
                                
                                <div className="relative z-10">
                                    <h3 className="text-gray-400 font-bold text-sm tracking-wide">{idx.name}</h3>
                                    <div className="flex items-end gap-2 mt-1">
                                        <span className="text-xl font-black text-white">{idx.val.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${isUp ? 'text-bullish' : 'text-bearish'}`}>
                                        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {isUp ? '+' : ''}{idx.change}%
                                    </div>
                                </div>

                                <div className="h-12 w-full mt-2 relative z-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={idx.spark}>
                                            <Area 
                                                type="monotone" dataKey="val" 
                                                stroke={isUp ? '#00E676' : '#FF1744'} 
                                                strokeWidth={2} fillOpacity={0} 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </motion.div>

            {/* --- CORE GRID: Sections 2, 3, 4 --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
                
                {/* LEFT COL: SECTION 2 (Trending) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                            <Flame className="w-7 h-7 text-orange-500 animate-pulse" /> 
                            Trending in India
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trendingData.map((stock, i) => {
                            const isPulsing = i < 2; // Top 2 get special glow
                            return (
                                <motion.div 
                                    key={stock.sym}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    whileHover={{ scale: 1.02 }}
                                    className={`bg-[#0d1117] border rounded-2xl p-5 relative overflow-hidden group cursor-pointer ${isPulsing ? 'border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.05)]' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-black text-white tracking-tight">{stock.sym}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{stock.name}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center justify-end gap-3 flex-nowrap w-full">
                                                {isPulsing && (
                                                    <div className="flex-shrink-0 flex items-center gap-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md">
                                                        <Flame className="w-3 h-3" /> Hot
                                                    </div>
                                                )}
                                                <motion.p 
                                                    key={stock.price} 
                                                    initial={{ color: '#fff' }}
                                                    animate={{ color: stock.change >= 0 ? ['#00ff88', '#fff'] : ['#ff3366', '#fff'] }}
                                                    transition={{ duration: 1 }}
                                                    className="text-xl font-bold tracking-tight text-white mb-1 truncate max-w-[140px]"
                                                >
                                                    {formatINR(stock.price)}
                                                </motion.p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${stock.change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {stock.change >= 0 ? '+' : ''}{stock.change}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex gap-2">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${
                                                stock.trend === 'bullish' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                                                stock.trend === 'bearish' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                                                'bg-gray-500/10 border-gray-500/20 text-gray-400'
                                            }`}>
                                                {stock.trend}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-400">
                                                Vol: {stock.vol}
                                            </span>
                                        </div>

                                        <div className="w-24 h-8">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={stock.spark}>
                                                    <Area 
                                                        type="monotone" dataKey="val" 
                                                        stroke={stock.change >= 0 ? '#00E676' : '#FF1744'} 
                                                        strokeWidth={2} fill={stock.change >= 0 ? '#00E676' : '#FF1744'} fillOpacity={0.1}
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>


                {/* RIGHT COL: SECTION 3 & 4 (Movers & Sectors) */}
                <div className="space-y-8 lg:mt-0 mt-8">
                    
                    {/* SECTION 4: SECTOR PERFORMANCE */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-300 mb-4 px-1 uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-accent" /> Sector Heatmap
                        </h2>
                        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4 space-y-2">
                            {SECTORS.sort((a,b) => b.change - a.change).map((sec) => {
                                const isPos = sec.change >= 0;
                                // Simple color intensity map based on magnitude
                                const opacity = Math.min(Math.abs(sec.change) / 2, 1);
                                
                                return (
                                    <div key={sec.name} className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] hover:bg-white/5 transition-colors group cursor-default border border-white/5 border-l-4" style={{ borderLeftColor: isPos ? `rgba(0,255,136,${opacity + 0.3})` : `rgba(255,51,102,${opacity + 0.3})` }}>
                                        <span className="text-gray-300 font-bold group-hover:text-white transition-colors text-sm">{sec.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden flex" style={{ justifyContent: isPos ? 'flex-start' : 'flex-end'}}>
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${Math.min(Math.abs(sec.change)*30, 100)}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full ${isPos ? 'bg-green-500' : 'bg-red-500'}`} 
                                                />
                                            </div>
                                            <span className={`text-xs font-bold w-12 text-right ${isPos ? 'text-green-400' : 'text-red-400'}`}>
                                                {isPos ? '+' : ''}{sec.change}%
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* SECTION 3: TOP MOVERS */}
                    <div>
                        <h2 className="text-lg font-bold text-gray-300 mb-4 px-1 uppercase tracking-widest flex items-center gap-2">
                            <Zap className="w-5 h-5 text-accent" /> Market Movers
                        </h2>
                        
                        <div className="flex gap-4">
                            {/* Gainers */}
                            <div className="flex-1 bg-gradient-to-b from-[#0d1117] to-[#161b22] border border-green-500/20 rounded-2xl p-4">
                                <h3 className="text-xs uppercase tracking-widest font-black text-green-400 mb-4 border-b border-green-500/20 pb-2">Top Gainers</h3>
                                <div className="space-y-4">
                                    {TOP_GAINERS.map(s => (
                                        <div key={s.sym} className="flex justify-between items-center group cursor-pointer">
                                            <div>
                                                <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{s.sym}</p>
                                                <p className="text-[10px] text-gray-500">₹{s.price}</p>
                                            </div>
                                            <div className="flex items-center text-green-400 text-sm font-black bg-green-500/10 px-2 py-0.5 rounded">
                                                <TrendingUp className="w-3 h-3 mr-1" /> +{s.change}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Losers */}
                            <div className="flex-1 bg-gradient-to-b from-[#0d1117] to-[#161b22] border border-red-500/20 rounded-2xl p-4">
                                <h3 className="text-xs uppercase tracking-widest font-black text-red-500 mb-4 border-b border-red-500/20 pb-2">Top Losers</h3>
                                <div className="space-y-4">
                                    {TOP_LOSERS.map(s => (
                                        <div key={s.sym} className="flex justify-between items-center group cursor-pointer">
                                            <div>
                                                <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{s.sym}</p>
                                                <p className="text-[10px] text-gray-500">₹{s.price}</p>
                                            </div>
                                            <div className="flex items-center text-red-400 text-sm font-black bg-red-500/10 px-2 py-0.5 rounded">
                                                <TrendingDown className="w-3 h-3 mr-1" /> {s.change}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
            
        </div>
    );
};

export default Markets;
