'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import MarketControls, { ViewMode, TimeRange } from '@/components/market/MarketControls';
import StackPerformanceChart from '@/components/market/StackPerformanceChart';
import CompanyDeepDiveChart from '@/components/market/CompanyDeepDiveChart';

export default function MarketPage() {
    const { stocks } = useStore();
    const searchParams = useSearchParams();

    const [viewMode, setViewMode] = useState<ViewMode>('stack');
    const [timeRange, setTimeRange] = useState<TimeRange>('1Y');

    // Defaults
    const [selectedStack, setSelectedStack] = useState<string>('All');
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

    // Initialize from URL params
    useEffect(() => {
        const companyId = searchParams.get('companyId');
        const view = searchParams.get('view');

        if (companyId) {
            setViewMode('company');
            setSelectedCompanyId(companyId);
        } else if (view === 'stack') {
            setViewMode('stack');
        }
    }, [searchParams]);

    // Memoized initial selection if null
    const activeCompany = useMemo(() => {
        if (selectedCompanyId) {
            return stocks.find(s => s.id === selectedCompanyId) || stocks[0];
        }
        return stocks[0];
    }, [stocks, selectedCompanyId]);

    if (!activeCompany) {
        return <div className="flex items-center justify-center h-full text-gray-500">Loading Market Data...</div>;
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Market Analysis</h1>
                    <p className="text-gray-400 mt-1">Deep dive into AI tech stack performance trends.</p>
                </div>
            </div>

            <MarketControls
                viewMode={viewMode}
                setViewMode={setViewMode}
                selectedStack={selectedStack}
                setSelectedStack={setSelectedStack}
                selectedCompanyId={selectedCompanyId || activeCompany.id}
                setSelectedCompanyId={setSelectedCompanyId}
                timeRange={timeRange}
                setTimeRange={setTimeRange}
            />

            <div className="flex-1 min-h-0 animate-in fade-in duration-500">
                {viewMode === 'stack' ? (
                    <StackPerformanceChart stocks={stocks} selectedStack={selectedStack} timeRange={timeRange} />
                ) : (
                    <CompanyDeepDiveChart company={activeCompany} timeRange={timeRange} />
                )}
            </div>

            {/* Additional Stats Row could go here */}
        </div>
    );
}
