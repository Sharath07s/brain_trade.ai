import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Zap, Loader2 } from 'lucide-react';
import { useGlobalContext } from '../context/GlobalContext';
import { useNavigate } from 'react-router-dom';
import { searchStocks } from '../services/api';

const Topbar = () => {
    const { setSymbol } = useGlobalContext();
    const navigate = useNavigate();
    
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounced search effect
    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length === 0) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await searchStocks(query.trim());
                setResults(data.results || []);
            } catch (err) {
                console.error("Search failed", err);
                setResults([]);
            }
            setLoading(false);
        };

        const timeoutId = setTimeout(fetchResults, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const executeSelection = (selectedSymbol: string) => {
        setSymbol(selectedSymbol); // Use context for now, or update URL
        navigate(`/dashboard/${selectedSymbol}`); 
        setShowDropdown(false);
        setQuery('');
        setActiveIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < results.length) {
                executeSelection(results[activeIndex].symbol);
            } else if (results.length > 0) {
                executeSelection(results[0].symbol);
            }
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (results.length > 0) {
            executeSelection(results[0].symbol);
        } else if (query.trim()) {
            executeSelection(query.trim().toUpperCase());
        }
    };

    return (
        <header className="h-20 w-full glass flex items-center justify-between px-6 md:px-10 sticky top-0 z-50">
            <div className="flex-1 max-w-2xl hidden md:block" ref={dropdownRef}>
                <form onSubmit={handleSearchSubmit} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-neutral group-focus-within:text-accent transition-colors" size={20} />
                    </div>
                    <input
                        type="text"
                        value={query}
                        autoComplete="off"
                        onFocus={() => setShowDropdown(true)}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setShowDropdown(true);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search ANY Global or Indian stock (e.g. RELIANCE, TSLA)"
                        className="w-full bg-panel border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-white placeholder-neutral focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 shadow-inner overflow-hidden"
                    />
                    {loading && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none animate-spin text-accent">
                            <Loader2 size={18} />
                        </div>
                    )}
                    
                    {/* Autocomplete Dropdown */}
                    {showDropdown && query.trim() && (
                        <div className="absolute mt-2 w-full bg-panel border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden z-50 max-h-96 overflow-y-auto">
                            {loading && results.length === 0 ? (
                                <div className="p-4 text-center text-neutral text-sm">Searching global equities...</div>
                            ) : results.length > 0 ? (
                                <ul>
                                    {results.map((r, i) => (
                                        <li 
                                            key={r.symbol}
                                            onClick={() => executeSelection(r.symbol)}
                                            onMouseEnter={() => setActiveIndex(i)}
                                            className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors border-b border-white/5 last:border-0 ${activeIndex === i ? 'bg-accent/10 border-l-2 border-l-accent' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-sm">{r.symbol}</span>
                                                <span className="text-xs text-neutral truncate max-w-[300px]">{r.name}</span>
                                            </div>
                                            <span className="text-[10px] uppercase bg-white/5 px-2 py-1 rounded text-neutral font-semibold">
                                                {r.exchange}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-4 text-center text-neutral text-sm">No stocks found matching '{query}'. Verify ticker symbol or search Yahoo Finance directly.</div>
                            )}
                        </div>
                    )}
                </form>
            </div>
            
            <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-2 bg-bullish/10 text-bullish px-3 py-1.5 rounded-full text-xs font-semibold border border-bullish/20">
                    <Zap size={14} /> Live Data Active
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                    <User className="text-neutral" size={20} />
                </div>
            </div>
        </header>
    );
};

export default Topbar;
