import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Flame, Brain, BarChart2, LayoutGrid, Clock } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { getMarketIndices, getIndianGrowthStocks } from '../services/api';

const generateSparkline = (points: number, trend: 'up'|'down'|'neutral') => {
    let current = 100;
    return Array.from({ length: points }).map(() => {
        const drift = trend === 'up' ? 0.5 : trend === 'down' ? -0.5 : 0;
        const noise = (Math.random() - 0.5) * 5;
        current = current + drift + noise;
        return { val: current };
    });
};

const SECTORS = [
    { name: 'Banking', change: 1.45 },
    { name: 'Energy', change: 1.20 },
    { name: 'Metal', change: 0.85 },
    { name: 'Auto', change: 0.25 },
    { name: 'FMCG', change: -0.15 },
    { name: 'Pharma', change: -0.40 },
    { name: 'IT', change: -0.95 }
];

const SkeletonCard = ({ className = "" }) => (
    <div className={`bg-[#0d1117] border border-white/5 rounded-2xl p-5 relative overflow-hidden animate-pulse ${className}`}>
        <div className="w-1/2 h-6 bg-white/10 rounded mb-2"></div>
        <div className="w-1/3 h-4 bg-white/10 rounded mb-4"></div>
        <div className="flex justify-between items-end mt-6">
            <div className="w-1/4 h-8 bg-white/10 rounded"></div>
            <div className="w-1/4 h-8 bg-white/10 rounded"></div>
        </div>
    </div>
);

