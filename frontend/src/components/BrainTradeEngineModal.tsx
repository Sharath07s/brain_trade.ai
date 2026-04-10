import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, AlertCircle, RefreshCcw, TrendingUp, TrendingDown, Target, ShieldAlert, Globe } from 'lucide-react';
import { getPrediction } from '../services/api';

interface BrainTradeEngineModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    stockName: string;
    isMarketOpen: boolean;
}

const BrainTradeEngineModal: React.FC<BrainTradeEngineModalProps> = ({ 
    isOpen, 
    onClose, 
    symbol, 
    stockName,
    isMarketOpen 
}) => {
    const [prediction, setPrediction] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

    useEffect(() => {
        // Check if disclaimer was already accepted
        const accepted = localStorage.getItem('brainTradeDisclaimerAccepted');
        if (accepted === 'true') {
            setDisclaimerAccepted(true);
        }
    }, [isOpen]);

    const handleAcceptDisclaimer = () => {
        localStorage.setItem('brainTradeDisclaimerAccepted', 'true');
        setDisclaimerAccepted(true);
        if (!prediction) fetchPrediction(); // Kick off fetch explicitly once accepted
    };

    const fetchPrediction = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPrediction(symbol);
            if (data && data.prediction) {
                setPrediction(data);
            } else {
                setError('Failed to resolve AI insights structure.');
            }
        } catch (err: any) {
            setError(err?.message || 'Failed to fetch AI insights. Real-world API rate limit reached or backend offline.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && disclaimerAccepted) {
            setPrediction(null); // Clear old data on symbol change
            fetchPrediction();
        }
        
        // Auto refresh every 15 seconds if open and market is active
        let interval: any;
        if (isOpen && disclaimerAccepted && isMarketOpen) {
             interval = setInterval(() => {
                 fetchPrediction();
             }, 15000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, disclaimerAccepted, symbol, isMarketOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
                <div 
                   className="absolute inset-0 w-full h-full pointer-events-none" 
                   onClick={onClose} 
                />

                <motion.div 
                    initial={{ y: 50, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: 20, opacity: 0, scale: 0.95 }}
                    className="relative w-full max-w-4xl bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col max-h-[90vh]"
                >
                    {/* Glowing Accent Ring */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none" />

                    {!disclaimerAccepted ? (
                        <div className="p-10 flex flex-col items-center justify-center text-center relative z-10 h-[500px]">
                            <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 border border-yellow-500/30">
                                <AlertCircle className="w-8 h-8 text-yellow-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4">Brain Trade Engine Disclaimer</h2>
                            <p className="text-gray-300 max-w-xl leading-relaxed mb-8">
                                <span className="font-bold text-white">⚠️ Disclaimer:</span> The Brain Trade Engine provides AI-based predictions for intraday trading using real-world data such as price trends, trading volume, news sentiment, social sentiment, and market indicators. These predictions are probabilistic and do not guarantee future performance. This platform does not provide financial advice. Users must conduct their own research and are fully responsible for their investment decisions.
                            </p>
                            <div className="flex gap-4 w-full max-w-sm">
                                <button 
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-300 font-semibold hover:bg-white/5 transition-all"
                                >
                                    Go Back
                                </button>
                                <button 
                                    onClick={handleAcceptDisclaimer}
                                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                                >
                                    Accept & Continue
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        <Brain className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-white tracking-tight">Brain Trade Engine</h2>
                                            <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(0,255,136,0.1)]">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(0,255,136,0.8)]"></span>
                                                <span className="text-[10px] font-bold text-green-400 tracking-wider">LIVE AI ACTIVE</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 font-medium mt-0.5">Intraday AI Core  |  {stockName}</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content Body */}
                            <div className="p-6 overflow-y-auto flex-1 relative z-10 hide-scrollbar">
                                {loading && !prediction ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-400">
                                        <RefreshCcw className="w-10 h-10 animate-spin text-blue-500" />
                                        <span className="font-semibold tracking-wider uppercase text-sm">Aggregating Macro Vectors...</span>
                                    </div>
                                ) : error ? (
                                    <div className="h-64 flex flex-col items-center justify-center gap-4 text-red-400 bg-red-500/5 rounded-2xl border border-red-500/20 p-6">
                                        <AlertCircle className="w-10 h-10" />
                                        <p className="text-center max-w-sm">{error}</p>
                                        <button onClick={fetchPrediction} className="mt-4 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-300 font-bold transition-all">Retry Computation</button>
                                    </div>
                                ) : prediction && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* Left Column: Direct Output */}
                                        <div className="flex flex-col gap-6">
                                            
                                            {/* Primary Prediction Sphere */}
                                            <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none transition-all group-hover:bg-blue-500/20" />
                                                
                                                <h3 className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-6 w-full text-left">Market Vector</h3>
                                                
                                                <div className="relative flex items-center justify-center w-48 h-48 mb-4">
                                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                                        <circle cx="96" cy="96" r="84" fill="none" stroke="#ffffff08" strokeWidth="16" />
                                                        <motion.circle 
                                                            initial={{ strokeDasharray: "0 1000" }}
                                                            animate={{ strokeDasharray: `${(prediction?.confidence || 0) * 5.27} 1000` }}
                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                            cx="96" cy="96" r="84" fill="none" 
                                                            stroke={prediction?.prediction === 'UP' ? '#00E676' : prediction?.prediction === 'DOWN' ? '#FF1744' : '#00E5FF'} 
                                                            strokeWidth="16" 
                                                            strokeLinecap="round" 
                                                            className="shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                                                        />
                                                    </svg>
                                                    <div className="flex flex-col items-center justify-center text-center">
                                                        <p className={`text-4xl font-black tracking-tighter ${prediction?.prediction === 'UP' ? 'text-bullish drop-shadow-[0_0_10px_rgba(0,255,136,0.5)]' : prediction?.prediction === 'DOWN' ? 'text-bearish drop-shadow-[0_0_10px_rgba(255,51,102,0.5)]' : 'text-blue-400 drop-shadow-[0_0_10px_rgba(0,200,255,0.5)]'}`}>
                                                            {prediction?.prediction || 'N/A'}
                                                        </p>
                                                        <p className="text-xs text-white/50 mt-1 font-medium">{prediction?.confidence}% Conviction</p>
                                                    </div>
                                                </div>

                                                {/* Bullish vs Bearish Confidence Bars */}
                                                <div className="w-full mt-2 space-y-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-green-400 font-bold">▲ Bullish</span>
                                                        <span className="text-green-400 font-bold">{prediction?.bull_confidence ?? 50}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${prediction?.bull_confidence ?? 50}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full shadow-[0_0_8px_rgba(0,255,136,0.4)]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-red-400 font-bold">▼ Bearish</span>
                                                        <span className="text-red-400 font-bold">{prediction?.bear_confidence ?? 50}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${prediction?.bear_confidence ?? 50}%` }}
                                                            transition={{ duration: 1, ease: 'easeOut' }}
                                                            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full shadow-[0_0_8px_rgba(255,51,102,0.4)]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* AI Trading Signals Box */}
                                            <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-1">Execution Signal</h3>
                                                    <p className="text-xs text-gray-500">Derivative AI Recommendation</p>
                                                </div>
                                                <div className={`px-5 py-2.5 rounded-xl font-bold tracking-widest uppercase border ${
                                                    prediction?.trade_signal?.includes('BUY') ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-[0_0_15px_rgba(0,255,136,0.2)]' : 
                                                    prediction?.trade_signal?.includes('SELL') ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(255,51,102,0.2)]' : 
                                                    'bg-gray-500/10 text-gray-400 border-gray-500/30'
                                                }`}>
                                                    {prediction?.trade_signal || 'HOLD'}
                                                </div>
                                            </div>

                                             {/* Risk Score */}
                                             <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <ShieldAlert className={`w-8 h-8 ${prediction?.risk_profile === 'HIGH' ? 'text-red-400' : prediction?.risk_profile === 'LOW' ? 'text-green-400' : 'text-yellow-400'}`} />
                                                    <div>
                                                        <h3 className="text-sm text-gray-400 font-semibold uppercase tracking-widest">Risk Profile</h3>
                                                        <p className="text-xs text-gray-500">Volatility & Convergence</p>
                                                    </div>
                                                </div>
                                                <p className={`text-lg font-black uppercase ${prediction?.risk_profile === 'HIGH' ? 'text-red-400' : prediction?.risk_profile === 'LOW' ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {prediction?.risk_profile || 'MEDIUM'}
                                                </p>
                                            </div>

                                        </div>

                                        {/* Right Column: Reasoning & Macro */}
                                        <div className="flex flex-col gap-6">
                                            
                                            {/* Macro Factors Breakdown */}
                                            <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6">
                                                 <div className="flex items-center gap-2 mb-4">
                                                     <Globe className="w-5 h-5 text-blue-400" />
                                                     <h3 className="text-sm text-white font-semibold uppercase tracking-widest">Data Factors (Transparency)</h3>
                                                 </div>
                                                 
                                                 <div className="space-y-4 text-sm mt-4">
                                                    {prediction?.shap_features && Object.entries(prediction.shap_features).map(([key, value]: [string, any], idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                                                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">{key}</span>
                                                            <span className={`font-bold ${String(value).includes('+') ? 'text-bullish' : String(value).includes('0.0') ? 'text-gray-400' : 'text-bearish'}`}>
                                                                {value}
                                                            </span>
                                                        </div>
                                                    ))}
                                                 </div>
                                            </div>

                                            {/* Macro Catalysts (LLM Extracted) */}
                                            {prediction?.macro_factors && prediction.macro_factors.length > 0 && (
                                                <div className="bg-[#161b22] border border-blue-500/10 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none" />
                                                    <h3 className="text-sm text-blue-400 font-semibold uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                                        <Globe className="w-4 h-4" /> Global Macro Catalysts
                                                    </h3>
                                                    <ul className="space-y-3 relative z-10">
                                                        {prediction.macro_factors.map((catalyst: string, idx: number) => (
                                                            <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                                                                <span className="text-blue-500 mt-1">•</span> {catalyst}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Explanations List */}
                                            <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6 flex-1 flex flex-col">
                                                 <h3 className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                                                     <Target className="w-4 h-4 text-blue-400" /> SHAP Catalyst Insights
                                                 </h3>
                                                 <div className="space-y-3 flex-1 overflow-y-auto hide-scrollbar pr-2">
                                                    {prediction?.explanations?.map((reason: string, idx: number) => (
                                                        <motion.div 
                                                            key={idx}
                                                            initial={{ x: 20, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            transition={{ delay: 0.1 * idx }}
                                                            className="text-sm text-gray-300 leading-relaxed p-4 bg-white/5 rounded-xl border border-white/5 border-l-4 border-l-blue-500 shadow-md"
                                                        >
                                                            {reason}
                                                        </motion.div>
                                                    ))}
                                                 </div>
                                            </div>

                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BrainTradeEngineModal;
