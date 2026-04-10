import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Activity, Filter, Globe, Building2, Brain, Clock, Newspaper, ShieldAlert, BarChart3, TrendingDown, TrendingUp, RefreshCcw, Loader2 } from 'lucide-react';
import { getGeneralNews } from '../services/api';

const NewsSentimentDashboard = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<'All' | 'Positive' | 'Negative' | 'Neutral'>('All');
    const [highImpactOnly, setHighImpactOnly] = useState(false);
    const [newsFeed, setNewsFeed] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNews = async () => {
        try {
            setError(null);
            const data = await getGeneralNews();
            if (data && Array.isArray(data.news)) {
                setNewsFeed(data.news);
            }
        } catch (err: any) {
            console.error("News fetch error:", err);
            setError("Failed to load market intelligence. Backend may be offline.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchNews, 60000);
        return () => clearInterval(interval);
    }, []);

    // Compute overall market mood from fetched data
    const overallMood = (() => {
        if (newsFeed.length === 0) return 'Neutral';
        const avgSentiment = newsFeed.reduce((sum, n) => sum + (n.sentiment_score || 0), 0) / newsFeed.length;
        if (avgSentiment > 0.05) return 'Slightly Bullish';
        if (avgSentiment < -0.05) return 'Slightly Bearish';
        return 'Neutral';
    })();

    const topImpactHeadline = newsFeed.find(n => n.impact === 'High')?.title || newsFeed[0]?.title || 'Analyzing market signals...';

    // Apply Filters
    const filteredNews = newsFeed.filter(news => {
        const matchesSearch = news.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (news.related_symbol || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const sentiment = news.sentiment_label || 'Neutral';
        const matchesTab = activeTab === 'All' ? true : sentiment === activeTab;
        const matchesImpact = highImpactOnly ? news.impact === 'High' : true;

        return matchesSearch && matchesTab && matchesImpact;
    });

    return (
        <div className="w-full min-h-screen pb-20 text-gray-200 font-sans">
            
            {/* --- STICKY TOP HEADER --- */}
            <div className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 pt-6 pb-4 px-4 sm:px-8 shadow-sm">
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

                {/* --- INSIGHT STRIP --- */}
                <div className="max-w-4xl mx-auto mt-4 px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-bold tracking-wider uppercase">Market Mood:</span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10">
                            {overallMood.includes('Bearish') ? (
                                <TrendingDown className="w-4 h-4 text-orange-400" />
                            ) : overallMood.includes('Bullish') ? (
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                                <Activity className="w-4 h-4 text-blue-400" />
                            )}
                            <span className="font-semibold text-gray-300">{overallMood}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 truncate text-gray-400">
                        <Zap className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        <span className="truncate"><strong>Top Impact:</strong> {topImpactHeadline}</span>
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
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <RefreshCcw className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-gray-400 font-semibold tracking-wider uppercase text-sm">Aggregating Market Intelligence...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-red-500/5 rounded-2xl border border-red-500/20 p-8">
                            <ShieldAlert className="w-10 h-10 text-red-400" />
                            <p className="text-red-300 font-medium text-center">{error}</p>
                            <button onClick={() => { setLoading(true); fetchNews(); }} className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-300 font-bold transition-all border border-red-500/20">
                                Retry
                            </button>
                        </div>
                    ) : (
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
                                filteredNews.map((news, idx) => {
                                    const isPositive = news.sentiment_label === 'Positive';
                                    const isNegative = news.sentiment_label === 'Negative';
                                    const isHighImpact = news.impact === 'High';

                                    return (
                                        <motion.a
                                            key={`${news.title}-${idx}`}
                                            href={news.url !== '#' ? news.url : undefined}
                                            target="_blank"
                                            rel="noreferrer"
                                            layout
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                                            className="group relative block bg-[#12161f] border border-white/5 rounded-2xl p-5 sm:p-6 hover:bg-[#161b26] hover:border-white/10 transition-all hover:-translate-y-0.5"
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
                                                        <span className="flex items-center gap-1.5"><Newspaper className="w-3.5 h-3.5"/> {news.source || 'Market Intel'}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {news.created_at ? new Date(news.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
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
                                                            {news.sentiment_label || 'Neutral'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Headline */}
                                                <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-snug group-hover:text-blue-100 transition-colors">
                                                    {news.title}
                                                </h2>

                                                {/* AI Insight Bar */}
                                                {news.ai_insight && (
                                                    <div className="flex items-start gap-3 p-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                                        <Brain className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <div className="text-[10px] font-black text-blue-500/80 uppercase tracking-widest mb-0.5">Analyst Engine</div>
                                                            <p className="text-sm text-blue-100/80 leading-relaxed font-medium">"{news.ai_insight}"</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Footer Elements */}
                                                <div className="pt-2 flex flex-wrap items-center gap-2">
                                                    <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 rounded-full border border-white/5 flex items-center gap-1.5">
                                                        {news.category === 'Company' || news.category === 'Earnings' || news.category === 'Corporate Action' ? <Building2 className="w-3 h-3"/> :
                                                         news.category === 'Global Policy' ? <Globe className="w-3 h-3"/> : <BarChart3 className="w-3 h-3"/>}
                                                        {news.category || 'General'}
                                                    </span>
                                                    {news.related_symbol && (
                                                        <span className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600/20 border border-blue-500/30 rounded-full hover:bg-blue-600/40 cursor-pointer transition-colors">
                                                            ${news.related_symbol}
                                                        </span>
                                                    )}
                                                </div>

                                            </div>
                                        </motion.a>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NewsSentimentDashboard;
