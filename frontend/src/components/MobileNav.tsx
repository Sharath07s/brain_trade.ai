import React from 'react';
import { Home, LineChart, Newspaper, Bell, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
    { to: '/dashboard', icon: Home, label: 'Home' },
    { to: '/markets', icon: LineChart, label: 'Markets' },
    { to: '/news', icon: Newspaper, label: 'News' },
    { to: '/alerts', icon: Bell, label: 'Alerts' },
    { to: '/settings', icon: Settings, label: 'Settings' },
];

const MobileNav = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px] ${
                                isActive
                                    ? 'text-accent'
                                    : 'text-gray-500 hover:text-gray-300'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`relative ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : ''}`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold tracking-wider ${isActive ? 'text-accent' : ''}`}>
                                    {label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
            {/* Safe area for notched devices */}
            <div className="h-[env(safe-area-inset-bottom)] bg-[#0d1117]" />
        </nav>
    );
};

export default MobileNav;
