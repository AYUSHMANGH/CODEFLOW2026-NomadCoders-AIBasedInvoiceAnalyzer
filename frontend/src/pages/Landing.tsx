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
  Play,
  ShieldCheck,
  Layers,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import financelensLogo from '../assets/logo.png';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    }
  }
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 24
    }
  }
} as const;

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
    <div className="min-h-screen bg-[#0B1020] text-slate-200 selection:bg-cyan/30 selection:text-white relative overflow-hidden">
      
      {/* ─── DYNAMIC BACKGROUND LIGHTING AURA ─────────────────────────────── */}
      {/* Glow Nebula 1 (Cyan - Pulsating) */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.35, 0.45, 0.35],
          x: [0, 20, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-[-10%] left-[-15%] w-[65%] h-[65%] bg-gradient-radial from-cyan/15 to-transparent rounded-full blur-[130px] pointer-events-none z-0"
      />

      {/* Glow Nebula 2 (Indigo - Pulsating opposite) */}
      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          opacity: [0.3, 0.4, 0.3],
          x: [0, -35, 0],
          y: [0, 40, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-[15%] right-[-15%] w-[60%] h-[60%] bg-gradient-radial from-secondary/15 to-transparent rounded-full blur-[140px] pointer-events-none z-0"
      />

      {/* Glow Nebula 3 (Magenta/Rose deep section glow) */}
      <div className="absolute top-[60%] left-[20%] w-[50%] h-[50%] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Space Grid Mesh overlay for high-tech background depth */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-40 z-0" />

      {/* ─── HEADER NAVIGATION ────────────────────────────────────────────── */}
      <header className="h-20 max-w-7xl mx-auto px-6 flex items-center justify-between border-b border-glass-border relative z-30 select-none">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <img
            src={financelensLogo}
            alt="FinanceLens Logo"
            className="w-9 h-9 object-contain rounded-lg drop-shadow-[0_0_8px_rgba(34,211,238,0.55)] transition-all hover:scale-105"
          />
          <div className="flex flex-col leading-none text-left">
            <span className="font-geist font-extrabold text-sm text-white tracking-wide">
              FINANCE<span className="text-cyan drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]">LENS</span>
            </span>
            <span className="text-[9px] font-mono text-slate-400 tracking-wider mt-0.5">AI Invoice Analyzer</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-400">
          <motion.a href="#features" whileHover={{ scale: 1.05, color: '#FFFFFF' }} className="transition-colors">Features</motion.a>
          <motion.a href="#security" whileHover={{ scale: 1.05, color: '#FFFFFF' }} className="transition-colors">Security</motion.a>
          <motion.a href="#faq" whileHover={{ scale: 1.05, color: '#FFFFFF' }} className="transition-colors">FAQ</motion.a>
        </nav>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(124,92,252,0.45)' }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-primary to-secondary text-white rounded-xl shadow-lg shadow-primary/10 cursor-pointer border border-white/10 transition-all"
          >
            Get Started
          </motion.button>
        </div>
      </header>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left text column - Animated with staggered motion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-7 flex flex-col gap-6 text-left"
        >
          {/* Tagline Badge */}
          <motion.div
            variants={itemVariants}
            className="self-start px-3.5 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-cyan text-[10px] font-bold font-mono uppercase tracking-wider shadow-[0_0_12px_rgba(34,211,238,0.15)]"
          >
            ⚡ Next-Gen AI Analysis
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-geist font-black text-white leading-[1.08] tracking-tight"
          >
            Turn invoices into <br />
            <span className="bg-gradient-to-r from-cyan via-primary to-secondary bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(91,140,255,0.25)]">
              financial intelligence
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed"
          >
            Upload receipts, extract expenses, and get AI insights instantly. We automate the drudgery of auditing and invoice data-entry so you can focus on scale and strategy.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center gap-4 mt-2"
          >
            <motion.button
              onClick={handleGetStarted}
              whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(34,211,238,0.45)' }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 bg-gradient-to-r from-cyan to-primary text-slate-950 font-extrabold rounded-2xl shadow-xl shadow-cyan/20 flex items-center gap-2 cursor-pointer text-xs"
            >
              <span>Upload Invoice</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </motion.button>
            <motion.button
              onClick={handleDemoClick}
              whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.97 }}
              className="px-6 py-3.5 bg-[#051424]/90 hover:bg-glass-bg border border-glass-border text-white font-extrabold rounded-2xl transition-colors flex items-center gap-2 cursor-pointer text-xs"
            >
              <Play className="w-4 h-4 fill-white text-white" />
              <span>Try Demo Sandbox</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Right Hero Graphic - Holographic Floating Widget */}
        <div className="lg:col-span-5 relative flex justify-center items-center">
          {/* Subtle halo glow in back */}
          <div className="absolute w-[360px] h-[360px] bg-gradient-radial from-secondary/15 to-transparent rounded-full blur-[80px] pointer-events-none" />

          {/* Floater container */}
          <motion.div
            animate={{
              y: [-8, 8, -8]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="w-full max-w-sm"
          >
            {/* Interactive Hero Widget */}
            <GlassCard className="w-full max-w-sm !p-5 relative border border-glass-border shadow-[0_0_40px_rgba(124,92,252,0.12)] select-none overflow-visible">
              <div className="flex justify-between items-center mb-4">
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white tracking-wider font-mono">Monthly Burn Rate</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">AI-Calculated efficiency score: 94%</p>
                </div>
                <BarChart3 className="w-5 h-5 text-cyan animate-pulse" />
              </div>

              {/* Glowing Charts mock bars */}
              <div className="flex items-end justify-between h-32 gap-2.5 px-2 mb-4">
                <div className="w-full bg-[#1E293B] rounded-lg h-[40%] transition-all duration-1000" />
                <div className="w-full bg-gradient-to-t from-primary/30 to-primary/80 rounded-lg h-[65%] shadow-[0_0_12px_rgba(91,140,255,0.2)]" />
                <div className="w-full bg-[#1E293B] rounded-lg h-[50%]" />
                <div className="w-full bg-[#1E293B] rounded-lg h-[35%]" />
                <div className="w-full bg-gradient-to-t from-secondary/30 to-secondary/80 rounded-lg h-[95%] shadow-[0_0_15px_rgba(124,92,252,0.25)]" />
                <div className="w-full bg-gradient-to-t from-[#22D3EE]/30 to-[#22D3EE]/80 rounded-lg h-[80%] shadow-[0_0_12px_rgba(34,211,238,0.2)]" />
              </div>

              {/* Overlay glowing widgets */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute -left-6 -bottom-4 bg-[#0F172A]/90 border border-success/40 p-3 rounded-2xl flex items-start gap-2.5 shadow-2xl max-w-[200px] transition-transform duration-300 pointer-events-auto"
              >
                <div className="w-5 h-5 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mt-0.5 animate-pulse">
                  ✓
                </div>
                <div className="text-left">
                  <span className="text-[9px] font-bold text-success uppercase block">Extraction Complete</span>
                  <p className="text-[9px] text-slate-400 leading-tight mt-0.5">Vendor: Amazon Web Services. Total: ₹4,299.12</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="absolute -right-4 top-[20%] bg-[#0F172A]/95 border border-primary/30 p-2.5 rounded-xl shadow-2xl text-left transition-transform duration-300 pointer-events-auto shadow-primary/10"
              >
                <span className="text-[8px] font-mono text-[#bdc2ff] font-bold uppercase tracking-wider block">Confidence Score</span>
                <span className="text-xs font-mono font-extrabold text-[#1ED760] drop-shadow-[0_0_6px_rgba(30,215,96,0.3)]">99.8%</span>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES GRID SECTION ───────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-glass-border text-center relative z-20">
        <h2 className="text-3xl font-geist font-black text-white mb-2">Precision at every layer</h2>
        <p className="text-sm text-slate-400 max-w-xl mx-auto mb-12">
          Our specialized AI models are trained on millions of financial documents to ensure institutional-grade accuracy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: AI Invoice Extraction */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            className="flex"
          >
            <GlassCard className="text-left flex flex-col gap-3.5 border border-glass-border hover:border-cyan/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)] transition-all duration-300 flex-1">
              <div className="w-10 h-10 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan border border-cyan/25">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">AI Invoice Extraction</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Neural OCR technology captures every line item with near-perfect accuracy, even from blurry mobile photos.
              </p>
            </GlassCard>
          </motion.div>

          {/* Card 2: Expense Categorization */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            className="flex"
          >
            <GlassCard className="text-left flex flex-col gap-3.5 border border-glass-border hover:border-primary/50 hover:shadow-[0_0_30px_rgba(91,140,255,0.12)] transition-all duration-300 flex-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/25">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Expense Categorization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatically sort expenses into tax-compliant categories using our proprietary LLM classifier.
              </p>
            </GlassCard>
          </motion.div>

          {/* Card 3: Financial Analytics */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            className="flex"
          >
            <GlassCard className="text-left flex flex-col gap-3.5 border border-glass-border hover:border-success/50 hover:shadow-[0_0_30px_rgba(30,215,96,0.12)] transition-all duration-300 flex-1">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success border border-success/25">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Financial Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Visualize spend patterns and identify anomalies before they become problems with real-time dashboards.
              </p>
            </GlassCard>
          </motion.div>

          {/* Card 4: Smart Recommendations */}
          <motion.div
            whileHover={{ scale: 1.03, y: -4 }}
            className="flex"
          >
            <GlassCard className="text-left flex flex-col gap-3.5 border border-glass-border hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(124,92,252,0.12)] transition-all duration-300 flex-1">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/25">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-sm font-extrabold text-white">Smart Recommendations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive proactive alerts on subscription bloat and tax-saving opportunities tailored to your profile.
              </p>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* ─── SECURITY & LOGOS SECTION ───────────────────────────────────── */}
      <section id="security" className="max-w-7xl mx-auto px-6 py-20 border-t border-glass-border relative z-20">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/20 text-success text-[10px] font-bold font-mono uppercase tracking-wider mb-4 animate-pulse">
            🛡️ Bank-Grade Compliance
          </div>
          <h2 className="text-3xl font-geist font-black text-white mb-3">Enterprise Trust & Ironclad Security</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            FinanceLens AI meets rigorous institutional auditing standards and operates under state-of-the-art security protocols to protect your corporate treasury logs.
          </p>
        </div>

        {/* Brand Logos Wall */}
        <div className="mb-20">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest text-center mb-8">Trusted by scale-focused companies</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-items-center opacity-50">
            {/* Linear-like Logo */}
            <motion.div whileHover={{ scale: 1.05, opacity: 1 }} className="flex items-center gap-2 transition-all duration-300 cursor-pointer">
              <div className="w-5 h-5 rounded-md bg-white text-slate-950 flex items-center justify-center font-bold text-xs font-mono">L</div>
              <span className="font-geist font-bold text-sm tracking-tight text-white">LINEAR</span>
            </motion.div>
            {/* Stripe-like Logo */}
            <motion.div whileHover={{ scale: 1.05, opacity: 1 }} className="flex items-center gap-1.5 transition-all duration-300 cursor-pointer">
              <span className="font-geist font-black text-lg tracking-tighter text-white">stripe</span>
            </motion.div>
            {/* Vercel-like Logo */}
            <motion.div whileHover={{ scale: 1.05, opacity: 1 }} className="flex items-center gap-2 transition-all duration-300 cursor-pointer">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 75 65"><path d="M37.5 0 L75 65 L0 65 Z" /></svg>
              <span className="font-geist font-bold text-sm tracking-tight text-white font-mono">VERCEL</span>
            </motion.div>
            {/* Supabase-like Logo */}
            <motion.div whileHover={{ scale: 1.05, opacity: 1 }} className="flex items-center gap-2 transition-all duration-300 cursor-pointer">
              <span className="text-emerald-400 font-bold">⚡</span>
              <span className="font-geist font-bold text-sm tracking-tight text-white">supabase</span>
            </motion.div>
            {/* Retool-like Logo */}
            <motion.div whileHover={{ scale: 1.05, opacity: 1 }} className="flex items-center gap-2 transition-all duration-300 cursor-pointer">
              <div className="w-4.5 h-4.5 border-2 border-dashed border-white rounded-md" />
              <span className="font-geist font-bold text-sm tracking-tight text-white font-mono">RETOOL</span>
            </motion.div>
          </div>
        </div>

        {/* Security Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <GlassCard className="text-left flex flex-col gap-4 p-6 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center text-success border border-success/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">SOC 2 Type II Certified</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                Undergoes continuous independent audits to ensure our security controls meet the highest AICPA Trust Services Criteria.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="text-left flex flex-col gap-4 p-6 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-cyan/15 flex items-center justify-center text-cyan border border-cyan/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">AES-256 Encryption</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                All uploaded documents and parsed financial metadata are encrypted at rest with AES-256 and in transit via TLS 1.3.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="text-left flex flex-col gap-4 p-6 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary border border-primary/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">ISO 27001 Governance</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                Operates within a formalized Information Security Management System (ISMS) protecting asset integrity and user operations.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="text-left flex flex-col gap-4 p-6 hoverEffect border border-glass-border">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Zero-Train Privacy</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2">
                Strict data boundaries apply. Your parsed receipt entries and logs are never utilized to pre-train public foundational AI models.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── FAQ SECTION WITH SLIDE ACCORDIONS ────────────────────────────── */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-20 border-t border-glass-border relative z-20">
        <h2 className="text-3xl font-geist font-black text-center text-white mb-10">Frequently Asked Questions</h2>
        
        <div className="flex flex-col gap-4">
          {faqItems.map((item, idx) => (
            <GlassCard
              key={idx}
              onClick={() => toggleFaq(idx)}
              className="!p-5 hoverEffect border border-glass-border cursor-pointer select-none"
            >
              <div className="flex justify-between items-center select-none">
                <span className="text-sm font-bold text-white text-left">{item.q}</span>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${activeFaq === idx ? 'rotate-180 text-cyan' : ''}`} />
              </div>
              <AnimatePresence initial={false}>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-[#1E293B] text-left leading-relaxed">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ─── BOTTOM GLOWING CALL TO ACTION ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-24 pt-10 relative z-20">
        {/* Glow panel container */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/15 to-[#0B1020] border border-secondary/35 rounded-[28px] p-12 text-center shadow-[0_0_40px_rgba(124,92,252,0.1)] relative overflow-hidden">
          {/* Internal neon ambient lighting */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#7C5CFC]/15 rounded-full blur-[90px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#22D3EE]/10 rounded-full blur-[90px] pointer-events-none" />

          <h2 className="text-3xl sm:text-4xl font-geist font-black text-white mb-3">Ready to automate your finance?</h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Join over 5,000+ finance teams using FinanceLens to reclaim 20+ hours a month on manual invoice bookkeeping and data-entry.
          </p>
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(124,92,252,0.5)' }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-4 bg-primary text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-primary/20 transition-all cursor-pointer border border-white/10"
          >
            Start Free Sandbox Session
          </motion.button>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1E293B] bg-[#051424] py-10 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img
              src={financelensLogo}
              alt="FinanceLens Logo"
              className="w-8 h-8 object-contain rounded-lg drop-shadow-[0_0_6px_rgba(0,229,255,0.5)]"
            />
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
