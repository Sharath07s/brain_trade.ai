import React from 'react';
import { Home, LineChart, Newspaper, Bell, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    return (
        <aside className="w-20 lg:w-64 h-screen glass border-r border-white/5 fixed left-0 top-0 flex flex-col pt-6 z-40 transition-all duration-300 hidden md:flex">
            <div className="flex items-center justify-center lg:justify-start lg:px-8 mb-10">
                <img src="/logo.png" alt="BrainTrade.AI" className="w-10 h-10 rounded-xl object-contain drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]" />
                <h1 className="ml-3 font-bold text-xl text-white hidden lg:block tracking-wide">BrainTrade<span className="text-accent">.AI</span></h1>
            </div>

            <nav className="flex-1 flex flex-col gap-2 px-4 mt-6">
                <NavItem to="/dashboard" icon={<Home size={22} />} label="Dashboard" />
                <NavItem to="/markets" icon={<LineChart size={22} />} label="Markets" />
                <NavItem to="/news" icon={<Newspaper size={22} />} label="News Sentiments" />
                <NavItem to="/alerts" icon={<Bell size={22} />} label="Alerts" />
                <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />
            </nav>

            <div className="mt-auto pb-8 hidden lg:flex flex-col items-center justify-center text-center px-4">
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">BrainTrade AI Core</p>
                <p className="text-[10px] text-gray-600 mt-1">v2.1.0-beta</p>
            </div>
        </aside>
    );
};

const NavItem = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => 
                `flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                    isActive 
                        ? 'bg-accent/10 border border-accent/20 text-accent shadow-[0_0_10px_rgba(0,240,255,0.1)]' 
                        : 'text-neutral hover:bg-white/5 hover:text-white border border-transparent'
                }`
            }
        >
            {({ isActive }) => (
                <motion.div
                    whileHover={{ x: isActive ? 0 : 5 }}
                    className="flex flex-row items-center w-full justify-center lg:justify-start relative"
                >
                    {icon}
                    <span className="ml-3 font-medium hidden lg:block">{label}</span>
                    {isActive && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(0,240,255,0.8)] hidden lg:block" />
                    )}
                </motion.div>
            )}
        </NavLink>
    );
};

export default Sidebar;
