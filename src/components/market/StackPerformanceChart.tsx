'use client';

import { Company } from '@/store/useStore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceLine } from 'recharts';
import { useMemo, useState, useEffect } from 'react';
import { TimeRange } from './MarketControls';

interface Props {
    stocks: Company[];
    selectedStack: string;
    timeRange: TimeRange;
}

// Expanded color palette for better differentiation
const COLORS = [
    '#00f0ff', // Cyan
    '#10b981', // Emerald
    '#ef4444', // Red
    '#a855f7', // Purple
    '#f97316', // Orange
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#eab308', // Yellow
    '#14b8a6', // Teal
    '#8b5cf6', // Violet
    '#f43f5e', // Rose
    '#22c55e', // Green
];

const POINTS_MAP: Record<TimeRange, number> = {
    '1D': 2,
    '1W': 5,
    '1M': 21,
    '6M': 126,
    '1Y': 252,
    '3Y': 756
};

export default function StackPerformanceChart({ stocks, selectedStack, timeRange }: Props) {
    const [selectedStock, setSelectedStock] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[400px] w-full bg-white/5 animate-pulse rounded-xl" />;

    const filteredStocks = useMemo(() => {
        return selectedStack === 'All' ? stocks : stocks.filter(s => s.stack === selectedStack);
    }, [stocks, selectedStack]);

    const chartData = useMemo(() => {
        if (filteredStocks.length === 0) return [];

        const points = POINTS_MAP[timeRange] || 252;
        const length = Math.min(points, filteredStocks[0]?.history?.length || 0);
        if (length === 0) return [];

        return Array.from({ length }).map((_, i) => {
            const point: any = { index: i };
            filteredStocks.forEach(stock => {
                const slice = stock.history?.slice(-length) || [];
                const startPrice = slice[0] || 0;
                const currentPrice = slice[i] || 0;
                const percentageGrowth = startPrice ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
                point[stock.ticker] = percentageGrowth;
            });
            return point;
        });
    }, [filteredStocks, timeRange]);

    // Calculate final growth for each stock
    const growthSummary = useMemo(() => {
        if (chartData.length === 0) return {};
        const lastPoint = chartData[chartData.length - 1];
        const summary: Record<string, number> = {};
        filteredStocks.forEach(stock => {
            summary[stock.ticker] = lastPoint[stock.ticker] || 0;
        });
        return summary;
    }, [chartData, filteredStocks]);

    const handleLineClick = (ticker: string) => {
        setSelectedStock(selectedStock === ticker ? null : ticker);
    };

    return (
        <div className="glass p-6 rounded-xl border border-white/10 h-[500px] flex flex-col">
            <div className="mb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white">Stack Performance Comparison</h3>
                        <p className="text-sm text-gray-400">Relative Growth % over selected period (normalized to 0%)</p>
                    </div>
                    {selectedStock && (
                        <div className="bg-white/10 px-3 py-1 rounded-lg border border-white/20">
                            <span className="text-sm text-gray-400">Selected: </span>
                            <span className="text-white font-bold">{selectedStock}</span>
                            <span className={`ml-2 font-mono font-bold ${growthSummary[selectedStock] >= 0 ? 'text-emerald-green' : 'text-bright-red'}`}>
                                {growthSummary[selectedStock] >= 0 ? '+' : ''}{growthSummary[selectedStock]?.toFixed(2)}%
                            </span>
                        </div>
                    )}
                </div>
                {/* Growth Badges */}
                <div className="flex flex-wrap gap-2 mt-3">
                    {filteredStocks.slice(0, 8).map((stock, index) => (
                        <button
                            key={stock.id}
                            onClick={() => handleLineClick(stock.ticker)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all border ${selectedStock === stock.ticker ? 'border-white/50 bg-white/10' : 'border-transparent bg-white/5 hover:bg-white/10'
                                }`}
                            style={{ color: COLORS[index % COLORS.length] }}
                        >
                            {stock.ticker}: {growthSummary[stock.ticker] >= 0 ? '+' : ''}{growthSummary[stock.ticker]?.toFixed(1) || 0}%
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 w-full min-h-[300px] min-w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={300} debounce={100}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        {/* Normalized Y-axis with 0% reference line */}
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />
                        <XAxis
                            dataKey="index"
                            stroke="#666"
                            fontSize={12}
                            tickFormatter={(val) => `${val}`}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#666"
                            fontSize={12}
                            tickFormatter={(val) => `${val.toFixed(0)}%`}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ fontSize: '12px' }}
                            labelFormatter={(label) => `Day ${label}`}
                            formatter={(value: any, name?: string) => [`${Number(value).toFixed(2)}%`, name || '']}
                        />
                        <Legend
                            iconType="circle"
                            wrapperStyle={{ paddingTop: '10px' }}
                            onClick={(e) => e.value && handleLineClick(e.value)}
                        />
                        {filteredStocks.map((stock, index) => (
                            <Line
                                key={stock.id}
                                type="monotone"
                                dataKey={stock.ticker}
                                stroke={COLORS[index % COLORS.length]}
                                strokeWidth={selectedStock === stock.ticker ? 4 : 2}
                                strokeOpacity={selectedStock && selectedStock !== stock.ticker ? 0.3 : 1}
                                dot={false}
                                activeDot={{ r: 6, onClick: () => handleLineClick(stock.ticker) }}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
