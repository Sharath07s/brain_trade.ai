import React from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div className="min-h-screen bg-background flex">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-20 lg:ml-64 transition-all overflow-x-hidden">
                <Topbar />
                <main className="p-6 md:p-10 flex-1 w-full max-w-7xl mx-auto space-y-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
