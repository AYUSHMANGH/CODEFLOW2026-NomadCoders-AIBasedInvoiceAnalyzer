import { Request, Response } from 'express';
import { extractInvoiceData, generateInsightsFromInvoices, getAdvisorChatResponse } from '../services/aiService';

// Stateful In-Memory Invoice Database for local sandbox and instant preview
interface InvoiceRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  ocrResult?: any;
}

// Initialized with standard mock values from the high-fidelity UI design assets!
let localInvoiceDB: InvoiceRecord[] = [
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

// Global configuration budget
let budgetLimit = 5000;

export const uploadInvoice = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const newId = `inv-${Math.random().toString(36).substring(2, 9)}`;
    const newInvoice: InvoiceRecord = {
      id: newId,
      fileName: req.file.originalname,
      fileUrl: req.file.path || '',
      status: 'processing',
      uploadedAt: new Date().toISOString()
    };

    localInvoiceDB.unshift(newInvoice);

    // Return reference immediately to trigger processing page
    return res.status(201).json(newInvoice);
  } catch (error: any) {
    console.error('Upload controller failed:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const extractInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Missing invoice id' });
    }

    const record = localInvoiceDB.find(item => item.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Invoice record not found' });
    }

    // Trigger AI service
    record.status = 'processing';
    const ocrData = await extractInvoiceData(record.fileName);
    
    record.ocrResult = ocrData;
    record.status = 'completed';

    return res.status(200).json(record);
  } catch (error: any) {
    console.error('OCR Extraction failed:', error);
    return res.status(500).json({ error: error.message });
  }
};

export const getInvoices = async (req: Request, res: Response) => {
  return res.status(200).json(localInvoiceDB);
};

