import { create } from 'zustand';
import { COMPANIES } from '@/data/mockData';

export interface Company {
    id: string;
    name: string;
    ticker: string;
    stack: string;
    price: number;
    change1M: number;
    change6M: number;
    change1Y: number;
    change3Y: number;
    projectedGrowth: number;
    projectedGrowth1M: number;
    projectedGrowth6M: number;
    projectedGrowth1Y: number;
    riskScore: 'Low' | 'Med' | 'High';
    volatility: string;
    forecasts: {
        timesfm?: Record<string, number>;
        chronos?: Record<string, number>;
    };
    history: number[];
}

interface PortfolioState {
    stocks: Company[];
    budget: number;
    allocations: Record<string, number>; // companyId -> percentage (0-100)
    lastUpdated: Date | null;
    isRefreshing: boolean;
    hasLoadedInitially: boolean;
    error: string | null;

    setBudget: (amount: number) => void;
    setAllocation: (id: string, percent: number) => void;
    loadInitialData: () => Promise<void>;
    refreshData: (runInference?: boolean) => Promise<void>;
    checkStaleness: () => Promise<{ needsRefresh: boolean; ageHours: number | null }>;
}

export const useStore = create<PortfolioState>((set, get) => ({
    stocks: [], // Start empty, fetch on mount
    budget: 100000,
    allocations: {},
    lastUpdated: null,
    isRefreshing: false,
    hasLoadedInitially: false,
    error: null,

    setBudget: (amount) => set({ budget: amount }),

    setAllocation: (id, percent) => set((state) => ({
        allocations: { ...state.allocations, [id]: percent }
    })),

    loadInitialData: async () => {
        // Only load once
        if (get().hasLoadedInitially) return;

        try {
            const res = await fetch('/api/py/stocks');
            if (!res.ok) throw new Error('Failed to fetch stocks');

            const data = await res.json();
            set({
                stocks: data,
                lastUpdated: new Date(),
                hasLoadedInitially: true,
                error: null
            });
        } catch (error) {
            console.error("Failed to load data, using mock data:", error);
            // Fallback to mock data if backend unavailable
            set({
                stocks: COMPANIES as Company[],
                hasLoadedInitially: true,
                error: 'Using cached data - backend unavailable'
            });
        }
    },

    checkStaleness: async () => {
        try {
            const res = await fetch('/api/py/needs-refresh');
            if (!res.ok) return { needsRefresh: true, ageHours: null };

            const data = await res.json();
            return {
                needsRefresh: data.needs_refresh,
                ageHours: data.age_hours
            };
        } catch {
            return { needsRefresh: true, ageHours: null };
        }
    },

    refreshData: async (runInference = false) => {
        if (get().isRefreshing) return;

        // Don't clear existing data - keep it visible during refresh
        set({ isRefreshing: true, error: null });

        try {
            // Trigger backend refresh (with optional inference)
            const url = runInference
                ? '/api/py/refresh?run_inference=true'
                : '/api/py/refresh';
            await fetch(url, { method: 'POST' });

            // Fetch updated data
            const res = await fetch('/api/py/stocks');
            if (!res.ok) throw new Error('Failed to fetch stocks');

            const data = await res.json();

            // Update with new data (preserving existing if fetch failed)
            set({
                stocks: data,
                lastUpdated: new Date(),
                isRefreshing: false,
                error: null
            });
        } catch (error) {
            console.error("Failed to refresh data:", error);
            // Keep existing data, just stop refreshing
            set({
                isRefreshing: false,
                error: 'Refresh failed - showing previous data'
            });
        }
    }
}));
