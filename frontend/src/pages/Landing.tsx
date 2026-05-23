import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/GlassCard';
import {
  FileText,
  BarChart3,
  Cpu,
  Zap,
  ArrowRight,
  TrendingDown,
  Lock,
  ChevronDown,
  Play
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleDemoClick = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      colors: ['#22D3EE', '#818CF8', '#10B981']
    });
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: 'How does the AI OCR extraction work?',
      a: 'FinanceLens AI utilizes state-of-the-art vision models (Gemini Flash) to parse receipt and invoice images or PDFs. It instantly extracts line items, merchant headers, dates, currencies, and taxes with an institutional-grade accuracy rate exceeding 99%.'
    },
    {
      q: 'Is my financial data secure?',
      a: 'Absolutely. We enforce AES-256 data encryption at rest and secure SSL transmissions. Data processing isolates each tenant, and we never utilize your private financial documents to train public LLM models.'
    },
    {
      q: 'Can I integrate this with QuickBooks or Xero?',
      a: 'Yes, FinanceLens AI includes one-click workspace dumps to standardized JSON/CSV formats, allowing you to import your audited records seamlessly into any accounting framework.'
    },
    {
      q: 'What document formats are supported?',
      a: 'We support high-resolution file formats up to 25MB, including PDF documents, PNG images, and JPEG files.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-200 selection:bg-cyan/30 selection:text-white">
      {/* Space blobs */}
      <div className="absolute top-[10%] left-[-15%] w-[60%] h-[60%] bg-[#5B8CFF]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-15%] w-[60%] h-[60%] bg-[#7C5CFC]/8 rounded-full blur-[140px] pointer-events-none" />

      {/* Modern Header Navigation */}
      <header className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between border-b border-glass-border relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-geist font-black text-lg text-white">F</span>
          </div>
          <span className="font-geist font-extrabold text-md text-white tracking-wide">
            FINANCE<span className="text-cyan">LENS</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#demo" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={handleGetStarted}
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/30 transition-all cursor-pointer"
          >
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left text column */}
        <div className="lg:col-span-7 flex flex-col gap-6 text-left">
          {/* Tagline Badge */}
          <div className="self-start px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold font-mono uppercase tracking-wider">
            ⚡ Next-Gen AI Analysis
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-geist font-black text-white leading-[1.1] tracking-tight">
            Turn invoices into <br />
            <span className="bg-gradient-to-r from-cyan via-primary to-secondary bg-clip-text text-transparent">
              financial intelligence
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed">
            Upload receipts, extract expenses, and get AI insights instantly. We automate the drudgery of auditing and invoice data-entry so you can focus on scale and strategy.
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <button
              onClick={handleGetStarted}
              className="px-6 py-3.5 bg-gradient-to-r from-cyan to-primary text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-cyan/25 hover:shadow-cyan/45 hover:scale-[1.03] transition-all flex items-center gap-2 cursor-pointer text-xs"
            >
              <span>Upload Invoice</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleDemoClick}
              className="px-6 py-3.5 bg-[#051424] hover:bg-glass-bg border border-glass-border text-white font-extrabold rounded-2xl transition-all flex items-center gap-2 cursor-pointer text-xs"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Try Demo Sandbox</span>
            </button>
          </div>
        </div>

        {/* Right Hero Graphic - Matches landing page.png! */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          <div className="absolute w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

          {/* Interactive Hero Widget */}
          <GlassCard className="w-full max-w-sm !p-5 relative border border-glass-border select-none">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wider font-mono">Monthly Burn Rate</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">AI-Calculated efficiency score: 94%</p>
              </div>
              <BarChart3 className="w-5 h-5 text-cyan" />
            </div>

            {/* Glowing Charts mock bars */}
            <div className="flex items-end justify-between h-32 gap-2.5 px-2 mb-4">
              <div className="w-full bg-[#1E293B] rounded-lg h-[40%] transition-all duration-1000" />
              <div className="w-full bg-gradient-to-t from-primary/30 to-primary/80 rounded-lg h-[65%] shadow-lg shadow-primary/20" />
              <div className="w-full bg-[#1E293B] rounded-lg h-[50%]" />
              <div className="w-full bg-[#1E293B] rounded-lg h-[35%]" />
              <div className="w-full bg-gradient-to-t from-secondary/30 to-secondary/80 rounded-lg h-[95%] shadow-lg shadow-secondary/25" />
              <div className="w-full bg-gradient-to-t from-[#22D3EE]/30 to-[#22D3EE]/80 rounded-lg h-[80%] shadow-lg shadow-cyan/20" />
            </div>

            {/* Overlay glowing widgets */}
            <div className="absolute -left-6 -bottom-4 bg-[#0F172A]/90 border border-success/40 p-3 rounded-2xl flex items-start gap-2.5 shadow-2xl max-w-[200px] hover:scale-105 transition-transform duration-300">
              <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mt-0.5 animate-pulse">
                ✓
              </div>
              <div className="text-left">
                <span className="text-[9px] font-bold text-success uppercase block">Extraction Complete</span>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Vendor: Amazon Web Services. Total: $4,299.12</p>
              </div>
            </div>

            <div className="absolute -right-4 top-[20%] bg-[#0F172A]/90 border border-primary/30 p-2.5 rounded-xl shadow-2xl text-left hover:scale-105 transition-transform duration-300">
              <span className="text-[8px] font-mono text-primary-glow font-bold uppercase tracking-wider block">Confidence Score</span>
              <span className="text-xs font-mono font-extrabold text-[#1ED760]">99.8%</span>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Features grid section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-glass-border text-center relative z-20">
        <h2 className="text-3xl font-geist font-black text-white mb-2">Precision at every layer</h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto mb-12">
          Our specialized AI models are trained on millions of financial documents to ensure institutional-grade accuracy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <GlassCard className="text-left flex flex-col gap-3.5 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan border border-cyan/20">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-white">AI Invoice Extraction</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Neural OCR technology captures every line item with near-perfect accuracy, even from blurry mobile photos.
            </p>
          </GlassCard>

          <GlassCard className="text-left flex flex-col gap-3.5 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary border border-primary/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Expense Categorization</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically sort expenses into tax-compliant categories using our proprietary LLM classifier.
            </p>
          </GlassCard>

          <GlassCard className="text-left flex flex-col gap-3.5 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center text-success border border-success/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Financial Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visualize spend patterns and identify anomalies before they become problems with real-time dashboards.
            </p>
          </GlassCard>

          <GlassCard className="text-left flex flex-col gap-3.5 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-white">Smart Recommendations</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive proactive alerts on subscription bloat and tax-saving opportunities tailored to your profile.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-glass-border relative z-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-geist font-black text-white mb-2">Transparent pricing for scale</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Choose a roadmap that suits your business scale. Setup takes less than 2 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          <GlassCard className="flex flex-col justify-between hoverEffect border border-glass-border">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Starter</span>
              <h3 className="text-2xl font-bold text-white mt-1">$0</h3>
              <p className="text-[11px] text-slate-400 mt-2 mb-6">Perfect to test sandbox metrics</p>
              <ul className="text-xs flex flex-col gap-3 text-slate-300 text-left">
                <li>✓ Local Sandbox Mode</li>
                <li>✓ 5 Uploads per Month</li>
                <li>✓ Standard AI OCR Scanning</li>
                <li>✓ Export to JSON/CSV</li>
              </ul>
            </div>
            <button
              onClick={handleGetStarted}
              className="w-full py-2.5 mt-8 bg-glass-bg border border-glass-border text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Sign Up Free
            </button>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between hoverEffect border-2 border-primary/50 relative shadow-2xl shadow-primary/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-slate-950 font-bold text-[9px] uppercase tracking-wider font-mono">
              Most Popular
            </span>
            <div>
              <span className="text-[10px] font-mono text-primary-glow uppercase">Professional</span>
              <h3 className="text-2xl font-bold text-white mt-1">$49<span className="text-sm text-slate-400">/mo</span></h3>
              <p className="text-[11px] text-slate-400 mt-2 mb-6">Ideal for active SMB finance teams</p>
              <ul className="text-xs flex flex-col gap-3 text-slate-300 text-left">
                <li>✓ Real Cloud Storage & Sync</li>
                <li>✓ Unlimited Invoice Uploads</li>
                <li>✓ Multi-page OCR Deep Scan</li>
                <li>✓ Zen AI Analyst chat consultations</li>
                <li>✓ Duplicates & Anomalies engine</li>
              </ul>
            </div>
            <button
              onClick={handleGetStarted}
              className="w-full py-2.5 mt-8 bg-primary text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-lg shadow-primary/20"
            >
              Start Free Trial
            </button>
          </GlassCard>

          <GlassCard className="flex flex-col justify-between hoverEffect border border-glass-border">
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase">Enterprise</span>
              <h3 className="text-2xl font-bold text-white mt-1">Custom</h3>
              <p className="text-[11px] text-slate-400 mt-2 mb-6">Tailored for complex compliance audits</p>
              <ul className="text-xs flex flex-col gap-3 text-slate-300 text-left">
                <li>✓ Custom API Endpoint integrations</li>
                <li>✓ Dedicated LLM OCR fine-tuning</li>
                <li>✓ Multi-seat Accountant permissions</li>
                <li>✓ 24/7 SLA Audit Assurances</li>
              </ul>
            </div>
            <button
              onClick={() => alert('Our Enterprise desk is routed to sales@financelens.ai.')}
              className="w-full py-2.5 mt-8 bg-glass-bg border border-glass-border text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              Contact Desk
            </button>
          </GlassCard>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-glass-border relative z-20">
        <h2 className="text-3xl font-geist font-black text-center text-white mb-10">Frequently Asked Questions</h2>
        
        <div className="flex flex-col gap-4">
          {faqItems.map((item, idx) => (
            <GlassCard
              key={idx}
              onClick={() => toggleFaq(idx)}
              className="!p-5 hoverEffect border border-glass-border"
            >
              <div className="flex justify-between items-center select-none">
                <span className="text-sm font-bold text-white text-left">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan' : ''}`} />
              </div>
              {activeFaq === idx && (
                <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-[#1E293B] text-left leading-relaxed">
                  {item.a}
                </p>
              )}
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Bottom Call to Action Section */}
      <section className="max-w-6xl mx-auto px-6 pb-24 pt-10 relative z-20">
        <GlassCard className="bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent p-12 text-center border border-glass-border">
          <h2 className="text-3xl sm:text-4xl font-geist font-black text-white mb-3">Ready to automate your finance?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Join over 5,000+ finance teams using FinanceLens to reclaim 20+ hours a month on manual invoice bookkeeping and data-entry.
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-primary text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/45 hover:scale-[1.03] transition-all cursor-pointer"
          >
            Start Free Sandbox Session
          </button>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] bg-[#051424] py-10 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <span className="font-geist font-black text-sm text-white">F</span>
            </div>
            <span className="font-geist font-extrabold text-xs text-white">
              © {new Date().getFullYear()} FinanceLens AI. Precision Intelligence for Finance.
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] text-slate-400 font-medium">
            <span className="hover:text-white cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white cursor-pointer">Terms of Service</span>
            <span className="hover:text-white cursor-pointer">Security Certifications</span>
            <span className="hover:text-white cursor-pointer">System Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
