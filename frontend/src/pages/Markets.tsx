import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getStock } from '../services/api';
import { TrendingUp, TrendingDown, LayoutGrid, Search } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const SYMBOLS = ['TSLA', 'NVDA', 'AAPL', 'AMZN', 'MSFT'];

const Markets = () => {
    const [stocks, setStocks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const results = await Promise.all(SYMBOLS.map(sym => getStock(sym)));
                setStocks(results.filter(r => !r.error));
            } catch (error) {
                console.error("Failed to load markets");
            }
            setLoading(false);
        };
        fetchAll();
    }, []);

    const filtered = stocks.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LayoutGrid className="text-accent" /> Market Overview</h1>
                
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral" size={18} />
                    <input 
                        type="text" 
                        placeholder="Filter markets..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:outline-none focus:border-accent"
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1,2,3].map(i => <div key={i} className="glass h-48 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((stock, i) => {
                        const isGain = stock.current_price >= (stock.open || stock.current_price);
                        const pctGain = (((stock.current_price - stock.open)/stock.open)*100).toFixed(2);
                        
                        return (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                key={stock.symbol} 
                                className="glass p-6 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{stock.symbol}</h3>
                                        <p className="text-xs text-neutral truncate max-w-[150px]">{stock.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-white">${stock.current_price?.toFixed(2)}</p>
                                        <p className={`text-sm font-semibold flex items-center justify-end ${isGain ? 'text-bullish' : 'text-bearish'}`}>
                                            {isGain ? <TrendingUp size={14} className="mr-1"/> : <TrendingDown size={14} className="mr-1"/>}
                                            {pctGain}%
                                        </p>
                                    </div>
                                </div>
                                <div className="h-16 w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stock.history || []}>
                                            <Area 
                                                type="monotone" 
                                                dataKey="close" 
                                                stroke={isGain ? '#00ff88' : '#ff3366'} 
                                                strokeWidth={2} 
                                                fillOpacity={0.1} 
                                                fill={isGain ? '#00ff88' : '#ff3366'} 
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

export default Markets;
