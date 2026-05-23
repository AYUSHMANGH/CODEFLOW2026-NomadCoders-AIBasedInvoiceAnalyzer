import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
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
          <div className="h-10 bg-glass-bg rounded-xl w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="h-28 bg-glass-bg rounded-[24px]" />
            <div className="h-28 bg-glass-bg rounded-[24px]" />
            <div className="h-28 bg-glass-bg rounded-[24px]" />
            <div className="h-28 bg-glass-bg rounded-[24px]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="h-80 bg-glass-bg rounded-[24px] lg:col-span-2" />
            <div className="h-80 bg-glass-bg rounded-[24px]" />
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
    monthlySpendData,
    categoryChart,
    recommendations,
    alerts
  } = dashboardStats;

  // Modern Chart Colors (Tailwind v4 mapped)
  const PIE_COLORS = ['#22D3EE', '#7C5CFC', '#5B8CFF', '#1ED760', '#FFB547', '#FF5A5F', '#E2E8F0'];

  // Recent activity subset
  const recentInvoices = invoices.slice(0, 5);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left">
        {/* Banner Section */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-geist font-black text-white">Financial Overview</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time analysis and anomaly detection from {invoicesCount} processed invoices.</p>
          </div>
          
          <button
            onClick={() => navigate('/upload')}
            className="px-4 py-2 text-xs font-bold bg-[#1ED760]/10 hover:bg-[#1ED760]/15 border border-[#1ED760]/30 text-[#1ED760] rounded-xl cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate AI Audit</span>
          </button>
        </div>

        {/* 4 TOP KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Spend */}
          <GlassCard className="border border-glass-border flex flex-col justify-between" hoverEffect>
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
              <div className="bg-primary h-full w-[65%]" />
            </div>
          </GlassCard>

          {/* Processed Count */}
          <GlassCard className="border border-glass-border flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Pending Invoices</span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-2">{pendingInvoices} Invoices</h3>
              </div>
              <span className="text-[9px] bg-warning/15 border border-warning/35 text-warning font-mono font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5">
                24 Flagged
              </span>
            </div>
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="bg-warning h-full w-[35%]" />
            </div>
          </GlassCard>

          {/* Monthly Growth */}
          <GlassCard className="border border-glass-border flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Monthly Growth</span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-2">Low Risk</h3>
              </div>
              <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="bg-[#7C5CFC] h-full w-[85%]" />
            </div>
          </GlassCard>

          {/* Budget Health Score */}
          <GlassCard className="border border-glass-border flex flex-col justify-between" hoverEffect>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Budget Score</span>
                <h3 className="text-2xl font-mono font-extrabold text-[#1ED760] mt-2">{budgetScore} <span className="text-[10px] text-slate-500 font-normal">/1000</span></h3>
              </div>
              <span className="text-[9px] bg-cyan/15 border border-cyan/35 text-cyan font-mono font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5">
                Optimized
              </span>
            </div>
            <div className="w-full bg-[#1E293B] h-1 rounded-full overflow-hidden mt-4">
              <div className="bg-cyan h-full w-[84%]" />
            </div>
          </GlassCard>
        </div>

        {/* MIDDLE SECTION - CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Line Area Chart: Spending Trends */}
          <GlassCard className="lg:col-span-8 border border-glass-border flex flex-col gap-6 justify-between !p-5">
            <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide font-mono">Spending Trends</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Jan to Aug Budgeted vs. Actual outputs</p>
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
                <AreaChart data={monthlySpendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBudgeted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#F8FAFC' }}
                    labelStyle={{ fontWeight: 'bold', color: '#FFF' }}
                  />
                  <Area type="monotone" dataKey="Budgeted" stroke="#22D3EE" strokeWidth={2} fillOpacity={1} fill="url(#colorBudgeted)" />
                  <Area type="monotone" dataKey="Actual" stroke="#7C5CFC" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Donut Chart: Category breakdown */}
          <GlassCard className="lg:col-span-4 border border-glass-border flex flex-col justify-between !p-5">
            <h4 className="text-xs font-bold text-white tracking-wide font-mono border-b border-[#1E293B] pb-3 mb-4">Spending by Category</h4>
            
            <div className="flex-1 flex flex-col justify-center items-center relative h-48">
              <div className="absolute flex flex-col justify-center items-center">
                <span className="text-[10px] text-slate-500 font-mono uppercase leading-none">Total spend</span>
                <span className="text-xl font-mono font-extrabold text-white mt-1.5">₹{totalSpend.toLocaleString()}</span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChart.length > 0 ? categoryChart : [{ name: 'Shopping', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Compact custom legends with percentages */}
            <div className="flex flex-col gap-2.5 mt-4">
              {categoryChart.map((entry, index) => {
                const pct = totalSpend > 0 ? ((entry.value / totalSpend) * 100).toFixed(0) : '0';
                return (
                  <div key={entry.name} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="text-slate-300 font-semibold">{entry.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-mono font-bold">{pct}%</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-2">₹{entry.value.toLocaleString()}</span>
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
                    <th className="pb-3 font-medium">Invoice ID</th>
                    <th className="pb-3 font-medium">Vendor</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
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
                      <td className="py-4.5 font-mono text-slate-300 group-hover:text-cyan">{inv.ocrResult?.invoiceNumber || 'INV-PENDING'}</td>
                      <td className="py-4.5 font-bold text-white relative">
                        <div className="flex items-center gap-1.5">
                          {inv.ocrResult?.merchant || 'Parsing details...'}
                          {inv.ocrResult && (
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_#7C5CFC]" title="Processed by AI" />
                          )}
                        </div>
                      </td>
                      <td className="py-4.5">
                        <span className="px-2 py-0.5 rounded-full bg-glass-bg border border-glass-border text-slate-300 font-semibold text-[10px]">
                          {inv.ocrResult?.category || 'Extracting'}
                        </span>
                      </td>
                      <td className="py-4.5 font-mono font-bold text-white">
                        {inv.ocrResult ? `₹${(inv.ocrResult.amount ?? 0).toFixed(2)}` : '--'}
                      </td>
                      <td className="py-4.5 text-slate-400 font-mono">{inv.ocrResult?.date || inv.uploadedAt.split('T')[0]}</td>
                      <td className="py-4.5">
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
      </div>
    </AppLayout>
  );
};
