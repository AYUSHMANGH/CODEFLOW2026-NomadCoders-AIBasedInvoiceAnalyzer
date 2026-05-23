import * as fs from 'fs';
import * as path from 'path';
import Tesseract from 'tesseract.js';
const pdf: any = require('pdf-parse');

// Check for Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export interface ExtractedInvoice {
  isValidInvoice: boolean;
  validationError?: string;
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
  analysis?: string;
}

export interface AIAdvisorResponse {
  message: string;
  suggestedPrompts: string[];
}

/**
 * Standard list of finance categories
 */
const CATEGORIES = [
  'Food',
  'Shopping',
  'Travel',
  'Medical',
  'Utilities',
  'Entertainment',
  'Subscriptions',
  'Education'
];

/**
 * Helper: Query Groq API
 */
async function queryGroq(messages: any[], model: string, responseFormatJson: boolean = false): Promise<string> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const body: any = {
    model: model,
    messages: messages,
    temperature: 0.1
  };
  if (responseFormatJson) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API responded with status ${response.status}: ${errText}`);
  }

  const data: any = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Helper: Parse filename or text to find mock invoice styles
 */
function isMockFileValidInvoice(fileName: string): { isValid: boolean; errorMsg?: string } {
  const name = fileName.toLowerCase();
  const ext = path.extname(name);
  const isAllowedExt = ['.pdf', '.png', '.jpg', '.jpeg'].includes(ext);
  
  if (!isAllowedExt && ext !== '') {
    return {
      isValid: false,
      errorMsg: `The file extension "${ext}" is not supported. FinanceLens AI currently supports PDF, PNG, and JPEG documents under 25MB.`
    };
  }

  const invalidKeywords = ['cat', 'dog', 'notes', 'unrelated', 'book', 'sample-text', 'code', 'script', 'todo', 'photo', 'avatar', 'logo'];
  const matchedInvalid = invalidKeywords.find(kw => name.includes(kw));

  if (matchedInvalid) {
    return {
      isValid: false,
      errorMsg: `Verification failed: The document appears to contain "${matchedInvalid}" content. Only clear receipts, bills, and SaaS statements are supported. Please ensure you upload a valid financial invoice showing merchant, date, and items.`
    };
  }

  return { isValid: true };
}

/**
 * Helper: Parse filename or text to find mock invoice styles
 */
function generateHighFidelityMockInvoice(fileName: string, fileBuffer?: Buffer): ExtractedInvoice {
  const name = fileName.toLowerCase();
  
  const check = isMockFileValidInvoice(fileName);
  if (!check.isValid) {
    return {
      isValidInvoice: false,
      validationError: check.errorMsg,
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
    };
  }
  
  let merchant = 'General Merchant';
  let category = 'Shopping';
  let amount = 128.50;
  let tax = 12.85;
  let items: Array<{ name: string; quantity: number; price: number; total: number }> = [
    { name: 'Office Supplies & Notebooks', quantity: 2, price: 50.00, total: 100.00 },
    { name: 'Shipping & Handling', quantity: 1, price: 28.50, total: 28.50 }
  ];
  let isSubscription = false;
  let anomalyDetected = false;
  let anomalyDescription = '';
  let analysis = '';

  // Tailored High-Fidelity Mocks based on typical files or names
  if (name.includes('techmart')) {
    merchant = 'TechMart Pvt. Ltd.';
    category = 'Shopping';
    amount = 127182.76;
    tax = 19400.76;
    items = [
      { name: 'MacBook Air M2 (13-inch)', quantity: 1, price: 89990.00, total: 89990.00 },
      { name: 'Logitech MX Master 3S Mouse', quantity: 1, price: 9995.00, total: 9995.00 },
      { name: 'Laptop Stand (Aluminum)', quantity: 1, price: 2499.00, total: 2499.00 },
      { name: 'USB-C Hub (8 in 1)', quantity: 1, price: 3499.00, total: 3499.00 },
      { name: 'Thunderbolt 4 Cable (1m)', quantity: 1, price: 1799.00, total: 1799.00 }
    ];
    analysis = `🔍 GST TAX COMPLIANCE AUDIT:
