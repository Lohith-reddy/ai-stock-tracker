'use client';

import { useStore, Company } from '@/store/useStore';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { AlertTriangle, DollarSign } from 'lucide-react';
import { useState } from 'react';

export default function PortfolioBuilder() {
    const { stocks, budget, setBudget, allocations, setAllocation } = useStore();

    const [selectedModel, setSelectedModel] = useState<'timesfm' | 'chronos'>('timesfm');
    const [selectedHorizon, setSelectedHorizon] = useState<string>('1m');

    const totalAllocation = Object.values(allocations).reduce((a, b) => a + b, 0);

    const getGrowth = (stock: Company) => {
        const forecast = stock.forecasts?.[selectedModel]?.[selectedHorizon];
        return forecast !== undefined ? forecast : stock.projectedGrowth;
    };

    // Calculate Portfolio Metrics
    const projectedValue = stocks.reduce((acc, stock) => {
        const alloc = allocations[stock.id] || 0;
        const amount = budget * (alloc / 100);
        const growth = getGrowth(stock) / 100;
        return acc + (amount * (1 + growth));
    }, 0);

    const currentTotalInvested = budget * (totalAllocation / 100);

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full">
            {/* Main Builder Area */}
            <div className="flex-1 glass rounded-xl border border-white/10 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-white/10 bg-black/20 z-10">
                    <h2 className="text-xl font-bold text-white mb-4">Portfolio Allocation</h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as any)}
                            className="bg-black/40 border border-white/20 rounded-lg py-1.5 px-3 text-sm text-gray-300 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                        >
                            <option value="timesfm">Google TimesFM</option>
                            <option value="chronos">Amazon Chronos</option>
                        </select>
                        <select
                            value={selectedHorizon}
                            onChange={(e) => setSelectedHorizon(e.target.value)}
                            className="bg-black/40 border border-white/20 rounded-lg py-1.5 px-3 text-sm text-gray-300 focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan"
                        >
                            <option value="1d">1 Day</option>
                            <option value="1w">1 Week</option>
                            <option value="1m">1 Month</option>
                            <option value="6m">6 Month</option>
                            <option value="1y">1 Year</option>
                        </select>
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <label className="text-sm text-gray-400">Total Budget:</label>
                        <div className="relative group">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan group-focus-within:text-neon-cyan/80 transition-colors" />
                            <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(Number(e.target.value))}
                                className="bg-black/40 border border-white/20 rounded-lg py-2 pl-9 pr-4 text-white focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan transition-all w-48 font-mono placeholder:text-gray-600"
                                placeholder="Enter budget..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
                    {stocks.map(stock => {
                        const alloc = allocations[stock.id] || 0;
                        const amount = budget * (alloc / 100);
                        const growth = getGrowth(stock);

                        return (
                            <div key={stock.id} className="bg-white/5 rounded-xl p-5 border border-white/5 hover:border-white/10 transition-colors shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx("w-1.5 h-10 rounded-full transition-all duration-300", alloc > 0 ? "bg-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.5)]" : "bg-gray-700")}></div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{stock.name}</h3>
                                            <p className="text-xs text-gray-400 font-medium">{stock.ticker} <span className="text-gray-600 px-1">•</span> {stock.stack}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4 sm:block">
                                        <div className="text-xl font-mono text-white font-bold ml-auto">${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                                        <div className="text-xs text-neon-cyan font-semibold">{alloc}% Allocation</div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row md:items-center gap-6">
                                    <div className="flex-1 relative pt-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={alloc}
                                            onChange={(e) => setAllocation(stock.id, Number(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neon-cyan hover:accent-neon-cyan/80 focus:outline-none focus:ring-2 focus:ring-neon-cyan/30"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
                                            <span>0%</span>
                                            <span>50%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>

                                    {/* The "Three Numbers" */}
                                    <div className="flex gap-2 shrink-0 overflow-x-auto pb-1 md:pb-0">
                                        <div className="px-3 py-1.5 rounded bg-blue-500/10 border border-blue-500/20 text-center min-w-[90px]">
                                            <div className="text-[10px] text-blue-400 uppercase font-semibold">Projected ({selectedHorizon})</div>
                                            <div className="text-sm font-bold text-blue-400">{growth > 0 ? '+' : ''}{growth.toFixed(2)}%</div>
                                        </div>
                                        <div className="px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[90px]">
                                            <div className="text-[10px] text-emerald-400 uppercase font-semibold">Past 1Y</div>
                                            <div className="text-sm font-bold text-emerald-400">+{stock.change1Y.toFixed(2)}%</div>
                                        </div>
                                    </div>
                                    <div className={clsx("px-3 py-1.5 rounded border text-center min-w-[90px]",
                                        stock.riskScore === 'High' ? "bg-red-500/10 border-red-500/20" : "bg-yellow-500/10 border-yellow-500/20"
                                    )}>
                                        <div className={clsx("text-[10px] uppercase font-semibold", stock.riskScore === 'High' ? "text-red-400" : "text-yellow-400")}>Risk</div>
                                        <div className={clsx("text-sm font-bold", stock.riskScore === 'High' ? "text-red-400" : "text-yellow-400")}>{stock.riskScore}</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Summary Side Card */}
            <div className="w-full lg:w-80 space-y-6">
                <div className="glass p-6 rounded-xl border border-white/10 sticky top-6">
                    <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Portfolio Summary</h3>

                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm text-gray-400 mb-2">Total Allocation</div>
                            <div className="h-4 bg-gray-800 rounded-full overflow-hidden p-[2px]">
                                <div
                                    className={clsx("h-full rounded-full transition-all duration-300", totalAllocation > 100 ? "bg-bright-red" : "bg-gradient-to-r from-neon-cyan to-emerald-green")}
                                    style={{ width: `${Math.min(totalAllocation, 100)}%` }}
                                ></div>
                            </div>
                            <div className={clsx("text-right text-xs mt-2 font-bold", totalAllocation > 100 ? "text-bright-red" : "text-emerald-green")}>
                                {totalAllocation}% {totalAllocation > 100 && "(Over Budget!)"}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Total Invested</span>
                                <span className="text-white font-mono">${currentTotalInvested.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">Remaining</span>
                                <span className="text-white font-mono">${(budget - currentTotalInvested).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                                <span className="text-sm text-neon-cyan font-bold">Projected Value (1Y)</span>
                                <span className="text-neon-cyan font-mono font-bold text-lg">${projectedValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>

                        {totalAllocation > 100 && (
                            <div className="p-3 rounded bg-red-500/10 border border-red-500/20 flex gap-2 items-start animate-pulse">
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400 font-medium">Allocation exceeds 100%. Please adjust sliders to proceed.</p>
                            </div>
                        )}

                        <button
                            className="w-full py-3 rounded-lg bg-neon-cyan text-black font-bold text-sm hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                            disabled={totalAllocation > 100}
                        >
                            Save Portfolio
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
