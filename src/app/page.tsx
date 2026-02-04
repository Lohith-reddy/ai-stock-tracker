'use client';

import GrowthTable from '@/components/dashboard/GrowthTable';
import SectorChart from '@/components/dashboard/SectorChart';
import { useStore } from '@/store/useStore';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useMemo } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { stocks } = useStore();

  const stats = useMemo(() => {
    if (stocks.length === 0) return { topGainer: null, topLoser: null, sectorAvg: 0 };

    const sorted = [...stocks].sort((a, b) => b.change1M - a.change1M);
    const topGainer = sorted[0];
    const topLoser = sorted[sorted.length - 1];

    const avg = stocks.reduce((acc, s) => acc + s.change1M, 0) / stocks.length;

    return { topGainer, topLoser, sectorAvg: avg };
  }, [stocks]);

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Gainer */}
        <Link href={`/market?companyId=${stats.topGainer?.id}`} className="block">
          <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-50 transition-opacity"><TrendingUp className="w-12 h-12 text-emerald-green" /></div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Top Gainer (1M)</p>
            <div className="mt-4 relative z-10">
              <h3 className="text-2xl font-bold text-white tracking-tight">{stats.topGainer?.name}</h3>
              <p className="text-emerald-green font-mono flex items-center gap-2 text-lg font-semibold mt-1">
                +{stats.topGainer?.change1M.toFixed(2)}%
                <span className="text-xs text-gray-500 font-sans font-normal ml-1">Last 30 days</span>
              </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-green to-transparent opacity-50"></div>
          </div>
        </Link>

        {/* Top Loser */}
        <Link href={`/market?companyId=${stats.topLoser?.id}`} className="block">
          <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-50 transition-opacity"><TrendingDown className="w-12 h-12 text-bright-red" /></div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Top Loser (1M)</p>
            <div className="mt-4 relative z-10">
              <h3 className="text-2xl font-bold text-white tracking-tight">{stats.topLoser?.name}</h3>
              <p className="text-bright-red font-mono flex items-center gap-2 text-lg font-semibold mt-1">
                {stats.topLoser?.change1M.toFixed(2)}%
                <span className="text-xs text-gray-500 font-sans font-normal ml-1">Last 30 days</span>
              </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-bright-red to-transparent opacity-50"></div>
          </div>
        </Link>

        {/* Market Average */}
        <Link href="/market?view=stack" className="block">
          <div className="glass p-6 rounded-xl border border-white/10 relative overflow-hidden group hover:bg-white/5 transition-colors cursor-pointer">
            <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-50 transition-opacity"><PieChart className="w-12 h-12 text-neon-cyan" /></div>
            <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Sector Average (1M)</p>
            <div className="mt-4 relative z-10">
              <h3 className="text-2xl font-bold text-white tracking-tight">AI Tech Stack</h3>
              <p className={`font-mono flex items-center gap-2 text-lg font-semibold mt-1 ${stats.sectorAvg >= 0 ? 'text-emerald-green' : 'text-bright-red'}`}>
                {stats.sectorAvg > 0 ? '+' : ''}{stats.sectorAvg.toFixed(2)}%
                <span className="text-xs text-gray-500 font-sans font-normal ml-1">Overall Trend</span>
              </p>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan to-transparent opacity-50"></div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[600px]">
        <div className="xl:col-span-2 h-full min-h-[400px]">
          <GrowthTable />
        </div>
        <div className="xl:col-span-1 h-full min-h-[400px]">
          <SectorChart />
        </div>
      </div>
    </div>
  );
}
