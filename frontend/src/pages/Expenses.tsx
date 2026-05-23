import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Invoice } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Edit2,
  Check,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Expenses: React.FC = () => {
  const { invoices, updateInvoiceMeta, deleteInvoiceDoc } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter & Search Logic
  const filteredInvoices = invoices.filter(inv => {
    const ocr = inv.ocrResult;
    const matchesSearch = ocr
      ? ocr.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ocr.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      : inv.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = selectedCategory === 'All' || (ocr && ocr.category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalEntries = filteredInvoices.length;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEntries = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleVerify = async (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inv.ocrResult) return;

    // Set anomalyDetected false and approve status on click
    await updateInvoiceMeta(inv.id, {
      anomalyDetected: false,
      anomalyDescription: undefined
    });

    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#1ED760', '#22D3EE']
    });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this invoice record?')) {
      await deleteInvoiceDoc(id);
    }
  };

  const categoriesList = ['All', 'Food', 'Shopping', 'Travel', 'Medical', 'Utilities', 'Entertainment', 'Subscriptions', 'Education'];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left relative min-h-[85vh]">
        {/* Header Action Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-geist font-black text-white">Detailed Expense View</h2>
            <p className="text-xs text-slate-400 mt-1">Audit and verify AI-extracted invoice data for Q3 expenses.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category dropdown filters */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="appearance-none pl-3 pr-8 py-2 bg-glass-bg border border-glass-border rounded-xl text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan cursor-pointer"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat} className="bg-[#0F172A]">{cat} Category</option>
                ))}
              </select>
              <Filter className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={() => alert('Exporting structured CSV output...')}
              className="px-4 py-2 border border-glass-border hover:bg-glass-shine text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Search Searchbar */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by merchant or invoice number..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-glass-bg border border-glass-border rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
          />
        </div>

        {/* Expenses List Glass Card - Matches 5.png! */}
        <GlassCard className="border border-glass-border !p-5">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#1E293B] text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Merchant</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Tax</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/40">
                {currentEntries.length > 0 ? (
                  currentEntries.map((inv) => (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-glass-shine transition-colors duration-150 cursor-pointer"
                    >
                      <td className="py-4 font-mono text-slate-400">{inv.ocrResult?.date || inv.uploadedAt.split('T')[0]}</td>
                      <td className="py-4 font-bold text-white relative">
                        <div className="flex items-center gap-2">
                          {inv.ocrResult?.merchant || inv.fileName}
                          {inv.ocrResult && (
                            <span className="w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_8px_#7C5CFC]" title="Processed by AI" />
                          )}
                        </div>
                      </td>
                      <td className="py-4 font-mono font-bold text-cyan-glow">
                        {inv.ocrResult ? `$${inv.ocrResult.amount.toFixed(2)}` : '--'}
                      </td>
                      <td className="py-4 font-mono text-slate-400">
                        {inv.ocrResult ? `$${inv.ocrResult.tax.toFixed(2)}` : '--'}
                      </td>
                      <td className="py-4">
                        {inv.ocrResult ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-glass-bg border border-glass-border text-slate-300 font-semibold text-[10px]">
                            {inv.ocrResult.category}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono italic">extracting...</span>
                        )}
                      </td>
                      <td className="py-4">
                        {inv.ocrResult?.anomalyDetected ? (
                          <span className="px-2 py-0.5 rounded-full bg-warning/15 border border-warning/35 text-warning font-mono text-[9px] font-bold uppercase tracking-wider inline-block">
                            Review
                          </span>
                        ) : inv.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded-full bg-success/15 border border-success/35 text-success font-mono text-[9px] font-bold uppercase tracking-wider inline-block">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-cyan/15 border border-cyan/35 text-cyan font-mono text-[9px] font-bold uppercase tracking-wider inline-block animate-pulse">
                            Processing
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                            title="Edit Invoice"
                            className="p-1.5 rounded-lg bg-glass-bg border border-glass-border hover:bg-glass-shine text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {inv.ocrResult?.anomalyDetected && (
                            <button
                              onClick={(e) => handleVerify(inv, e)}
                              title="Verify/Approve invoice anomalies"
                              className="p-1.5 rounded-lg bg-[#1ED760]/10 border border-[#1ED760]/20 hover:bg-[#1ED760]/20 text-[#1ED760] transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={(e) => handleDelete(inv.id, e)}
                            title="Delete record"
                            className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-400 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-slate-500 font-mono text-center">
                      No matching financial records audited.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pager Pagination - Matches 5.png! */}
          <div className="flex justify-between items-center pt-5 border-t border-[#1E293B] mt-5 text-[11px] text-slate-500">
            <span>
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalEntries)} of {totalEntries} entries
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded bg-[#051424] border border-[#1E293B] hover:border-glass-shine text-slate-300 disabled:opacity-30 disabled:hover:border-[#1E293B] transition-all cursor-pointer"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`px-2.5 py-1 rounded transition-all cursor-pointer font-bold ${
                    currentPage === idx + 1
                      ? 'bg-cyan text-slate-900 shadow shadow-cyan/20'
                      : 'bg-[#051424] border border-[#1E293B] hover:border-glass-shine text-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded bg-[#051424] border border-[#1E293B] hover:border-glass-shine text-slate-300 disabled:opacity-30 disabled:hover:border-[#1E293B] transition-all cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Dynamic Glowing Floating FAB Button - Matches 5.png + styling rule! */}
        <button
          onClick={() => navigate('/upload')}
          title="Audit new invoice"
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-gradient-to-tr from-cyan via-primary to-secondary flex items-center justify-center text-slate-950 shadow-2xl shadow-cyan/35 hover:shadow-cyan/50 hover:scale-110 active:scale-95 transition-all duration-300 z-30 animate-bounce pointer-events-auto cursor-pointer"
        >
          <Plus className="w-6 h-6 stroke-[3px]" />
        </button>
      </div>
    </AppLayout>
  );
};
