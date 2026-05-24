import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import {
  Send,
  Sparkles,
  Trash2,
  TrendingUp,
  ChevronRight,
  Rocket,
  ShieldCheck,
  Zap,
  Target,
  Lock,
  Clock,
  LineChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const WELCOME_MESSAGE =
  "Hello and welcome! I am **Zen AI Analyst**, your premium virtual financial advisor. 🌟\n\nI've completed an autonomous audit of your workspace transactions and Q3 ledger database. Here is a quick initial update:\n\n- I noticed your **'Professional Services'** category has spiked by **22%** this quarter. This was primarily driven by recent legal retainer adjustments.\n\nWould you like me to compare these rates against regional benchmarks or analyze your recurring subscription leaks?";

// Renders inline markdown tokens with colors matching ai_page.png
const renderInline = (text: string, isAssistant: boolean): React.ReactNode => {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|'[^']+'|\b\d+%\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          const inner = part.slice(2, -2);
          return (
            <strong
              key={i}
              className={`font-semibold ${
                isAssistant ? 'text-cyan' : 'text-slate-950'
              }`}
            >
              {inner}
            </strong>
          );
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return (
            <em
              key={i}
              className={`not-italic font-semibold ${
                isAssistant ? 'text-[#c4b5fd]' : 'text-slate-900'
              }`}
            >
              {part.slice(1, -1)}
            </em>
          );
        }
        if (/^'[^']+'$/.test(part)) {
          return (
            <span
              key={i}
              className={
                isAssistant
                  ? 'text-[#c084fc] font-semibold'
                  : 'text-slate-950 font-bold'
              }
            >
              {part}
            </span>
          );
        }
        if (/^\b\d+%\b$/.test(part)) {
          return (
            <span
              key={i}
              className={
                isAssistant
                  ? 'text-cyan font-mono font-bold'
                  : 'text-slate-950 font-bold'
              }
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

const renderMessageContent = (content: string): React.ReactNode => {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="flex flex-col gap-3 text-[13px] leading-relaxed text-slate-200">
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        if (lines.length === 0) return null;

        const isBullet = (l: string) => /^\s*[\*\-]\s{1,4}/.test(l);
        const isNumbered = (l: string) => /^\s*\d+\.\s+/.test(l);
        const allBullets = lines.every(isBullet);
        const allNumbered = lines.every(isNumbered);

        if (allBullets) {
          return (
            <ul key={bIdx} className="flex flex-col gap-2 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2.5">
                  <span className="text-cyan mt-1.5 shrink-0 text-[7px]">●</span>
                  <span className="flex-1">
                    {renderInline(line.replace(/^\s*[\*\-]\s{1,4}/, ''), true)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (allNumbered) {
          return (
            <ol key={bIdx} className="flex flex-col gap-2 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2.5">
                  <span className="text-[#818cf8] font-mono font-bold shrink-0 min-w-[18px]">
                    {lIdx + 1}.
                  </span>
                  <span className="flex-1">
                    {renderInline(line.replace(/^\s*\d+\.\s+/, ''), true)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        return (
          <div key={bIdx} className="flex flex-col gap-2">
            {lines.map((line, lIdx) => (
              <p key={lIdx}>{renderInline(line.trim(), true)}</p>
            ))}
          </div>
        );
      })}
    </div>
  );
};

const formatInr = (value: number) =>
  value.toLocaleString('en-IN', { maximumFractionDigits: 0 });

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    title: 'Enterprise Secure',
    subtitle: '256-bit encryption',
  },
  {
    icon: Zap,
    title: 'Real-time Analysis',
    subtitle: 'Live financial insights',
  },
  {
    icon: Target,
    title: 'Audit Grade Accuracy',
    subtitle: 'AI validated results',
  },
  {
    icon: Lock,
    title: 'Your Data, Your Control',
    subtitle: 'Private & secure',
  },
] as const;

export const Advisor: React.FC = () => {
  const { sendAdvisorMessage, invoices, budgetLimit } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME_MESSAGE },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Yes, compare rates',
    'Audit recurring subscriptions',
    'Where am I overspending?',
  ]);

  const [savingsPct, setSavingsPct] = useState(15);
  const [reductionPct, setReductionPct] = useState(10);
  const [projectedCash, setProjectedCash] = useState(252170);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const totalSpend =
      invoices.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0) || 2500;

    const computedYield = Math.round(
      totalSpend * 18 * (savingsPct / 100) +
        budgetLimit * 22 * (reductionPct / 100) +
        234420
    );
    setProjectedCash(computedYield);
  }, [savingsPct, reductionPct, budgetLimit, invoices]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendAdvisorMessage(textToSend, historyPayload);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.message },
      ]);

      if (response.suggestedPrompts?.length) {
        setSuggestedPrompts(response.suggestedPrompts);
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection to advisor lost. Please verify backend state.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (
      window.confirm(
        'Would you like to clear the chat history and start a fresh session?'
      )
    ) {
      setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
      setSuggestedPrompts([
        'Yes, compare rates',
        'Audit recurring subscriptions',
        'Where am I overspending?',
      ]);
    }
  };

  const getPromptIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('compare') || t.includes('rate') || t.includes('yes'))
      return <LineChart className="w-4 h-4 text-cyan shrink-0" strokeWidth={2} />;
    if (t.includes('audit') || t.includes('sub') || t.includes('recurring'))
      return <Target className="w-4 h-4 text-[#c084fc] shrink-0" strokeWidth={2} />;
    return <Clock className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />;
  };

  const cyanTrackStyle = {
    background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${((savingsPct - 5) / 45) * 100}%, rgba(30,41,59,0.9) ${((savingsPct - 5) / 45) * 100}%, rgba(30,41,59,0.9) 100%)`,
  };

  const purpleTrackStyle = {
    background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((reductionPct - 5) / 35) * 100}%, rgba(30,41,59,0.9) ${((reductionPct - 5) / 35) * 100}%, rgba(30,41,59,0.9) 100%)`,
  };

  return (
    <AppLayout lockScroll>
      <div className="advisor-page-bg relative flex flex-col h-full min-h-0 overflow-hidden gap-3 sm:gap-4 text-left select-none">
        <div className="advisor-glow-orb advisor-glow-orb--tl" aria-hidden />
        <div className="advisor-glow-orb advisor-glow-orb--br" aria-hidden />
        <div className="advisor-glow-orb advisor-glow-orb--chat" aria-hidden />

        <div className="relative z-10 flex flex-col h-full min-h-0 overflow-hidden gap-3 sm:gap-4">
        {/* Header — compact so chat gets more height */}
        <div className="shrink-0">
          <h1 className="text-2xl sm:text-3xl font-geist font-bold text-white tracking-tight">
            Zen{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] via-[#5B8CFF] to-[#a855f7] bg-clip-text text-transparent">
              AI Advisor
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Direct corporate financial counseling session.
          </p>
        </div>

        {/* Main grid — chat ~72% width on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
          {/* Chat column */}
          <div className="lg:col-span-9 group flex flex-col advisor-panel min-h-0 h-full max-h-full max-lg:min-h-[58vh] max-lg:flex-1 relative overflow-hidden">
            <div className="relative z-[1] flex flex-col flex-1 min-h-0 h-full overflow-hidden p-4 sm:p-5">
            {loading && (
              <div className="absolute top-0 left-0 w-full h-0.5 glass-shimmer z-20" />
            )}

            {/* Analyst header */}
            <div className="shrink-0 flex justify-between items-center gap-3 pb-3 border-b border-slate-700/60 z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-[#7c5cfc] to-[#3b82f6] flex items-center justify-center shadow-lg shadow-[#7c5cfc]/25">
                  <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1ED760] rounded-full border-2 border-[#050a14]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-white">Zen AI Analyst</h2>
                  <p className="text-xs mt-0.5 truncate">
                    <span className="text-[#1ED760] font-medium">Active</span>
                    <span className="text-slate-400"> • Processing transactions</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Clear chat"
                  className="p-2.5 text-slate-300 hover:text-white hover:bg-white/5 border border-slate-600/50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" strokeWidth={2} />
                </button>
                <span className="hidden sm:inline text-xs border border-[#3b82f6]/50 text-cyan px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
                  Audit Consultation Thread
                </span>
              </div>
            </div>

            {/* Messages — only this region scrolls */}
            <div
              ref={messagesContainerRef}
              className="advisor-messages-scroll flex-1 min-h-0 flex flex-col gap-4 pr-1 py-3 z-10"
            >
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`max-w-full ${
                      m.role === 'user' ? 'self-end max-w-[85%]' : 'self-start w-full'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <div className="advisor-bubble p-5 sm:p-6 relative">
                        {renderMessageContent(m.content)}
                        <div className="flex items-center justify-between mt-5 pt-1">
                          <span className="text-[11px] text-slate-500 font-mono">
                            10:42 AM
                          </span>
                          <Sparkles className="w-5 h-5 text-[#a855f7]" strokeWidth={2} />
                        </div>
                      </div>
                    ) : (
                      <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-gradient-to-r from-[#3b82f6] to-[#a855f7] text-white text-sm font-medium shadow-lg shadow-blue-500/15">
                        {m.content}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="advisor-bubble px-5 py-4 flex items-center gap-3"
                >
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-[#a855f7] animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Zen is auditing ledger logs...
                  </span>
                </motion.div>
              )}
            </div>

            {/* Prompts + input */}
            <div className="shrink-0 flex flex-col gap-3 z-10 pt-2 border-t border-slate-700/40">
              {suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((p, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSendMessage(p)}
                      className="advisor-glass-pill px-4 py-2.5 rounded-full hover:border-cyan/50 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white flex items-center gap-2.5 transition-all cursor-pointer"
                    >
                      {getPromptIcon(p)}
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMsg);
                }}
                className="relative"
              >
                <input
                  type="text"
                  placeholder="Ask Zen AI anything about your corporate finances..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="advisor-glass-input w-full pl-4 pr-16 py-3.5 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan/70 focus:ring-1 focus:ring-cyan/30 focus:shadow-[0_0_24px_rgba(34,211,238,0.2)] transition-all"
                />
                <button
                  type="submit"
                  title="Send message"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-gradient-to-r from-[#3b82f6] to-[#a855f7] text-white hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#3b82f6]/25"
                >
                  <Send className="w-5 h-5" strokeWidth={2} />
                </button>
              </form>
            </div>
            </div>
          </div>

          {/* Sidebar — narrower to give chat more room */}
          <div className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto lg:overflow-hidden lg:max-w-[320px] lg:justify-self-end w-full">
            {/* Scenario simulator */}
            <div className="advisor-card p-4 flex flex-col shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#a855f7] shrink-0" strokeWidth={2} />
                <h3 className="text-xs font-bold text-white">Scenario Simulator</h3>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-slate-400">Monthly Savings Increase</span>
                    <span className="font-mono font-bold text-cyan">+{savingsPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    value={savingsPct}
                    onChange={(e) => setSavingsPct(Number(e.target.value))}
                    className="advisor-range-cyan w-full"
                    style={cyanTrackStyle}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-slate-400">Expense Reduction Target</span>
                    <span className="font-mono font-bold text-[#c084fc]">
                      {reductionPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    value={reductionPct}
                    onChange={(e) => setReductionPct(Number(e.target.value))}
                    className="advisor-range-purple w-full"
                    style={purpleTrackStyle}
                  />
                </div>
              </div>
            </div>

            {/* Projected result */}
            <div className="advisor-card p-4 flex flex-col gap-4 shrink-0">
              <div>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
                  Projected 12-Month Result
                </p>

                <div className="mt-2 flex flex-col gap-1.5">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={projectedCash}
                      initial={{ opacity: 0.7, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-2xl font-bold text-white tracking-tight leading-tight"
                    >
                      +₹{formatInr(projectedCash)}
                    </motion.span>
                  </AnimatePresence>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1ED760]">
                    Available Cash
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Enables hiring 1 associate or larger office by Q4.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  confetti({ particleCount: 80, colors: ['#3b82f6', '#a855f7'] });
                  alert(
                    `Simulation implemented. Parameters synchronized (Savings: +${savingsPct}%, Reduction: ${reductionPct}%).`
                  );
                }}
                className="w-full py-3 px-3 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#a855f7] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#3b82f6]/20 border border-white/10"
              >
                <Rocket className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span className="truncate">Implement Strategy</span>
                <ChevronRight className="w-4 h-4 shrink-0" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Trust footer — compact */}
        <div className="shrink-0 pt-3 border-t border-slate-700/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x lg:divide-slate-700/60">
            {TRUST_ITEMS.map(({ icon: Icon, title, subtitle }) => (
              <div
                key={title}
                className="flex items-center gap-2.5 lg:px-5 first:lg:pl-0 last:lg:pr-0"
              >
                <Icon className="w-5 h-5 text-cyan shrink-0" strokeWidth={2} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white">{title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
};