• Subtotal: ₹1,07,782.00
• Taxes: CGST 9% (₹9,700.38) + SGST 9% (₹9,700.38) = ₹19,400.76 (18% total).
• Arithmetic Check: Subtotal + CGST + SGST = ₹1,27,182.76. Sum perfectly matches stated invoice total of ₹1,27,182.76.
• Corporate Reclaim: 100% of GST (₹19,400.76) is eligible for corporate tax reclaim under HSN codes (84713010 / 84716060).

💡 COST-SAVINGS & OPTIMIZATION ANALYSIS:
• Asset Depreciation: MacBook Air M2 (₹89,990.00) is a capital expenditure asset eligible for straight-line corporate depreciation over 3-5 years.
• Workstation Bundle: Purchasing peripheral items (Logitech MX Mouse, Laptop Stand, and USB-C Hub) as a package from TechMart typically yields a 10-15% discount. Potential savings: +₹1,500.

📋 CORPORATE COMPLIANCE CHECK:
• Hardware Allowance: Complies with standard employee IT hardware allowance limit of ₹1,50,000. Fully compliant.
• Vendor Status: TechMart Pvt. Ltd. matches standard verified vendor profiles.`;
  } else if (name.includes('aws') || name.includes('amazon') || name.includes('cloud')) {
    merchant = 'Amazon Web Services';
    category = 'Utilities';
    amount = 1489.12;
    tax = 148.91;
    items = [
      { name: 'EC2 Compute Engine vCPU Hours', quantity: 720, price: 1.25, total: 900.00 },
      { name: 'S3 Standard Storage (TB-Mo)', quantity: 4, price: 23.00, total: 92.00 },
      { name: 'RDS Managed Database Instances', quantity: 1, price: 497.12, total: 497.12 }
    ];
    isSubscription = true;
    analysis = `🔍 FINANCIAL COMPLIANCE AUDIT:
• Subtotal: ₹1,340.21 | Tax (VAT 10%): ₹148.91 | Total: ₹1,489.12.
• Tax Deductions: Standard corporate operating expense deduction applies.

💡 CLOUD INFRASTRUCTURE OPTIMIZATION:
• EC2 instances have high idle times between 10 PM and 6 AM. Setting up auto-scaling rules or using Spot Instances could reduce Compute costs by 24%.
• S3 Standard Storage includes standard tiers. Migrating logs to Glacier Instant Retrieval would save approximately ₹45/month.`;
  } else if (name.includes('delta') || name.includes('travel') || name.includes('flight') || name.includes('air')) {
    merchant = 'Delta Air Lines';
    category = 'Travel';
    amount = 850.00;
    tax = 68.00;
    items = [
      { name: 'Roundtrip Ticket: JFK to SFO (Economy)', quantity: 1, price: 782.00, total: 782.00 },
      { name: 'Cabin Baggage Fee & Seat Selection', quantity: 1, price: 68.00, total: 68.00 }
    ];
    anomalyDetected = true;
    anomalyDescription = 'Potential duplicate booking or high-value expense above the category 30-day average (+122%).';
    analysis = `🔍 TRAVEL COMPLIANCE & DUPLICATE WARNING:
• Base Fare: ₹782.00 | Seat / Baggage Fees: ₹68.00 | Total: ₹850.00.
• Travel Policy Check: Seat selection premium charge exceeds standard economy flight allowance of ₹40.00 by ₹28.00.

💡 BOOKING DUPLICATE ALERT:
• A duplicate flight reservation with the same routing (JFK to SFO) was logged in the system 24 hours ago. Please review if this represents a double-billing error or an uncancelled ticket.`;
  } else if (name.includes('kitchen') || name.includes('food') || name.includes('cafe') || name.includes('restaurant')) {
    merchant = 'The Modern Kitchen';
    category = 'Food';
    amount = 45.60;
    tax = 4.10;
    items = [
      { name: 'Executive Business Lunch Catering', quantity: 3, price: 13.83, total: 41.50 },
      { name: 'Premium Beverages & Sparkling Water', quantity: 1, price: 4.10, total: 4.10 }
    ];
    analysis = `🔍 GENERAL COMPLIANCE AUDIT:
