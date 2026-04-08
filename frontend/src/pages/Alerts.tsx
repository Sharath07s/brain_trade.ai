import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Activity, TrendingUp, TrendingDown, Newspaper, Zap, ChevronDown, CheckCircle2, ShieldAlert, AlertTriangle, Brain } from 'lucide-react';

// --- MOCK DATA --- //
const MOCK_ALERTS = [
    {
        id: 1,
        type: 'BUY',
        symbol: 'TCS',
        header: '🟢 BUY TCS',
        time: 'Just now',
        confidence: 94,
        reason: 'Strong volume breakout coupled with positive forward-guidance adjustments by major tier-1 analysts. Sentiments have shifted heavily bullish over the last 30 minutes.',
        news: [
            { id: 101, title: 'TCS reports surprise margin expansion in Q3', sentiment: 'Positive' },
            { id: 102, title: 'European tech spending signals robust recovery', sentiment: 'Positive' }
        ],
        tags: [
            { label: 'Sentiment: Positive', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { label: 'Impact: High ⚡', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { label: 'Type: News + Price', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        ]
    },
    {
        id: 2,
        type: 'SELL',
        symbol: 'RELIANCE',
        header: '🔴 SELL RELIANCE',
        time: '5 mins ago',
        confidence: 82,
        reason: 'Stock is dropping rapidly due to unexpected margin contraction inside the O2C business wing and a negative macro shift in crude prices. Sell-side pressure dominant.',
        news: [
            { id: 201, title: 'Reliance O2C margins face sudden compression', sentiment: 'Negative' },
            { id: 202, title: 'Brent crude slump puts pressure on refiners', sentiment: 'Negative' }
        ],
        tags: [
            { label: 'Sentiment: Negative', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
            { label: 'Impact: High ⚡', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { label: 'Type: News-based', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        ]
    },
    {
        id: 3,
        type: 'PRICE',
        symbol: 'INFY',
        header: '📉 PRICE DROP – INFY',
        time: '12 mins ago',
        confidence: 76,
        reason: 'Algorithmic trigger detected: Price fell below the 200 EMA key support level on heavy volume, accelerating a systematic sell-off.',
        news: [
            { id: 301, title: 'IT sector faces global slowdown concerns', sentiment: 'Negative' }
        ],
        tags: [
            { label: 'Sentiment: Neutral', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' },
            { label: 'Impact: Medium', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
            { label: 'Type: Technical', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' }
        ]
    },
    {
        id: 4,
        type: 'BUY',
        symbol: 'HDFCBANK',
        header: '📈 PRICE SURGE – HDFC',
        time: '34 mins ago',
        confidence: 88,
        reason: 'Unusual options activity detected indicating large institutional buying. Retail sentiment is aggressively attempting to front-run the momentum.',
        news: [
            { id: 401, title: 'FIIs turn net buyers in Indian banking sector', sentiment: 'Positive' },
            { id: 402, title: 'HDFC Bank hits 3-month resistance breakout', sentiment: 'Positive' }
        ],
        tags: [
            { label: 'Sentiment: Positive', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
            { label: 'Impact: High ⚡', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
            { label: 'Type: Price-based', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }
        ]
    }
];


const Alerts = () => {
    const [signalsActive, setSignalsActive] = useState(true);
    const [filter, setFilter] = useState<'ALL'|'BUY'|'SELL'|'PRICE'|'HIGH'>('ALL');
    const [alerts, setAlerts] = useState(MOCK_ALERTS);
    const [expandedIds, setExpandedIds] = useState<number[]>([1]); // Expand first by default

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'ALL') return true;
        if (filter === 'HIGH') return a.confidence > 80;
        if (filter === 'PRICE') return a.type === 'PRICE';
        return a.type === filter;
    });

    return (
        <div className="w-full min-h-screen pb-20 font-sans space-y-6">

            {/* --- TOP HEADER & SEARCH --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1117] border border-white/5 rounded-2xl p-4">
                
                {/* Status & Search */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-4 py-2 rounded-xl">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-bold text-green-400 tracking-wide">Live Alerts Active</span>
                    </div>

                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="Search stock (e.g. TCS, RELIANCE)..."
                            className="w-full bg-[#161b22] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Signals Toggle */}
                <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">Signals {signalsActive ? 'ON' : 'OFF'}</span>
                    <button 
                        onClick={() => setSignalsActive(!signalsActive)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${signalsActive ? 'bg-blue-600' : 'bg-gray-700'}`}
                    >
                        <motion.div 
                            layout
                            className={`w-4 h-4 rounded-full bg-white absolute top-1 ${signalsActive ? 'right-1' : 'left-1'}`}
                        />
                    </button>
                </div>
            </div>

            {/* --- HERO TITLE --- */}
            <div className="px-2">
                <h1 className="text-3xl font-black text-white flex items-center gap-3">
                    <Zap className="w-8 h-8 text-yellow-400" />
                    AI Alerts Strategy
                </h1>
                <p className="text-gray-400 mt-2 font-medium">Smart alerts that don't just notify — they analyze and explain the market.</p>
            </div>

            {/* --- FILTERS --- */}
            <div className="flex flex-wrap gap-3 px-2">
                {[
                    { id: 'ALL', label: 'All Alerts' },
                    { id: 'BUY', label: 'Buy Signals' },
                    { id: 'SELL', label: 'Sell Signals' },
                    { id: 'PRICE', label: 'Price Alerts' },
                    { id: 'HIGH', label: 'High Confidence (>80%)' },
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                            filter === f.id 
                                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30' 
                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* --- ALERTS FEED --- */}
            <div className="space-y-4">
                <AnimatePresence mode='popLayout'>
                    {filteredAlerts.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="bg-[#0d1117] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center"
                        >
                            <Bell className="w-12 h-12 text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400">No signals matching criteria.</h3>
                        </motion.div>
                    ) : (
                        filteredAlerts.map((alert, i) => {
                            const isBuy = alert.type === 'BUY' || alert.header.includes('SURGE');
                            const isSell = alert.type === 'SELL' || alert.header.includes('DROP');
                            const isExpanded = expandedIds.includes(alert.id);

                            return (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    key={alert.id}
                                    className={`bg-gradient-to-r ${
                                        isBuy ? 'from-green-500/5 to-[#0d1117]' :
                                        isSell ? 'from-red-500/5 to-[#0d1117]' :
                                        'from-blue-500/5 to-[#0d1117]'
                                    } border border-white/5 rounded-2xl overflow-hidden relative group`}
                                >
                                    {/* Accent Left Border */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${
                                        isBuy ? 'bg-green-500' : isSell ? 'bg-red-500' : 'bg-blue-500'
                                    }`} />

                                    {/* Main Card Header (Clickable) */}
                                    <div 
                                        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                                        onClick={() => toggleExpand(alert.id)}
                                    >
                                        <div className="flex items-center gap-4 pl-2">
                                            <div className={`p-3 rounded-xl bg-[#161b22] border ${
                                                isBuy ? 'border-green-500/20 shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 
                                                isSell ? 'border-red-500/20 shadow-[0_0_15px_rgba(255,51,102,0.1)]' : 
                                                'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                                            }`}>
                                                {isBuy ? <CheckCircle2 className="w-6 h-6 text-green-400" /> :
                                                 isSell ? <ShieldAlert className="w-6 h-6 text-red-500" /> :
                                                 <Activity className="w-6 h-6 text-blue-400" />}
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-black text-white tracking-tight">{alert.header}</h2>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1"><Bell className="w-3 h-3"/> {alert.time}</span>
                                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md border ${
                                                         alert.confidence > 85 ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                         alert.confidence > 75 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                         'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                                    }`}>
                                                        Confidence: {alert.confidence}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pr-2 hidden md:flex">
                                            <span className="text-sm font-bold text-blue-400">Why this alert?</span>
                                            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Expanded "Why this alert?" Section */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-5 border-t border-white/5 bg-[#0a0d14]/50 pl-7 pb-6 space-y-6">
                                                    
                                                    {/* Mini Indicator Tags */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {alert.tags.map((tag, idx) => (
                                                            <span key={idx} className={`text-xs font-bold px-3 py-1 rounded-lg border ${tag.color}`}>
                                                                {tag.label}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    {/* Explanation Text */}
                                                    <div className="flex gap-4 items-start">
                                                        <Brain className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
                                                        <div>
                                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1.5">AI Reasoning</h4>
                                                            <p className="text-gray-200 text-sm leading-relaxed">{alert.reason}</p>
                                                        </div>
                                                    </div>

                                                    {/* Related News Headlines */}
                                                    <div className="flex gap-4 items-start pt-2">
                                                        <Newspaper className="w-6 h-6 text-gray-500 mt-1 flex-shrink-0" />
                                                        <div className="w-full">
                                                            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Related News Catalysts</h4>
                                                            <div className="space-y-2">
                                                                {alert.news.map(n => (
                                                                    <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#161b22] px-4 py-3 rounded-xl border border-white/5">
                                                                        <span className="text-sm text-gray-300 font-medium">"{n.title}"</span>
                                                                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                                                                            n.sentiment === 'Positive' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
                                                                            n.sentiment === 'Negative' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                                                                            'text-gray-400 bg-gray-500/10 border-gray-500/20'
                                                                        }`}>
                                                                            {n.sentiment === 'Positive' ? '🟢 Positive' : n.sentiment === 'Negative' ? '🔴 Negative' : '⚪ Neutral'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>
            
        </div>
    );
};

export default Alerts;
