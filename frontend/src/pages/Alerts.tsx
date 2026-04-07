import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';
import { getPrediction } from '../services/api';
import { useGlobalContext } from '../context/GlobalContext';

// Keep alerts across navigation using a module-level variable for simplicity, 
// or optimally in a global state manager (like Zustand). 
// We mock persistence here just for the active session.
let alertHistory: any[] = [];

const Alerts = () => {
    const { symbol } = useGlobalContext();
    const [loading, setLoading] = useState(false);
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [history, setHistory] = useState<any[]>(alertHistory);

    useEffect(() => {
        const fetchAlert = async () => {
            if (!alertsEnabled) return;
            setLoading(true);
            try {
                const data = await getPrediction(symbol);
                const newAlert = {
                    id: Date.now(),
                    symbol: symbol,
                    type: data.prediction,
                    confidence: data.confidence,
                    reasons: data.explanations,
                    time: new Date().toLocaleTimeString()
                };
                
                // Avoid strict duplicates back-to-back
                if (history.length === 0 || history[0].symbol !== symbol || history[0].type !== data.prediction) {
                     const updated = [newAlert, ...history].slice(0, 10);
                     alertHistory = updated;
                     setHistory(updated);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        
        fetchAlert();
        
        // Mock a poll
        const interval = setInterval(fetchAlert, 60000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, alertsEnabled]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
            <div className="flex justify-between items-center glass p-6 rounded-3xl">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bell className="text-accent" /> AI Alerts Strategy</h1>
                    <p className="text-neutral text-sm mt-1">Autonomous trading signals based on real-time multi-factor models.</p>
                </div>
                
                <div className="flex items-center gap-3 bg-panel p-2 rounded-xl border border-white/5">
                    <span className={`text-sm font-medium ${alertsEnabled ? 'text-white' : 'text-neutral'}`}>Signals Active</span>
                    <button 
                        onClick={() => setAlertsEnabled(!alertsEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative ${alertsEnabled ? 'bg-accent' : 'bg-white/10'}`}
                    >
                        <motion.div 
                            animate={{ x: alertsEnabled ? 24 : 2 }} 
                            className="w-5 h-5 bg-white rounded-full absolute top-0.5" 
                        />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {history.length === 0 && !loading ? (
                    <div className="glass p-10 text-center rounded-3xl text-neutral">No historical alerts available for session.</div>
                ) : (
                    history.map((alert, i) => (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={alert.id}
                            className={`glass p-6 rounded-2xl border-l-4 relative overflow-hidden ${alert.type === 'UP' ? 'border-l-bullish' : alert.type === 'DOWN' ? 'border-l-bearish' : 'border-l-accent'}`}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                <Cpu size={100} />
                            </div>
                            
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3 mb-2">
                                    {alert.type === 'UP' ? <CheckCircle2 className="text-bullish" /> : alert.type === 'DOWN' ? <ShieldAlert className="text-bearish" /> : <Bell className="text-accent"/>}
                                    <h3 className="text-xl font-bold text-white">
                                        {alert.type === 'UP' ? 'BUY' : alert.type === 'DOWN' ? 'SELL' : 'HOLD'} {alert.symbol}
                                    </h3>
                                    <span className="text-xs bg-white/10 px-2 py-1 rounded-lg text-white">Confidence: {alert.confidence}%</span>
                                </div>
                                <span className="text-sm text-neutral">{alert.time}</span>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {alert.reasons.map((r: string, idx: number) => (
                                    <p key={idx} className="text-sm text-neutral flex items-start gap-2">
                                        <span className="text-accent mt-1">•</span> {r}
                                    </p>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    );
};

export default Alerts;
