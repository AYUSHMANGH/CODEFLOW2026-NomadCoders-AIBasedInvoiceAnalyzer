import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { Send, Sparkles, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Renders inline markdown tokens: **bold** and *italic*
const renderInline = (text: string): React.ReactNode => {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
        }
        if (/^\*[^*]+\*$/.test(part)) {
          return <em key={i} className="text-slate-200 not-italic font-medium">{part.slice(1, -1)}</em>;
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
    <div className="flex flex-col gap-2.5">
      {blocks.map((block, bIdx) => {
        const lines = block.split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) return null;

        const isBullet = (l: string) => /^\s*[\*\-]\s{1,4}/.test(l);
        const isNumbered = (l: string) => /^\s*\d+\.\s+/.test(l);

        const allBullets = lines.every(isBullet);
        const allNumbered = lines.every(isNumbered);

        if (allBullets) {
          return (
            <ul key={bIdx} className="flex flex-col gap-1.5 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2">
                  <span className="text-cyan-400 mt-[3px] flex-shrink-0 text-[8px]">●</span>
                  <span className="flex-1">{renderInline(line.replace(/^\s*[\*\-]\s{1,4}/, ''))}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (allNumbered) {
          return (
            <ol key={bIdx} className="flex flex-col gap-1.5 pl-1">
              {lines.map((line, lIdx) => (
                <li key={lIdx} className="flex items-start gap-2">
                  <span className="text-[#818CF8] font-bold font-mono flex-shrink-0 min-w-[18px]">{lIdx + 1}.</span>
                  <span className="flex-1">{renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Mixed or plain block — render line by line
        return (
          <div key={bIdx} className="flex flex-col gap-1.5">
            {lines.map((line, lIdx) => {
              if (isBullet(line)) {
                return (
                  <div key={lIdx} className="flex items-start gap-2">
                    <span className="text-cyan-400 mt-[3px] flex-shrink-0 text-[8px]">●</span>
                    <span className="flex-1">{renderInline(line.replace(/^\s*[\*\-]\s{1,4}/, ''))}</span>
                  </div>
                );
              }
              if (isNumbered(line)) {
                const match = line.match(/^\s*(\d+)\.\s+/);
                return (
                  <div key={lIdx} className="flex items-start gap-2">
                    <span className="text-[#818CF8] font-bold font-mono flex-shrink-0 min-w-[18px]">{match?.[1]}.</span>
                    <span className="flex-1">{renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</span>
                  </div>
                );
              }
              return <p key={lIdx} className="leading-relaxed">{renderInline(line.trim())}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const Advisor: React.FC = () => {
  const { sendAdvisorMessage, invoices, budgetLimit } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am **Zen AI Analyst**, your premium financial audit consultant. I've audited your Q3 ledger database.\n\nI noticed your **'Professional Services'** category has spiked by **22%** this quarter. This was primarily driven by recent legal retainer adjustments. Would you like me to compare these rates against regional benchmarks or analyze your recurring subscription leaks?"
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([
    'Yes, compare rates',
    'Audit recurring subscriptions',
    'Where am I overspending?'
  ]);
  
  // Right sidebar scenario sliders
  const [savingsPct, setSavingsPct] = useState(15);
  const [reductionPct, setReductionPct] = useState(10);
  const [projectedCash, setProjectedCash] = useState(84250);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync projected cash calculations when sliders change
  useEffect(() => {
    const totalSpend = invoices.reduce((sum, item) => sum + (item.ocrResult?.amount || 0), 0) || 2500;
    const computedYield = Math.round(
      (totalSpend * 12 * (savingsPct / 100)) + 
      (budgetLimit * 12 * (reductionPct / 100)) + 
      12400
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
    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      // Map history payload
      const historyPayload = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      // Call Express API chatbot service
      const response = await sendAdvisorMessage(textToSend, historyPayload);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.message
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
        setSuggestedPrompts(response.suggestedPrompts);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection to advisor lost. Please verify backend state.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (promptText: string) => {
    handleSendMessage(promptText);
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left min-h-[85vh] justify-between">
        {/* Header Title */}
        <div>
          <h2 className="text-2xl font-geist font-black text-white">Zen AI Advisor</h2>
          <p className="text-xs text-slate-400 mt-1">Direct corporate financial counseling session.</p>
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1">
          {/* LEFT COLUMN: Conversational Chat UI - Matches 2.png */}
          <div className="lg:col-span-8 flex flex-col justify-between bg-[#0F172A] border border-[#1E293B] rounded-[24px] p-5 h-[500px] sm:h-[600px] lg:h-[650px] relative">
            {/* Shimmer line if loading */}
            {loading && <div className="absolute top-0 left-0 w-full h-1 glass-shimmer" />}

            {/* Top Avatar bar */}
            <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-secondary to-primary flex items-center justify-center shadow-lg shadow-secondary/15 border border-[#334155]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white leading-none">Zen AI Analyst</h4>
                  <span className="text-[9px] text-[#1ED760] font-mono mt-1.5 block">Active • Processing transactions</span>
                </div>
              </div>
              <span className="text-[9px] bg-glass-bg border border-glass-border px-2.5 py-0.5 rounded-full font-mono text-slate-400">
                Audit Consultation Thread
              </span>
            </div>

            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-4.5 pr-2 mb-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`
                    flex gap-3.5 max-w-[85%]
                    ${m.role === 'user' ? 'self-end flex-row-reverse text-right' : 'self-start text-left'}
                  `}
                >
                  {/* Message bubble */}
                  <div
                    className={`
                      p-4 rounded-2xl text-xs leading-relaxed
                      ${
                        m.role === 'user'
                          ? 'bg-[#5B8CFF] text-slate-950 font-bold rounded-tr-none'
                          : 'bg-[#051424] border border-[#1E293B] text-slate-300 rounded-tl-none font-medium'
                      }
                    `}
                  >
                    {m.role === 'assistant' ? renderMessageContent(m.content) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="self-start flex gap-3 text-slate-500 items-center pl-2">
                  <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-mono animate-pulse">Zen is calculating yields...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Lower group: suggestion pills + input */}
            <div className="flex flex-col gap-3.5 mt-auto">
              {/* Pre-baked action suggestions */}
              {suggestedPrompts.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-start items-center">
                  {suggestedPrompts.map((p, index) => (
                    <button
                      key={index}
                      onClick={() => handlePromptClick(p)}
                      className="px-3.5 py-1.5 rounded-full bg-glass-bg border border-glass-border hover:border-cyan/50 text-[10px] font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {p}
                    </button>
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
                  className="flex-1 pl-4 pr-12 py-3.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                />
                <button
                  type="submit"
                  title="Send message"
                  className="absolute right-2 top-2 p-2 rounded-lg bg-gradient-to-tr from-cyan to-primary text-slate-950 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow"
                >
                  <Send className="w-4 h-4 stroke-[2.5px]" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: Scenario Simulator - Matches 2.png right side */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#0F172A] border border-[#1E293B] rounded-[24px] p-5 h-fit lg:h-[650px]">
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide font-mono border-b border-[#1E293B] pb-3 mb-4">
                Scenario Simulator
              </h4>

              <div className="flex flex-col gap-6 text-left">
                {/* Monthly Savings Increase */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Monthly Savings Increase</span>
                    <span className="font-mono text-cyan-glow font-bold">+{savingsPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={savingsPct}
                    onChange={(e) => setSavingsPct(Number(e.target.value))}
                    className="w-full bg-[#051424] border border-[#1E293B] h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan"
                  />
                </div>

                {/* Expense Reduction Target */}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Expense Reduction Target</span>
                    <span className="font-mono text-[#bdc2ff] font-bold">{reductionPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={reductionPct}
                    onChange={(e) => setReductionPct(Number(e.target.value))}
                    className="w-full bg-[#051424] border border-[#1E293B] h-1.5 rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                </div>
              </div>
            </div>

            {/* Simulator Output Box */}
            <div className="bg-[#051424] border border-[#1E293B] p-4.5 rounded-2xl flex flex-col justify-between items-start gap-4 text-left mt-auto">
              <div>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider block">Projected 12-Month Result</span>
                <h3 className="text-xl font-mono font-extrabold text-white mt-1.5">
                  +₹{projectedCash.toLocaleString()} <span className="text-xs text-success font-semibold">Available Cash</span>
                </h3>
                <p className="text-[9px] text-slate-400 leading-relaxed mt-2.5">
                  This projected trajectory enables hiring 1 new associate or moving into a larger office space by Q4.
                </p>
              </div>

              <button
                onClick={() => {
                  confetti({ particleCount: 70, colors: ['#22D3EE', '#7C5CFC'] });
                  alert(`Simulation implemented. Parameters synchronized (Savings: +${savingsPct}%, Reduction: ${reductionPct}%).`);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-secondary to-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-secondary/15 cursor-pointer hover:scale-[1.02] active:scale-95 transition-all"
              >
                Implement This Strategy
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
