import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Activity, Filter, Globe, Building2, Brain, Clock, Newspaper, ShieldAlert, BarChart3, TrendingDown } from 'lucide-react';

// --- RICH MOCK DATA FEED --- //
const NEWS_FEED = [
    {
        id: 1,
        headline: "TCS Reports Surprise Margin Expansion in Q3, Beating Street Estimates",
        source: "Bloomberg Finance",
        time: "12 mins ago",
        sentiment: "Positive",
        impact: "High",
        category: "Earnings",
        aiInsight: "Surprise margins hint at successful cost-optimization; expect immediate upward rerating across mid-cap IT sector peers.",
        relatedSymbols: ["TCS", "INFY"]
    },
    {
        id: 2,
        headline: "Reliance Extends Strategic Partnership with Aramco for Advanced Chemicals Facility",
        source: "Reuters",
        time: "45 mins ago",
        sentiment: "Positive",
        impact: "Medium",
        category: "Company",
        aiInsight: "Long-term bullish driver for O2C margins; likely to support price holding above crucial 2900 resistance band.",
        relatedSymbols: ["RELIANCE"]
    },
    {
        id: 3,
        headline: "Global Central Banks Signal Slower Rate Cuts Amid Stuck Inflation Data",
        source: "Financial Times",
        time: "1 hour ago",
        sentiment: "Negative",
        impact: "High",
        category: "Global Policy",
        aiInsight: "Hawkish macro shift directly pressures foreign inflows; expect sustained broad-market weakness and banking sector drag.",
        relatedSymbols: ["NIFTY 50", "BANKNIFTY"]
    },
    {
        id: 4,
        headline: "HDFC Bank Deposit Growth Moderates; Management Highlights Tight Liquidity",
        source: "CNBC TV18",
        time: "2 hours ago",
        sentiment: "Negative",
        impact: "High",
        category: "Economy",
        aiInsight: "Structural liquidity constraints will compress net interest margins; short-to-medium term bearish catalyst.",
        relatedSymbols: ["HDFCBANK", "ICICIBANK"]
    },
    {
        id: 5,
        headline: "EV Subsidy Extension Draft Circulated Among Select Automakers",
        source: "Mint",
        time: "3 hours ago",
        sentiment: "Positive",
        impact: "Medium",
        category: "Policy",
        aiInsight: "Policy tailwind for early EV adopters; Tata Motors remains technically primed for a breakout on confirmation.",
        relatedSymbols: ["TATAMOTORS", "M&M"]
    },
    {
        id: 6,
        headline: "Adani Enterprises successfully concludes $1.5B international bond issuance",
        source: "Economic Times",
        time: "5 hours ago",
        sentiment: "Neutral",
        impact: "Low",
        category: "Corporate Action",
        aiInsight: "Reduces immediate refinancing risks; minimal impact on daily trading structure as issuance was fully priced in.",
        relatedSymbols: ["ADANIENT"]
    }
];

