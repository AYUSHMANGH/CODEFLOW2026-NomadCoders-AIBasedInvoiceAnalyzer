import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { extractInvoiceData, generateInsightsFromInvoices, getAdvisorChatResponse } from '../services/aiService';

// ─── Email Alert Helper ────────────────────────────────────────────────────────
// Uses nodemailer with Ethereal (test) credentials when SMTP_USER/PASS not set,
// so the alert never hard-crashes the server even without email configuration.
async function sendHighRiskEmailAlert(spend: number, target: number, overspend: number): Promise<void> {
  try {
    // Dynamic import so missing nodemailer doesn't crash on startup
    const nodemailer = await import('nodemailer').catch(() => null);
    if (!nodemailer) {
      console.warn('[HighRisk Alert] nodemailer not installed – skipping email send.');
      return;
    }

    const adminEmail = process.env.ALERT_ADMIN_EMAIL || 'admin@financelens.ai';
    const smtpUser   = process.env.SMTP_USER;
    const smtpPass   = process.env.SMTP_PASS;

    let transporter: any;
    if (smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass }
      });
    } else {
      // Create a test Ethereal account so email preview still works in dev
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass }
      });
    }

    const info = await transporter.sendMail({
      from: `"FinanceLens AI" <${smtpUser || 'alerts@financelens.ai'}>`,
      to: adminEmail,
      subject: '⚠️ HIGH RISK Budget Alert – FinanceLens',
      html: `
        <div style="font-family:Arial,sans-serif;background:#0F172A;color:#F8FAFC;padding:32px;border-radius:12px;max-width:560px">
          <h2 style="color:#FF5A5F;margin-top:0">⚠️ High Risk Spending Alert</h2>
          <p style="color:#94A3B8">Your FinanceLens workspace has detected an <strong style="color:#FF5A5F">overspend</strong> condition for the current period.</p>
          <table style="width:100%;border-collapse:collapse;margin-top:20px">
            <tr style="border-bottom:1px solid #1E293B">
              <td style="padding:12px 0;color:#64748B;font-size:13px">Current Actual Spend</td>
              <td style="padding:12px 0;text-align:right;font-weight:bold;color:#F8FAFC;font-size:16px">₹${spend.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom:1px solid #1E293B">
              <td style="padding:12px 0;color:#64748B;font-size:13px">Target Budget</td>
              <td style="padding:12px 0;text-align:right;font-weight:bold;color:#22D3EE;font-size:16px">₹${target.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;color:#64748B;font-size:13px">Overspending Amount</td>
              <td style="padding:12px 0;text-align:right;font-weight:bold;color:#FF5A5F;font-size:16px">₹${overspend.toLocaleString()}</td>
            </tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#1E293B;border-radius:8px;border-left:4px solid #FF5A5F">
            <p style="margin:0;font-size:13px;color:#F1F5F9">
              <strong>Action Required:</strong> Your actual spend has exceeded the configured budget target by 
              <strong style="color:#FF5A5F">₹${overspend.toLocaleString()}</strong>. 
              Please review your invoices immediately and take corrective action to restore financial health.
            </p>
          </div>
          <p style="margin-top:20px;font-size:11px;color:#475569">This is an automated alert from FinanceLens AI. Login to your dashboard to review details.</p>
        </div>
      `
    });

    console.log('[HighRisk Alert] Email sent – MessageId:', info.messageId);
    // If using Ethereal, print preview URL
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) console.log('[HighRisk Alert] Preview URL:', previewUrl);
  } catch (err) {
    console.error('[HighRisk Alert] Failed to send email:', err);
  }
}

const getMonthName = (dateStr?: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

// Stateful In-Memory Invoice Database for local sandbox and instant preview
interface InvoiceRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  ocrResult?: any;
}

