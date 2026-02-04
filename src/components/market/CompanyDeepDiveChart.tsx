'use client';

import { Company } from '@/store/useStore';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { clsx } from 'clsx';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { TimeRange } from './MarketControls';
import { useState, useEffect } from 'react';

interface Props {
    company: Company;
    timeRange: TimeRange;
}

const POINTS_MAP: Record<TimeRange, number> = {
    '1D': 2,   // Placeholder, ideally would be hourly
    '1W': 5,
    '1M': 21,
    '6M': 126,
    '1Y': 252,
    '3Y': 756
};

export default function CompanyDeepDiveChart({ company, timeRange }: Props) {
    const [selectedModel, setSelectedModel] = useState<'timesfm' | 'chronos'>('timesfm');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[500px] w-full bg-white/5 animate-pulse rounded-xl" />;

    const points = POINTS_MAP[timeRange] || 252;
    // Handle case where history is undefined or empty
    const history = company.history || [];
    const historySlice = history.slice(-points);

    const chartData = historySlice.map((price, i) => ({
        index: i,
        price: price,
    }));

    const startPrice = historySlice[0] || 0;
    const endPrice = historySlice[historySlice.length - 1] || 0;
    const isPositive = endPrice >= startPrice;
    const growth = startPrice !== 0 ? ((endPrice - startPrice) / startPrice) * 100 : 0;

    const color = isPositive ? '#10b981' : '#ef4444'; // Emerald or Red

    // Forecast Data Helper
    const getForecast = (horizon: string) => {
        if (!company.forecasts || !company.forecasts[selectedModel]) return 0.0;
        // The API returns lowercase keys like '1m', '6m'
        return company.forecasts[selectedModel][horizon] || 0.0;
    };

    const horizons = ['1d', '1w', '1m', '6m', '1y'];

    return (
        <div className="glass p-8 rounded-xl border border-white/10 h-[600px] flex flex-col">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/10 font-bold text-lg text-white">
                            {company.ticker[0]}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{company.name}</h2>
                            <span className="text-sm text-gray-400 font-mono">{company.ticker} • {company.stack}</span>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div>
                        <div className="flex items-center justify-end gap-2 mb-2">
                            <span className="text-xs text-gray-400">Model:</span>
                            <div className="flex bg-white/10 rounded-lg p-0.5">
                                <button
                                    onClick={() => setSelectedModel('timesfm')}
                                    className={clsx("px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all", selectedModel === 'timesfm' ? "bg-neon-cyan text-black" : "text-gray-400 hover:text-white")}
                                >
                                    TimesFM
                                </button>
                                <button
                                    onClick={() => setSelectedModel('chronos')}
                                    className={clsx("px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all", selectedModel === 'chronos' ? "bg-neon-purp text-black" : "text-gray-400 hover:text-white")}
                                >
                                    Chronos
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-2 w-[320px] ml-auto">
                            {horizons.map(h => {
                                const val = getForecast(h);
                                return (
                                    <div key={h} className="bg-white/5 rounded p-2 text-center">
                                        <div className="text-[9px] text-gray-400 uppercase mb-0.5">{h}</div>
                                        {/* Dynamic Color based on Model Selection */}
                                        <div className={`font-mono text-xs font-bold leading-tight ${val >= 0
                                            ? (selectedModel === 'chronos' ? 'text-neon-purp' : 'text-neon-cyan')
                                            : 'text-bright-red'
                                            }`}>
                                            {val > 0 ? '+' : ''}{val.toFixed(2)}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="text-4xl font-mono font-bold text-white mb-1">${(company.price || 0).toFixed(2)}</div>
                        <div className={clsx("flex items-center justify-end gap-1 font-mono text-lg font-medium", isPositive ? "text-emerald-green" : "text-bright-red")}>
                            {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                            {growth.toFixed(2)}% <span className="text-xs text-gray-500 ml-1">Past Period</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] min-w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={300} debounce={100}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis
                            dataKey="index"
                            hide
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            orientation="right"
                            stroke="#666"
                            fontSize={12}
                            tickFormatter={(val) => `$${val.toFixed(0)}`}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
                            labelFormatter={() => ''}
                            cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Deep Dive Metrics */}
            <div className="grid grid-cols-3 gap-6 mt-8 pt-6 border-t border-white/10">
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Volatility Risk</p>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-neon-cyan" />
                        <span className="text-white font-medium">{company.volatility}</span>
                    </div>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Projected Growth (Mean)</p>
                    <div className="text-blue-400 font-bold font-mono">+{company.projectedGrowth.toFixed(2)}%</div>
                </div>
                <div>
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-1">Risk Score</p>
                    <div className={clsx("font-bold", company.riskScore === 'High' ? "text-bright-red" : "text-emerald-green")}>{company.riskScore}</div>
                </div>
            </div>
        </div>
    );
}
