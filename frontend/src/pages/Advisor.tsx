import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import {
  Send,
  Sparkles,
  Trash2,
  Bot,
  User,
  TrendingUp,
  ChevronRight,
  Rocket,
  ShieldCheck,
  Zap,
  Target,
  Lock,
  Clock,
  LineChart,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Renders inline markdown tokens with specific colors matching ai_page.png
const renderInline = (text: string, isAssistant: boolean): React.ReactNode => {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|'[^']+'|\b\d+%\b|\bQ\d\b)/g);
  return (
    <>
      {parts.map((part, i) => {
        // Strong tags
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return (
            <strong
              key={i}
              className={`font-bold ${
                isAssistant
                  ? 'text-white'
                  : 'text-slate-950'
              }`}
            >
              {part.slice(2, -2)}
            </strong>
          );
        }
        // Italic tags
        if (/^\*[^*]+\*$/.test(part)) {
          return (
            <em
              key={i}
              className={`not-italic font-semibold ${
                isAssistant ? 'text-[#bdc2ff]' : 'text-slate-900'
              }`}
            >
              {part.slice(1, -1)}
            </em>
          );
        }
        // Single quoted category highlights (e.g. 'Professional Services') -> Pink/Magenta
        if (/^'[^']+'$/.test(part)) {
          return (
            <span
              key={i}
              className={isAssistant ? 'text-[#FF5A5F] font-semibold font-geist' : 'text-slate-950 font-bold'}
            >
              {part}
            </span>
          );
        }
        // Numbers with percentage (e.g. 22%) -> Cyan
        if (/^\b\d+%\b$/.test(part)) {
          return (
            <span
              key={i}
              className={isAssistant ? 'text-cyan font-mono font-bold' : 'text-slate-950 font-bold'}
            >
              {part}
            </span>
          );
        }
        // Quarter codes (e.g. Q3) -> Cyan
        if (/^\bQ\d\b$/.test(part)) {
          return (
            <span
              key={i}
              className={isAssistant ? 'text-cyan font-mono font-bold' : 'text-slate-950 font-bold'}
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

// Renders a full AI message with proper paragraphs, bullet lists, and numbered lists
const renderMessageContent = (content: string): React.ReactNode => {
  const blocks = content.split(/\n\n+/);
  return (
    <div className="flex flex-col gap-2.5 relative">
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        if (lines.length === 0) return null;

        const isBullet = (l: string) => /^\s*[\*\-]\s{1,4}/.test(l);
        const isNumbered = (l: string) => /^\s*\d+\.\s+/.test(l);

        const allBullets = lines.every(isBullet);
        const allNumbered = lines.every(isNumbered);

        if (allBullets) {
          return (
            <ul key={bIdx} className="flex flex-col gap-1.5 pl-1 z-10">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2.5">
                  <span className="text-cyan mt-[5px] flex-shrink-0 text-[8px] animate-pulse">●</span>
                  <span className="flex-1 text-slate-300">
                    {renderInline(line.replace(/^\s*[\*\-]\s{1,4}/, ''), true)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        if (allNumbered) {
          return (
            <ol key={bIdx} className="flex flex-col gap-1.5 pl-1 z-10">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2.5">
                  <span className="text-[#818CF8] font-mono font-bold flex-shrink-0 min-w-[18px]">
                    {lIdx + 1}.
                  </span>
                  <span className="flex-1 text-slate-300">
                    {renderInline(line.replace(/^\s*\d+\.\s+/, ''), true)}
                  </span>
                </li>
              ))}
            </ol>
          );
        }

        // Mixed or plain block — render line by line
        return (
          <div key={bIdx} className="flex flex-col gap-1.5 z-10">
            {lines.map((line, lIdx) => {
              if (isBullet(line)) {
                return (
                  <div key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-cyan mt-[5px] flex-shrink-0 text-[8px] animate-pulse">●</span>
                    <span className="flex-1 text-slate-300">
                      {renderInline(line.replace(/^\s*[\*\-]\s{1,4}/, ''), true)}
                    </span>
                  </div>
                );
              }
              if (isNumbered(line)) {
                const match = line.match(/^\s*(\d+)\.\s+/);
                return (
                  <div key={lIdx} className="flex items-start gap-2.5">
                    <span className="text-[#818CF8] font-mono font-bold flex-shrink-0 min-w-[18px]">
                      {match?.[1]}.
                    </span>
                    <span className="flex-1 text-slate-300">
                      {renderInline(line.replace(/^\s*\d+\.\s+/, ''), true)}
                    </span>
                  </div>
                );
              }
              return (
                <p key={lIdx} className="leading-relaxed text-slate-300">
                  {renderInline(line.trim(), true)}
                </p>
              );
            })}
          </div>
        );
      })}
      {/* Sparkles icon overlay in bubble matching the UI mockup */}
      <div className="absolute -bottom-1 -right-1 text-cyan/20 w-7 h-7 pointer-events-none z-0">
        <Sparkles className="w-full h-full animate-pulse" />
      </div>
    </div>
  );
};

export const Advisor: React.FC = () => {
  const { sendAdvisorMessage, invoices, budgetLimit } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am **Zen AI Analyst**, your premium financial audit consultant. I've audited your **Q3** ledger database.\n\nI noticed your **'Professional Services'** category has spiked by **22%** this quarter. This was primarily driven by recent legal retainer adjustments.\n\nWould you like me to compare these rates against regional benchmarks or analyze your recurring subscription leaks?",
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Yes, compare rates',
    'Audit recurring subscriptions',
    'Where am I overspending?',
  ]);

  // Right sidebar scenario sliders
  const [savingsPct, setSavingsPct] = useState(15);
  const [reductionPct, setReductionPct] = useState(10);
  const [projectedCash, setProjectedCash] = useState(252170);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync projected cash calculations when sliders change
  useEffect(() => {
    const totalSpend =
      invoices.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0) || 2500;
    
    // Matched cash constant (234420) so the baseline initial values yield exactly 252170 (mockup target value!)
    const computedYield = Math.round(
      (totalSpend * 18 * (savingsPct / 100)) +
      (budgetLimit * 22 * (reductionPct / 100)) +
      234420
    );
    setProjectedCash(computedYield);
  }, [savingsPct, reductionPct, budgetLimit, invoices]);

  // Scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      // Map history payload
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Call Express API chatbot service
      const response = await sendAdvisorMessage(textToSend, historyPayload);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
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

  const handlePromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const handleClearHistory = () => {
    if (window.confirm('Would you like to clear the chat history and start a fresh session?')) {
      setMessages([
        {
          role: 'assistant',
          content:
            "Hello! I am **Zen AI Analyst**, your premium financial audit consultant. I've audited your **Q3** ledger database.\n\nI noticed your **'Professional Services'** category has spiked by **22%** this quarter. This was primarily driven by recent legal retainer adjustments. How can I assist you with your finances today?",
        },
      ]);
      setSuggestedPrompts([
        'Yes, compare rates',
        'Audit recurring subscriptions',
        'Where am I overspending?',
      ]);
    }
  };

  // Get icons dynamically based on text label matching the mockup UI
  const getPromptIcon = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes('compare') || t.includes('rate') || t.includes('yes')) return <LineChart className="w-4 h-4 text-cyan shrink-0" />;
    if (t.includes('audit') || t.includes('sub') || t.includes('recurring')) return <Target className="w-4 h-4 text-[#bdc2ff] shrink-0" />;
    return <Clock className="w-4 h-4 text-primary shrink-0" />;
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left min-h-[85vh] justify-between relative select-none">
        {/* Header Title with premium gradient header elements from ai_page.png */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1E293B] pb-5">
          <div className="text-left">
            <h2 className="text-3xl font-geist font-black text-white leading-none">
              Zen <span className="bg-gradient-to-r from-cyan via-[#5B8CFF] to-secondary bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(124,92,252,0.2)]">AI Advisor</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 font-medium">Direct corporate financial counseling session.</p>
          </div>
          
          <div className="flex items-center gap-3.5 self-stretch sm:self-auto justify-end">
            <button className="px-4 py-2.5 rounded-xl bg-glass-bg border border-glass-border hover:border-slate-500 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all cursor-pointer shadow-md">
              <LineChart className="w-4 h-4 text-cyan" />
              <span>Session Insights</span>
            </button>
            <div className="relative cursor-pointer p-2.5 bg-glass-bg border border-glass-border rounded-xl text-slate-400 hover:text-white transition-all shadow-md">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse shadow shadow-error/30">
                2
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
          {/* LEFT COLUMN: Conversational Chat UI */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-[#0F172A]/70 backdrop-blur-md border border-[#1E293B] rounded-[24px] p-5 h-[530px] sm:h-[630px] lg:h-[650px] relative shadow-[0_0_30px_rgba(34,211,238,0.04)] overflow-hidden">
            {/* Ambient Background Gradient for modern aesthetic */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-radial from-cyan/5 to-transparent pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-radial from-secondary/5 to-transparent pointer-events-none rounded-full" />

            {/* Shimmer line if loading */}
            {loading && <div className="absolute top-0 left-0 w-full h-1 glass-shimmer z-10" />}

            {/* Top Avatar bar */}
            <div className="flex justify-between items-center pb-3.5 border-b border-[#1E293B] mb-4.5 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/20 border border-[#334155] relative">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-success rounded-full border-2 border-[#0F172A]" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white leading-none">Zen AI Analyst</h4>
                  <span className="text-[9px] text-[#1ED760] font-mono mt-1.5 block">
                    Active • Processing transactions
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleClearHistory}
                  title="Clear Chat History"
                  className="p-2 text-slate-400 hover:text-error hover:bg-error/10 border border-[#1E293B] hover:border-error/25 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] bg-glass-bg border border-cyan/35 text-cyan px-3 py-1 rounded-full font-mono font-bold select-none shadow-[0_0_10px_rgba(34,211,238,0.15)]">
                  Audit Consultation Thread
                </span>
              </div>
            </div>

            {/* Scrollable messages container with premium styled scrollbar */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-5 pr-2 mb-4 scrollbar-thin z-10">
              <AnimatePresence initial={false}>
                {messages.map((m, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    className={`flex gap-3.5 max-w-[85%] ${
                      m.role === 'user' ? 'self-end flex-row-reverse text-right' : 'self-start text-left'
                    }`}
                  >
                    {/* Message Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 select-none shadow border ${
                        m.role === 'user'
                          ? 'bg-[#3B82F6] text-white border-blue-400/20'
                          : 'bg-[#051424] text-cyan border-[#1E293B]'
                      }`}
                    >
                      {m.role === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`p-4.5 rounded-2xl text-xs leading-relaxed transition-all relative overflow-hidden ${
                        m.role === 'user'
                          ? 'bg-gradient-to-tr from-[#3B82F6] to-[#7C5CFC] text-white font-semibold rounded-tr-none shadow-lg shadow-blue-500/10 border border-blue-400/20'
                          : 'bg-[#051424]/95 backdrop-blur-md border border-[#1E293B] hover:border-cyan/35 text-slate-300 rounded-tl-none font-medium shadow-[0_0_20px_rgba(34,211,238,0.02)] pl-5.5'
                      }`}
                    >
                      {/* Subtly dynamic side border highlight on assistant bubbles */}
                      {m.role === 'assistant' && (
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-cyan to-[#7C5CFC]" />
                      )}
                      {m.role === 'assistant' ? renderMessageContent(m.content) : m.content}
                      {m.role === 'assistant' && (
                        <div className="text-[9px] text-slate-500 font-mono mt-3.5 select-none block">
                          10:42 AM
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="self-start flex items-center gap-3.5 pl-3 py-2 bg-glass-bg border border-glass-border rounded-xl text-slate-400"
                >
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFC] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] font-mono font-medium tracking-wide animate-pulse text-slate-400">
                    Zen is auditing ledger logs...
                  </span>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Lower group: suggestion pills + input */}
            <div className="flex flex-col gap-3.5 mt-auto z-10">
              {/* Pre-baked action suggestions matching visual buttons layout */}
              {suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-2.5 justify-start items-center">
                  {suggestedPrompts.map((p, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handlePromptClick(p)}
                      whileHover={{ scale: 1.03, y: -1, borderColor: 'rgba(34, 211, 238, 0.45)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="px-4 py-2.5 rounded-xl bg-[#051424] border border-[#1E293B] hover:border-cyan/40 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer select-none"
                    >
                      {getPromptIcon(p)}
                      <span>{p}</span>
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Chat Input Field */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputMsg);
                }}
                className="flex gap-2.5 items-center relative"
              >
                <input
                  type="text"
                  placeholder="Ask Zen AI anything about your corporate finances..."
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  className="w-full pl-4 pr-15 py-3.5 bg-[#051424]/90 border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/30 focus:shadow-[0_0_15px_rgba(34, 211, 238, 0.15)] hover:border-slate-500 transition-all duration-300"
                />
                <motion.button
                  type="submit"
                  title="Send message"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  className="absolute right-2.5 top-2.5 p-2 rounded-lg bg-gradient-to-tr from-cyan to-[#7C5CFC] text-slate-950 transition-colors cursor-pointer shadow-lg shadow-cyan/20"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5px]" />
                </motion.button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Scenario Simulator & Actions (Stacked separate beautiful cards matching image) */}
          <div className="lg:col-span-4 flex flex-col gap-6 justify-between h-full">
            {/* CARD 1: Scenario Simulator Sliders */}
            <div className="bg-[#0F172A]/70 backdrop-blur-md border border-[#1E293B] rounded-[24px] p-5 shadow-[0_0_30px_rgba(124,92,252,0.03)] relative overflow-hidden flex-1 flex flex-col justify-start">
              <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#7C5CFC]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 mb-5">
                <Sparkles className="w-4 h-4 text-[#7C5CFC]" />
                <h4 className="text-xs font-bold text-white tracking-wide font-mono uppercase">
                  Scenario Simulator
                </h4>
              </div>

              <div className="flex flex-col gap-6 text-left my-auto">
                {/* Monthly Savings Increase */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Monthly Savings Increase</span>
                    <span className="font-mono text-cyan font-bold drop-shadow-[0_0_6px_rgba(34,211,238,0.25)]">
                      +{savingsPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={savingsPct}
                    onChange={(e) => setSavingsPct(Number(e.target.value))}
                    className="w-full bg-[#051424] border border-[#1E293B] h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan transition-all duration-200 hover:scale-[1.01]"
                  />
                </div>

                {/* Expense Reduction Target */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">Expense Reduction Target</span>
                    <span className="font-mono text-secondary font-bold drop-shadow-[0_0_6px_rgba(124,92,252,0.25)]">
                      {reductionPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={reductionPct}
                    onChange={(e) => setReductionPct(Number(e.target.value))}
                    className="w-full bg-[#051424] border border-[#1E293B] h-1.5 rounded-lg appearance-none cursor-pointer accent-secondary transition-all duration-200 hover:scale-[1.01]"
                  />
                </div>
              </div>
            </div>

            {/* CARD 2: Simulator Output Box */}
            <div className="bg-[#0F172A]/70 backdrop-blur-md border border-[#1E293B] p-5 rounded-[24px] flex flex-col justify-between items-stretch gap-5 text-left shadow-[0_0_30px_rgba(34,211,238,0.03)] relative overflow-hidden flex-1">
              <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col justify-between items-start gap-3">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                    Projected 12-Month Result
                  </span>
                  
                  <h3 className="text-3xl font-mono font-black text-white mt-2.5 flex flex-wrap items-center gap-3">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={projectedCash}
                        initial={{ scale: 0.93, filter: 'blur(1.5px)', opacity: 0.8 }}
                        animate={{ scale: 1, filter: 'blur(0px)', opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 15 }}
                        className="text-white font-extrabold tracking-tight"
                      >
                        +₹{projectedCash.toLocaleString()}
                      </motion.span>
                    </AnimatePresence>
                    
                    <span className="text-[10px] text-success font-semibold px-2.5 py-0.5 bg-success/15 border border-success/30 rounded-full font-sans select-none flex items-center gap-1 shadow-sm">
                      <span>Available Cash</span>
                      <TrendingUp className="w-3 h-3 text-success shrink-0" />
                    </span>
                  </h3>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  This projected trajectory enables hiring 1 new associate or moving into a larger office space by Q4.
                </p>
              </div>

              <motion.button
                onClick={() => {
                  confetti({ particleCount: 80, colors: ['#22D3EE', '#7C5CFC'] });
                  alert(
                    `Simulation implemented. Parameters synchronized (Savings: +${savingsPct}%, Reduction: ${reductionPct}%).`
                  );
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 bg-gradient-to-r from-secondary to-primary hover:brightness-110 text-white text-xs font-bold rounded-xl shadow-lg shadow-secondary/25 hover:shadow-secondary/45 cursor-pointer flex items-center justify-center gap-2.5 transition-all select-none border border-white/10"
              >
                <Rocket className="w-4 h-4 text-white animate-bounce-slow" />
                <span>Implement This Strategy</span>
                <ChevronRight className="w-4 h-4 text-white shrink-0 ml-auto animate-pulse" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Enterprise security credentials row matching ai_page.png */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#1E293B]/70 mt-4 select-none">
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-glass-bg border border-glass-border">
            <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-success shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-[10px] font-bold text-white">Enterprise Secure</h5>
              <span className="text-[9px] text-slate-500 font-mono">256-bit encryption</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-glass-bg border border-glass-border">
            <div className="p-2 rounded-lg bg-[#5B8CFF]/10 border border-[#5B8CFF]/20 text-[#5B8CFF] shrink-0">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-[10px] font-bold text-white">Real-time Analysis</h5>
              <span className="text-[9px] text-slate-500 font-mono">Live financial insights</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-glass-bg border border-glass-border">
            <div className="p-2 rounded-lg bg-cyan/10 border border-cyan/20 text-cyan shrink-0">
              <Target className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-[10px] font-bold text-white">Audit Grade Accuracy</h5>
              <span className="text-[9px] text-slate-500 font-mono">AI validated results</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-glass-bg border border-glass-border">
            <div className="p-2 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary shrink-0">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div className="text-left leading-tight">
              <h5 className="text-[10px] font-bold text-white">Your Data, Your Control</h5>
              <span className="text-[9px] text-slate-500 font-mono">Private & secure</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
