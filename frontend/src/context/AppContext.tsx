import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const getMonthName = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

export interface Invoice {
  id: string;
  fileName: string;
  fileUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  ocrResult?: {
    merchant: string;
    date: string;
    invoiceNumber: string;
    amount: number;
    currency: string;
    tax: number;
    confidence: number;
    category: string;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    anomalyDetected: boolean;
    anomalyDescription?: string;
    isSubscription: boolean;
    isValidInvoice?: boolean;
    validationError?: string;
    extractedText?: string;
  };
}

interface DashboardStats {
  totalSpend: number;
  invoicesCount: number;
  pendingInvoices: number;
  budgetScore: number;
  targetBudget: number;
  spendingRisk: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  spendPercent: number;
  savingsOpportunity: number;
  monthlySpendData: Array<{ name: string; Budgeted: number; Actual: number }>;
  categoryChart: Array<{ name: string; value: number; amount?: number }>;
  merchantChart: Array<{ name: string; amount: number }>;
  aiSummary: string;
  recommendations: Array<{ title: string; description: string; impact: string; category: string }>;
  alerts: Array<{ category: string; amount: number; threshold: number; percentage: number }>;
}

interface AnalyticsStats {
  trendData: Array<any>;
  taxSummary: {
    totalTax: number;
    taxReclaimable: number;
    taxRateAverage: number;
  };
  heatmapData: Array<any>;
}

interface AppContextType {
  invoices: Invoice[];
  activeUploads: Array<{ id: string; name: string; size: number; progress: number; status: string }>;
  dashboardStats: DashboardStats | null;
  analyticsStats: AnalyticsStats | null;
  budgetLimit: number;
  loading: boolean;
  serverOffline: boolean;
  fetchDashboardData: () => Promise<void>;
  fetchAnalyticsData: () => Promise<void>;
  uploadFile: (file: File) => Promise<string>;
  triggerOCR: (id: string) => Promise<void>;
  updateInvoiceMeta: (id: string, ocrData: any) => Promise<void>;
  reprocessInvoiceDoc: (id: string) => Promise<void>;
  deleteInvoiceDoc: (id: string) => Promise<void>;
  triggerCustomAISummary: () => Promise<void>;
  sendAdvisorMessage: (message: string, history: Array<{ role: string; content: string }>) => Promise<any>;
  updateBudgetLimit: (limit: number) => Promise<void>;
  sendHighRiskAlert: (spend: number, target: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:5000/api';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activeUploads, setActiveUploads] = useState<any[]>([]);
  const [budgetLimit, setBudgetLimit] = useState<number>(5000);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [analyticsStats, setAnalyticsStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [serverOffline, setServerOffline] = useState<boolean>(false);

  // Checks backend server health and loads initial data
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // One-time clear of legacy dummy invoices from localStorage
      const saved = localStorage.getItem('financelens_invoices');
      if (saved && (saved.includes('inv-001') || saved.includes('aws-billing-oct23.pdf'))) {
        localStorage.removeItem('financelens_invoices');
      }

      try {
        const response = await fetch('http://localhost:5000/health');
        if (response.ok) {
          setServerOffline(false);
          await loadInvoicesFromServer();
          await fetchDashboardData();
          await fetchAnalyticsData();
        } else {
          throw new Error('Server health check failed');
        }
      } catch (err) {
        console.warn('FinanceLens Node Server offline - running in stateful client-side Sandbox mode!');
        setServerOffline(true);
        loadInvoicesFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initData();
    } else {
      setInvoices([]);
      setDashboardStats(null);
      setAnalyticsStats(null);
      setLoading(false);
    }
  }, [user]);

  // Sync client-side calculations when invoices change in Sandbox mode
  useEffect(() => {
    if (serverOffline && invoices.length > 0) {
      calculateClientDashboard();
      calculateClientAnalytics();
      localStorage.setItem('financelens_invoices', JSON.stringify(invoices));
    }
  }, [invoices, budgetLimit, serverOffline]);

