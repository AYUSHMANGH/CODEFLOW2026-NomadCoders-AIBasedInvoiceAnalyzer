import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { ZenPageShell, ZenStaggerGrid } from '../components/ZenPageShell';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  ArrowUpRight,
  ShieldCheck,
  Search,
  FileText,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { dashboardStats, fetchDashboardData, invoices } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (!dashboardStats) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col gap-6 animate-pulse">
          <div className="h-10 zen-glass-card rounded-xl w-48 mb-6 !p-0 min-h-[2.5rem]" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 zen-glass-card rounded-2xl !p-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="h-80 zen-glass-card rounded-2xl lg:col-span-2 !p-0" />
            <div className="h-80 zen-glass-card rounded-2xl !p-0" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const {
    totalSpend,
    invoicesCount,
    pendingInvoices,
    budgetScore,
    targetBudget,
    spendingRisk,
    spendPercent,
    monthlySpendData,
    categoryChart,
    recommendations,
    alerts
  } = dashboardStats;

  // Current month label for the chart
  const currentMonthLabel = ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()];

  // Dynamic Y-axis max: 2× the highest of (maxActual spend, targetBudget), minimum 1000
  const maxActual = Math.max(...monthlySpendData.map(d => d.Actual), 0);
  const yAxisMax = Math.max(Math.ceil(Math.max(maxActual, targetBudget ?? 5000) * 2 / 1000) * 1000, 1000);

  // Risk color mapping
  const riskColor = spendingRisk === 'High Risk' ? '#FF5A5F' : spendingRisk === 'Moderate Risk' ? '#FFB547' : '#1ED760';
  const riskBgClass = spendingRisk === 'High Risk' ? 'bg-error/15 border-error/35 text-error' : spendingRisk === 'Moderate Risk' ? 'bg-warning/15 border-warning/35 text-warning' : 'bg-success/15 border-success/35 text-success';

  // Modern Chart Colors (Tailwind v4 mapped)
  const PIE_COLORS = ['#22D3EE', '#7C5CFC', '#5B8CFF', '#1ED760', '#FFB547', '#FF5A5F', '#E2E8F0'];

  // Recent activity subset
  const recentInvoices = invoices.slice(0, 5);

  return (
    <AppLayout>
      <ZenPageShell
        title="Financial"
        highlight="Overview"
        subtitle={`Real-time analysis and anomaly detection from ${invoicesCount} processed invoices.`}
        action={
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="zen-btn-primary px-4 py-2.5 text-xs font-bold text-white rounded-full cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" strokeWidth={2} />
            <span>Generate AI Audit</span>
          </button>
        }
      >
        <ZenStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Spend */}
          <GlassCard className="flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Total Spending</span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-2">₹{totalSpend.toLocaleString()}</h3>
              </div>
              <span className="text-[9px] bg-success/15 border border-success/35 text-success font-mono font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5">
                +12.5%
              </span>
            </div>
            {/* Small subtle progress bar */}
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="bg-primary h-full" style={{ width: `${Math.min(spendPercent, 100)}%` }} />
            </div>
          </GlassCard>

          {/* Pending Invoices */}
          <GlassCard className="flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Pending Invoices</span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-2">{invoicesCount} Invoices</h3>
              </div>
              <span className="text-[9px] bg-warning/15 border border-warning/35 text-warning font-mono font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5">
                {pendingInvoices} Uploaded
              </span>
            </div>
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="bg-warning h-full" style={{ width: `${invoicesCount > 0 ? Math.min(100, (pendingInvoices / Math.max(invoicesCount, 1)) * 100) : 0}%` }} />
            </div>
          </GlassCard>

          {/* Monthly Growth / Risk */}
          <GlassCard className="flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Monthly Growth</span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-2" style={{ color: riskColor }}>{spendingRisk}</h3>
              </div>
              <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="h-full" style={{ width: `${Math.min(spendPercent, 100)}%`, backgroundColor: riskColor }} />
            </div>
          </GlassCard>

          {/* Budget Health Score */}
          <GlassCard className="flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Budget Score</span>
                <h3 className="text-2xl font-mono font-extrabold text-[#1ED760] mt-2">₹{budgetScore.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">/ ₹{(targetBudget ?? 5000).toLocaleString()}</span></h3>
              </div>
              <span className={`text-[9px] border font-mono font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${riskBgClass}`}>
                {spendPercent}%
              </span>
            </div>
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="bg-cyan h-full" style={{ width: `${Math.min(spendPercent, 100)}%` }} />
            </div>
          </GlassCard>
        </ZenStaggerGrid>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <GlassCard className="lg:col-span-8 flex flex-col gap-6 justify-between !p-5">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide font-mono">Spending Trends</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">{currentMonthLabel} — Actual vs. Target Budget</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan" />
                  <span className="text-slate-400">Budgeted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFC]" />
                  <span className="text-slate-400">Actual</span>
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={10}
                    tickLine={false}
                    domain={[0, yAxisMax]}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#F8FAFC' }}
                    labelStyle={{ fontWeight: 'bold', color: '#FFF' }}
                    formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, String(name)]}
                  />
                  {/* Flat horizontal budget reference line */}
                  <ReferenceLine
                    y={targetBudget ?? 5000}
                    stroke="#22D3EE"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    label={{ value: 'Budget', position: 'right', fontSize: 9, fill: '#22D3EE' }}
                  />
                  {/* Actual spend bars — rise only from real invoice data */}
                  <Bar dataKey="Actual" fill="url(#colorActual)" stroke="#7C5CFC" strokeWidth={1.5} radius={[4, 4, 0, 0]} maxBarSize={48} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Donut Chart: Category breakdown */}
          <GlassCard className="lg:col-span-4 border border-glass-border flex flex-col justify-between !p-5">
            <h4 className="text-xs font-bold text-white tracking-wide font-mono border-b border-[#1E293B] pb-3 mb-4">Spending by Category</h4>
            
            <div className="flex-1 flex flex-col justify-center items-center relative h-48">
              <div className="absolute flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase leading-none">Total spend</span>
                <span className={`font-mono font-extrabold text-white mt-1.5 transition-all ${
                  `₹${totalSpend.toLocaleString()}`.length > 12 ? 'text-[11px]' :
                  `₹${totalSpend.toLocaleString()}`.length > 9 ? 'text-xs' :
                  `₹${totalSpend.toLocaleString()}`.length > 7 ? 'text-sm' : 'text-base'
                }`}>
                  ₹{totalSpend.toLocaleString()}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChart.length > 0 ? categoryChart : [{ name: 'Shopping', value: 100 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(categoryChart.length > 0 ? categoryChart : [{ name: 'Shopping', value: 100 }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Compact custom legends with percentages */}
            <div className="flex flex-col gap-2.5 mt-4">
              {categoryChart.map((entry: any, index) => {
                const pct = entry.value.toFixed(0);
                const amount = entry.amount !== undefined ? entry.amount : entry.value;
                return (
                  <div key={entry.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-slate-300 font-semibold">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-mono font-bold">{pct}%</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-2">₹{amount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* BOTTOM SECTION - RECENTS TABLE */}
        <div className="grid grid-cols-1 gap-6">
          <GlassCard className="border border-glass-border !p-5 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono">Recent Activity</h4>
              <button
                onClick={() => navigate('/expenses')}
                className="text-[10px] font-mono text-cyan hover:underline"
              >
                View All Records
              </button>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    <th className="pb-3 font-medium hidden sm:table-cell">Invoice ID</th>
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium hidden md:table-cell">Category</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Date</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Status</th>
                    <th className="pb-3 font-medium text-right">AI Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/40">
                  {recentInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-glass-shine transition-colors duration-200 cursor-pointer group"
                    >
                      <td className="py-4.5 font-mono text-slate-300 group-hover:text-cyan hidden sm:table-cell">{inv.ocrResult?.invoiceNumber || 'INV-PENDING'}</td>
                      <td className="py-4.5 font-bold text-white relative">
                        <div className="flex items-center gap-1.5">
                          {inv.ocrResult?.merchant || 'Parsing details...'}
                          {inv.ocrResult && (
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_#7C5CFC]" title="Processed by AI" />
                          )}
                        </div>
                      </td>
                      <td className="py-4.5 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full bg-glass-bg border border-glass-border text-slate-300 font-semibold text-[10px]">
                          {inv.ocrResult?.category || 'Extracting'}
                        </span>
                      </td>
                      <td className="py-4.5 font-mono font-bold text-white">
                        {inv.ocrResult ? `₹${(inv.ocrResult.amount ?? 0).toFixed(2)}` : '--'}
                      </td>
                      <td className="py-4.5 text-slate-400 font-mono hidden sm:table-cell">{inv.ocrResult?.date || inv.uploadedAt.split('T')[0]}</td>
                      <td className="py-4.5 hidden sm:table-cell">
                        <span
                          className={`
                            px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider inline-block
                            ${
                              inv.status === 'completed'
                                ? 'bg-success/15 border border-success/35 text-success'
                                : inv.status === 'processing'
                                ? 'bg-cyan/15 border border-cyan/35 text-cyan animate-pulse'
                                : 'bg-error/15 border border-error/35 text-error'
                            }
                          `}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-4.5 text-right">
                        {inv.ocrResult?.anomalyDetected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#FFB547] bg-[#FFB547]/10 px-2 py-0.5 rounded-full font-mono border border-[#FFB547]/20 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>FLAGGED</span>
                          </span>
                        ) : inv.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[#1ED760] bg-[#1ED760]/10 px-2 py-0.5 rounded-full font-mono border border-[#1ED760]/20 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>APPROVED</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[10px]">WAITING</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      </ZenPageShell>
    </AppLayout>
  );
};