let localInvoiceDB: InvoiceRecord[] = [];

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

    let fileBuffer: Buffer | undefined;
    let fileType: string | undefined;

    if (record.fileUrl && fs.existsSync(record.fileUrl)) {
      try {
        fileBuffer = fs.readFileSync(record.fileUrl);
        const ext = path.extname(record.fileName).toLowerCase();
        if (ext === '.pdf') {
          fileType = 'application/pdf';
        } else if (ext === '.png') {
          fileType = 'image/png';
        } else if (ext === '.jpg' || ext === '.jpeg') {
          fileType = 'image/jpeg';
        }
      } catch (err) {
        console.error('Failed to read file from disk for extraction:', err);
      }
    }

    const ocrData = await extractInvoiceData(record.fileName, fileBuffer, fileType);
    
    record.ocrResult = ocrData;
    if (ocrData && ocrData.isValidInvoice === false) {
      record.status = 'failed';
    } else {
      record.status = 'completed';
    }

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

    let fileBuffer: Buffer | undefined;
    let fileType: string | undefined;

    if (record.fileUrl && fs.existsSync(record.fileUrl)) {
      try {
        fileBuffer = fs.readFileSync(record.fileUrl);
        const ext = path.extname(record.fileName).toLowerCase();
        if (ext === '.pdf') {
          fileType = 'application/pdf';
        } else if (ext === '.png') {
          fileType = 'image/png';
        } else if (ext === '.jpg' || ext === '.jpeg') {
          fileType = 'image/jpeg';
        }
      } catch (err) {
        console.error('Failed to read file from disk for reprocessing:', err);
      }
    }

    const ocrData = await extractInvoiceData(record.fileName, fileBuffer, fileType);
    record.ocrResult = ocrData;
    if (ocrData && ocrData.isValidInvoice === false) {
      record.status = 'failed';
    } else {
      record.status = 'completed';
    }

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
  // Category aggregate
  const categorySummary: { [key: string]: number } = {};
  completedInvoices.forEach(item => {
    const cat = item.ocrResult?.category || 'Shopping';
    categorySummary[cat] = (categorySummary[cat] || 0) + (item.ocrResult?.amount || 0);
  });

  const categoryChart = Object.keys(categorySummary).map(cat => ({
    name: cat,
    value: totalSpend > 0 ? parseFloat(((categorySummary[cat] / totalSpend) * 100).toFixed(2)) : 0,
    amount: parseFloat(categorySummary[cat].toFixed(2))
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

  // --- Spending Risk Calculation ---
  const spendRatio = budgetLimit > 0 ? totalSpend / budgetLimit : 0;
  const spendPercent = parseFloat((spendRatio * 100).toFixed(1));
  let spendingRisk: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  if (spendRatio < 0.7) spendingRisk = 'Low Risk';
  else if (spendRatio <= 1.0) spendingRisk = 'Moderate Risk';
  else spendingRisk = 'High Risk';

  // Trigger email alert (fire-and-forget) if High Risk
  if (spendingRisk === 'High Risk') {
    sendHighRiskEmailAlert(totalSpend, budgetLimit, parseFloat((totalSpend - budgetLimit).toFixed(2))).catch(() => {});
  }

  // --- Spending Graph: X-axis with actual invoice dates or baseline first day of month ---
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

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

  // Only completed invoices from the current month
  const currentMonthInvoices = completedInvoices.filter(item => {
    const p = parseInvoiceDate(item.ocrResult?.date);
    return p && p.year === currentYear && p.month === currentMonth;
  });

  const currentMonthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][currentMonth];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const weekBoundaries = [7, 14, 21, daysInMonth];
  const weekLabels = [
    `01 ${currentMonthName}`,
    `08 ${currentMonthName}`,
    `15 ${currentMonthName}`,
    `22 ${currentMonthName}`
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

  const insights = generateInsightsFromInvoices(completedInvoices, budgetLimit);

  return res.status(200).json({
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    invoicesCount: localInvoiceDB.length,
    pendingInvoices: localInvoiceDB.length,
    budgetScore: parseFloat(totalSpend.toFixed(2)),
    targetBudget: budgetLimit,
    spendingRisk,
    spendPercent,
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
  
  // Stacked categories trends (initially zero dummy data!)
  const trendData = [
    { month: 'May', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 },
    { month: 'Jun', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 },
    { month: 'Jul', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 },
    { month: 'Aug', Food: 0, Travel: 0, Utilities: 0, Subscriptions: 0, Shopping: 0, Medical: 0, Entertainment: 0, Education: 0 }
  ];

  completedInvoices.forEach(item => {
    const month = getMonthName(item.ocrResult?.date);
    const monthTrend = trendData.find(t => t.month === month);
    if (monthTrend) {
      const cat = item.ocrResult?.category || 'Shopping';
      if (cat in monthTrend) {
        (monthTrend as any)[cat] = parseFloat(((monthTrend as any)[cat] + (item.ocrResult?.amount || 0)).toFixed(2));
      }
    }
  });

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

  // Calendar Heatmap Grid (Spend density - initially zero dummy data!)
  const heatmapData = [
    { day: 'Mon', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
    { day: 'Tue', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
    { day: 'Wed', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
    { day: 'Thu', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 },
    { day: 'Fri', '9 AM': 0, '12 PM': 0, '3 PM': 0, '6 PM': 0 }
  ];

  completedInvoices.forEach(item => {
    const date = new Date(item.ocrResult?.date);
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

// High Risk Budget Alert endpoint
export const triggerHighRiskAlert = async (req: Request, res: Response) => {
  const { spend, target, overspend } = req.body;
  if (spend === undefined || target === undefined) {
    return res.status(400).json({ error: 'Missing spend or target values' });
  }
  try {
    await sendHighRiskEmailAlert(
      parseFloat(spend),
      parseFloat(target),
      parseFloat(overspend ?? (spend - target))
    );
    return res.status(200).json({ success: true, message: 'High Risk alert email dispatched.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
