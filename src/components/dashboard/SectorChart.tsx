'use client';

import { useStore } from '@/store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { useEffect, useState } from 'react';

export default function SectorChart() {
    const { stocks } = useStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[300px] w-full bg-white/5 animate-pulse rounded-xl" />;

    const sectorData = stocks.reduce((acc, stock) => {
        if (!acc[stock.stack]) {
            acc[stock.stack] = { name: stock.stack, total: 0, count: 0 };
        }
        acc[stock.stack].total += stock.change1Y;
        acc[stock.stack].count += 1;
        return acc;
    }, {} as Record<string, { name: string, total: number, count: number }>);

    const data = Object.values(sectorData).map(d => ({
        name: d.name,
        avgGrowth: d.total / d.count
    }));

    const COLORS = ['#3b82f6', '#a855f7', '#ec4899', '#f97316'];

    return (
        <div className="h-full w-full p-6 glass rounded-xl border border-white/10 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-2">Sector Performance</h3>
            <p className="text-sm text-gray-500 mb-6">Average 1 Year Growth by Stack</p>

            <div className="flex-1 w-full min-h-[300px] min-w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={300} debounce={100}>
                    <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis type="number" stroke="#666" fontSize={12} tickFormatter={(val) => `${val.toFixed(0)}%`} axisLine={false} tickLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#999" fontSize={12} width={100} axisLine={false} tickLine={false} />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Avg Growth']}
                        />
                        <Bar dataKey="avgGrowth" radius={[0, 4, 4, 0]} barSize={32}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
