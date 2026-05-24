import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { ZenPageShell } from '../components/ZenPageShell';
import { GlassCard } from '../components/GlassCard';
import { motion } from 'framer-motion';
import { FileText, ArrowRight, Loader2, Sparkles, ShieldCheck, Database, BarChart3, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Processing: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { triggerOCR, invoices } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingText, setLoadingText] = useState('Initiating character scanner...');
  
  const currentInvoice = invoices.find(inv => inv.id === id);

  const steps = [
    { title: 'Upload File', desc: 'Secure AES-256 cloud staging verification', icon: Database },
    { title: 'OCR Scanning', desc: 'Reading high-precision text character grids', icon: Loader2 },
    { title: 'Data Extraction', desc: 'Identifying Merchant, Date, Amount, and Tax structures', icon: FileText },
    { title: 'Expense Categorization', desc: 'Sorting under tax-compliant categories', icon: Sparkles },
    { title: 'Generating Insights', desc: 'Auditing duplication logs & overspending health', icon: BarChart3 },
    { title: 'Finalizing Audit', desc: 'Storing parsed ledger payload directly in Firestore', icon: ShieldCheck }
  ];

  useEffect(() => {
    if (!id) return;

    let t1: any;
    let t2: any;
    let t3: any;
    let t4: any;
    let t5: any;

    const runSimulation = () => {
      // Step 1: Upload (instant)
      setCurrentStep(0);
      setLoadingText('Securely uploading to Firebase Storage...');
      
      // Step 2: OCR Scan (after 700ms)
      t1 = setTimeout(() => {
        setCurrentStep(1);
        setLoadingText('OCR reading character pixels...');
      }, 700);

      // Step 3: Extraction (after 1500ms)
      t2 = setTimeout(() => {
        setCurrentStep(2);
        setLoadingText('Identifying billing tables & line items...');
      }, 1500);

      // Step 4: Categorization (after 2300ms)
      t3 = setTimeout(() => {
        setCurrentStep(3);
        setLoadingText('Contextually classifying expenses...');
      }, 2300);

      // Step 5: Insights (after 3000ms)
      t4 = setTimeout(() => {
        setCurrentStep(4);
        setLoadingText('Aggregating statistics & double check anomalies...');
      }, 3000);

      // Step 6: Finalize (after 3700ms)
      t5 = setTimeout(() => {
        setCurrentStep(5);
        setLoadingText('Completing secure Firestore storage commit...');
      }, 3700);
    };

    runSimulation();

    // Trigger the actual OCR back-end processing
    triggerOCR(id).catch(console.error);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [id]);

  // Navigate dynamically only when currentInvoice status changes to completed or failed!
  useEffect(() => {
    if (!id || !currentInvoice) return;

    if (currentInvoice.status === 'completed' || currentInvoice.status === 'failed') {
      const navTimer = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 60,
          colors: ['#22D3EE', '#7C5CFC', '#1ED760']
        });
        navigate(`/invoices/${id}`);
      }, 600);

      return () => clearTimeout(navTimer);
    }
  }, [currentInvoice?.status, id, navigate]);

  return (
    <AppLayout>
      <ZenPageShell
        title="AI Extraction"
        highlight="Engine"
        subtitle={
          <>
            Analyzing document{' '}
            <span className="font-mono text-cyan">{currentInvoice?.fileName || id}</span>...
          </>
        }
        className="items-center justify-center min-h-[70vh] max-w-xl mx-auto"
      >
        <GlassCard className="zen-glass-panel w-full relative overflow-hidden !p-6">
          {/* Glass shimmering shimmer layer */}
          <div className="absolute top-0 left-0 w-full h-1 glass-shimmer" />

          {/* Top Progress bar and percentage */}
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#1E293B]">
            <div>
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Pipeline Completion</span>
              <span className="text-xs font-mono font-bold text-cyan-glow">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% Completed
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-mono animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>ACTIVE PROCESSING</span>
            </div>
          </div>

          {/* Stepper Pipeline checklist */}
          <div className="flex flex-col gap-4">
            {steps.map((step, idx) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > idx;
              const isActive = currentStep === idx;
              const isPending = currentStep < idx;

              return (
                <div
                  key={idx}
                  className={`
                    flex gap-4 p-2.5 rounded-xl border transition-all duration-300
                    ${isActive ? 'border-[#334155] bg-glass-bg' : 'border-transparent'}
                  `}
                >
                  {/* Left Circle Indicator */}
                  <div className="flex items-center justify-center shrink-0">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="w-7 h-7 rounded-full bg-success/15 border border-success/35 text-success flex items-center justify-center text-xs font-bold"
                      >
                        ✓
                      </motion.div>
                    ) : isActive ? (
                      <div className="w-7 h-7 rounded-full bg-cyan/15 border border-cyan/45 text-cyan flex items-center justify-center animate-spin">
                        <Loader2 className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-glass-bg border border-[#1E293B] text-slate-600 flex items-center justify-center">
                        <StepIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Step Description */}
                  <div className="text-left flex-1 min-w-0">
                    <h4
                      className={`
                        text-xs font-bold leading-none
                        ${isActive ? 'text-white' : isCompleted ? 'text-slate-300' : 'text-slate-600'}
                      `}
                    >
                      {step.title}
                    </h4>
                    <p
                      className={`
                        text-[10px] mt-1.5 truncate
                        ${isActive ? 'text-cyan-glow' : 'text-slate-500'}
                      `}
                    >
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Live terminal ticker */}
          <div className="mt-5 pt-3 border-t border-[#1E293B] flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span className="animate-pulse">{loadingText}</span>
            <span>Task Thread: 0x{id?.substring(4, 8) || 'AE3A'}</span>
          </div>
        </GlassCard>
      </ZenPageShell>
    </AppLayout>
  );
};
