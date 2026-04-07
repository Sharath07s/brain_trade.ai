import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, Filter } from 'lucide-react';
import { getNews } from '../services/api';
import { useGlobalContext } from '../context/GlobalContext';

const News = () => {
    const { symbol } = useGlobalContext();
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const data = await getNews(symbol);
                setNews(data.news || []);
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchNews();
    }, [symbol]);

    const filteredNews = news.filter(n => filter === 'All' || n.sentiment_label === filter);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Newspaper className="text-accent" /> News Sentiments ({symbol})
                </h1>

                <div className="flex items-center gap-2 glass px-2 py-1 rounded-xl">
                    <Filter size={16} className="text-neutral ml-2" />
                    {['All', 'Positive', 'Negative', 'Neutral'].map(f => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-neutral hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1,2,3,4].map(i => <div key={i} className="glass h-24 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : filteredNews.length === 0 ? (
                <div className="glass p-10 text-center rounded-3xl">
                    <p className="text-neutral">No {filter !== 'All' ? filter.toLowerCase() : ''} news found. Try a different symbol or filter.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredNews.map((item, i) => (
                        <motion.a 
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={i} 
                            className="glass p-6 rounded-2xl hover:bg-white/10 transition-all group block border border-transparent hover:border-white/10"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-xs text-neutral bg-white/5 py-1 px-3 rounded-full">{item.source}</span>
                                <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${item.sentiment_label === 'Positive' ? 'bg-bullish/20 text-bullish border border-bullish/30' : item.sentiment_label === 'Negative' ? 'bg-bearish/20 text-bearish border border-bearish/30' : 'bg-neutral/20 text-neutral border border-neutral/30'}`}>
                                    {item.sentiment_label} (Score: {item.sentiment_score})
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-accent transition-colors leading-snug">
                                {item.title}
                            </h3>
                            <p className="text-xs text-neutral mt-4">{new Date(item.created_at).toLocaleString()}</p>
                        </motion.a>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default News;
