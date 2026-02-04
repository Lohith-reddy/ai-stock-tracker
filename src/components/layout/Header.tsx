'use client';

import { useStore } from '@/store/useStore';
import { RefreshCw, Search, Bell, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clsx } from 'clsx';

export default function Header() {
    const { lastUpdated, isRefreshing, refreshData, loadInitialData, error } = useStore();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        loadInitialData(); // Load data on mount (no inference, just fetch)
    }, [loadInitialData]);

    // Format time - only display if mounted and lastUpdated exists
    const timeString = mounted && lastUpdated
        ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '...';

    return (
        <header className="sticky top-0 z-40 w-full glass border-b border-white/10 px-8 py-4 flex items-center justify-between backdrop-blur-md">
            {/* Search / Breadcrumb Placeholder */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-64 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                    <input
                        type="text"
                        placeholder="Search stocks..."
                        className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all placeholder:text-gray-600 hover:bg-white/10"
                    />
                </div>

                {/* Error indicator */}
                {error && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs text-amber-500">{error}</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-xs text-gray-400">Last Updated:</span>
                    <span className="text-xs font-mono text-neon-cyan">{timeString}</span>
                </div>

                <button
                    onClick={() => refreshData(false)}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan hover:bg-neon-cyan/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_0_10px_rgba(0,240,255,0.1)] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                    title="Refresh stock data"
                >
                    <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
                    <span className="text-sm font-medium">Refresh</span>
                </button>

                <button className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-bright-red rounded-full ring-2 ring-black animate-pulse"></span>
                </button>

                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-neon-cyan to-emerald-green p-[2px] cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-shadow">
                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center">
                        <span className="text-xs font-bold text-white">AI</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