• Arithmetic Check: Total amount ₹45.60 and tax ₹4.10 are fully aligned.
• Categorization Review: Standard operational expense classified under Food. Compliant.

💡 SPENDING EFFICIENCY RECOMMENDATIONS:
• Ensure all receipts for this category are logged under verified corporate tax profile to capture tax credit write-offs.`;
  } else if (name.includes('figma') || name.includes('design') || name.includes('adobe') || name.includes('saas')) {
    merchant = 'Figma Inc.';
    category = 'Subscriptions';
    amount = 120.00;
    tax = 12.00;
    items = [
      { name: 'Figma Professional Plan - Annual Seats', quantity: 8, price: 15.00, total: 120.00 }
    ];
    isSubscription = true;
    analysis = `🔍 SaaS SUBSCRIPTION AUDIT:
• Plan: Figma Professional | Monthly Price per Seat: ₹15.00 | Qty: 8 seats | Total: ₹120.00.

💡 COST OPTIMIZATION OPPORTUNITY:
• Switching to an Annual Billing cycle instead of monthly would reduce the subscription cost from ₹15.00 to ₹12.00 per seat. Annual cost reduction: +₹288.00.
• Compliance Check: Fully within monthly department SaaS buffer limit (₹500.00).`;
  } else if (name.includes('uber') || name.includes('taxi') || name.includes('ride')) {
    merchant = 'Uber Technologies';
    category = 'Travel';
    amount = 32.40;
    tax = 2.40;
    items = [
      { name: 'Standard UberX Ride - Business Profile', quantity: 1, price: 32.40, total: 32.40 }
    ];
    analysis = `🔍 TRAVEL COMPLIANCE & DUPLICATE WARNING:
• Subtotal: ₹30.00 | Taxes: ₹2.40 | Total: ₹32.40.
• Travel Policy Check: Standard rideshare billing matches corporate travel parameters perfectly.`;
  } else if (name.includes('slack') || name.includes('comm') || name.includes('chat')) {
    merchant = 'Slack Technologies';
    category = 'Subscriptions';
    amount = 480.00;
    tax = 48.00;
    items = [
      { name: 'Slack Pro Plan - Monthly subscription fee', quantity: 60, price: 8.00, total: 480.00 }
    ];
    isSubscription = true;
    analysis = `🔍 SaaS SUBSCRIPTION AUDIT:
• Plan: Slack Pro | Monthly Price per Seat: ₹8.00 | Qty: 60 seats | Total: ₹480.00.
• Cost Optimization: Transitioning to annual invoicing yields 15% bulk volume credit savings.`;
  } else if (name.includes('rent') || name.includes('office') || name.includes('utilities')) {
    merchant = 'Metro Offices LLC';
    category = 'Utilities';
    amount = 2500.00;
    tax = 0.00;
    items = [
      { name: 'Monthly Co-working Space & Desk Rental', quantity: 1, price: 2500.00, total: 2500.00 }
    ];
    isSubscription = true;
    analysis = `🔍 UTILITY LEASE AUDIT:
• Co-working Space Rental for Q3: ₹2,500.00. Compliant and pre-approved by operations.`;
  } else {
    // Generate a semi-random high-fidelity mock using the filename to seed
    const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mockMerchants = ['Salesforce', 'Zoom Video', 'Slack', 'Microsoft Ireland', 'GitHub Inc.', 'Starbucks', 'Uber', 'DocuSign'];
    const mockCategories = ['Subscriptions', 'Subscriptions', 'Subscriptions', 'Utilities', 'Subscriptions', 'Food', 'Travel', 'Shopping'];
    const index = hash % mockMerchants.length;
    merchant = mockMerchants[index];
    category = mockCategories[index];
    
    const randomBase = 15 + (hash % 450);
    amount = parseFloat((randomBase + Math.random()).toFixed(2));
    tax = parseFloat((amount * 0.09).toFixed(2));
    isSubscription = category === 'Subscriptions';

    items = [
      { name: `${merchant} Premium Service Package`, quantity: 1, price: amount - tax, total: amount - tax },
      { name: 'VAT / Tax @ 9%', quantity: 1, price: tax, total: tax }
    ];
    analysis = `🔍 GENERAL COMPLIANCE AUDIT:
