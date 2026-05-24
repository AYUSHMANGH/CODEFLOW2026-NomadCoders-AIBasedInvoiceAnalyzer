import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { ZenPageShell } from '../components/ZenPageShell';
import { GlassCard } from '../components/GlassCard';
import {
  TrendingDown,
  Sparkles,
  TrendingUp,
  Percent,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  HelpCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine
} from 'recharts';
import confetti from 'canvas-confetti';

export const Insights: React.FC = () => {
  const {
    dashboardStats,
    fetchDashboardData,
    triggerCustomAISummary,
    budgetLimit,
    invoices
  } = useApp();

  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const completedInvoices = invoices.filter(
    (inv) => inv.status === 'completed' && inv.ocrResult
  );
  
  const totalSpend = completedInvoices.reduce(
    (sum, inv) => sum + (inv.ocrResult?.amount || 0),
    0
  );
  
  const budgetLimitVal = budgetLimit || 5000;

  // --- 1. AI Financial Health Summary Calculations ---
  const ratio = budgetLimitVal > 0 ? totalSpend / budgetLimitVal : 0;
  
  let budgetDeduction = 0;
  if (ratio > 1) {
    budgetDeduction = Math.min(500, (ratio - 1) * 300);
  } else {
    budgetDeduction = ratio * 150;
  }

  const anomaliesCount = completedInvoices.filter(
    (inv) => inv.ocrResult?.anomalyDetected
  ).length;
  const anomalyDeduction = anomaliesCount * 80;

  const subsCount = completedInvoices.filter(
    (inv) => inv.ocrResult?.isSubscription
  ).length;
  const subDeduction = subsCount * 20;

  const rawScore = 1000 - budgetDeduction - anomalyDeduction - subDeduction;
  const healthScore = Math.max(100, Math.min(1000, Math.round(rawScore)));

  let riskLevel: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Low Risk';
  if (ratio > 1.0) riskLevel = 'High Risk';
  else if (ratio > 0.7) riskLevel = 'Moderate Risk';
  else riskLevel = 'Low Risk';

  // Savings opportunities calculations
  let duplicateLeakage = 0;
  const seenInvoices = new Set<string>();
  const duplicateList: typeof invoices = [];

  completedInvoices.forEach((inv) => {
    const key = `${inv.ocrResult?.merchant?.toLowerCase() || ''}_${inv.ocrResult?.amount || 0}_${inv.ocrResult?.date || ''}`;
    const invNum = inv.ocrResult?.invoiceNumber;
    if (seenInvoices.has(key) || (invNum && invNum !== 'N/A' && seenInvoices.has(invNum))) {
      duplicateLeakage += inv.ocrResult?.amount || 0;
      duplicateList.push(inv);
    } else {
      seenInvoices.add(key);
      if (invNum && invNum !== 'N/A') {
        seenInvoices.add(invNum);
      }
    }
  });

  const anomalyLeakage = completedInvoices
    .filter((inv) => inv.ocrResult?.anomalyDetected)
    .reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);

  const subInvoices = completedInvoices.filter(
    (inv) =>
      inv.ocrResult?.isSubscription ||
      inv.ocrResult?.category === 'Subscriptions' ||
      inv.ocrResult?.category === 'Software'
  );
  const subTotalAmt = subInvoices.reduce(
    (sum, inv) => sum + (inv.ocrResult?.amount || 0),
    0
  );

  const savingsOpportunity = parseFloat(
    (duplicateLeakage + anomalyLeakage * 0.5 + subTotalAmt * 0.15).toFixed(2)
  );
  const displaySavingsOpportunity =
    savingsOpportunity > 0 ? savingsOpportunity : parseFloat((totalSpend * 0.12).toFixed(2));

  // Dynamic Category Mapping
  const mapCategory = (
    cat?: string
  ): 'Food' | 'Travel' | 'Software' | 'Utilities' | 'Office' | 'Misc' => {
    if (!cat) return 'Misc';
    const c = cat.toLowerCase();
    if (c.includes('food') || c.includes('meal') || c.includes('dining') || c.includes('restaurant')) return 'Food';
    if (c.includes('travel') || c.includes('flight') || c.includes('taxi') || c.includes('hotel') || c.includes('cab')) return 'Travel';
    if (c.includes('software') || c.includes('subscription') || c.includes('saas') || c.includes('license') || c.includes('aws') || c.includes('cloud')) return 'Software';
    if (c.includes('utility') || c.includes('utilities') || c.includes('internet') || c.includes('electricity') || c.includes('water')) return 'Utilities';
    if (c.includes('office') || c.includes('supplies') || c.includes('stationery')) return 'Office';
    return 'Misc';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Food': return '🍔';
      case 'Travel': return '✈️';
      case 'Software': return '💻';
      case 'Utilities': return '⚡';
      case 'Office': return '📎';
      default: return '📦';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Food': return '#FFB547';
      case 'Travel': return '#5B8CFF';
      case 'Software': return '#22D3EE';
      case 'Utilities': return '#7C5CFC';
      case 'Office': return '#1ED760';
      default: return '#94A3B8';
    }
  };

  // Generate dynamic AI Insight
  const getDynamicAIInsight = () => {
    if (completedInvoices.length === 0) {
      return 'Upload invoices or receipts to run automated audit scanning and generate custom financial health insights.';
    }
    let insightStr = '';
    if (ratio > 1.0) {
      insightStr += `CRITICAL: Spend exceeds budget target by ${Math.round((ratio - 1) * 100)}%. `;
    } else if (ratio > 0.8) {
      insightStr += `WARNING: Budget utilization is high at ${Math.round(ratio * 100)}%. `;
    } else {
      insightStr += `SUCCESS: Spend levels are healthy at ${Math.round(ratio * 100)}% of standard budget limit. `;
    }

    if (duplicateLeakage > 0) {
      insightStr += `Identified ₹${duplicateLeakage.toLocaleString()} in duplicate billing instances. `;
    }
    if (anomaliesCount > 0) {
      insightStr += `Detected ${anomaliesCount} anomalous transactions representing ₹${anomalyLeakage.toLocaleString()} in potential risk. `;
    }
    
    // Find top category
    const catGroup: { [key: string]: number } = {};
    completedInvoices.forEach((inv) => {
      const cat = mapCategory(inv.ocrResult?.category);
      catGroup[cat] = (catGroup[cat] || 0) + (inv.ocrResult?.amount || 0);
    });
    const sorted = Object.entries(catGroup).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) {
      insightStr += `Largest cost center is ${sorted[0][0]} representing ${Math.round((sorted[0][1] / (totalSpend || 1)) * 100)}% of audited spend. `;
    }

    insightStr += `Actioning our smart audits can unlock ₹${displaySavingsOpportunity.toLocaleString()} in estimated savings.`;
    return insightStr;
  };

  // --- 2. Smart Spending Audits Calculations ---
  const auditsList: Array<{
    title: string;
    severity: 'Critical' | 'Warning' | 'Info';
    leakage: number;
    recommendation: string;
  }> = [];

  // Duplicates detection
  if (duplicateLeakage > 0) {
    auditsList.push({
      title: 'Duplicate/Repeated Expense',
      severity: 'Critical',
      leakage: duplicateLeakage,
      recommendation: `Duplicate invoice numbers or identical transaction metadata found. Settle billing claims from the merchant to claw back overcharges.`
    });
  }

  // Unusual High Spending detection
  const averageInvoiceAmt = completedInvoices.length > 0 ? totalSpend / completedInvoices.length : 0;
  const highInvoices = completedInvoices.filter(
    (inv) => (inv.ocrResult?.amount || 0) > 1.8 * averageInvoiceAmt && (inv.ocrResult?.amount || 0) > 200
  );
  if (highInvoices.length > 0) {
    const maxHigh = Math.max(...highInvoices.map((inv) => inv.ocrResult?.amount || 0));
    const highestVendor = highInvoices.find((inv) => inv.ocrResult?.amount === maxHigh)?.ocrResult?.merchant || 'Merchant';
    auditsList.push({
      title: 'Unusual High Spending',
      severity: 'Warning',
      leakage: maxHigh * 0.2,
      recommendation: `High-value outlier of ₹${maxHigh.toLocaleString()} processed for ${highestVendor} (average invoice size: ₹${Math.round(averageInvoiceAmt).toLocaleString()}). Review deliverables structure.`
    });
  }

  // Subscription waste
  if (subTotalAmt > 0) {
    auditsList.push({
      title: 'Subscription/Vendor Waste',
      severity: 'Warning',
      leakage: subTotalAmt * 0.15,
      recommendation: `Active recurring SaaS tools total ₹${subTotalAmt.toLocaleString()} monthly. Consolidate seat counts or move monthly plans to annual contracts to save 15%.`
    });
  }

  // Sudden category spikes
  const categoryPercentages: { [key: string]: number } = {};
  completedInvoices.forEach((inv) => {
    const mapped = mapCategory(inv.ocrResult?.category);
    categoryPercentages[mapped] = (categoryPercentages[mapped] || 0) + (inv.ocrResult?.amount || 0);
  });
  
  let spikeCategory = '';
  let spikePercent = 0;
  Object.entries(categoryPercentages).forEach(([cat, amt]) => {
    const pct = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
    if (pct > 40) {
      spikeCategory = cat;
      spikePercent = pct;
    }
  });
  
  if (spikeCategory) {
    auditsList.push({
      title: 'Sudden Category Spike',
      severity: 'Critical',
      leakage: categoryPercentages[spikeCategory] * 0.25,
      recommendation: `Expenditure in ${spikeCategory} occupies a dominant ${Math.round(spikePercent)}% share of total outflows. Impose pre-approval thresholds.`
    });
  }

  if (auditsList.length === 0) {
    auditsList.push({
      title: 'Operational Cost Zones',
      severity: 'Info',
      leakage: 0,
      recommendation: 'All cost flows are balanced. Average sizes, duplicate matching, and subscription records occupy nominal risk parameters.'
    });
  }

  // --- 3. Expense Category Intelligence Calculations ---
  const CATEGORIES: ('Food' | 'Travel' | 'Software' | 'Utilities' | 'Office' | 'Misc')[] = [
    'Food', 'Travel', 'Software', 'Utilities', 'Office', 'Misc'
  ];

  const targetAllocations = {
    Food: 0.10,
    Travel: 0.20,
    Software: 0.35,
    Utilities: 0.15,
    Office: 0.10,
    Misc: 0.10
  };

  const categoryData = CATEGORIES.map((cat) => {
    const actualSpend = completedInvoices
      .filter((inv) => mapCategory(inv.ocrResult?.category) === cat)
      .reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);

    const percent = totalSpend > 0 ? (actualSpend / totalSpend) * 100 : 0;
    const targetLimit = budgetLimitVal * targetAllocations[cat];
    const deviation = targetLimit > 0 ? ((actualSpend - targetLimit) / targetLimit) * 100 : 0;

    let behaviorInsight = 'No active transactions detected in this billing ledger.';
    if (actualSpend > 0) {
      switch (cat) {
        case 'Food':
          behaviorInsight = actualSpend > targetLimit
            ? 'Food overheads exceed targets. Restrict corporate card lunch sessions.'
            : 'Food outlays are completely optimized and run well under target allocations.';
          break;
        case 'Travel':
          behaviorInsight = actualSpend > targetLimit
            ? 'Travel spending is high. Require economy bookings 14 days in advance.'
            : 'Corporate travel expenses are steady and maintain strong cost efficiency.';
          break;
        case 'Software':
          behaviorInsight = actualSpend > targetLimit
            ? 'SaaS spending is elevated. Audit seats, cancel duplicates, or move to annual billing.'
            : 'Software investments are tight and represent a highly focused SaaS footprint.';
          break;
        case 'Utilities':
          behaviorInsight = actualSpend > targetLimit
            ? 'Utility bills exceed baseline allocations. Turn off unused AWS instances.'
            : 'Utilities and cloud servers are operating within nominal cost windows.';
          break;
        case 'Office':
          behaviorInsight = actualSpend > targetLimit
            ? 'Office supply costs are high. Restrict hardware purchases for the quarter.'
            : 'Office materials and hardware acquisition costs are minimal.';
          break;
        default:
          behaviorInsight = actualSpend > targetLimit
            ? 'Misc bills represent an operational leak. Tag invoice details to trace merchants.'
            : 'Misc expenditures occupy low-volume margins. Audit parameters clear.';
      }
    }

    return {
      category: cat,
      actualSpend,
      percent,
      deviation,
      insight: behaviorInsight
    };
  });

  // --- 4. Predictive Forecasting Calculations ---
  const currentDay = Math.max(1, new Date().getDate());
  const predictedSpend = currentDay > 0 ? (totalSpend / currentDay) * 30 : 0;
  const forecastDiff = predictedSpend - budgetLimitVal;

  const forecastChartData = [1, 7, 14, 21, 30].map((day) => {
    let actual = null;
    if (day <= currentDay) {
      actual = completedInvoices
        .filter((inv) => {
          const dStr = inv.ocrResult?.date;
          if (!dStr) return false;
          const d = new Date(dStr);
          return !isNaN(d.getTime()) && d.getDate() <= day;
        })
        .reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);

      if (actual === 0 && totalSpend > 0) {
        actual = (totalSpend / currentDay) * day;
      }
    }
    const projected = (totalSpend / Math.max(1, currentDay)) * day;

    return {
      name: `Day ${day}`,
      Actual: actual !== null ? parseFloat(actual.toFixed(2)) : undefined,
      Projected: parseFloat(projected.toFixed(2)),
      Budget: budgetLimitVal
    };
  });

  const handleGenerateSummary = async () => {
    setGenerating(true);
    try {
      await triggerCustomAISummary();
      confetti({
        particleCount: 80,
        spread: 60,
        colors: ['#22D3EE', '#7C5CFC']
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const riskColor = riskLevel === 'High Risk' ? '#FF5A5F' : riskLevel === 'Moderate Risk' ? '#FFB547' : '#1ED760';

  return (
    <AppLayout>
      <ZenPageShell
        title="AI"
        highlight="Insights"
        subtitle="Autonomous financial audits and predictive forecasting models run by Zen AI."
      >
        <div className="flex flex-col gap-8">
          
          {/* SECTION 1: AI Financial Health Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Health Info Card */}
            <GlassCard className="lg:col-span-8 border border-glass-border flex flex-col justify-between bg-gradient-to-r from-primary/10 via-[#0F172A] to-[#0F172A] !p-6">
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider pl-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  <span>AI Financial Health Summary</span>
                </span>
                <h3 className="text-2xl font-geist font-bold text-white leading-tight text-left">
                  Your business liquidity is standing at <span style={{ color: riskColor }}>{riskLevel}</span> status.
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-mono text-left">
                  {getDynamicAIInsight()}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#1E293B]">
                <div className="text-left font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block">Total Spend</span>
                  <span className="text-sm font-bold text-white">₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block">Monthly Budget</span>
                  <span className="text-sm font-bold text-cyan-glow">₹{budgetLimitVal.toLocaleString()}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block">Risk Exposure</span>
                  <span className="text-sm font-bold" style={{ color: riskColor }}>{riskLevel}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block">Savings Opportunity</span>
                  <span className="text-sm font-bold text-[#1ED760]">₹{displaySavingsOpportunity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </GlassCard>

            {/* Radial Health Score Chart */}
            <GlassCard className="lg:col-span-4 border border-glass-border flex flex-col justify-between items-center text-center !p-6">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono self-start mb-4 border-b border-[#1E293B] pb-2 w-full text-left">
                Financial Health Index
              </h4>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-[#1E293B]" />
                <div 
                  className="absolute inset-1.5 rounded-full border-4 border-t-transparent border-l-transparent animate-spin-slow"
                  style={{ borderColor: riskColor }}
                />
                
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-mono font-black text-white">{healthScore}</span>
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mt-1 block">Score / 1000</span>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5">
                <span 
                  className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: `${riskColor}1A`,
                    borderColor: `${riskColor}33`,
                    color: riskColor
                  }}
                >
                  {healthScore > 750 ? 'Growth Ready' : healthScore > 500 ? 'Caution Active' : 'Stressed'}
                </span>
                <span className="text-[9px] font-mono font-bold bg-cyan/10 border border-cyan/20 text-cyan px-2.5 py-1 rounded-full">
                  {riskLevel}
                </span>
              </div>
            </GlassCard>
          </div>

          {/* SECTION 2: Smart Spending Audits */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#1E293B] pb-3 text-left">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Smart Spending Audits</h3>
              <p className="text-[10px] text-slate-500 mt-1">Real-time expenditure anomalies and cost leakage indicators</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {auditsList.map((audit, idx) => (
                <GlassCard key={idx} className="border border-glass-border flex flex-col justify-between !p-5 relative overflow-hidden group hover:border-cyan/40 transition-all duration-300">
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2.5 border-b border-[#1E293B]">
                      <span className="text-[11px] font-bold text-white font-mono text-left">{audit.title}</span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        audit.severity === 'Critical' ? 'bg-error/10 border-error/20 text-error' :
                        audit.severity === 'Warning' ? 'bg-warning/10 border-warning/20 text-warning' :
                        'bg-success/10 border-success/20 text-success'
                      }`}>
                        {audit.severity}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 text-left font-mono">
                      <span className="text-[10px] text-slate-500">Estimated Leakage</span>
                      <span className="text-sm font-bold text-error">
                        {audit.leakage > 0 ? `₹${audit.leakage.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₹0.00'}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed text-left">
                      {audit.recommendation}
                    </p>
                  </div>

                  <div className="w-full h-1 bg-[#1E293B] rounded-full overflow-hidden mt-6">
                    <div 
                      className={`h-full ${
                        audit.severity === 'Critical' ? 'bg-error' :
                        audit.severity === 'Warning' ? 'bg-warning' :
                        'bg-success'
                      }`} 
                      style={{ width: audit.severity === 'Critical' ? '100%' : audit.severity === 'Warning' ? '60%' : '20%' }} 
                    />
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* SECTION 3: Expense Category Intelligence */}
          <div className="flex flex-col gap-4">
            <div className="border-b border-[#1E293B] pb-3 text-left">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">Expense Category Intelligence</h3>
              <p className="text-[10px] text-slate-500 mt-1">Real-time expenditure limits, weight allocations, and behavioral insight audits</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryData.map((catItem, idx) => {
                const catColor = getCategoryColor(catItem.category);
                const isOverBudget = catItem.deviation > 0;
                return (
                  <GlassCard key={idx} className="border border-glass-border flex flex-col justify-between !p-5 relative overflow-hidden group hover:border-[#7C5CFC]/40 transition-all duration-300">
                    <div className="flex flex-col gap-3.5">
                      <div className="flex justify-between items-center pb-2.5 border-b border-[#1E293B]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getCategoryIcon(catItem.category)}</span>
                          <span className="text-xs font-bold text-white font-mono">{catItem.category}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {catItem.percent.toFixed(1)}% Share
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="flex flex-col font-mono">
                          <span className="text-[9px] text-slate-500 uppercase">Spend</span>
                          <span className="text-xs font-bold text-white">₹{catItem.actualSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col font-mono text-right">
                          <span className="text-[9px] text-slate-500 uppercase">Target Status</span>
                          <span className={`text-[10px] font-bold ${isOverBudget ? 'text-error' : catItem.actualSpend > 0 ? 'text-success' : 'text-slate-500'}`}>
                            {catItem.actualSpend === 0 ? 'No spend' : isOverBudget ? `+${catItem.deviation.toFixed(0)}% Over` : `${Math.abs(catItem.deviation).toFixed(0)}% Under`}
                          </span>
                        </div>
                      </div>

                      {/* Small visual bar indicator */}
                      <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden mt-1">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${Math.min(catItem.percent * 2.5, 100)}%`,
                            backgroundColor: catColor
                          }} 
                        />
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed text-left italic border-t border-[#1E293B]/40 pt-2.5">
                        "{catItem.insight}"
                      </p>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: Predictive Forecasting */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Prediction Stats and summary */}
            <GlassCard className="lg:col-span-4 border border-glass-border flex flex-col justify-between gap-5 !p-5 relative overflow-hidden bg-gradient-to-b from-[#0F172A] to-[#051424]">
              {generating && <div className="absolute top-0 left-0 w-full h-1 glass-shimmer" />}
              
              <div>
                <div className="flex justify-between items-center border-b border-[#1E293B] pb-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan animate-pulse" />
                    <h4 className="text-xs font-bold text-white tracking-wide font-mono">Predictive AI Analyst</h4>
                  </div>
                  <span className="text-[8px] bg-secondary/15 border border-secondary/25 text-[#bdc2ff] font-mono px-2 py-0.5 rounded-full uppercase shrink-0">
                    30-Day Outlook
                  </span>
                </div>

                <div className="flex flex-col gap-4 text-left font-mono border-b border-[#1E293B]/60 pb-4 mb-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Current Monthly Spend</span>
                    <span className="font-bold text-white">₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Linear Forecasted Spend</span>
                    <span className="font-bold text-cyan-glow">₹{predictedSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Monthly Budget Threshold</span>
                    <span className="font-bold text-white">₹{budgetLimitVal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 bg-[#051424] border border-[#1E293B] rounded-2xl flex flex-col items-start gap-1 text-left">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Month-End Budget Outlook</span>
                  <h3 className={`text-base font-mono font-extrabold mt-1 ${forecastDiff > 0 ? 'text-error' : 'text-success'}`}>
                    {forecastDiff > 0 
                      ? `🔴 Over Budget by ₹${forecastDiff.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      : `🟢 Under Budget by ₹${Math.abs(forecastDiff).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                    }
                  </h3>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-2.5">
                    {forecastDiff > 0 
                      ? "Your current spending velocity suggests an overage. Settle active saas subscriptions or hold office purchase pipelines to realign outflows."
                      : "Great work! Your current spending trajectory keeps you safely within limits. Surpluses can be safely reallocated."
                    }
                  </p>
                </div>

                {/* AI Executive Summary Report */}
                {dashboardStats?.aiSummary && (
                  <div className="mt-4 p-4 rounded-2xl bg-[#0F172A]/85 border border-[#7C5CFC]/30 shadow-[0_0_15px_rgba(124,92,252,0.1)] flex flex-col items-start gap-2 text-left relative overflow-hidden group hover:border-[#22D3EE]/50 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-[#7C5CFC]/10 to-transparent rounded-bl-full pointer-events-none" />
                    <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold text-[#bdc2ff] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] animate-pulse" />
                      <span>Zen AI Budget Summary</span>
                    </div>
                    <p className="text-[10.5px] text-slate-200 leading-relaxed font-mono mt-1 pr-1.5 select-text">
                      {dashboardStats.aiSummary}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={generating}
                className="w-full py-3.5 bg-gradient-to-r from-cyan to-primary disabled:opacity-40 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-lg shadow-cyan/15 hover:shadow-cyan/35 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Executive AI Refresh</span>
              </button>
            </GlassCard>

            {/* Smooth visual Recharts forecasting chart */}
            <GlassCard className="lg:col-span-8 flex flex-col gap-6 justify-between !p-5">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono">Predictive Capital Outflows</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">30-Day Cumulative Forecast vs. Target Budget</p>
                </div>
                <div className="flex items-center gap-3.5 text-[9px] font-mono shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-0.5 border border-dashed border-cyan inline-block" />
                    <span className="text-slate-400">Budget Limit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7C5CFC]" />
                    <span className="text-slate-400">Actual Outflow</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE]" />
                    <span className="text-slate-400">AI Forecast Projection</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorActualFlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C5CFC" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#7C5CFC" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={10}
                      tickLine={false}
                      domain={[0, Math.max(Math.ceil(Math.max(predictedSpend, budgetLimitVal) * 1.3 / 1000) * 1000, 1000)]}
                      tickFormatter={(v: number) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : `${v}`}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0F172A', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#F8FAFC' }}
                      labelStyle={{ fontWeight: 'bold', color: '#FFF' }}
                      formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, String(name)]}
                    />
                    
                    <ReferenceLine
                      y={budgetLimitVal}
                      stroke="#FF5A5F"
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      label={{ value: 'Budget Limit', position: 'right', fontSize: 9, fill: '#FF5A5F', fontWeight: 'bold' }}
                    />

                    {/* Projected fill area */}
                    <Area 
                      type="monotone" 
                      dataKey="Projected" 
                      stroke="#22D3EE" 
                      strokeWidth={2} 
                      strokeDasharray="3 3"
                      fill="url(#colorForecast)" 
                    />

                    {/* Actual cumulative spend up to today */}
                    <Area 
                      type="monotone" 
                      dataKey="Actual" 
                      stroke="#7C5CFC" 
                      strokeWidth={3} 
                      fill="url(#colorActualFlow)" 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

        </div>
      </ZenPageShell>
    </AppLayout>
  );
};
