import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Moon, Sun, Bell, Database, Key } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';

// Simple mock store
const MOCK_DB = {
    apiKey: '',
    notifications: true,
    preferredStocks: 'TSLA, NVDA, AAPL'
};

const Settings = () => {
    const { theme, setTheme } = useGlobalContext();
    const [prefs, setPrefs] = useState(MOCK_DB);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-8"><SettingsIcon className="text-accent" /> Preferences</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Appearance */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Appearance</h2>
                    
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-white font-medium">Theme</p>
                            <p className="text-sm text-neutral">Toggle dark or light mode</p>
                        </div>
                        <button 
                            onClick={toggleTheme}
                            className="bg-panel border border-white/5 p-3 rounded-xl hover:bg-white/5 transition-colors"
                        >
                            {theme === 'dark' ? <Moon className="text-accent" /> : <Sun className="text-accent" />}
                        </button>
                    </div>
                    
                    <hr className="border-white/5" />
                    
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-white font-medium">Alert Notifications</p>
                            <p className="text-sm text-neutral">Receive browser toast alerts</p>
                        </div>
                        <button 
                            onClick={() => setPrefs({...prefs, notifications: !prefs.notifications})}
                            className={`w-12 h-6 rounded-full transition-colors relative ${prefs.notifications ? 'bg-accent' : 'bg-white/10'}`}
                        >
                            <motion.div 
                                animate={{ x: prefs.notifications ? 24 : 2 }} 
                                className="w-5 h-5 bg-white rounded-full absolute top-0.5" 
                            />
                        </button>
                    </div>
                </div>

                {/* API & Data */}
                <div className="glass p-8 rounded-3xl space-y-6">
                    <h2 className="text-xl font-bold text-white mb-4">Data Integrations</h2>
                    
                    <div>
                        <label className="block text-white font-medium mb-2 flex items-center gap-2">
                            <Key size={16} className="text-neutral" /> Custom API Key (Optional)
                        </label>
                        <input 
                            type="password" 
                            value={prefs.apiKey}
                            onChange={(e) => setPrefs({...prefs, apiKey: e.target.value})}
                            placeholder="Enter AlphaVantage/NewsAPI key"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-neutral focus:outline-none focus:border-accent"
                        />
                        <p className="text-xs text-neutral mt-2">Overwrites global mock endpoints if provided.</p>
                    </div>

                    <hr className="border-white/5" />

                    <div>
                        <label className="block text-white font-medium mb-2 flex items-center gap-2">
                            <Database size={16} className="text-neutral" /> Preferred Watchlist
                        </label>
                        <input 
                            type="text" 
                            value={prefs.preferredStocks}
                            onChange={(e) => setPrefs({...prefs, preferredStocks: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white placeholder-neutral focus:outline-none focus:border-accent"
                        />
                    </div>
                    
                    <button className="w-full bg-accent text-panel font-bold py-3 rounded-xl hover:bg-accent_hover transition-colors shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        Save Preferences
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default Settings;
