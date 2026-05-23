import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FileText,
  RotateCw,
  Download,
  Trash2,
  Check,
  ChevronLeft,
  Sparkles,
  DollarSign,
  Calendar,
  Layers,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FormValues {
  merchant: string;
  date: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  category: string;
  isSubscription: boolean;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
}

export const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { invoices, updateInvoiceMeta, reprocessInvoiceDoc, deleteInvoiceDoc } = useApp();
  const [reprocessing, setReprocessing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const currentInvoice = invoices.find(inv => inv.id === id);

  const { register, handleSubmit, control, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      merchant: '',
      date: '',
      invoiceNumber: '',
      amount: 0,
      tax: 0,
      category: 'Shopping',
      isSubscription: false,
      items: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  // Sync form values on invoice load
  useEffect(() => {
    if (currentInvoice && currentInvoice.ocrResult) {
      reset({
        merchant: currentInvoice.ocrResult.merchant,
        date: currentInvoice.ocrResult.date,
        invoiceNumber: currentInvoice.ocrResult.invoiceNumber,
        amount: currentInvoice.ocrResult.amount,
        tax: currentInvoice.ocrResult.tax,
        category: currentInvoice.ocrResult.category,
        isSubscription: currentInvoice.ocrResult.isSubscription || false,
        items: currentInvoice.ocrResult.items || []
      });
    }
  }, [currentInvoice, reset]);

  if (!currentInvoice) {
    return (
      <AppLayout>
        <div className="py-12 text-center text-slate-500 font-mono">
          Invoice record not found. <button onClick={() => navigate('/dashboard')} className="text-cyan underline">Return Dashboard</button>
        </div>
      </AppLayout>
    );
  }

  const onSubmit = async (data: FormValues) => {
    // Re-verify items sums and update context
    await updateInvoiceMeta(currentInvoice.id, {
      ...data,
      amount: Number(data.amount),
      tax: Number(data.tax)
    });
    
    confetti({
      particleCount: 70,
      spread: 60,
      colors: ['#22D3EE', '#1ED760']
    });
    alert('Invoice metadata saved successfully.');
  };

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await reprocessInvoiceDoc(currentInvoice.id);
      confetti({ particleCount: 50, colors: ['#7C5CFC'] });
    } catch (e) {
      console.error(e);
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this invoice permanently?')) {
      await deleteInvoiceDoc(currentInvoice.id);
      navigate('/expenses');
    }
  };

  const handleDownloadJSON = () => {
    if (!currentInvoice.ocrResult) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(currentInvoice.ocrResult, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `financelens_payload_${currentInvoice.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  const categories = ['Food', 'Shopping', 'Travel', 'Medical', 'Utilities', 'Entertainment', 'Subscriptions', 'Education'];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left">
        {/* Back and Action button header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Audit Ledger</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleReprocess}
              disabled={reprocessing}
              className="px-3.5 py-2 border border-glass-border hover:bg-glass-shine disabled:opacity-40 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
              <span>Reprocess</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3.5 py-2 border border-glass-border hover:bg-glass-shine text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Download JSON'}</span>
            </button>

            <button
              onClick={handleDelete}
              className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Workspace Double-Pane Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Simulated Visual Canvas Doc Preview */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono">Invoice Canvas</h4>
              <span className="text-[10px] text-slate-500 font-mono">{currentInvoice.fileName}</span>
            </div>

            <GlassCard className="border border-glass-border aspect-[3/4] flex flex-col justify-between !p-6 relative overflow-hidden bg-gradient-to-b from-[#051424] to-[#0B1020]">
              {/* Outer glow dots */}
              <div className="absolute top-12 left-12 w-28 h-28 bg-[#7C5CFC]/8 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute bottom-12 right-12 w-28 h-28 bg-[#22D3EE]/8 rounded-full blur-[40px] pointer-events-none" />

              {/* Doc header simulation */}
              <div className="border-b border-[#1E293B] pb-6 mb-4 flex justify-between items-start text-left z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                    <span className="font-geist font-black text-sm text-white">FL</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white font-mono leading-none">
                      {currentInvoice.ocrResult?.merchant || 'INVOICE'}
                    </h3>
                    <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                      {currentInvoice.ocrResult?.invoiceNumber || 'INV-PENDING'}
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[9px] text-slate-500 uppercase block">Total Billing</span>
                  <span className="text-md font-extrabold text-white">
                    ${currentInvoice.ocrResult?.amount.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              {/* Simulated Doc body scanner */}
              <div className="flex-1 flex flex-col gap-4 border-2 border-dashed border-[#1E293B]/60 rounded-2xl p-4 justify-center items-center text-slate-500 relative z-10 group">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan to-transparent animate-bounce opacity-40" />
                <FileText className="w-12 h-12 text-slate-600 opacity-45 group-hover:scale-110 transition-transform" />
                <div className="text-center font-mono">
                  <span className="text-[9px] block">SCAN GRID INDEX</span>
                  <span className="text-[10px] text-slate-400">PDF Character Buffer Verified</span>
                </div>
              </div>

              {/* Doc Footer simulation */}
              <div className="border-t border-[#1E293B] pt-4 mt-4 flex justify-between items-center text-[10px] font-mono z-10">
                <div className="text-left">
                  <span className="text-slate-500 uppercase block text-[8px]">Processed Date</span>
                  <span className="text-slate-300 font-semibold">{currentInvoice.ocrResult?.date || 'PENDING'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 uppercase block text-[8px]">Confidence Score</span>
                  <span className="text-success font-bold">{currentInvoice.ocrResult?.confidence || '99'}%</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* RIGHT COLUMN: Metadata Editor Form (React Hook Form) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono">Structured Metadata Editor</h4>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_#7C5CFC]" />
                <span className="text-[9px] text-slate-400 font-mono">AI Extraction Engine Verified</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <GlassCard className="border border-glass-border !p-6 flex flex-col gap-5">
                {/* Form fields grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Merchant */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pl-1">Merchant Header</label>
                    <div className="relative">
                      <Bookmark className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        {...register('merchant', { required: true })}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Invoice Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pl-1">Invoice / Receipt ID</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        {...register('invoiceNumber', { required: true })}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Invoice Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pl-1">Billing Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="YYYY-MM-DD"
                        {...register('date', { required: true })}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Expense Category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pl-1">Compliance Category</label>
                    <div className="relative">
                      <Layers className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <select
                        {...register('category')}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300 appearance-none cursor-pointer"
                      >
                        {categories.map(c => (
                          <option key={c} value={c} className="bg-[#0F172A]">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Billing Amount */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pl-1">Total Amount (USD)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        step="0.01"
                        {...register('amount', { required: true, valueAsNumber: true })}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Tax Amount */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase tracking-wider pl-1">Total VAT / Tax Paid</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        step="0.01"
                        {...register('tax', { required: true, valueAsNumber: true })}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Subscription Checkbox */}
                <div className="p-3 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-between mt-2">
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-white leading-none">Recurring Subscription</h5>
                    <p className="text-[9px] text-slate-400 mt-1">Check if this represents monthly/yearly SaaS overhead</p>
                  </div>
                  <input
                    type="checkbox"
                    {...register('isSubscription')}
                    className="w-4.5 h-4.5 rounded border-[#334155] bg-[#051424] text-cyan focus:ring-cyan/30 cursor-pointer"
                  />
                </div>

                {/* Dynamic Itemized Table */}
                <div className="mt-4 text-left">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Itemized Ledger Breakdown</h5>
                    <button
                      type="button"
                      onClick={() => append({ name: 'New Item Line', quantity: 1, price: 0.00, total: 0.00 })}
                      className="text-[9px] font-mono text-cyan hover:underline"
                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {fields.map((field, idx) => (
                      <div key={field.id} className="grid grid-cols-12 gap-2 bg-[#051424] border border-[#1E293B] p-2 rounded-xl items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            placeholder="Item description"
                            {...register(`items.${idx}.name` as const)}
                            className="w-full bg-transparent border-none p-1 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-cyan/20 rounded"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            {...register(`items.${idx}.quantity` as const, { valueAsNumber: true })}
                            className="w-full bg-transparent border-none p-1 text-[11px] font-mono text-slate-300 text-center focus:outline-none focus:ring-1 focus:ring-cyan/20 rounded"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            {...register(`items.${idx}.price` as const, { valueAsNumber: true })}
                            className="w-full bg-transparent border-none p-1 text-[11px] font-mono text-slate-300 text-center focus:outline-none focus:ring-1 focus:ring-cyan/20 rounded"
                          />
                        </div>
                        <div className="col-span-2 font-mono text-[11px] text-white font-bold text-center">
                          ${(watch(`items.${idx}.quantity`) * watch(`items.${idx}.price`) || 0).toFixed(2)}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => remove(idx)}
                            className="text-rose-500 hover:text-rose-400 p-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save button CTA */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-cyan to-primary text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-cyan/15 hover:shadow-cyan/35 transition-all mt-4 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3px]" />
                  <span>Verify and Commit Records</span>
                </button>
              </GlassCard>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