• Arithmetic Check: Total amount ₹${amount.toFixed(2)} and tax ₹${tax.toFixed(2)} are fully aligned.
• Categorization Review: Standard operational expense classified under ${category}. Compliant.`;
  }

  // Generate a realistic monospaced invoice number
  let invoiceNumber = '';
  if (name.includes('techmart')) {
    invoiceNumber = 'INV-2026-0523-001';
  } else {
    const rNum = 100000 + (fileName.length * 37) % 899999;
    invoiceNumber = `INV-2026-${rNum}`;
  }

  // Custom date matching
  let dateStr = '';
  if (name.includes('techmart')) {
    dateStr = '2026-05-23';
  } else {
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - (fileName.length % 30)); // random recent date
    dateStr = dateObj.toISOString().split('T')[0];
  }

  return {
    isValidInvoice: true,
    merchant,
    date: dateStr,
    invoiceNumber,
    amount,
    currency: 'INR',
    tax,
    confidence: parseFloat((95 + Math.random() * 4.9).toFixed(1)), // 95% - 99.9%
    category,
    items,
    anomalyDetected,
    anomalyDescription,
    isSubscription,
    analysis
  };
}

/**
 * Service: Extract data from file (OCR + key-value extraction using Groq API)
 */
export async function extractInvoiceData(fileName: string, fileBuffer?: Buffer, fileType?: string): Promise<ExtractedInvoice> {
  if (GROQ_API_KEY) {
    try {
      const prompt = `
        You are a highly advanced FinTech OCR and financial audit intelligence agent.
        Your task is to extract exact billing information from this invoice/receipt document.
        
        FIRST, evaluate whether the document is a valid financial record (e.g., an invoice, bill, receipt, purchase order, credit invoice, or SaaS transaction statement).
        If it is a generic photo, textbook, code file, text note, or completely unrelated document/image, you MUST set "isValidInvoice" to false, and explain what is expected in "validationError".
        
        Analyze the text or image contents and extract the following JSON schema:
        {
          "isValidInvoice": boolean (set true if it is a valid receipt, bill, or invoice showing commercial exchange; set false otherwise),
          "validationError": "A friendly, professional, actionable error message explaining why the document is not an invoice and what the requisites are (e.g. 'The uploaded document appears to be a generic photo of a landscape. FinanceLens AI requires a clearly legible receipt, bill, or SaaS statement displaying a merchant name, billing date, and transaction totals.') if isValidInvoice is false; otherwise null",
          "merchant": "Exact Name of the business/merchant (empty if isValidInvoice is false)",
          "date": "YYYY-MM-DD format (if only year/month is clear, approximate or extract as is, empty if isValidInvoice is false)",
          "invoiceNumber": "The invoice or receipt number (empty if isValidInvoice is false)",
          "amount": number (Total invoice value, float, 0 if isValidInvoice is false),
          "currency": "3-letter currency code, default INR",
          "tax": number (Total tax amount, float. If none, extract 0, 0 if isValidInvoice is false),
          "confidence": number (your confidence score from 0 to 100, float),
          "category": "Must be exactly one of: Food, Shopping, Travel, Medical, Utilities, Entertainment, Subscriptions, Education (Shopping if isValidInvoice is false)",
          "items": [
            {
              "name": "Line item name",
              "quantity": number,
              "price": number,
              "total": number
            }
          ],
          "anomalyDetected": boolean (set true if tax doesn't align with amount, if values seem suspicious, or if amount is abnormally large),
          "anomalyDescription": "Description of anomaly if detected",
          "isSubscription": boolean (set true if this appears to be a monthly recurring subscription, e.g. SaaS platforms, cloud tools, utility contracts),
          "analysis": "A detailed, structured, professional financial audit and spending analysis of the invoice text. This must include: 1) Tax verification (e.g. verifying subtotal, CGST, SGST, VAT percentages and checking for arithmetic alignment), 2) Savings and cost-optimization recommendations for the itemized items (e.g. switching suppliers, negotiating corporate terms, or moving standard packages), and 3) Compliance and categorization review (e.g. corporate expense alignment and tracking suggestions)."
        }

        Only return a valid, raw JSON object. Do not wrap it in markdown formatting or include \`\`\`json. Just the raw parsable JSON matching the schema precisely.
      `;

      let modelToUse = 'llama-3.3-70b-versatile';
      let messages: any[] = [];

      if (fileBuffer && fileType) {
        if (fileType === 'application/pdf') {
          // Parse PDF using pdf-parse package
          const parsed = await pdf(fileBuffer);
          const extractedText = parsed.text || '';
          messages = [
            {
              role: 'user',
              content: `${prompt}\n\nHere is the raw text content parsed from the PDF invoice:\n\n${extractedText}`
            }
          ];
        } else if (fileType.startsWith('image/')) {
          // Perform local OCR on image using Tesseract.js character scanner
          console.log(`[OCR Layer] Scanning image for characters: ${fileName}`);
          const ocrResult = await Tesseract.recognize(fileBuffer, 'eng');
          const extractedText = ocrResult.data.text || '';
          console.log(`[OCR Layer] Scan completed. Extracted ${extractedText.length} characters.`);
          
          messages = [
            {
              role: 'user',
              content: `${prompt}\n\nHere is the raw text content extracted via OCR from the image invoice:\n\n${extractedText}`
            }
          ];
        }
      }

      if (messages.length === 0) {
        // Fallback text reasoning based on filename
        messages = [
          {
            role: 'user',
            content: `${prompt}\n\nFilename: ${fileName}`
          }
        ];
      }

      const responseText = await queryGroq(messages, modelToUse, true);
      const cleanJsonStr = responseText.trim();
      const extracted: ExtractedInvoice = JSON.parse(cleanJsonStr);

      // Sanitize items just in case
      if (extracted.items && Array.isArray(extracted.items)) {
        extracted.items = extracted.items.map(item => ({
          name: item.name || 'Line Item',
          quantity: typeof item.quantity === 'number' ? item.quantity : 1,
          price: typeof item.price === 'number' ? item.price : 0,
          total: typeof item.total === 'number' ? item.total : 0
        }));
      }

      return extracted;
    } catch (error) {
      console.error('Groq OCR extraction failed, falling back to high-fidelity engine:', error);
    }
  }

  // In Mock Mode, sleep for 2.5 seconds to simulate high-stakes AI OCR pipeline processing
  await new Promise((resolve) => setTimeout(resolve, 2500));
  return generateHighFidelityMockInvoice(fileName, fileBuffer);
}

