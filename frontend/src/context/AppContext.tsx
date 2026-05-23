import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
  };
}

interface DashboardStats {
  totalSpend: number;
  invoicesCount: number;
  pendingInvoices: number;
  budgetScore: number;
  savingsOpportunity: number;
  monthlySpendData: Array<{ name: string; Budgeted: number; Actual: number }>;
  categoryChart: Array<{ name: string; value: number }>;
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
    const initialMocks: Invoice[] = [
      {
        id: 'inv-001',
        fileName: 'aws-billing-oct23.pdf',
        fileUrl: '',
        status: 'completed',
        uploadedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        ocrResult: {
          merchant: 'Amazon Web Services',
          date: '2023-10-22',
          invoiceNumber: 'INV-2023-948123',
          amount: 1489.12,
          currency: 'USD',
          tax: 148.91,
          confidence: 99.8,
          category: 'Utilities',
          items: [
            { name: 'EC2 Compute Engine vCPU Hours', quantity: 720, price: 1.25, total: 900.00 },
            { name: 'S3 Standard Storage (TB-Mo)', quantity: 4, price: 23.00, total: 92.00 },
            { name: 'RDS Managed Database Instances', quantity: 1, price: 497.12, total: 497.12 }
          ],
          anomalyDetected: false,
          isSubscription: true
        }
      },
      {
        id: 'inv-002',
        fileName: 'delta-air-jfk-sfo.png',
        fileUrl: '',
        status: 'completed',
        uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ocrResult: {
          merchant: 'Delta Air Lines',
          date: '2023-10-20',
          invoiceNumber: 'INV-2023-102948',
          amount: 850.00,
          currency: 'USD',
          tax: 68.00,
          confidence: 98.4,
          category: 'Travel',
          items: [
            { name: 'Roundtrip Ticket: JFK to SFO (Economy)', quantity: 1, price: 782.00, total: 782.00 },
            { name: 'Cabin Baggage Fee & Seat Selection', quantity: 1, price: 68.00, total: 68.00 }
          ],
          anomalyDetected: true,
          anomalyDescription: 'Potential duplicate booking or high-value expense above the category 30-day average (+122%).',
          isSubscription: false
        }
      },
      {
        id: 'inv-003',
        fileName: 'modern-kitchen-lunch.jpg',
        fileUrl: '',
        status: 'completed',
        uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        ocrResult: {
          merchant: 'The Modern Kitchen',
          date: '2023-10-22',
          invoiceNumber: 'INV-2023-440212',
          amount: 45.60,
          currency: 'USD',
          tax: 4.10,
          confidence: 99.1,
          category: 'Food',
          items: [
            { name: 'Executive Business Lunch Catering', quantity: 3, price: 13.83, total: 41.50 },
            { name: 'Premium Beverages & Sparkling Water', quantity: 1, price: 4.10, total: 4.10 }
          ],
          anomalyDetected: false,
          isSubscription: false
        }
      },
      {
        id: 'inv-004',
        fileName: 'figma-subscription-oct.png',
        fileUrl: '',
        status: 'completed',
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        ocrResult: {
          merchant: 'Figma Inc.',
          date: '2023-10-18',
          invoiceNumber: 'INV-2023-882049',
          amount: 120.00,
          currency: 'USD',
          tax: 12.00,
          confidence: 99.9,
          category: 'Subscriptions',
          items: [
            { name: 'Figma Professional Plan - Annual Seats', quantity: 8, price: 15.00, total: 120.00 }
          ],
          anomalyDetected: false,
          isSubscription: true
        }
      }
    ];
    setInvoices(initialMocks);
    localStorage.setItem('financelens_invoices', JSON.stringify(initialMocks));
  };

  // Dashboard Stats Calculations for Sandbox mode
  const calculateClientDashboard = () => {
    const completed = invoices.filter(i => i.status === 'completed');
    const totalSpend = completed.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0);
    const pendingCount = invoices.filter(i => i.status !== 'completed').length;

    // Calculate budget health score (0-1000 scale)
    let budgetScore = 1000;
    const percentage = totalSpend / budgetLimit;
    if (percentage > 1.2) {
      budgetScore = Math.max(200, Math.round(850 - (percentage - 1.2) * 500));
    } else if (percentage > 0.8) {
      budgetScore = Math.round(950 - (percentage - 0.8) * 350);
    } else {
      budgetScore = Math.round(1000 - percentage * 100);
    }

    // Category chart mapping
    const catGroup: { [key: string]: number } = {};
    completed.forEach(item => {
      const cat = item.ocrResult?.category || 'Shopping';
      catGroup[cat] = (catGroup[cat] || 0) + (item.ocrResult?.amount || 0);
    });

    const categoryChart = Object.keys(catGroup).map(c => ({
      name: c,
      value: parseFloat(catGroup[c].toFixed(2))
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
        description: `You have ${subs.length} recurring SaaS platforms active, billing a total of $${subTotal.toFixed(2)} monthly. De-provision idle licenses immediately.`,
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

    // Monthly trends mock
    const monthlySpendData = [
      { name: 'Jan', Budgeted: 3500, Actual: 2900 },
      { name: 'Feb', Budgeted: 3500, Actual: 3200 },
      { name: 'Mar', Budgeted: 3800, Actual: 3100 },
      { name: 'Apr', Budgeted: 3800, Actual: 4100 },
      { name: 'May', Budgeted: 4000, Actual: 3800 },
      { name: 'Jun', Budgeted: 4000, Actual: 3950 },
      { name: 'Jul', Budgeted: 4500, Actual: 4200 },
      { name: 'Aug', Budgeted: budgetLimit, Actual: parseFloat(totalSpend.toFixed(2)) }
    ];

    setDashboardStats({
      totalSpend: parseFloat(totalSpend.toFixed(2)),
      invoicesCount: invoices.length,
      pendingInvoices: pendingCount,
      budgetScore,
      savingsOpportunity,
      monthlySpendData,
      categoryChart,
      merchantChart,
      aiSummary: `Local Sandbox Analysis: You have audited ${completed.length} receipts representing $${totalSpend.toFixed(2)} in Q3. Overall budget efficiency stands at ${budgetScore}/1000. Travel charges are currently flagged.`,
      recommendations,
      alerts
    });
  };

  // Analytics Stats Calculations for Sandbox mode
  const calculateClientAnalytics = () => {
    const completed = invoices.filter(i => i.status === 'completed');
    
    // Stacked categories breakdown trends
    const trendData = [
      { month: 'May', Food: 240, Travel: 800, Utilities: 2100, Subscriptions: 660 },
      { month: 'Jun', Food: 310, Travel: 950, Utilities: 2150, Subscriptions: 540 },
      { month: 'Jul', Food: 180, Travel: 450, Utilities: 2200, Subscriptions: 1370 },
      { month: 'Aug', Food: 45.60, Travel: 850.00, Utilities: 1489.12, Subscriptions: 600 }
    ];

    let totalTax = 0;
    let taxReclaimable = 0;

    completed.forEach(item => {
      totalTax += (item.ocrResult?.tax || 0);
      if (['Utilities', 'Travel', 'Subscriptions'].includes(item.ocrResult?.category || '')) {
        taxReclaimable += (item.ocrResult?.tax || 0);
      }
    });

    const heatmapData = [
      { day: 'Mon', '9 AM': 12, '12 PM': 45, '3 PM': 0, '6 PM': 23 },
      { day: 'Tue', '9 AM': 0, '12 PM': 0, '3 PM': 850, '6 PM': 10 },
      { day: 'Wed', '9 AM': 1489, '12 PM': 0, '3 PM': 150, '6 PM': 0 },
      { day: 'Thu', '9 AM': 20, '12 PM': 45, '3 PM': 55, '6 PM': 120 },
      { day: 'Fri', '9 AM': 0, '12 PM': 120, '3 PM': 0, '6 PM': 80 }
    ];

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
        setDashboardStats(data);
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
      
      // Seed invoice metadata
      const name = invoices.find(i => i.id === id)?.fileName || 'general.png';
      
      // Simple parse heuristics
      const lower = name.toLowerCase();
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
              isSubscription: isSub
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
        setDashboardStats({
          ...dashboardStats,
          aiSummary: 'Sandbox Workspace Refreshed: Core SaaS expenditures show healthy balances. Travel spending audits are complete.'
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
      const q = message.toLowerCase();
      let response = `I've analyzed your invoices state (Total spend: $${dashboardStats?.totalSpend}). `;
      let suggestedPrompts = ['Where am I overspending?', 'How to save?', 'Monthly summary'];

      if (q.includes('overspend') || q.includes('leak') || q.includes('spend')) {
        response += `Spending analysis highlights **AWS** cloud hosting utilities and **Delta Air Lines** travel costs as major concentrations. Ensure idle compute capacities are terminated.`;
        suggestedPrompts = ['Explain the Delta Air Lines anomaly', 'Optimize cloud pricing'];
      } else if (q.includes('save') || q.includes('optimize') || q.includes('figma')) {
        response += `Audits indicate 3 unused seats in **Figma Inc.** De-provision seats immediately for a recurring yield of **+$840/year**.`;
        suggestedPrompts = ['Open Scenario Simulator', 'Audit my recurring subscriptions'];
      } else {
        response += `As the **Zen AI Analyst**, I'm auditing your financial transaction pipeline. Ask me about overspending leaks or subscription optimizations.`;
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
        updateBudgetLimit
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