  // Load Invoices from Node Server
  const loadInvoicesFromServer = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error('Failed to load invoices from server', e);
    }
  };

  // Load from LocalStorage fallback
  const loadInvoicesFromLocalStorage = () => {
    const saved = localStorage.getItem('financelens_invoices');
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (e) {
        loadMockInitialInvoices();
      }
    } else {
      loadMockInitialInvoices();
    }
  };

  const loadMockInitialInvoices = () => {
    const initialMocks: Invoice[] = [];
    setInvoices(initialMocks);
    localStorage.setItem('financelens_invoices', JSON.stringify(initialMocks));
  };

  // Dashboard Stats Calculations for Sandbox mode
  const calculateClientDashboard = () => {
    const completed = invoices.filter(i => i.status === 'completed');
    const totalSpend = completed.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0);
    // Pending = all invoices that are not yet completed (uploaded but unprocessed)
    const pendingCount = invoices.length;

    // --- Spending Risk Calculation ---
    const spendRatio = budgetLimit > 0 ? totalSpend / budgetLimit : 0;
    const spendPercent = parseFloat((spendRatio * 100).toFixed(1));
    let spendingRisk: 'Low Risk' | 'Moderate Risk' | 'High Risk';
    if (spendRatio < 0.7) {
      spendingRisk = 'Low Risk';
    } else if (spendRatio <= 1.0) {
      spendingRisk = 'Moderate Risk';
    } else {
      spendingRisk = 'High Risk';
    }

    // Trigger email alert if High Risk (fire-and-forget, non-blocking)
    if (spendingRisk === 'High Risk') {
      sendHighRiskAlert(totalSpend, budgetLimit).catch(() => {});
    }

    // --- Budget Score: shown as ₹spent / ₹target ---
    // budgetScore stores the raw totalSpend; Dashboard renders it as ₹x / ₹target
    const budgetScore = parseFloat(totalSpend.toFixed(2));

    // Category chart mapping
    const catGroup: { [key: string]: number } = {};
    completed.forEach(item => {
      const cat = item.ocrResult?.category || 'Shopping';
      catGroup[cat] = (catGroup[cat] || 0) + (item.ocrResult?.amount || 0);
    });

    const categoryChart = Object.keys(catGroup).map(c => ({
      name: c,
      value: totalSpend > 0 ? parseFloat(((catGroup[c] / totalSpend) * 100).toFixed(2)) : 0,
      amount: parseFloat(catGroup[c].toFixed(2))
    }));

    // Top merchants mapping
    const merchGroup: { [key: string]: number } = {};
    completed.forEach(item => {
      const m = item.ocrResult?.merchant || 'Merchant';
      merchGroup[m] = (merchGroup[m] || 0) + (item.ocrResult?.amount || 0);
    });

    const merchantChart = Object.keys(merchGroup).map(m => ({
      name: m,
      amount: parseFloat(merchGroup[m].toFixed(2))
    })).sort((a,b) => b.amount - a.amount).slice(0, 5);

    // AI advice recommendations
    const recommendations: any[] = [];
    const alerts: any[] = [];

    // Category threshold rule
    Object.keys(catGroup).forEach(c => {
      const amt = catGroup[c];
      const pct = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
      if (pct > 40) {
        alerts.push({
          category: c,
          amount: parseFloat(amt.toFixed(2)),
          threshold: parseFloat((totalSpend * 0.4).toFixed(2)),
          percentage: parseFloat(pct.toFixed(1))
        });
        recommendations.push({
          title: `Overspending on ${c}`,
          description: `Expenses in ${c} represent a significant ${pct.toFixed(1)}% share of your Q3 cash outlays. Consolidate your vendors.`,
          impact: 'High',
          category: c
        });
      }
    });

    // Subscriptions check
    const subs = completed.filter(i => i.ocrResult?.isSubscription);
    const subTotal = subs.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0);
    if (subTotal > 0) {
      recommendations.push({
        title: 'Cancel Duplicate Subscriptions',
        description: `You have ${subs.length} recurring SaaS platforms active, billing a total of ₹${subTotal.toFixed(2)} monthly. De-provision idle licenses immediately.`,
        impact: 'Medium',
        category: 'Subscriptions'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Optimize Savings Ratio',
        description: 'Your cash flow is strong. Re-allocate 15% of surplus capital to higher-yield index positions.',
        impact: 'Low',
        category: 'Shopping'
      });
    }

    const savingsOpportunity = parseFloat((totalSpend * 0.12).toFixed(2));

    // --- Spending Graph: X-axis with actual invoice dates or baseline first day of month ---
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentMonthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][currentMonth];

    const parseInvoiceDate = (dateStr?: string) => {
      if (!dateStr) return null;
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return {
          year: parseInt(match[1], 10),
          month: parseInt(match[2], 10) - 1,
          day: parseInt(match[3], 10)
        };
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return {
        year: d.getFullYear(),
        month: d.getMonth(),
        day: d.getDate()
      };
    };

    const currentMonthInvoices = completed.filter(item => {
      const p = parseInvoiceDate(item.ocrResult?.date);
      return p && p.year === currentYear && p.month === currentMonth;
    });

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const weekBoundaries = [7, 14, 21, daysInMonth];
    const todayDay = new Date().getDate();
    const lastWeekLabel = todayDay > 22 ? `${todayDay.toString().padStart(2, '0')} ${currentMonthName}` : `22 ${currentMonthName}`;
    const weekLabels = [
      `01 ${currentMonthName}`,
      `08 ${currentMonthName}`,
      `15 ${currentMonthName}`,
      lastWeekLabel
    ];

    const monthlySpendData = weekLabels.map((label, idx) => {
      const weekEndDay = weekBoundaries[idx];

      const cumActual = currentMonthInvoices
        .filter(item => {
          const p = parseInvoiceDate(item.ocrResult?.date);
          return p && p.day <= weekEndDay;
        })
        .reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0);

      return {
        name: label,
        Budgeted: budgetLimit,
        Actual: parseFloat(cumActual.toFixed(2))
      };
    });

    setDashboardStats({
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      invoicesCount: invoices.length,
      pendingInvoices: pendingCount,
      budgetScore,
      targetBudget: budgetLimit,
      spendingRisk,
      spendPercent,
      savingsOpportunity,
      monthlySpendData,
      categoryChart,
      merchantChart,
      aiSummary: `Local Sandbox Analysis: You have audited ${completed.length} receipts representing ₹${totalSpend.toFixed(2)}. Budget risk level: ${spendingRisk}. Spending is at ${spendPercent}% of ₹${budgetLimit} target.`,
      recommendations,
      alerts
    });
  };

  // Analytics Stats Calculations for Sandbox mode
  const calculateClientAnalytics = () => {
    const completed = invoices.filter(i => i.status === 'completed');
    
    // Stacked categories breakdown trends (initially zero dummy data!)
    const trendData = [
      { month: 'May', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 },
      { month: 'Jun', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 },
      { month: 'Jul', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 },
      { month: 'Aug', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 }
    ];

    completed.forEach(item => {
      const month = getMonthName(item.ocrResult?.date);
      const monthTrend = trendData.find(t => t.month === month);
      if (monthTrend) {
        const cat = item.ocrResult?.category || 'Shopping';
        if (cat in monthTrend) {
          (monthTrend as any)[cat] = parseFloat(((monthTrend as any)[cat] + (item.ocrResult?.amount || 0)).toFixed(2));
        }
      }
    });

    let totalTax = 0;
    let taxReclaimable = 0;

    completed.forEach(item => {
      totalTax += (item.ocrResult?.tax || 0);
      if (['Utilities', 'Travel', 'Subscriptions'].includes(item.ocrResult?.category || '')) {
        taxReclaimable += (item.ocrResult?.tax || 0);
      }
    });

    const heatmapData = [
      { day: 'Mon', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
      { day: 'Tue', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
      { day: 'Wed', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
      { day: 'Thu', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
      { day: 'Fri', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 }
    ];

    completed.forEach(item => {
      const date = new Date(item.ocrResult?.date || '');
      if (!isNaN(date.getTime())) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayName = days[date.getDay()];
        const dayTrend = heatmapData.find(h => h.day === dayName);
        if (dayTrend) {
          const hours = ['9 AM', '12 PM', '3 PM', '6 PM'];
          const hash = (item.ocrResult?.invoiceNumber || '').split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0);
          const slot = hours[hash % hours.length];
          (dayTrend as any)[slot] = parseFloat(((dayTrend as any)[slot] + (item.ocrResult?.amount || 0)).toFixed(2));
        }
      }
    });

    setAnalyticsStats({
      trendData,
      taxSummary: {
        totalTax: parseFloat(totalTax.toFixed(2)),
        taxReclaimable: parseFloat(taxReclaimable.toFixed(2)),
        taxRateAverage: 9.5
      },
      heatmapData
    });
  };

  // Send High Risk budget alert email via backend
  const sendHighRiskAlert = async (spend: number, target: number): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/alert/high-risk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spend, target, overspend: parseFloat((spend - target).toFixed(2)) })
      });
    } catch (e) {
      // Silently log — alert failure must not block dashboard
      console.warn('High Risk email alert could not be sent:', e);
    }
  };

  // API Call wrappers
  const fetchDashboardData = async () => {
    if (serverOffline) {
      calculateClientDashboard();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard`);
      if (response.ok) {
        const data = await response.json();
        // Enrich server response with risk fields if not already present
        const totalSpend: number = data.totalSpend || 0;
        const target: number = data.targetBudget || budgetLimit;
        const ratio = target > 0 ? totalSpend / target : 0;
        const spendPercent = parseFloat((ratio * 100).toFixed(1));
        let spendingRisk: 'Low Risk' | 'Moderate Risk' | 'High Risk';
        if (ratio < 0.7) spendingRisk = 'Low Risk';
        else if (ratio <= 1.0) spendingRisk = 'Moderate Risk';
        else spendingRisk = 'High Risk';

        if (spendingRisk === 'High Risk') {
          sendHighRiskAlert(totalSpend, target).catch(() => {});
        }

        setDashboardStats({
          ...data,
          targetBudget: target,
          spendingRisk,
          spendPercent,
          // Budget score = raw spend amount for ₹x/₹y display
          budgetScore: parseFloat(totalSpend.toFixed(2))
        });
      }
    } catch (e) {
      setServerOffline(true);
      calculateClientDashboard();
    }
  };

  const fetchAnalyticsData = async () => {
    if (serverOffline) {
      calculateClientAnalytics();
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/analytics`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsStats(data);
      }
    } catch (e) {
      setServerOffline(true);
      calculateClientAnalytics();
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const tempId = `inv-${Math.random().toString(36).substring(2, 9)}`;
    const newUpload = {
      id: tempId,
      name: file.name,
      size: file.size,
      progress: 20,
      status: 'Uploading'
    };

    setActiveUploads(prev => [...prev, newUpload]);

    // Animate progress bar simulation
    const interval = setInterval(() => {
      setActiveUploads(prev => prev.map(u => {
        if (u.id === tempId) {
          const nextProg = u.progress + 25;
          return {
            ...u,
            progress: nextProg >= 100 ? 100 : nextProg,
            status: nextProg >= 100 ? 'Processing' : 'Uploading'
          };
        }
        return u;
      }));
    }, 400);

    if (serverOffline) {
      // Simulate client local upload
      await new Promise(resolve => setTimeout(resolve, 1800));
      clearInterval(interval);

      const localNew: Invoice = {
        id: tempId,
        fileName: file.name,
        fileUrl: '',
        status: 'processing',
        uploadedAt: new Date().toISOString()
      };

      setInvoices(prev => [localNew, ...prev]);
      setActiveUploads(prev => prev.filter(u => u.id !== tempId));
      return tempId;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);

      if (response.ok) {
        const data = await response.json();
        setInvoices(prev => [data, ...prev]);
        setActiveUploads(prev => prev.filter(u => u.id !== tempId));
        return data.id;
      } else {
        throw new Error('Upload failed on server');
      }
    } catch (e) {
      clearInterval(interval);
      // Fallback state on error
      const localNew: Invoice = {
        id: tempId,
        fileName: file.name,
        fileUrl: '',
        status: 'processing',
        uploadedAt: new Date().toISOString()
      };
      setInvoices(prev => [localNew, ...prev]);
      setActiveUploads(prev => prev.filter(u => u.id !== tempId));
      return tempId;
    }
  };

  const triggerOCR = async (id: string) => {
    // If offline
    if (serverOffline) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const record = invoices.find(i => i.id === id);
      const name = record?.fileName || 'general.png';
      const lower = name.toLowerCase();
      
      // Validation Check for mock mode
      const ext = name.split('.').pop()?.toLowerCase();
      const isAllowedExt = ['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '');
      
      const invalidKeywords = ['cat', 'dog', 'notes', 'unrelated', 'book', 'sample-text', 'code', 'script', 'todo', 'photo', 'avatar', 'logo'];
      const matchedInvalid = invalidKeywords.find(kw => lower.includes(kw));
      
      let isValid = true;
      let errorMsg = '';
      
      if (!isAllowedExt && ext !== name) {
        isValid = false;
        errorMsg = `The file extension ".${ext}" is not supported. FinanceLens AI currently supports PDF, PNG, and JPEG documents under 25MB.`;
      } else if (matchedInvalid) {
        isValid = false;
        errorMsg = `Verification failed: The document appears to contain "${matchedInvalid}" content. Only clear receipts, bills, and SaaS statements are supported. Please ensure you upload a valid financial invoice showing merchant, date, and items.`;
      }

      if (!isValid) {
        setInvoices(prev => prev.map(inv => {
          if (inv.id === id) {
            return {
              ...inv,
              status: 'failed',
              ocrResult: {
                isValidInvoice: false,
                validationError: errorMsg,
                merchant: 'N/A',
                date: new Date().toISOString().split('T')[0],
                invoiceNumber: 'N/A',
                amount: 0,
                currency: 'USD',
                tax: 0,
                confidence: 0,
                category: 'Shopping',
                items: [],
                anomalyDetected: false,
                isSubscription: false
              }
            };
          }
          return inv;
        }));
        return;
      }
      
      // Seed invoice metadata
      let merchant = 'General Services';
      let category = 'Shopping';
      let amount = 145.00;
      let tax = 14.50;
      let isSub = false;
      let items = [{ name: 'Operational Services Pack', quantity: 1, price: 130.50, total: 130.50 }];

      if (lower.includes('aws') || lower.includes('amazon')) {
        merchant = 'Amazon Web Services';
        category = 'Utilities';
        amount = 1489.12;
        tax = 148.91;
        isSub = true;
        items = [
          { name: 'EC2 Compute Engine vCPU Hours', quantity: 720, price: 1.25, total: 900.00 },
          { name: 'S3 Standard Storage', quantity: 4, price: 23.00, total: 92.00 },
          { name: 'RDS Managed Database', quantity: 1, price: 497.12, total: 497.12 }
        ];
      } else if (lower.includes('delta') || lower.includes('flight')) {
        merchant = 'Delta Air Lines';
        category = 'Travel';
        amount = 850.00;
        tax = 68.00;
        items = [
          { name: 'Flight JFK to SFO roundtrip', quantity: 1, price: 782.00, total: 782.00 },
          { name: 'Luggage Fees', quantity: 1, price: 68.00, total: 68.00 }
        ];
      }

      setInvoices(prev => prev.map(inv => {
        if (inv.id === id) {
          return {
            ...inv,
            status: 'completed',
            ocrResult: {
              isValidInvoice: true,
              merchant,
              date: new Date().toISOString().split('T')[0],
              invoiceNumber: `INV-2026-${100000 + Math.round(Math.random() * 899999)}`,
              amount,
              currency: 'USD',
              tax,
              confidence: 99.2,
              category,
              items,
              anomalyDetected: category === 'Travel',
              anomalyDescription: category === 'Travel' ? 'Potential duplicate booking detected.' : undefined,
              isSubscription: isSub,
              extractedText: `MOCK CLIENT-SIDE OCR TEXT SCAN\n-----------------------------\nMerchant: ${merchant}\nInvoice: INV-2026-${id}\nTotal Amount: $${amount}\n`
            }
          };
        }
        return inv;
      }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(prev => prev.map(inv => inv.id === id ? data : inv));
      }
    } catch (e) {
      console.error('Failed to run extract', e);
    }
  };

  const updateInvoiceMeta = async (id: string, ocrResult: any) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          ocrResult: {
            ...inv.ocrResult,
            ...ocrResult
          }
        };
      }
      return inv;
    }));

    if (serverOffline) return;

    try {
      await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrResult })
      });
    } catch (e) {
      console.error('Server syncing failed', e);
    }
  };

  const reprocessInvoiceDoc = async (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'processing' } : inv));
    
    if (serverOffline) {
      await triggerOCR(id);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/invoices/${id}/reprocess`, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setInvoices(prev => prev.map(inv => inv.id === id ? data : inv));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteInvoiceDoc = async (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    
    if (serverOffline) return;

    try {
      await fetch(`${API_BASE_URL}/invoices/${id}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const triggerCustomAISummary = async () => {
    if (serverOffline) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (dashboardStats) {
        const completed = invoices.filter(i => i.status === 'completed');
        const totalSpend = completed.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0);
        const percent = budgetLimit > 0 ? (totalSpend / budgetLimit) * 100 : 0;
        
        let localSummary = "";
        if (completed.length === 0) {
          localSummary = `No active invoices detected in the workspace. Upload SaaS statements, bills, or travel receipts to let Zen AI analyze your budget health. Currently, your spending is ₹0 of your ₹${budgetLimit.toLocaleString()} monthly limit, leaving 100% of your runway intact.`;
        } else {
          if (percent > 100) {
            localSummary += `🔴 CRITICAL OVERSPEND (Sandbox Mode): Your budget is extremely tight, having consumed ₹${totalSpend.toLocaleString()} which is ${percent.toFixed(0)}% of your ₹${budgetLimit.toLocaleString()} monthly limit. `;
          } else if (percent > 80) {
            localSummary += `⚠️ BUDGET WARNING (Sandbox Mode): Your budget is highly compressed, with utilization sitting at ${percent.toFixed(0)}% (₹${totalSpend.toLocaleString()} spent out of ₹${budgetLimit.toLocaleString()}). `;
          } else {
            localSummary += `🟢 OPTIMIZED SPENDING (Sandbox Mode): Your outlays are running perfectly on track, consuming only ${percent.toFixed(0)}% of your ₹${budgetLimit.toLocaleString()} monthly allowance. `;
          }

          // Find top category
          const catGroup: { [key: string]: number } = {};
          completed.forEach(item => {
            const cat = item.ocrResult?.category || 'Shopping';
            catGroup[cat] = (catGroup[cat] || 0) + (item.ocrResult?.amount || 0);
          });
          const sortedCats = Object.entries(catGroup).sort((a, b) => b[1] - a[1]);

          if (sortedCats.length > 0) {
            const [topCat, topAmt] = sortedCats[0];
            const topPct = (topAmt / totalSpend) * 100;
            localSummary += `We detected a heavy concentration in ${topCat} representing ₹${topAmt.toLocaleString()} (${topPct.toFixed(0)}% of your spend). `;
            
            if (topCat === 'Subscriptions' || topCat === 'Software') {
              localSummary += `Actionable optimization: Consolidate active SaaS licenses or negotiate annual pricing to immediately save up to 15%. `;
            } else if (topCat === 'Travel') {
              localSummary += `Actionable optimization: Restrict late-notice flight bookings and set pre-approval guidelines for employee rideshares. `;
            } else if (topCat === 'Utilities') {
              localSummary += `Actionable optimization: Audit cloud servers (like S3/EC2) and shut down idle developer machines after 6 PM. `;
            } else {
              localSummary += `Actionable optimization: Review recent high-value items in ${topCat} to prune non-essential procurement. `;
            }
          }

          const anomalies = completed.filter(inv => inv.ocrResult?.anomalyDetected);
          if (anomalies.length > 0) {
            localSummary += `Additionally, you have ${anomalies.length} anomalous transactions (e.g. at ${anomalies[0].ocrResult?.merchant || 'Merchant'}) which represent active leakage.`;
          } else {
            localSummary += `All parsed invoices comply perfectly with standard compliance metrics, keeping your risk index highly optimized.`;
          }
        }

        setDashboardStats({
          ...dashboardStats,
          aiSummary: localSummary
        });
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/insights/summary`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (dashboardStats) {
          setDashboardStats({
            ...dashboardStats,
            aiSummary: data.aiSummary
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const sendAdvisorMessage = async (message: string, history: Array<{ role: string; content: string }>) => {
    if (serverOffline) {
      // Direct local simulation chatbot
      await new Promise(resolve => setTimeout(resolve, 1000));
      const q = message.toLowerCase().trim();

      // Greeting detection — return a warm welcome before any financial checks
      const isGreeting = /^(hi|hello|hey|howdy|greetings|namaste|good\s*(morning|afternoon|evening|day)|what'?s?\s*up|yo)\b/.test(q);
      if (isGreeting) {
        return {
          message: `Hello! I'm **Zen AI Analyst**, your personal financial intelligence advisor.\n\nI'm here to help you with:\n- Analyzing your invoices and expense patterns\n- Identifying overspending and budget anomalies\n- Optimizing subscriptions and recurring charges\n- Tax and GST advisory\n- Investment and savings recommendations\n\nYou currently have **${invoices.length}** invoice(s) in your workspace. Go ahead — ask me anything about your finances!`,
          suggestedPrompts: ['Where am I overspending?', 'Monthly summary', 'How to save?']
        };
      }

      const totalSpend = invoices.reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);
      
      let response = `I've analyzed your **FinanceLens AI Workspace** (Total spend audited: **₹${totalSpend.toFixed(2)}** across **${invoices.length} invoices**). `;
      let suggestedPrompts = ['Where am I overspending?', 'How to save?', 'Monthly summary'];

      const isBadInvestmentOrOverspend = q.includes('overspend') || q.includes('leak') || q.includes('spend') || q.includes('bad') || q.includes('investment') || q.includes('waste');
      const isSaveOrOptimize = q.includes('save') || q.includes('optimize') || q.includes('recommend') || q.includes('how much') || q.includes('how to save') || q.includes('saving');
      const isSummary = q.includes('summary') || q.includes('monthly') || q.includes('report') || q.includes('health') || q.includes('index');

      const completedInvoices = invoices.filter(inv => inv.status === 'completed' && inv.ocrResult);
      const anomalies = completedInvoices.filter(inv => inv.ocrResult?.anomalyDetected);
      const subs = completedInvoices.filter(inv => inv.ocrResult?.isSubscription);
      const highestSpend = completedInvoices.length > 0 ? [...completedInvoices].sort((a, b) => (b.ocrResult?.amount || 0) - (a.ocrResult?.amount || 0))[0] : null;

      // ── Conversation Memory ────────────────────────────────────────────────
      // Detect short affirmative / negative replies and route them using the
      // last assistant message as context so the chat "remembers" what it asked.
      const isAffirmative = /^(yes|yeah|sure|ok|okay|yep|yup|absolutely|definitely|please|go ahead|of course|alright|sounds good|do it|let'?s (do it|go)|proceed|show me|tell me more|i do|i would|yes please)\b/.test(q);
      const isNegative    = /^(no|nope|nah|not really|not now|skip|never mind|nevermind|cancel|stop|no thanks|don'?t)\b/.test(q);

      const lastAssistantContent =
        [...history].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';

      if ((isAffirmative || isNegative) && lastAssistantContent) {
        // Build category breakdown helper (reused below)
        const buildCategoryBreakdown = () => {
          const catGroup: { [key: string]: number } = {};
          completedInvoices.forEach(inv => {
            const cat = inv.ocrResult?.category || 'Shopping';
            catGroup[cat] = (catGroup[cat] || 0) + (inv.ocrResult?.amount || 0);
          });
          return Object.keys(catGroup)
            .sort((a, b) => catGroup[b] - catGroup[a])
            .map(cat => `- **${cat}**: ₹${catGroup[cat].toFixed(2)}`)
            .join('\n');
        };

        if (isAffirmative) {
          // ── YES replies ──────────────────────────────────────────────────
          if (lastAssistantContent.includes('scenario simulator')) {
            return {
              message: `Let's do it! Here's how to use the **Scenario Simulator** on the right panel:\n\n- **Monthly Savings Increase** slider — drag to your target savings rate (5–50%)\n- **Expense Reduction Target** slider — set your cost-cutting goal (5–40%)\n\nThe **12-month projected cash gain** updates in real time. When the numbers look right, hit **Implement This Strategy** to lock them in.\n\nWould you like me to suggest optimal starting values based on your current spend of ₹${totalSpend.toFixed(2)}?`,
              suggestedPrompts: ['Suggest optimal slider values', 'Audit recurring subscriptions', 'Monthly summary']
            };
          }
          if (lastAssistantContent.includes('compare') || lastAssistantContent.includes('benchmark') || lastAssistantContent.includes('regional')) {
            return {
              message: `Here's how your spending stacks up against typical SMB benchmarks:\n\n- **Your Total Audited Spend**: ₹${totalSpend.toFixed(2)} across ${invoices.length} invoice(s)\n- **SMB Industry Benchmark**: ₹3,500–₹6,000/month\n- **Active Subscriptions**: ${subs.length > 0 ? `${subs.length} recurring charge(s) detected` : 'None flagged yet'}\n- **Anomaly Rate**: ${anomalies.length} flag(s) out of ${completedInvoices.length} audited invoices\n\nWould you like a full breakdown by expense category?`,
              suggestedPrompts: ['Break down by category', 'Which subscriptions to cut?', 'How to save more?']
            };
          }
          if (lastAssistantContent.includes('category') || lastAssistantContent.includes('breakdown')) {
            const breakdown = buildCategoryBreakdown();
            return {
              message: `Here's your **Category Breakdown** across all audited invoices:\n\n${breakdown || '- No completed invoices yet'}\n\n**Total**: ₹${totalSpend.toFixed(2)}\n\nWould you like tips on reducing the highest category?`,
              suggestedPrompts: ['Tips to reduce top category', 'Audit subscriptions', 'Monthly summary']
            };
          }
          if (lastAssistantContent.includes('subscription') || lastAssistantContent.includes('saas')) {
            const subTotal = subs.reduce((s, inv) => s + (inv.ocrResult?.amount || 0), 0);
            return {
              message: `Here's your **Subscription Audit**:\n\n${subs.length > 0
                ? subs.map(s => `- **${s.ocrResult?.merchant}** — ₹${s.ocrResult?.amount?.toFixed(2)}/month`).join('\n')
                : '- No active subscriptions flagged yet'}\n\n${subs.length > 0 ? `**Total recurring burn**: ₹${subTotal.toFixed(2)}/month\n\nConverting monthly plans to annual contracts typically saves **15–20%**. Want me to run those numbers?` : 'Upload more invoices and I can flag any recurring charges automatically.'}`,
              suggestedPrompts: ['Run annual contract savings', 'Open Scenario Simulator', 'Where am I overspending?']
            };
          }
          // Generic affirmative fallback
          return {
            message: `Sure! What would you like to explore next?\n\nI can help you with:\n- A detailed expense category breakdown\n- Savings and optimization strategies\n- Tax and GST advisory\n- Investment recommendations`,
            suggestedPrompts: ['Where am I overspending?', 'Monthly summary', 'How to save?']
          };
        }

        if (isNegative) {
          // ── NO replies ───────────────────────────────────────────────────
          if (lastAssistantContent.includes('scenario simulator')) {
            return {
              message: `No problem — the Scenario Simulator is always available on the right whenever you need it.\n\nWhat else can I help you with?`,
              suggestedPrompts: ['Where am I overspending?', 'Monthly summary', 'Audit subscriptions']
            };
          }
          if (lastAssistantContent.includes('category') || lastAssistantContent.includes('breakdown')) {
            return {
              message: `Alright! What else would you like to look into?\n\nI can help with overspending analysis, savings strategies, tax advisory, or investment recommendations.`,
              suggestedPrompts: ['Where am I overspending?', 'How to save?', 'Monthly summary']
            };
          }
          if (lastAssistantContent.includes('subscription')) {
            return {
              message: `Understood! Let me know if there's anything else you'd like to review — spending patterns, tax records, or budget optimization.`,
              suggestedPrompts: ['Where am I overspending?', 'Monthly summary', 'Tax advisory']
            };
          }
          // Generic negative fallback
          return {
            message: `Understood, no problem! Let me know if there's something else I can help you with.\n\nI'm here to assist with any financial queries about your invoices, expenses, or savings strategies.`,
            suggestedPrompts: ['Where am I overspending?', 'Monthly summary', 'How to save?']
          };
        }
      }
      // ── End Conversation Memory ────────────────────────────────────────────

      if (isBadInvestmentOrOverspend) {
        if (completedInvoices.length > 0) {
          response += `\n\nHere is a live audit of your risk factors and low-yield outlays:\n`;
          if (anomalies.length > 0) {
            response += `*   ⚠️ **Flagged Anomalies (${anomalies.length})**: We detected high-risk items. Most notably, the invoice from **${anomalies[0].ocrResult?.merchant}** (₹${anomalies[0].ocrResult?.amount.toFixed(2)}) is flagged: *"${anomalies[0].ocrResult?.anomalyDescription || 'Potential duplication / pricing mismatch'}"*.\n`;
          } else {
            response += `*   ✅ **Anomalies**: Good news! No explicit fraudulent or duplicate invoices have been flagged by the AI scanner so far.\n`;
          }
          
          if (subs.length > 0) {
            response += `*   🔄 **Recurring SaaS Licenses**: You have active subscriptions with **${subs[0].ocrResult?.merchant}** (₹${subs[0].ocrResult?.amount.toFixed(2)}) and others. If these licenses are underutilized, they represent a recurring operational leak.\n`;
          }

          if (highestSpend) {
            response += `*   📉 **Highest Single Investment**: A payment of **₹${highestSpend.ocrResult?.amount.toFixed(2)}** to **${highestSpend.ocrResult?.merchant}** was processed. Let's verify if the deliverables align with corporate yield expectations.\n`;
          }
          
          response += `\n**Zen Action Recommendation**: I recommend auditing the recurring seat counts and reviewing the flagged invoice from **${anomalies[0]?.ocrResult?.merchant || 'your travel partners'}** to claim potential refund credits.`;
          suggestedPrompts = ['How to save on these?', 'Explain my highest spend item', 'Audit recurring subscriptions'];
        } else {
          response += `\n\nSpending analysis highlights **AWS** cloud hosting utilities and **Delta Air Lines** travel costs as major concentrations. Ensure idle compute capacities are terminated.`;
          suggestedPrompts = ['Explain the Delta Air Lines anomaly', 'Optimize cloud pricing'];
        }
      } else if (isSaveOrOptimize) {
        if (completedInvoices.length > 0) {
          const immediateSavings = (totalSpend * 0.15);
          response += `\n\nHere is your custom **Savings Blueprint** compiled from your active receipts:\n`;
          response += `1.  **Immediate Optimization Target**: Moving standard service categories to contracted vendors will yield an estimated **₹${immediateSavings.toFixed(2)}** in annual savings (15% yield target).\n`;
          
          if (subs.length > 0) {
            const subSavings = subs.reduce((sum, s) => sum + (s.ocrResult?.amount || 0) * 0.2, 0);
            response += `2.  **SaaS License Pruning**: Consolidating recurring profiles for **${subs[0].ocrResult?.merchant}** and converting monthly billing cycles to annual contracts will save up to **20%** (approx. **₹${subSavings.toFixed(2)}/year**).\n`;
          } else {
            response += `2.  **Establish Savings Buffer**: We recommend routing 10% of cash reserves to secure corporate liquidity pools.\n`;
          }

          response += `3.  **Anomalous Invoice Refunds**: Settling the flagged anomalies or duplicate entries could immediately return capital straight to your balance sheet.\n\nWould you like to load these parameters into the **Scenario Simulator** in the right-hand panel to calculate Q4 yields?`;
          suggestedPrompts = ['Open Scenario Simulator', 'Audit my recurring subscriptions', 'What is my budget score?'];
        } else {
          response += `\n\nAudits indicate 3 unused seats in **Figma Inc.** De-provision seats immediately for a recurring yield of **+₹840/year**.`;
          suggestedPrompts = ['Open Scenario Simulator', 'Audit my recurring subscriptions'];
        }
      } else if (isSummary) {
        const budgetScore = completedInvoices.length > 0 ? (totalSpend > 5000 ? 540 : 880) : 840;
        response += `\n\nHere is your **Executive Summary** for the current billing cycle:\n`;
        response += `*   **Total Outflows**: ₹${totalSpend.toFixed(2)}\n`;
        response += `*   **Audited Items**: ${invoices.length} Receipts / Invoices processed\n`;
        response += `*   **Finance Health Index**: **${budgetScore} / 1000 (${budgetScore > 800 ? 'Optimized' : 'Stressed'} for Q3 Expansion)**\n`;
        response += `*   **Flagged Anomalies**: ${anomalies.length} items under manual review.\n\nYour budget is in ${budgetScore > 800 ? 'strong' : 'critical'} standing. Take active control of your subscription cycles to optimize bottom-line health.`;
        suggestedPrompts = ['Where am I overspending?', 'Run high-fidelity OCR scan', 'Export workspace data'];
      } else {
        // 1. Dynamic Tax/GST Query Match
        const isTaxQuery = q.includes('tax') || q.includes('gst') || q.includes('vat') || q.includes('reclaim') || q.includes('taxable');
        const isBudgetQuery = q.includes('budget') || q.includes('limit') || q.includes('threshold') || q.includes('burn');
        
        // 2. Structural Financial Consultant Queries
        const isCreditScoreQuery = q.includes('credit') || q.includes('cibil') || q.includes('score') || q.includes('rating');
        const isInvestmentQuery = q.includes('mutual fund') || q.includes('stock') || q.includes('portfolio') || q.includes('yield') || q.includes('equity') || q.includes('investing') || q.includes('shares') || q.includes('fd');
        const isDebtQuery = q.includes('loan') || q.includes('debt') || q.includes('leverage') || q.includes('borrow') || q.includes('funding') || q.includes('mortgage') || q.includes('banks');
        const isCashFlowQuery = q.includes('cash flow') || q.includes('runway') || q.includes('burn rate') || q.includes('liquidity') || q.includes('cashflow') || q.includes('capital');
        const isInflationQuery = q.includes('inflation') || q.includes('recession') || q.includes('economy') || q.includes('economic') || q.includes('market');
        const isRetirementQuery = q.includes('retirement') || q.includes('epf') || q.includes('ppf') || q.includes('pension') || q.includes('nps');

        // 3. Dynamic Merchant Match
        const matchedMerchantInv = completedInvoices.find(inv => {
          const mName = inv.ocrResult?.merchant?.toLowerCase() || '';
          return mName.length > 2 && q.includes(mName);
        });

        // 4. Dynamic Category Match
        const CATEGORIES = ['Food', 'Shopping', 'Travel', 'Medical', 'Utilities', 'Entertainment', 'Subscriptions', 'Education'];
        const matchedCategoryName = CATEGORIES.find(cat => q.includes(cat.toLowerCase()));

        // Detect irrelevant (non-financial) queries and return a polite redirect
        const financialKeywords = [
          'invoice', 'receipt', 'expense', 'payment', 'merchant', 'financial', 'finance',
          'money', 'rupee', 'rupees', 'dollar', 'audit', 'bill', 'transaction', 'account',
          'spend', 'cost', 'price', 'amount', 'total', 'budget', 'save', 'saving', 'tax',
          'gst', 'income', 'revenue', 'profit', 'loss', 'invest', 'subscription', 'category',
          'ledger', 'vendor', 'fee', 'charge', 'cash', 'fund', 'stock', 'equity', 'interest',
          'loan', 'debt', 'credit', 'salary', 'wage', 'purchase', 'buy', 'sell', 'rate', 'statement'
        ];
        const hasAnyFinancialIntent =
          isTaxQuery || isBudgetQuery || isCreditScoreQuery || isInvestmentQuery ||
          isDebtQuery || isCashFlowQuery || isInflationQuery || isRetirementQuery ||
          !!matchedMerchantInv || !!matchedCategoryName ||
          financialKeywords.some(kw => q.includes(kw));

        if (!hasAnyFinancialIntent) {
          return {
            message: `I'm **Zen AI Analyst**, specialized in financial intelligence and invoice analysis.\n\nI'm not able to help with that query, but here's what I can do for you:\n- Audit your invoices and receipts\n- Identify spending patterns and anomalies\n- Budget optimization and savings strategies\n- Tax and GST advisory\n- Investment and retirement planning\n\nPlease ask me something related to your finances and I'll get right on it!`,
            suggestedPrompts: ['Where am I overspending?', 'Monthly expense summary', 'How to save more?']
          };
        }

        if (isCreditScoreQuery) {
          response += `\n\n**Dun & Bradstreet & Credit Score Advisory**:\n`;
          response += `Commercial and personal credit scores are the gateway to institutional scale. To optimize them:\n`;
          response += `*   **Vendor Net-30 Compliance**: Paying suppliers within early windows directly triggers positive commercial reports.\n`;
          response += `*   **Maintain Low Utilization**: Keep your commercial credit card and overdraft utilization strictly below **30%**.\n`;
          response += `*   **Prune Redundant Loans**: Avoid submitting multiple credit inquiry applications within a short 90-day window, as it indicates liquidity stress.\n\n*Zen Consultant Tip*: For personal credit (CIBIL/FICO), pay revolving card balances *before* the statement generation date to report a 10% utilization rate!`;
          suggestedPrompts = ['How is my budget score calculated?', 'Where are my bad investments?', 'Monthly summary'];
        } else if (isInvestmentQuery) {
          response += `\n\n**Corporate Treasury & Mutual Fund Blueprint**:\n`;
          response += `Leaving corporate surpluses in a standard zero-yield current account is an operational leak. Let's redirect capital:\n`;
          response += `*   **Liquid Mutual Funds**: Perfect for parking OpEx runway. They feature T+1 redemption and outpace standard current accounts.\n`;
          response += `*   **Arbitrage Funds**: Tax-efficient equity-savings wrappers suited for companies in high tax brackets.\n`;
          response += `*   **Treasury Bills (T-Bills)**: Risk-free government-backed debt, ideal for holding non-operational reserves (91 to 364 days).\n\n*Zen Advisory Recommendation*: Lock 3 months of emergency buffer in liquid funds, and allocate 20% of profits to diversified growth mutual funds.`;
          suggestedPrompts = ['Where are my bad investments?', 'Open Scenario Simulator', 'How to save?'];
        } else if (isDebtQuery) {
          response += `\n\n**Debt Optimization & Leverage Review**:\n`;
          response += `Leverage is a powerful engine if structured correctly. To maximize your capital structure:\n`;
          response += `*   **Debt-to-Equity Ratio**: Keep this metric under **1.5** to qualify for premium banking lines.\n`;
          response += `*   **WACC Optimization**: Secure a business line of credit *while your balance sheet is healthy*—banks reject applicants during cash flow emergencies.\n`;
          response += `*   **Match Asset Durations**: Funded equipment or land should use long-term debt, while inventory should use short-term trade credit.\n\nWould you like to model a debt scenario in our Scenario Simulator?`;
          suggestedPrompts = ['Open Scenario Simulator', 'Audit my SaaS expenses', 'Where am I overspending?'];
        } else if (isCashFlowQuery) {
          response += `\n\n**Cash Flow Runway & Liquidity Advisory**:\n`;
          response += `Cash flow is the literal oxygen of operations. Let's optimize yours:\n`;
          response += `*   **Runway Target**: Maintain at least **3 to 6 months** of total operational OpEx parked in liquid reserves.\n`;
          response += `*   **Accelerate DSO (Days Sales Outstanding)**: Offer clients a 2% discount for payments completed within 10 days to collect receivables faster.\n`;
          response += `*   **Decelerate DPO (Days Payable Outstanding)**: Work with your key vendors to extend payment windows to 45 days, keeping liquidity in your accounts longer.`;
          suggestedPrompts = ['View my monthly budget limit', 'Explain my monthly expense breakdown', 'How to save?'];
        } else if (isInflationQuery) {
          response += `\n\n**Inflation Hedging & Macro Strategy**:\n`;
          response += `In a high-inflation environment, holding idle cash represents an active loss in purchasing power. Hedging tactics:\n`;
          response += `*   **Lock long-term rates**: Convert monthly subscriptions and S3 utility hosting (e.g. AWS) to reserved, long-term contracts.\n`;
          response += `*   **Lock Vendor Pricing**: Renegotiate supply agreements to freeze standard transaction rates for 12 to 18 months.\n`;
          response += `*   **Audit Leaks**: Eliminate duplicate SaaS tools to expand your net profit buffer.`;
          suggestedPrompts = ['Audit recurring subscriptions', 'Where are my bad investments?', 'Monthly summary'];
        } else if (isRetirementQuery) {
          response += `\n\n**Retirement wealth & Tax Shield Advice (PPF, NPS)**:\n`;
          response += `Building wealth requires maximizing tax exemptions. Focus on these premium avenues:\n`;
          response += `*   **Public Provident Fund (PPF)**: Invest ₹1.5L early in April to capitalize on compound interest. Returns are tax-exempt (EEE structure).\n`;
          response += `*   **National Pension System (NPS)**: Route employee contributions via corporate NPS models to claim additional tax benefits under Section 80CCD Portfolios.\n`;
          response += `*   **Asset Allocation**: Maintain an equity mutual fund weight of (100 minus your age) to beat inflation over multi-decade horizons.`;
          suggestedPrompts = ['Export tax records', 'How much to save?', 'Monthly summary'];
        } else if (isTaxQuery && completedInvoices.length > 0) {
          let totalTax = completedInvoices.reduce((sum, inv) => sum + (inv.ocrResult?.tax || 0), 0);
          let reclaimable = completedInvoices.reduce((sum, inv) => {
            if (['Utilities', 'Travel', 'Subscriptions'].includes(inv.ocrResult?.category || '')) {
              return sum + (inv.ocrResult?.tax || 0);
            }
            return sum;
          }, 0);

          response += `\n\n**Tax & GST Audit Report**:\n`;
          response += `*   **Total Tax Paid**: ₹${totalTax.toFixed(2)} across processed invoices.\n`;
          response += `*   **Reclaimable Business Tax**: ₹${reclaimable.toFixed(2)} (from Utilities, Travel, and Subscription categories).\n`;
          response += `*   **Action Plan**: You can download these records in CSV format from the settings panel to process your corporate tax returns.`;
          suggestedPrompts = ['Export tax records', 'Monthly summary', 'Where am I overspending?'];
        } else if (isBudgetQuery) {
          const percentage = (totalSpend / budgetLimit) * 100;
          response += `\n\n**Budget Allocation Analysis**:\n`;
          response += `*   **Monthly Budget Limit**: ₹${budgetLimit.toFixed(2)}\n`;
          response += `*   **Current Audited Outflow**: ₹${totalSpend.toFixed(2)} (${percentage.toFixed(1)}% burned).\n`;
          response += `*   **Status**: ${percentage > 100 ? '🔴 Over budget! Action required to settle anomalies.' : '🟢 Under budget. Capital reserves are stable.'}\n\nTo update your limits, move to the **Settings** or drag the sliders in the Scenario Simulator.`;
          suggestedPrompts = ['Open Scenario Simulator', 'Audit recurring subscriptions', 'Explain my monthly budget limit'];
        } else if (matchedMerchantInv) {
          const merchant = matchedMerchantInv.ocrResult?.merchant || 'General';
          const merchantInvoices = completedInvoices.filter(inv => inv.ocrResult?.merchant && inv.ocrResult.merchant.toLowerCase() === merchant.toLowerCase());
          const merchantTotal = merchantInvoices.reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);

          response += `\n\n**Merchant Deep-Dive [${merchant}]**:\n`;
          response += `I found **${merchantInvoices.length}** active transaction(s) from **${merchant}** in your database totaling **₹${merchantTotal.toFixed(2)}**:\n`;
          merchantInvoices.forEach(inv => {
            response += `-   *Invoice ${inv.ocrResult?.invoiceNumber}* (${inv.ocrResult?.date}): **₹${inv.ocrResult?.amount.toFixed(2)}** (${inv.ocrResult?.category})\n`;
          });
          if (matchedMerchantInv.ocrResult?.anomalyDetected) {
            response += `\n⚠️ Note: This merchant has transactions flagged as **anomalous**: *"${matchedMerchantInv.ocrResult?.anomalyDescription}"*`;
          }
          suggestedPrompts = [`How to save on ${merchant}?`, 'Back to ledger overview', 'Cancel this subscription'];
        } else if (matchedCategoryName && completedInvoices.length > 0) {
          const catInvoices = completedInvoices.filter(inv => inv.ocrResult?.category?.toLowerCase() === matchedCategoryName.toLowerCase());
          const catTotal = catInvoices.reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);

          response += `\n\n**Category Spend Audit [${matchedCategoryName}]**:\n`;
          response += `Expenditure in **${matchedCategoryName}** sums up to **₹${catTotal.toFixed(2)}** across **${catInvoices.length}** invoices:\n`;
          catInvoices.slice(0, 4).forEach(inv => {
            response += `-   **${inv.ocrResult?.merchant}** (Invoice: ${inv.ocrResult?.invoiceNumber}) on ${inv.ocrResult?.date}: **₹${inv.ocrResult?.amount.toFixed(2)}**\n`;
          });
          suggestedPrompts = [`Consolidate ${matchedCategoryName}`, 'Optimize SaaS pricing', 'Audit recurring subscriptions'];
        } else if (completedInvoices.length > 0) {
          const uniqueMerchants = Array.from(new Set(completedInvoices.map(inv => inv.ocrResult?.merchant))).slice(0, 5);
          
          // Calculate top category spend
          const categoryGroup: { [key: string]: number } = {};
          completedInvoices.forEach((inv) => {
            const cat = inv.ocrResult?.category || 'Shopping';
            categoryGroup[cat] = (categoryGroup[cat] || 0) + (inv.ocrResult?.amount || 0);
          });
          const topCategory = Object.keys(categoryGroup).sort((a,b) => categoryGroup[b] - categoryGroup[a])[0] || 'Shopping';
          const topCategorySpend = categoryGroup[topCategory] || 0;

          response += `\n\nHere is a tailored workspace review relative to your query:\n`;
          response += `*   **Active Ledger Merchants**: Processing bills from *${uniqueMerchants.join(', ')}*.\n`;
          response += `*   **Top Expense Concentration**: **${topCategory}** represents your primary outflow, at **₹${topCategorySpend.toFixed(2)}**.\n`;
          response += `*   **Risk Factors**: We have flagged **${anomalies.length}** anomaly entries in your current session.\n\nYou can ask me specific questions about these merchants, categories, or tax filings, and I will parse them instantly!`;
          suggestedPrompts = ['Where are my bad investments?', `Audit ${topCategory} category`, 'How much to save?'];
        } else {
          response += `\n\nAs the **Zen AI Analyst**, I'm ready to help you get started. Upload some invoices to your workspace, then ask me about spending patterns, overspending leaks, or savings opportunities.`;
        }
      }

      return { message: response, suggestedPrompts };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/advisor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.error(e);
    }

    return { message: 'I was unable to reach the AI engine. Please ensure Node services are online.', suggestedPrompts: ['Retry request'] };
  };

  const updateBudgetLimit = async (limit: number) => {
    setBudgetLimit(limit);
    if (serverOffline) return;

    try {
      await fetch(`${API_BASE_URL}/budget`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        invoices,
        activeUploads,
        dashboardStats,
        analyticsStats,
        budgetLimit,
        loading,
        serverOffline,
        fetchDashboardData,
        fetchAnalyticsData,
        uploadFile,
        triggerOCR,
        updateInvoiceMeta,
        reprocessInvoiceDoc,
        deleteInvoiceDoc,
        triggerCustomAISummary,
        sendAdvisorMessage,
        updateBudgetLimit,
        sendHighRiskAlert
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be called within AppProvider');
  }
  return context;
};
