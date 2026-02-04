'use client';

import { useStore } from '@/store/useStore';
import { clsx } from 'clsx';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STACK_COLORS: Record<string, string> = {
    'Infrastructure': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'Hardware': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'Model': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    'Application': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export default function GrowthTable() {
    const { stocks } = useStore();

    return (
        <div className="glass rounded-xl overflow-hidden border border-white/10 flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-semibold text-white">Market Data</h3>
                <button className="text-xs text-neon-cyan hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-sm">
                        <tr className="border-b border-white/10 text-gray-400 font-medium text-xs uppercase tracking-wider">
                            <th className="p-4">Stack</th>
                            <th className="p-4">Company</th>
                            <th className="p-4 text-right">Price</th>
                            <th className="p-4 text-right">1M %</th>
                            <th className="p-4 text-right hidden lg:table-cell">6M %</th>
                            <th className="p-4 text-right hidden md:table-cell">1Y %</th>
                            <th className="p-4 text-right hidden xl:table-cell">3Y %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {stocks.map((stock) => (
                            <motion.tr
                                layoutId={stock.id}
                                key={stock.id}
                                className="hover:bg-white/5 transition-colors group cursor-pointer"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <td className="p-4">
                                    <span className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border", STACK_COLORS[stock.stack] || 'bg-gray-800 text-gray-400')}>
                                        {stock.stack}
                                    </span>
                                </td>
                                <td className="p-4" onClick={() => window.location.href = `/market?companyId=${stock.id}`}>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                                            {stock.ticker[0]}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white group-hover:text-neon-cyan transition-colors">{stock.name}</div>
                                            <div className="text-xs text-gray-500 font-mono">{stock.ticker}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="font-mono text-white text-base">${stock.price.toFixed(2)}</div>
                                </td>

                                {[stock.change1M, stock.change6M, stock.change1Y, stock.change3Y].map((val, i) => {
                                    const isPos = val >= 0;
                                    const displayClass = i === 1 ? 'hidden lg:table-cell' : i === 2 ? 'hidden md:table-cell' : i === 3 ? 'hidden xl:table-cell' : '';
                                    return (
                                        <td key={i} className={clsx("p-4 text-right", displayClass)}>
                                            <div className={clsx("flex items-center justify-end gap-1 font-mono", isPos ? "text-emerald-green bg-emerald-green/10 px-2 py-0.5 rounded-md inline-flex" : "text-bright-red bg-bright-red/10 px-2 py-0.5 rounded-md inline-flex")}>
                                                {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {Math.abs(val).toFixed(2)}%
                                            </div>
                                        </td>
                                    )
                                })}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
