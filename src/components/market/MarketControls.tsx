'use client';

import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';
import { Layers, Building2, Calendar } from 'lucide-react';

export type ViewMode = 'stack' | 'company';
export type TimeRange = '1D' | '1W' | '1M' | '6M' | '1Y' | '3Y';

interface MarketControlsProps {
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectedStack: string | null;
    setSelectedStack: (stack: string) => void;
    selectedCompanyId: string | null;
    setSelectedCompanyId: (id: string) => void;
    timeRange: TimeRange;
    setTimeRange: (range: TimeRange) => void;
}

export default function MarketControls({
    viewMode,
    setViewMode,
    selectedStack,
    setSelectedStack,
    selectedCompanyId,
    setSelectedCompanyId,
    timeRange,
    setTimeRange
}: MarketControlsProps) {
    const { stocks } = useStore();

    // Get unique stacks
    const stacks = Array.from(new Set(stocks.map(s => s.stack)));

    return (
        <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Main View Toggle */}
                <div className="bg-white/5 p-1 rounded-lg flex items-center border border-white/10 w-fit">
                    <button
                        onClick={() => setViewMode('stack')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                            viewMode === 'stack' ? "bg-neon-cyan text-black shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                    >
                        <Layers className="w-4 h-4" />
                        View by Stack
                    </button>
                    <button
                        onClick={() => setViewMode('company')}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all",
                            viewMode === 'company' ? "bg-neon-cyan text-black shadow-lg" : "text-gray-400 hover:text-white"
                        )}
                    >
                        <Building2 className="w-4 h-4" />
                        View by Company
                    </button>
                </div>

                {/* Time Range Toggle */}
                <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden w-fit">
                    {['1D', '1W', '1M', '6M', '1Y', '3Y'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range as TimeRange)}
                            className={clsx(
                                "px-3 py-2 text-xs font-semibold transition-colors border-r border-white/5 last:border-0",
                                timeRange === range ? "bg-emerald-green text-black" : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Secondary Selection Filters */}
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <span className="text-sm text-gray-500 font-medium whitespace-nowrap">Filter By:</span>

                {viewMode === 'stack' ? (
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedStack('All')}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                selectedStack === 'All' ? "bg-white text-black border-white" : "bg-transparent text-gray-400 border-white/20 hover:border-white/50"
                            )}
                        >
                            All Stacks
                        </button>
                        {stacks.map(stack => (
                            <button
                                key={stack}
                                onClick={() => setSelectedStack(stack)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                    selectedStack === stack ? "bg-white text-black border-white" : "bg-transparent text-gray-400 border-white/20 hover:border-white/50"
                                )}
                            >
                                {stack}
                            </button>
                        ))}
                    </div>
                ) : (
                    <select
                        value={selectedCompanyId || ''}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="bg-black/40 border border-white/20 text-white text-sm rounded-lg focus:ring-neon-cyan focus:border-neon-cyan block p-2.5 min-w-[200px]"
                    >
                        {stocks.map(stock => (
                            <option key={stock.id} value={stock.id}>{stock.name} ({stock.ticker})</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}