const Markets = () => {
    const [trendingData, setTrendingData] = useState<any[]>([]);
    const [indicesData, setIndicesData] = useState<any[]>([]);
    const [marketStatus, setMarketStatus] = useState<string>("LOADING");
    const [loadingIndices, setLoadingIndices] = useState(true);
    const [loadingGrowth, setLoadingGrowth] = useState(true);
    
    useEffect(() => {
        const fetchIndices = async () => {
            try {
                const data = await getMarketIndices();
                if (data && Array.isArray(data.indices)) {
                    setIndicesData(data.indices.map((idx: any) => ({
                        name: idx.name,
                        val: idx.price,
                        change: parseFloat(idx.change_percent).toFixed(2),
                        spark: generateSparkline(20, idx.change >= 0 ? 'up' : 'down')
                    })));
                    setMarketStatus(data.market_status || "UNKNOWN");
                }
            } catch (error) {
                console.error("Error fetching market indices", error);
            } finally {
                setLoadingIndices(false);
            }
        };

        const fetchGrowth = async () => {
            try {
                const data = await getIndianGrowthStocks();
                if (data && Array.isArray(data.top_growth)) {
                    setTrendingData(data.top_growth.map((t: any) => ({
                        sym: t.sym,
                        name: t.name,
                        price: parseFloat(t.price),
                        change: parseFloat(t.change_percentage).toFixed(2),
                        vol: t.vol,
                        trend: t.trend,
                        tag: t.tag,
                        spark: generateSparkline(30, parseFloat(t.change_amount) >= 0 ? 'up' : 'down')
                    })));
                } else if (data && data.error) {
                    console.error("Indian Growth API Error:", data.error);
                }
            } catch (error) {
                console.error("Error fetching indian growth stocks", error);
            } finally {
                setLoadingGrowth(false);
            }
        };

        fetchIndices();
        fetchGrowth();
    }, []);

    const formatINR = (val: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    return (
        <div className="w-full min-h-screen pb-20 space-y-8 font-sans">
            
            {/* --- SECTION 5: AI INSIGHT BAR --- */}
            <motion.div 
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="w-full bg-[#161b22]/80 backdrop-blur-md border border-blue-500/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                        <Brain className="w-4 h-4" />
                        <span className="text-sm">AI Market Mood: {marketStatus === 'OPEN' ? 'Live Data Tracking' : marketStatus === 'CLOSED' ? 'Market Closed' : 'Identifying Patterns...'}</span>
                    </div>
                </div>
            </motion.div>

            {/* --- SECTION 1: BENCHMARK INDICES --- */}
            <motion.div className="mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-lg font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-accent" /> Benchmark Indices (India)
                    </h2>
                    {marketStatus === "CLOSED" && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20 px-2 py-1 rounded">
                            <Clock className="w-3.5 h-3.5" /> MARKET CLOSED
                        </div>
                    )}
                </div>
                <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                    {loadingIndices ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="min-w-[200px] flex-shrink-0 h-[140px] bg-[#0d1117] border border-white/5 rounded-2xl p-4 animate-pulse">
                                <div className="w-16 h-4 bg-white/10 rounded mb-4"></div>
                                <div className="w-24 h-6 bg-white/10 rounded mb-2"></div>
                                <div className="w-12 h-4 bg-white/10 rounded"></div>
                            </div>
                        ))
                    ) : indicesData.length > 0 ? (
                        indicesData.map((idx) => {
                            const isUp = parseFloat(idx.change) >= 0;
                            return (
                                <motion.div 
                                    key={idx.name}
                                    whileHover={{ scale: 1.02 }}
                                    className={`min-w-[200px] flex-shrink-0 bg-[#0d1117] border rounded-2xl p-4 relative overflow-hidden transition-all duration-300 ${isUp ? 'border-green-500/20 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)]' : 'border-red-500/20 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(255,51,102,0.1)]'}`}
                                >
                                    <div className={`absolute top-0 right-0 w-24 h-24 blur-[40px] rounded-full pointer-events-none ${isUp ? 'bg-green-500/10' : 'bg-red-500/10'}`} />
                                    <div className="relative z-10">
                                        <h3 className="text-gray-400 font-bold text-sm tracking-wide">{idx.name}</h3>
                                        <div className="flex items-end gap-2 mt-1">
                                            <span className="text-xl font-black text-white">{idx.val.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                            {isUp ? '+' : ''}{idx.change}%
                                        </div>
                                    </div>
                                    <div className="h-12 w-full mt-2 relative z-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={idx.spark}>
                                                <Area type="monotone" dataKey="val" stroke={isUp ? '#00E676' : '#FF1744'} strokeWidth={2} fillOpacity={0} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </motion.div>
                            )
                        })
                    ) : (
                        <p className="text-gray-500 text-sm ml-2">Failed to load market indices.</p>
                    )}
                </div>
            </motion.div>

            {/* --- CORE GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
                
                {/* LEFT COL: SECTION 2 (Trending) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                            <Flame className="w-7 h-7 text-orange-500 animate-pulse" /> 
                            Top Growth Stocks (India)
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loadingGrowth ? (
                            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                        ) : trendingData.length > 0 ? (
                            trendingData.map((stock, i) => {
                                const isPulsing = i < 2;
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
                                                    <p className="text-xl font-bold tracking-tight text-white mb-1 truncate max-w-[140px]">
                                                        {formatINR(stock.price)}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${parseFloat(stock.change) >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {parseFloat(stock.change) >= 0 ? '+' : ''}{stock.change}%
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
                                                    {stock.tag || stock.trend}
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
                                                            stroke={parseFloat(stock.change) >= 0 ? '#00E676' : '#FF1744'} 
                                                            strokeWidth={2} fill={parseFloat(stock.change) >= 0 ? '#00E676' : '#FF1744'} fillOpacity={0.1}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </motion.div>
                                )
                            })
                        ) : (
                            <p className="text-gray-500 col-span-2 text-center py-10">No growth stocks found or error fetching data.</p>
                        )}
                    </div>
                </div>

                {/* RIGHT COL: SECTION 4 */}
                <div className="space-y-8 lg:mt-0 mt-8">
                    <div>
                        <h2 className="text-lg font-bold text-gray-300 mb-4 px-1 uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-accent" /> Sector Heatmap
                        </h2>
                        <div className="bg-[#0d1117] border border-white/5 rounded-2xl p-4 space-y-2">
                            {SECTORS.sort((a,b) => b.change - a.change).map((sec) => {
                                const isPos = sec.change >= 0;
                                const opacity = Math.min(Math.abs(sec.change) / 2, 1);
                                return (
                                    <div key={sec.name} className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] hover:bg-white/5 transition-colors group cursor-default border border-white/5 border-l-4" style={{ borderLeftColor: isPos ? `rgba(0,255,136,${opacity + 0.3})` : `rgba(255,51,102,${opacity + 0.3})` }}>
                                        <span className="text-gray-300 font-bold group-hover:text-white transition-colors text-sm">{sec.name}</span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden flex" style={{ justifyContent: isPos ? 'flex-start' : 'flex-end'}}>
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${Math.min(Math.abs(sec.change)*30, 100)}%` }}
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
                </div>
            </div>
            
        </div>
    );
};

export default Markets;
