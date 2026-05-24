import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { ZenPageShell } from '../components/ZenPageShell';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';
import {
  BarChart3,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Receipt,
  Sparkles,
  TrendingDown
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { analyticsStats, fetchAnalyticsData, serverOffline } = useApp();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (!analyticsStats) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col gap-6 animate-pulse">
          <div className="h-10 bg-glass-bg rounded-xl w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-28 bg-glass-bg rounded-[24px]" />
            <div className="h-28 bg-glass-bg rounded-[24px]" />
            <div className="h-28 bg-glass-bg rounded-[24px]" />
          </div>
          <div className="h-80 bg-glass-bg rounded-[24px] mt-6" />
        </div>
      </AppLayout>
    );
  }

  const { trendData, taxSummary, heatmapData } = analyticsStats;

  return (
    <AppLayout>
      <ZenPageShell
        title="Expense"
        highlight="Analytics"
        subtitle="Deep-dive structural charts and GST summaries."
        action={
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => alert('Filtering options are synced to Q3 ledger.')}
              className="zen-btn-secondary px-4 py-2 text-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>30 Days (Q3)</span>
            </button>
            <button
              type="button"
              onClick={() => alert('Downloading analytical spreadsheet...')}
              className="zen-btn-primary px-4 py-2 text-white rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="border border-glass-border" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Tax Paid (VAT)</span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-2">₹{taxSummary.totalTax.toLocaleString()}</h3>
                <span className="text-[9px] text-[#bdc2ff] font-mono mt-1 block">Accumulated across Q3 receipts</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-cyan/15 border border-cyan/20 flex items-center justify-center text-cyan">
                <Receipt className="w-5 h-5" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border border-glass-border" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Reclaimable GST</span>
                <h3 className="text-2xl font-mono font-extrabold text-cyan-glow mt-2">₹{taxSummary.taxReclaimable.toLocaleString()}</h3>
                <span className="text-[9px] text-[#1ED760] font-mono mt-1 block">Eligible corporate operational tax reclaims</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1ED760]/15 border border-[#1ED760]/20 flex items-center justify-center text-[#1ED760]">
                <TrendingDown className="w-5 h-5" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border border-glass-border" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Average Tax Rate</span>
                <h3 className="text-2xl font-mono font-extrabold text-[#7C5CFC] mt-2">{taxSummary.taxRateAverage}%</h3>
                <span className="text-[9px] text-slate-500 font-mono mt-1 block">Aggregated country indices</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/15 border border-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC]">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
          </GlassCard>
        </div>

        {/* LARGE VISUALIZATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Stacked category area chart */}
          <GlassCard className="lg:col-span-8 border border-glass-border !p-5 flex flex-col gap-6 justify-between">
            <div className="border-b border-[#1E293B] pb-3">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono">Category Breakdown over Time</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Stack representation of major categories from May to August</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFood" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTravel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUtilities" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFB547" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#FFB547" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#F8FAFC' }}
                  />
                  <Area type="monotone" dataKey="Food" stackId="1" stroke="#FF5A5F" strokeWidth={1.5} fill="url(#colorFood)" />
                  <Area type="monotone" dataKey="Travel" stackId="1" stroke="#22D3EE" strokeWidth={1.5} fill="url(#colorTravel)" />
                  <Area type="monotone" dataKey="Utilities" stackId="1" stroke="#7C5CFC" strokeWidth={1.5} fill="url(#colorUtilities)" />
                  <Area type="monotone" dataKey="Subscriptions" stackId="1" stroke="#FFB547" strokeWidth={1.5} fill="url(#colorSubs)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Labels legends footer */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-[10px] font-mono pb-2 border-t border-[#1E293B]/40 pt-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#FF5A5F]" />
                <span className="text-slate-400">Food Catering</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#22D3EE]" />
                <span className="text-slate-400">Travel & Flight</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#7C5CFC]" />
                <span className="text-slate-400">Utilities / Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-[#FFB547]" />
                <span className="text-slate-400">Subscriptions</span>
              </div>
            </div>
          </GlassCard>

          {/* Calendar Heatmap Grid - High Visual Wow Factor */}
          <GlassCard className="lg:col-span-4 border border-glass-border !p-5 flex flex-col justify-between">
            <div className="border-b border-[#1E293B] pb-3 mb-4">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono">Auditing Density Heatmap</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Day vs. hour grid tracking invoice uploads</p>
            </div>

            <div className="flex-1 flex flex-col gap-2.5 justify-center">
              {/* Heatmap Matrix Header */}
              <div className="grid grid-cols-5 text-center text-[8px] font-mono text-slate-500 font-bold uppercase mb-1">
                <div>9 AM</div>
                <div>12 PM</div>
                <div>3 PM</div>
                <div>6 PM</div>
                <div>Other</div>
              </div>

              {/* Rows layout */}
              {heatmapData.map((row) => (
                <div key={row.day} className="grid grid-cols-5 gap-2.5 items-center">
                  {/* Row title */}
                  <div className="text-[10px] text-slate-400 font-mono font-bold text-left col-span-5 mb-1 mt-1 border-b border-[#1E293B]/20 pb-0.5">
                    {row.day} Auditing Slots
                  </div>
                  
                  {/* Heatmap blocks */}
                  <div className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-105 ${
                    row['9 AM'] > 1000 ? 'bg-cyan text-slate-900 shadow-md shadow-cyan/25' : row['9 AM'] > 100 ? 'bg-[#7C5CFC]/80 text-white' : row['9 AM'] > 0 ? 'bg-[#5B8CFF]/30 text-[#bdc2ff]' : 'bg-[#051424] text-slate-600 border border-[#1E293B]'
                  }`} title={`${row.day} 9AM: ₹${row['9 AM']}`}>
                    {row['9 AM'] > 0 ? `₹${Math.round(row['9 AM'])}` : '-'}
                  </div>

                  <div className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-105 ${
                    row['12 PM'] > 1000 ? 'bg-cyan text-slate-900 shadow-md shadow-cyan/25' : row['12 PM'] > 100 ? 'bg-[#7C5CFC]/80 text-white' : row['12 PM'] > 0 ? 'bg-[#5B8CFF]/30 text-[#bdc2ff]' : 'bg-[#051424] text-slate-600 border border-[#1E293B]'
                  }`} title={`${row.day} 12PM: ₹${row['12 PM']}`}>
                    {row['12 PM'] > 0 ? `₹${Math.round(row['12 PM'])}` : '-'}
                  </div>

                  <div className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-105 ${
                    row['3 PM'] > 1000 ? 'bg-cyan text-slate-900 shadow-md shadow-cyan/25' : row['3 PM'] > 100 ? 'bg-[#7C5CFC]/80 text-white' : row['3 PM'] > 0 ? 'bg-[#5B8CFF]/30 text-[#bdc2ff]' : 'bg-[#051424] text-slate-600 border border-[#1E293B]'
                  }`} title={`${row.day} 3PM: ₹${row['3 PM']}`}>
                    {row['3 PM'] > 0 ? `₹${Math.round(row['3 PM'])}` : '-'}
                  </div>

                  <div className={`h-8 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold transition-all hover:scale-105 ${
                    row['6 PM'] > 1000 ? 'bg-cyan text-slate-900 shadow-md shadow-cyan/25' : row['6 PM'] > 100 ? 'bg-[#7C5CFC]/80 text-white' : row['6 PM'] > 0 ? 'bg-[#5B8CFF]/30 text-[#bdc2ff]' : 'bg-[#051424] text-slate-600 border border-[#1E293B]'
                  }`} title={`${row.day} 6PM: ₹${row['6 PM']}`}>
                    {row['6 PM'] > 0 ? `₹${Math.round(row['6 PM'])}` : '-'}
                  </div>

                  <div className="h-8 rounded-lg bg-[#051424] border border-[#1E293B] text-slate-600 flex items-center justify-center font-mono">
                    -
                  </div>
                </div>
              ))}
            </div>

            {/* Ticker legends footer */}
            <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-4 border-t border-[#1E293B]/40 pt-3">
              <span>Less Busy</span>
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded bg-[#051424] border border-[#1E293B]" />
                <span className="w-2.5 h-2.5 rounded bg-[#5B8CFF]/30" />
                <span className="w-2.5 h-2.5 rounded bg-[#7C5CFC]/80" />
                <span className="w-2.5 h-2.5 rounded bg-cyan" />
              </div>
              <span>Very Dense</span>
            </div>
          </GlassCard>
        </div>
      </ZenPageShell>
    </AppLayout>
  );
};