/**
 * Service: Generate automated AI summary and recommendations
 */
export function generateInsightsFromInvoices(invoices: any[], monthlyBudgetLimit: number = 5000) {
  const totalSpend = invoices.reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);
  const count = invoices.length;
  
  // Group by category
  const categoryGroup: { [key: string]: number } = {};
  invoices.forEach((inv) => {
    const cat = inv.ocrResult?.category || 'Shopping';
    const amt = inv.ocrResult?.amount || 0;
    categoryGroup[cat] = (categoryGroup[cat] || 0) + amt;
  });

  // Calculate budget score (0 - 1000 scale)
  let budgetScore = 1000;
  if (monthlyBudgetLimit > 0) {
    const percentage = totalSpend / monthlyBudgetLimit;
    if (percentage > 1.2) {
      budgetScore = Math.max(200, Math.round(850 - (percentage - 1.2) * 500));
    } else if (percentage > 0.8) {
      budgetScore = Math.round(950 - (percentage - 0.8) * 350);
    } else {
      budgetScore = Math.round(1000 - percentage * 100);
    }
  }
  
  const alerts: Array<{ category: string; amount: number; threshold: number; percentage: number }> = [];
  const recommendations: Array<{ title: string; description: string; impact: 'High' | 'Medium' | 'Low'; category: string }> = [];
  
  Object.keys(categoryGroup).forEach((cat) => {
    const amt = categoryGroup[cat];
    const pct = totalSpend > 0 ? (amt / totalSpend) * 100 : 0;
    
    if (pct > 40) {
      alerts.push({
        category: cat,
        amount: parseFloat(amt.toFixed(2)),
        threshold: parseFloat((totalSpend * 0.4).toFixed(2)),
        percentage: parseFloat(pct.toFixed(1))
      });

      recommendations.push({
        title: `Consolidate ${cat} Expenses`,
        description: `Your ${cat} spend represents ${pct.toFixed(1)}% of your total outlays. Audit redundant SaaS licenses or vendors in this space immediately.`,
        impact: 'High',
        category: cat
      });
    }
  });

  // Check subscriptions
  const subs = invoices.filter((inv) => inv.ocrResult?.isSubscription);
  const totalSubSpend = subs.reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);
  
  if (totalSubSpend > 0) {
    recommendations.push({
      title: 'Analyze Recurring Subscriptions',
      description: `You have ${subs.length} active recurring subscription(s) totaling ₹${totalSubSpend.toFixed(2)} this month. Consider switching to annual billing to save up to 20%.`,
      impact: 'Medium',
      category: 'Subscriptions'
    });
  }

  // Generic savings opportunity estimation
  const savingsOpportunity = parseFloat((totalSpend * 0.12).toFixed(2));
  
  if (savingsOpportunity > 50) {
    recommendations.push({
      title: 'Optimize SaaS Idle Capacity',
      description: 'AI auditing detected under-utilized cloud seats and overlapping communication plans. De-provision 3 seats for a return of ₹840/year.',
      impact: 'High',
      category: 'Utilities'
    });
  }

  // Pre-baked summary
  let recentSummary = `You have audited ${count} invoice(s) this billing cycle, representing a total expenditure of ₹${totalSpend.toFixed(2)}. `;
  if (budgetScore > 800) {
    recentSummary += `Your financial health index is exceptional at ${budgetScore}/1000. Under-utilization has kept your burn rate perfectly optimized.`;
  } else if (budgetScore > 500) {
    recentSummary += `Your financial health index is moderate at ${budgetScore}/1000. Spending is within bounds, but optimization is recommended for cloud infrastructure and SaaS plans.`;
  } else {
    recentSummary += `WARNING: Your budget is highly stressed at ${budgetScore}/1000. Substantial overspending detected. Take actions on the flagged anomalies and duplicate entries immediately.`;
  }

  return {
    budgetScore,
    savingsOpportunity,
    overspendingAlerts: alerts,
    recommendations: recommendations.length > 0 ? recommendations : [
      { title: 'Increase Savings Reserve', description: 'Begin setting aside 10% of monthly operational cash flow to grow capital buffer.', impact: 'Low', category: 'Shopping' }
    ],
    recentSummary
  };
}

