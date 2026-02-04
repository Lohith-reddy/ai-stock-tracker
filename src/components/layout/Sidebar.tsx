'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LineChart, Briefcase, Settings, Zap } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Market Analysis', href: '/market', icon: LineChart },
    { name: 'Portfolio Builder', href: '/portfolio', icon: Briefcase },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 flex flex-col z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                    <Zap className="w-5 h-5 text-neon-cyan fill-neon-cyan" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                    AI<span className="text-neon-cyan">Stock</span>
                </h1>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group',
                                isActive
                                    ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                            )}
                        >
                            <item.icon className={clsx("w-5 h-5 transition-colors", isActive ? "text-neon-cyan" : "group-hover:text-white")} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-white/10">
                <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 shadow-inner">
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">System Status</p>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-green"></span>
                        </span>
                        <span className="text-sm font-semibold text-emerald-green shadow-emerald-green/20">Market Open</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
