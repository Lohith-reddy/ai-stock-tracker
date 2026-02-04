'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Search, Loader2 } from 'lucide-react';

export default function SettingsPage() {
    const { stocks, refreshData } = useStore();
    const [ticker, setTicker] = useState('');
    const [stack, setStack] = useState('Hardware');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;

        setIsLoading(true);
        setMessage(null);

        try {
            const res = await fetch('/api/py/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: ticker.toUpperCase(), stack }),
            });

            if (!res.ok) {
                throw new Error('Failed to add ticker. Verify functionality or symbol.');
            }

            await refreshData();
            setMessage({ type: 'success', text: `Successfully added ${ticker.toUpperCase()}` });
            setTicker('');
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Manage Watchlist</h1>
                <p className="text-gray-400 mt-1">Add new companies to your AI Stock Tracker.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Add New Stock Form */}
                <div className="glass p-8 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-neon-cyan" />
                        Add New Company
                    </h2>

                    <form onSubmit={handleAddStock} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Ticker Symbol</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={ticker}
                                    onChange={(e) => setTicker(e.target.value)}
                                    placeholder="e.g. TSLA"
                                    className="w-full bg-black/40 border border-white/20 text-white rounded-lg pl-10 pr-4 py-2.5 focus:ring-neon-cyan focus:border-neon-cyan transition-all"
                                />
                                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tech Stack Category</label>
                            <select
                                value={stack}
                                onChange={(e) => setStack(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 text-white rounded-lg px-4 py-2.5 focus:ring-neon-cyan focus:border-neon-cyan"
                            >
                                <option value="Hardware">Hardware</option>
                                <option value="Cloud & Infra">Cloud & Infrastructure</option>
                                <option value="Data & MLOps">Data & MLOps</option>
                                <option value="Models">Models & Platforms</option>
                                <option value="Applications">AI Applications</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !ticker}
                            className="w-full bg-neon-cyan text-black font-bold py-3 rounded-lg hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add to Watchlist'}
                        </button>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {message.text}
                            </div>
                        )}
                    </form>
                </div>

                {/* Current Watchlist Preview */}
                <div className="glass p-8 rounded-xl border border-white/10 flex flex-col h-[500px]">
                    <h2 className="text-xl font-bold text-white mb-4">Current Watchlist ({stocks.length})</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {stocks.map((stock) => (
                            <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <div>
                                    <div className="font-bold text-white">{stock.ticker}</div>
                                    <div className="text-xs text-gray-400">{stock.name}</div>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-300">
                                        {stock.stack}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Run Inference Section */}
                <div className="col-span-1 md:col-span-2 glass p-8 rounded-xl border border-white/10">
                    <h2 className="text-xl font-bold text-white mb-2">AI Prediction Engine</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Run foundation model inference (Google TimesFM & Amazon Chronos) on all stocks in your watchlist.
                        This will generate multi-horizon forecasts (1D, 1W, 1M, 6M, 1Y).
                    </p>

                    <div className="flex items-center justify-between bg-black/40 p-6 rounded-lg border border-white/5">
                        <div>
                            <div className="font-bold text-white text-lg">Trigger Inference Cycle</div>
                            <div className="text-xs text-gray-500 mt-1">
                                Fetches latest market data and runs TimesFM + Chronos models (~5 minutes).
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                setMessage(null);
                                setIsLoading(true);
                                try {
                                    // Use refreshData with inference enabled
                                    await refreshData(true);
                                    setMessage({ type: 'success', text: 'Inference cycle completed. Check dashboard for updated forecasts.' });
                                } catch (e) {
                                    setMessage({ type: 'error', text: 'Error running inference.' });
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            disabled={isLoading}
                            className="px-6 py-3 bg-neon-cyan/20 hover:bg-neon-cyan/30 text-neon-cyan font-bold rounded-lg border border-neon-cyan/30 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? 'Running...' : 'Run Inference'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