const NewsSentimentDashboard = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'All' | 'Positive' | 'Negative' | 'Neutral'>('All');
    const [highImpactOnly, setHighImpactOnly] = useState(false);

    // Apply Filters
    const filteredNews = NEWS_FEED.filter(news => {
        const matchesSearch = news.headline.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              news.relatedSymbols.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesTab = activeTab === 'All' ? true : news.sentiment === activeTab;
        const matchesImpact = highImpactOnly ? news.impact === 'High' : true;

        return matchesSearch && matchesTab && matchesImpact;
    });

    return (
        <div className="w-full min-h-screen bg-[#07090e] pb-24 text-gray-200 font-sans">
            
            {/* --- STICKY TOP HEADER --- */}
            <div className="sticky top-0 z-40 bg-[#07090e]/80 backdrop-blur-xl border-b border-white/5 pt-6 pb-4 px-4 sm:px-8 shadow-sm">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Title & Live Badge */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Activity className="w-6 h-6 text-blue-500" />
                            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Market Intelligence</h1>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-green-400 tracking-widest uppercase">Live Feed</span>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-80 overflow-hidden group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search stocks (TCS, RELIANCE)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#161b22]/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium"
                        />
                    </div>
                </div>

                {/* --- OPTIONAL INSIGHT STRIP --- */}
                <div className="max-w-4xl mx-auto mt-4 px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold tracking-wider uppercase">Market Mood:</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                            <TrendingDown className="w-4 h-4 text-orange-400" />
                            <span className="font-semibold text-gray-300">Slightly Bearish</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 truncate text-gray-400">
                        <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="truncate"><strong>Top Impact:</strong> Global Central Banks Signal Slower Rate Cuts Amid Stuck Inflation Data</span>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT CONTAINER --- */}
            <div className="max-w-4xl mx-auto px-4 sm:px-8 mt-8">
                
                {/* --- FILTERS & TOGGLES --- */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 mb-6 border-b border-white/5 backdrop-blur-sm">
                    
                    {/* Sentiment Tabs */}
                    <div className="flex p-1 bg-[#161b22] border border-white/5 rounded-xl">
                        {(['All', 'Positive', 'Negative', 'Neutral'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                    activeTab === tab 
                                    ? 'bg-[#21262d] text-white shadow-md border border-white/5' 
                                    : 'text-gray-500 hover:text-gray-300'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* High Impact Toggle */}
                    <button 
                        onClick={() => setHighImpactOnly(!highImpactOnly)}
                        className={`flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full border transition-all ${
                            highImpactOnly 
                            ? 'bg-yellow-500/10 border-yellow-500/30' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                        <span className={`text-sm font-bold ${highImpactOnly ? 'text-yellow-400' : 'text-gray-400'}`}>High Impact Only</span>
                        <div className={`w-8 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                            highImpactOnly ? 'bg-yellow-500' : 'bg-gray-700'
                        }`}>
                            <motion.div 
                                layout
                                className="w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm"
                            >
                                {highImpactOnly && <Zap className="w-2.5 h-2.5 text-yellow-500" />}
                            </motion.div>
                        </div>
                    </button>
                </div>

                {/* --- NEWS FEED --- */}
                <div className="space-y-5">
                    <AnimatePresence mode="popLayout">
                        {filteredNews.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="w-full flex flex-col items-center justify-center py-20 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4">
                                    <Filter className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-300">No signals found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your filters or search criteria.</p>
                            </motion.div>
                        ) : (
                            filteredNews.map((news) => {
                                const isPositive = news.sentiment === 'Positive';
                                const isNegative = news.sentiment === 'Negative';
                                const isHighImpact = news.impact === 'High';

                                return (
                                    <motion.div
                                        key={news.id}
                                        layout
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2 }}
                                        className="group relative bg-[#12161f] border border-white/5 rounded-2xl p-5 sm:p-6 hover:bg-[#161b26] hover:border-white/10 transition-all hover:-translate-y-0.5"
                                    >
                                        {/* Left Accent Bar */}
                                        <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-2xl ${
                                            isPositive ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                                            isNegative ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' :
                                            'bg-gray-500'
                                        }`} />

                                        {/* Content Wrapper */}
                                        <div className="pl-3 sm:pl-4 space-y-4">
                                            
                                            {/* Meta Header */}
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                    <span className="flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5"/> {news.source}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {news.time}</span>
                                                </div>
                                                
                                                {/* Sentiment & Impact Badges */}
                                                <div className="flex items-center gap-2">
                                                    {isHighImpact && (
                                                        <span className="flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                                                            <ShieldAlert className="w-3 h-3" /> HIGH IMPACT
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-md bg-[#0d1117] border border-white/5">
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            isPositive ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' :
                                                            isNegative ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]' :
                                                            'bg-gray-400'
                                                        }`} />
                                                        {news.sentiment}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Headline */}
                                            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug group-hover:text-blue-100 transition-colors">
                                                {news.headline}
                                            </h2>

                                            {/* AI Insight Bar */}
                                            <div className="flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                                <Brain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-0.5">Analyst Engine</div>
                                                    <p className="text-sm text-blue-100/80 leading-relaxed font-medium">"{news.aiInsight}"</p>
                                                </div>
                                            </div>

                                            {/* Footer Elements */}
                                            <div className="pt-2 flex flex-wrap items-center gap-2">
                                                <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 rounded-full border border-white/5 flex items-center gap-1.5">
                                                    {news.category === 'Company' || news.category === 'Earnings' || news.category === 'Corporate Action' ? <Building2 className="w-3 h-3"/> :
                                                     news.category === 'Global Policy' ? <Globe className="w-3 h-3"/> : <BarChart3 className="w-3 h-3"/>}
                                                    {news.category}
                                                </span>
                                                {news.relatedSymbols.map(sym => (
                                                    <span key={sym} className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600/20 border border-blue-500/30 rounded-full hover:bg-blue-600/40 cursor-pointer transition-colors">
                                                        ${sym}
                                                    </span>
                                                ))}
                                            </div>

                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default NewsSentimentDashboard;