export const getInvoiceById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = localInvoiceDB.find(item => item.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  return res.status(200).json(record);
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { ocrResult } = req.body;
    
    const recordIndex = localInvoiceDB.findIndex(item => item.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    localInvoiceDB[recordIndex].ocrResult = {
      ...localInvoiceDB[recordIndex].ocrResult,
      ...ocrResult
    };

    return res.status(200).json(localInvoiceDB[recordIndex]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const reprocessInvoice = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = localInvoiceDB.find(item => item.id === id);
    if (!record) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    record.status = 'processing';
    const ocrData = await extractInvoiceData(record.fileName);
    record.ocrResult = ocrData;
    record.status = 'completed';

    return res.status(200).json(record);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const recordIndex = localInvoiceDB.findIndex(item => item.id === id);
  if (recordIndex === -1) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  localInvoiceDB.splice(recordIndex, 1);
  return res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
};

export const getDashboardStats = async (req: Request, res: Response) => {
  const completedInvoices = localInvoiceDB.filter(item => item.status === 'completed');
  
  // Metrics sums
  const totalSpend = completedInvoices.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0);
  const pendingCount = localInvoiceDB.filter(item => item.status !== 'completed').length;
  
  // Growth mock data (Jan to Aug)
  const monthlySpendData = [
    { name: 'Jan', Budgeted: 3500, Actual: 2900 },
    { name: 'Feb', Budgeted: 3500, Actual: 3200 },
    { name: 'Mar', Budgeted: 3800, Actual: 3100 },
    { name: 'Apr', Budgeted: 3800, Actual: 4100 },
    { name: 'May', Budgeted: 4000, Actual: 3800 },
    { name: 'Jun', Budgeted: 4000, Actual: 3950 },
    { name: 'Jul', Budgeted: 4500, Actual: 4200 },
    { name: 'Aug', Budgeted: 5000, Actual: totalSpend }
  ];

  // Category aggregate
  const categorySummary: { [key: string]: number } = {};
  completedInvoices.forEach(item => {
    const cat = item.ocrResult?.category || 'Shopping';
    categorySummary[cat] = (categorySummary[cat] || 0) + (item.ocrResult?.amount || 0);
  });

  const categoryChart = Object.keys(categorySummary).map(cat => ({
    name: cat,
    value: parseFloat(categorySummary[cat].toFixed(2))
  }));

  // Top Merchants aggregate
  const merchantSummary: { [key: string]: number } = {};
  completedInvoices.forEach(item => {
    const merchant = item.ocrResult?.merchant || 'Unknown';
    merchantSummary[merchant] = (merchantSummary[merchant] || 0) + (item.ocrResult?.amount || 0);
  });

  const merchantChart = Object.keys(merchantSummary).map(m => ({
    name: m,
    amount: parseFloat(merchantSummary[m].toFixed(2))
  })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  const insights = generateInsightsFromInvoices(completedInvoices, budgetLimit);

  return res.status(200).json({
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    invoicesCount: localInvoiceDB.length,
    pendingInvoices: pendingCount,
    budgetScore: insights.budgetScore,
    monthlySpendData,
    categoryChart,
    merchantChart,
    aiSummary: insights.recentSummary,
    recommendations: insights.recommendations,
    alerts: insights.overspendingAlerts
  });
};

export const getAnalyticsStats = async (req: Request, res: Response) => {
  const completedInvoices = localInvoiceDB.filter(item => item.status === 'completed');
  
  // Stacked categories trends
  const trendData = [
    { month: 'May', Food: 240, Travel: 800, Utilities: 2100, Subscriptions: 660 },
    { month: 'Jun', Food: 310, Travel: 950, Utilities: 2150, Subscriptions: 540 },
    { month: 'Jul', Food: 180, Travel: 450, Utilities: 2200, Subscriptions: 1370 },
    { month: 'Aug', Food: 45.60, Travel: 850.00, Utilities: 1489.12, Subscriptions: 600 }
  ];

  // Compute GST / Tax Summary
  let totalTax = 0;
  let taxReclaimable = 0;
  completedInvoices.forEach(item => {
    totalTax += (item.ocrResult?.tax || 0);
    // Supposing utilities and business travel are reclaimable
    if (['Utilities', 'Travel', 'Subscriptions'].includes(item.ocrResult?.category)) {
      taxReclaimable += (item.ocrResult?.tax || 0);
    }
  });

  // Calendar Heatmap Grid (Spend density mock)
  const heatmapData = [
    { day: 'Mon', '9 AM': 12, '12 PM': 45, '3 PM': 0, '6 PM': 23 },
    { day: 'Tue', '9 AM': 0, '12 PM': 0, '3 PM': 850, '6 PM': 10 },
    { day: 'Wed', '9 AM': 1489, '12 PM': 0, '3 PM': 150, '6 PM': 0 },
    { day: 'Thu', '9 AM': 20, '12 PM': 45, '3 PM': 55, '6 PM': 120 },
    { day: 'Fri', '9 AM': 0, '12 PM': 120, '3 PM': 0, '6 PM': 80 }
  ];

  return res.status(200).json({
    trendData,
    taxSummary: {
      totalTax: parseFloat(totalTax.toFixed(2)),
      taxReclaimable: parseFloat(taxReclaimable.toFixed(2)),
      taxRateAverage: 9.5
    },
    heatmapData
  });
};

export const getInsightsStats = async (req: Request, res: Response) => {
  const completedInvoices = localInvoiceDB.filter(item => item.status === 'completed');
  const insights = generateInsightsFromInvoices(completedInvoices, budgetLimit);
  return res.status(200).json({
    budgetScore: insights.budgetScore,
    savingsOpportunity: insights.savingsOpportunity,
    overspendingAlerts: insights.overspendingAlerts,
    recommendations: insights.recommendations,
    aiSummary: insights.recentSummary
  });
};

export const triggerCustomSummary = async (req: Request, res: Response) => {
  const completedInvoices = localInvoiceDB.filter(item => item.status === 'completed');
  const insights = generateInsightsFromInvoices(completedInvoices, budgetLimit);
  
  // Simulate heavy AI processing shimmer
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return res.status(200).json({
    aiSummary: `AI WORKSPACE UPDATE: Audited Q3 expenditure shows a major concentration in Cloud/Utilities ($${(insights.savingsOpportunity * 5).toFixed(2)}) and duplicate risks in Travel. Actionable recommendation items have been updated in your Insights check board.`
  });
};

export const getBudgetSettings = async (req: Request, res: Response) => {
  return res.status(200).json({ budgetLimit });
};

export const updateBudgetSettings = async (req: Request, res: Response) => {
  const { limit } = req.body;
  if (limit !== undefined && typeof limit === 'number') {
    budgetLimit = limit;
  }
  return res.status(200).json({ budgetLimit });
};

export const getAdvisorChat = async (req: Request, res: Response) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message query' });
  }

  const completedInvoices = localInvoiceDB.filter(item => item.status === 'completed');
  const response = await getAdvisorChatResponse(message, completedInvoices, history || []);
  
  return res.status(200).json(response);
};
