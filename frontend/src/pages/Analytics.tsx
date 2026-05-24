import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { ZenPageShell } from '../components/ZenPageShell';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';
import {
  BarChart3,
  Download,
  Filter,
  Receipt,
  Sparkles,
  TrendingDown
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const { analyticsStats, fetchAnalyticsData, invoices } = useApp();

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

  // --- Real dynamic variables derived from uploaded invoices ---
  const completedInvoices = invoices.filter(
    (inv) => inv.status === 'completed' && inv.ocrResult
  );
  
  const totalSpend = completedInvoices.reduce(
    (sum, inv) => sum + (inv.ocrResult?.amount || 0),
    0
  );

  const totalTax = completedInvoices.reduce(
    (sum, inv) => sum + (inv.ocrResult?.tax || 0),
    0
  );

  const reclaimableTax = completedInvoices
    .filter((inv) =>
      ['Utilities', 'Travel', 'Subscriptions', 'Software'].includes(
        inv.ocrResult?.category || ''
      )
    )
    .reduce((sum, inv) => sum + (inv.ocrResult?.tax || 0), 0);

  const taxRates = completedInvoices
    .filter((inv) => (inv.ocrResult?.amount || 0) > 0)
    .map(
      (inv) =>
        ((inv.ocrResult?.tax || 0) / (inv.ocrResult?.amount || 1)) * 100
    );
  const avgTaxRate =
    taxRates.length > 0
      ? parseFloat(
          (taxRates.reduce((sum, r) => sum + r, 0) / taxRates.length).toFixed(
            1
          )
        )
      : 0.0;

  // --- 1. Smart Purchase Ledger (Strictly Real OCR Extracted Items Only) ---
  const allItems = completedInvoices.flatMap((inv) =>
    (inv.ocrResult?.items || []).map((item) => ({
      ...item,
      merchant: inv.ocrResult?.merchant || 'Merchant',
      category: inv.ocrResult?.category || 'General',
      date: inv.ocrResult?.date || inv.uploadedAt.split('T')[0]
    }))
  );

  // --- 2. Vendor & Merchant Analytics Calculations ---
  const merchantMap: { [key: string]: { amount: number; count: number } } = {};
  completedInvoices.forEach((inv) => {
    const m = inv.ocrResult?.merchant || 'Merchant';
    if (!merchantMap[m]) {
      merchantMap[m] = { amount: 0, count: 0 };
    }
    merchantMap[m].amount += inv.ocrResult?.amount || 0;
    merchantMap[m].count += 1;
  });

  const merchantChartData = Object.entries(merchantMap).map(([name, stats]) => ({
    name,
    Amount: parseFloat(stats.amount.toFixed(2)),
    Transactions: stats.count
  })).sort((a, b) => b.Amount - a.Amount);

  const highestSpendingVendor = merchantChartData[0]?.name || 'N/A';
  const highestSpendAmt = merchantChartData[0]?.Amount || 0;

  const merchantRankings = [...merchantChartData];
  const totalMerchantInvoicesCount = completedInvoices.length;

  // --- 3. Financial Behavior Analytics Calculations ---
  const weekendInvoices = completedInvoices.filter((inv) => {
    const dateStr = inv.ocrResult?.date;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const day = d.getDay();
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  });
  const weekendSpendAmt = weekendInvoices.reduce(
    (sum, inv) => sum + (inv.ocrResult?.amount || 0),
    0
  );
  const weekendPct = totalSpend > 0 ? (weekendSpendAmt / totalSpend) * 100 : 0;

  const avgInvAmt = completedInvoices.length > 0 ? totalSpend / completedInvoices.length : 0;
  const spikes = completedInvoices.filter(
    (inv) => (inv.ocrResult?.amount || 0) > 1.8 * avgInvAmt && (inv.ocrResult?.amount || 0) > 150
  );
  const hasSpikes = spikes.length > 0;
  const spikeInvoice = spikes.sort((a,b) => (b.ocrResult?.amount || 0) - (a.ocrResult?.amount || 0))[0];

  const itemFreq: { [key: string]: number } = {};
  allItems.forEach((item) => {
    const n = item.name.toLowerCase().trim();
    if (n) itemFreq[n] = (itemFreq[n] || 0) + 1;
  });
  const repeatedList = Object.entries(itemFreq)
    .filter(([k, v]) => v > 1)
    .map(([k, v]) => ({ name: k, count: v }));
  const hasRepeated = repeatedList.length > 0;

  const getBehaviorAIInsights = () => {
    const insights = [];
    if (completedInvoices.length === 0) {
      return [
        '💡 Awaiting uploaded invoice scans. Zen AI Behavior engine will parse weekday patterns, spikes, and repeated transactions.',
        '💡 Scans will automatically catalog merchant concentrations and repeated operational outlays.'
      ];
    }

    const categoryGroups: { [key: string]: number } = {};
    completedInvoices.forEach(inv => {
      const c = inv.ocrResult?.category || 'Shopping';
      categoryGroups[c] = (categoryGroups[c] || 0) + (inv.ocrResult?.amount || 0);
    });
    const sortedCats = Object.entries(categoryGroups).sort((a,b) => b[1] - a[1]);
    if (sortedCats.length > 0) {
      const catPercent = Math.round((sortedCats[0][1] / (totalSpend || 1)) * 100);
      insights.push(`🚨 ${sortedCats[0][0]} spending dominates your ledger, occupying ${catPercent}% of all outflows.`);
    }

    if (weekendSpendAmt > 0) {
      insights.push(`💼 Weekend transactions represent ${weekendPct.toFixed(0)}% of total spent (₹${weekendSpendAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}). Consider strict weekday approvals.`);
    } else {
      insights.push('✅ Excellent! All audited transactions occurred during regular business weekdays.');
    }

    if (hasSpikes && spikeInvoice) {
      insights.push(`⚠️ Sudden spending spike: A charge of ₹${spikeInvoice.ocrResult?.amount.toLocaleString()} was processed at ${spikeInvoice.ocrResult?.merchant} on a single purchase. Review details.`);
    }

    if (hasRepeated) {
      insights.push(`🔄 Repeated purchases detected for product "${repeatedList[0].name}" (${repeatedList[0].count} times). Consolidate to monthly bulk orders.`);
    }

    return insights.length > 0 ? insights : [
      '✅ All cost flows are perfectly optimized across standard country indices.',
      '✅ Merchant transactions are steady, displaying zero irregular pricing spikes.'
    ];
  };

  const behaviorInsightsList = getBehaviorAIInsights();

  // Modern Chart Colors
  const CHART_COLORS = ['#22D3EE', '#7C5CFC', '#5B8CFF', '#1ED760', '#FFB547', '#FF5A5F'];

  return (
    <AppLayout>
      <ZenPageShell
        title="Expense"
        highlight="Analytics"
        subtitle="Deep-dive structural charts and item-level audits."
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
        <div className="flex flex-col gap-8">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="border border-glass-border" hoverEffect>
              <div className="flex justify-between items-start text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Tax Paid (VAT)</span>
                  <h3 className="text-2xl font-mono font-extrabold text-white mt-2">
                    ₹{totalTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <span className="text-[9px] text-[#bdc2ff] font-mono mt-1 block">Accumulated across receipts</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan/15 border border-cyan/20 flex items-center justify-center text-cyan shrink-0">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="border border-glass-border" hoverEffect>
              <div className="flex justify-between items-start text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Reclaimable GST</span>
                  <h3 className="text-2xl font-mono font-extrabold text-cyan-glow mt-2">
                    ₹{reclaimableTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h3>
                  <span className="text-[9px] text-[#1ED760] font-mono mt-1 block">Eligible corporate operational tax reclaims</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#1ED760]/15 border border-[#1ED760]/20 flex items-center justify-center text-[#1ED760] shrink-0">
                  <TrendingDown className="w-5 h-5" />
                </div>
              </div>
            </GlassCard>

            <GlassCard className="border border-glass-border" hoverEffect>
              <div className="flex justify-between items-start text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Average Tax Rate</span>
                  <h3 className="text-2xl font-mono font-extrabold text-[#7C5CFC] mt-2">
                    {avgTaxRate.toFixed(1)}%
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">Aggregated country indices</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/15 border border-[#7C5CFC]/20 flex items-center justify-center text-[#7C5CFC] shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* SECTION 1: Smart Purchase Ledger */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#1E293B] pb-3 text-left">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Smart Purchase Ledger</h3>
              <p className="text-[10px] text-slate-500 mt-1">Real product details, merchant categories, and purchase metrics from uploaded invoices</p>
            </div>

            {allItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allItems.map((item, idx) => (
                  <GlassCard key={idx} className="border border-glass-border flex flex-col justify-between !p-5 relative overflow-hidden group hover:border-[#7C5CFC]/40 transition-all duration-300">
                    <div className="flex flex-col gap-3.5 text-left">
                      <div className="flex justify-between items-start gap-4 pb-2.5 border-b border-[#1E293B]/60">
                        <div>
                          <h4 className="text-xs font-bold text-white font-mono leading-tight">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[9px] bg-glass-bg border border-glass-border px-2 py-0.5 rounded text-slate-400 font-mono">
                              {item.category}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              Purchased at {item.merchant}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-cyan-glow font-bold shrink-0">
                          Qty: {item.quantity}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-left font-mono">
                        <div>
                          <span className="text-[8px] text-slate-500 uppercase block">Unit Price</span>
                          <span className="text-xs font-bold text-white">₹{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-500 uppercase block">Total Spend</span>
                          <span className="text-xs font-bold text-cyan-glow">₹{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            ) : (
              <GlassCard className="border border-glass-border !p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
                <Sparkles className="w-8 h-8 text-slate-600 mb-3 animate-pulse" />
                <span className="text-xs font-mono font-bold text-white uppercase block">Awaiting Product Extraction</span>
                <p className="text-[10px] text-slate-500 leading-relaxed max-w-sm mt-2">
                  No line items found. Upload clear bills showing individual product names, quantities, and price breakdowns to automatically populate this section.
                </p>
              </GlassCard>
            )}
          </div>

          {/* SECTION 2: Vendor & Merchant Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Vendor Spend Bar Chart */}
            <GlassCard className="lg:col-span-8 border border-glass-border !p-5 flex flex-col justify-between text-left">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide font-mono">Merchant Volume Distribution</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Total outflows mapped across audited corporate vendors</p>
              </div>

              {completedInvoices.length > 0 ? (
                <div className="h-64 w-full mt-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={merchantChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                      <YAxis
                        stroke="#64748B"
                        fontSize={9}
                        tickLine={false}
                        tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`}
                      />
                      <Tooltip
                        contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#F8FAFC' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, 'Total Spend']}
                      />
                      <Bar dataKey="Amount" maxBarSize={40} radius={[4, 4, 0, 0]}>
                        {merchantChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full mt-6 flex flex-col items-center justify-center bg-[#051424]/40 border border-dashed border-[#1E293B] rounded-2xl">
                  <BarChart3 className="w-8 h-8 text-slate-600 mb-2" />
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">No Scanned Merchants</span>
                </div>
              )}
            </GlassCard>

            {/* Vendor Rankings list */}
            <GlassCard className="lg:col-span-4 border border-glass-border !p-5 flex flex-col justify-between text-left">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide font-mono border-b border-[#1E293B] pb-3 mb-4">Vendor Rankings</h4>
                
                {completedInvoices.length > 0 && highestSpendAmt > 0 ? (
                  <div className="bg-[#051424] border border-[#1E293B] p-3.5 rounded-xl text-left font-mono mb-4">
                    <span className="text-[8px] text-slate-500 uppercase block leading-none">Highest Spending Vendor</span>
                    <h5 className="text-xs font-bold text-white mt-1.5 leading-tight">{highestSpendingVendor}</h5>
                    <span className="text-sm font-bold text-[#FF5A5F] block mt-1">₹{highestSpendAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ) : (
                  <div className="bg-[#051424]/40 border border-dashed border-[#1E293B] p-3.5 rounded-xl text-center font-mono mb-4 text-slate-500">
                    <span className="text-[8px] uppercase block leading-none">Highest Spending Vendor</span>
                    <span className="text-xs mt-2 block font-bold">No data available</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 max-h-52 overflow-y-auto pr-1">
                  {merchantChartData.length > 0 ? (
                    merchantRankings.map((merchant, idx) => {
                      const pct = totalSpend > 0 ? (merchant.Amount / totalSpend) * 100 : 0;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs border-b border-[#1E293B]/20 pb-2">
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-white">{merchant.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">{merchant.Transactions} Invoice{merchant.Transactions > 1 ? 's' : ''}</span>
                          </div>
                          <div className="text-right font-mono shrink-0">
                            <span className="text-white font-bold block">₹{merchant.Amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <span className="text-[9px] text-cyan-glow font-bold block mt-0.5">{pct.toFixed(0)}% Share</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[10px] font-mono text-slate-500 text-center py-8">
                      No merchant logs found.
                    </div>
                  )}
                </div>
              </div>

              <span className="text-[9px] text-slate-500 font-mono text-center block mt-4 border-t border-[#1E293B]/40 pt-3">
                Tracking {totalMerchantInvoicesCount} scanned merchant files
              </span>
            </GlassCard>
          </div>

          {/* SECTION 3: Financial Behavior Analytics */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#1E293B] pb-3 text-left">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Financial Behavior Analytics</h3>
              <p className="text-[10px] text-slate-500 mt-1">Audit schedules, cost spikes, unnecessary repeated purchases, and AI habits reviews</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Behavioral Indicators Grid */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Indicator 1: Weekend Spending */}
                <GlassCard className="border border-glass-border flex flex-col justify-between !p-5 text-left" hoverEffect>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Weekend Spending</span>
                    <h3 className="text-xl font-mono font-black text-white leading-none">
                      ₹{weekendSpendAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h3>
                    <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#7C5CFC] h-full" style={{ width: `${Math.min(weekendPct, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      {weekendSpendAmt > 0
                        ? `Transactions on Saturday/Sunday represent ${weekendPct.toFixed(0)}% of spent capital.`
                        : 'Clean ledger! No weekend non-operational payments detected.'
                      }
                    </p>
                  </div>
                </GlassCard>

                {/* Indicator 2: Sudden Spending Spikes */}
                <GlassCard className="border border-glass-border flex flex-col justify-between !p-5 text-left" hoverEffect>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Spending Spikes</span>
                    <h3 className="text-xl font-mono font-black text-white leading-none">
                      {hasSpikes ? `${spikes.length} Spike${spikes.length > 1 ? 's' : ''}` : '0 Spikes'}
                    </h3>
                    <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-1">
                      <div className="bg-[#FF5A5F] h-full" style={{ width: hasSpikes ? '100%' : '0%' }} />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      {hasSpikes && spikeInvoice
                        ? `Outlier invoice of ₹${spikeInvoice.ocrResult?.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })} found at ${spikeInvoice.ocrResult?.merchant}.`
                        : 'No abnormal transaction-level cost spikes found in history.'
                      }
                    </p>
                  </div>
                </GlassCard>

                {/* Indicator 3: Repeated Purchases */}
                <GlassCard className="border border-glass-border flex flex-col justify-between !p-5 text-left" hoverEffect>
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Repeated Purchases</span>
                    <h3 className="text-xl font-mono font-black text-white leading-none">
                      {hasRepeated ? `${repeatedList.length} Items` : '0 Items'}
                    </h3>
                    <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-1">
                      <div className="bg-cyan h-full" style={{ width: hasRepeated ? '100%' : '0%' }} />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                      {hasRepeated
                        ? `Multiple bills found for "${repeatedList[0].name}". Consolidate orders.`
                        : 'All product procurements display single-occurrence cost profiles.'
                      }
                    </p>
                  </div>
                </GlassCard>
              </div>

              {/* AI Behavior Insights Console */}
              <GlassCard className="lg:col-span-4 border border-glass-border !p-5 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-[#051424] text-left">
                <div>
                  <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan animate-pulse" />
                      <h4 className="text-xs font-bold text-white tracking-wide font-mono">Behavioral AI Console</h4>
                    </div>
                    <span className="text-[8px] bg-secondary/15 border border-secondary/25 text-[#bdc2ff] font-mono px-2 py-0.5 rounded-full uppercase shrink-0">
                      Audit Stream
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {behaviorInsightsList.map((insight, index) => (
                      <div key={index} className="p-3 bg-[#051424] border border-[#1E293B] rounded-xl flex items-start gap-2.5 text-left">
                        <p className="text-[10px] font-mono text-slate-300 leading-relaxed">
                          {insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <span className="text-[8px] font-mono text-slate-500 text-center block mt-4 border-t border-[#1E293B]/40 pt-3">
                  Zen AI Behavior Scans updated Q3 Logs
                </span>
              </GlassCard>
            </div>
          </div>

        </div>
      </ZenPageShell>
    </AppLayout>
  );
};