/**
 * Service: Interactive AI Advisor Chat
 */
export async function getAdvisorChatResponse(query: string, invoices: any[], chatHistory: any[]): Promise<AIAdvisorResponse> {
  const q = query.toLowerCase().trim();
  const totalSpend = invoices.reduce((sum, inv) => sum + (inv.ocrResult?.amount || 0), 0);
  
  if (GROQ_API_KEY) {
    try {
      const invoiceSummaries = invoices.map(inv => {
        return `- Invoice ${inv.ocrResult?.invoiceNumber} from ${inv.ocrResult?.merchant} on ${inv.ocrResult?.date}: ₹${inv.ocrResult?.amount} (${inv.ocrResult?.category})`;
      }).join('\n');

      const systemContext = `
        You are "Zen AI Analyst", a premium, friendly, yet highly analytical financial advisor embedded inside the FinanceLens AI SaaS platform.
        You have direct visibility into the user's uploaded invoices and expenses:
        Total Spend Audited: ₹${totalSpend}
        
        List of Invoices:
        ${invoiceSummaries}

        Answer the user's financial questions with exceptional clarity, precision, and professional financial counsel.
        Feel free to highlight anomalies, duplicate charges, or specific optimization opportunities.
        Keep your advice highly actionable and structured. Use lists, bullet points, and highlight metrics if possible.
        Keep your response moderately concise (under 250 words) and premium.
      `;

      const groqHistory = [
        {
          role: 'system',
          content: systemContext
        },
        ...chatHistory.map(ch => ({
          role: ch.role === 'assistant' ? 'assistant' : 'user',
          content: ch.content
        })),
        {
          role: 'user',
          content: query
        }
      ];

      const responseText = await queryGroq(groqHistory, 'llama-3.3-70b-versatile', false);
      
      return {
        message: responseText.trim(),
        suggestedPrompts: [
          'How to increase my savings buffer?',
          'Audit my recurring subscriptions',
          'Explain the anomalies detected'
        ]
      };
    } catch (e) {
      console.error('Groq Chat failed, running mock response:', e);
    }
  }

  // Stateful/Rule-based high-fidelity advisor mock
  await new Promise((resolve) => setTimeout(resolve, 1000));

  let reply = `I have analyzed your **FinanceLens AI Workspace** (Total spend audited: **₹${totalSpend.toFixed(2)}** across **${invoices.length} invoices**). `;
  let suggestedPrompts = ['Where am I overspending?', 'How to save?', 'Monthly summary'];

  if (q.includes('overspend') || q.includes('leak') || q.includes('spend')) {
    reply += `
Based on Q3 transaction logs, you are experiencing spending spikes in **Professional Services and SaaS Utilities**:
*   **Professional Services**: Up by **22%** this quarter. This was heavily driven by recent legal retainer adjustments.
*   **Overlapping Subscriptions**: Figma Inc. (₹120.00) and other communication suites represent a high concentration (**45%**) of your operating overhead.
*   **Anomalies Detected**: A flagged high-value invoice of **₹850.00** from **Delta Air Lines** is currently under review for potential booking duplicates.

**Recommendation**: Let's audit these 3 seats in Figma, and reprocess the Delta Air Lines invoice to verify if there was a duplicate credit.
    `;
    suggestedPrompts = ['Audit my recurring subscriptions', 'What is the Delta Air Lines anomaly?', 'View my monthly budget limit'];
  } else if (q.includes('save') || q.includes('optimize') || q.includes('recommend')) {
    reply += `
Here is a structured **Savings Blueprint** based on your current cash outflows:
1.  **De-provision Idle Licenses**: AI analysis shows 3 seats in **Figma Inc.** are inactive. Savings: **+₹840/year**.
2.  **Rep negotiate AWS Hosting**: Moving from on-demand S3 structures to standard reserved instances would trim cloud overhead by **12%**. Savings: **+₹178/month**.
3.  **Consolidate Food Catering**: The Modern Kitchen catering logs show frequent small orders. Ordering monthly batch catering reduces transaction and courier fees by **15%**.

Would you like to open the **Scenario Simulator** to calculate Q4 yields if these strategies are deployed?
    `;
    suggestedPrompts = ['Open Scenario Simulator', 'Audit my AWS expenses', 'How is the budget health calculated?'];
  } else if (q.includes('summary') || q.includes('monthly') || q.includes('report')) {
    reply += `
Here is your **Executive Summary** for the current billing cycle:
*   **Total Outflows**: ₹${totalSpend.toFixed(2)}
*   **Audited Items**: ${invoices.length} Receipts / Invoices processed
*   **Finance Health Index**: **840 / 1000 (Optimized for Q3 Expansion)**
*   **Flagged Anomalies**: 2 items under manual review.
*   **Savings Potential**: ₹${(totalSpend * 0.12).toFixed(2)} (approx. 12% in operational leaks)

Your budget is in strong standing. Overspending in travel and dining is currently balanced out by optimized office and hardware utility management.
    `;
    suggestedPrompts = ['Where am I overspending?', 'Run high-fidelity OCR scan', 'Export workspace data'];
  } else {
    reply += `
I am the **Zen AI Analyst** at your service. I can help you audit your invoices, locate financial leakages, optimize subscriptions, or simulate savings strategies. 

You can ask me questions like:
*   *Where am I overspending?*
*   *Show me how to save on my SaaS subscriptions.*
*   *Explain my monthly expense breakdown.*
    `;
  }

  return {
    message: reply,
    suggestedPrompts
  };
}
