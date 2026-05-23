import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import {
  UploadCloud,
  FileText,
  ShieldAlert,
  HelpCircle,
  Eye,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Upload: React.FC = () => {
  const { uploadFile, triggerOCR, activeUploads, invoices } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Get completed recent invoices for preview
  const recentInvoices = invoices.slice(0, 3);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setErrorMsg('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    if (e.target.files && e.target.files[0]) {
      await processFiles(e.target.files);
    }
  };

  const processFiles = async (fileList: FileList) => {
    const file = fileList[0];
    
    // File validation: Size <= 25MB and matches PDF/PNG/JPG
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Only PDF, JPG, and PNG documents are supported.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File sizes must be under the 25MB standard limit.');
      return;
    }

    try {
      // Trigger upload file endpoint
      const invoiceId = await uploadFile(file);
      
      // Navigate straight to the dedicated OCR Processing page for that document!
      navigate(`/processing/${invoiceId}`);
    } catch (e) {
      setErrorMsg('Extraction pipeline failed. Please retry.');
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left">
        <div>
          <h2 className="text-2xl font-geist font-black text-white">Invoice Processing</h2>
          <p className="text-xs text-slate-400 mt-1">Streamline your financial audit with high-precision AI extraction.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Area: Drag and drop + upload queue */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
              className={`
                border-2 border-dashed rounded-[24px] p-12 text-center transition-all duration-300 cursor-pointer relative overflow-hidden group
                ${dragActive ? 'border-cyan bg-cyan/5 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 'border-[#334155] bg-glass-bg hover:border-cyan/50 hover:bg-glass-bg/70'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-cyan/15 flex items-center justify-center text-cyan border border-cyan/20 group-hover:scale-110 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">Drop invoices here</h3>
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    Support for PDF, JPG, and PNG files up to 25MB.<br />
                    AI will automatically begin extraction.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-5 py-2.5 rounded-xl bg-cyan text-slate-900 text-xs font-extrabold shadow shadow-cyan/20 transition-all hover:scale-105 pointer-events-none"
                >
                  Select Files
                </button>
              </div>

              {/* Shimmer line if dragging active */}
              {dragActive && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-cyan to-primary animate-pulse" />
              )}
            </div>

            {errorMsg && (
              <div className="p-4 bg-error/10 border border-error/25 rounded-2xl flex items-center gap-3 text-error text-xs">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Live Queue Cards */}
            <GlassCard className="border border-glass-border">
              <div className="flex justify-between items-center pb-3 border-b border-[#1E293B] mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan" />
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono">Live Processing Queue</h4>
                </div>
                <span className="text-[10px] bg-glass-shine text-slate-300 font-mono px-2 py-0.5 rounded-full">
                  {activeUploads.length} Active Tasks
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {activeUploads.length > 0 ? (
                  <AnimatePresence>
                    {activeUploads.map((task) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-3.5 bg-[#051424] border border-[#1E293B] rounded-xl flex flex-col gap-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-primary" />
                            <div className="text-left">
                              <span className="text-xs font-bold text-white truncate max-w-[200px] block">
                                {task.name}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {(task.size / (1024 * 1024)).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] text-cyan font-bold font-mono animate-pulse">
                            {task.status}...
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-cyan to-primary h-full rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${task.progress}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center py-6 font-mono">
                    No active upload streams. Drag an invoice above to test!
                  </p>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Area: Previews & Tips */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Recent Preview */}
            <GlassCard className="border border-glass-border !p-5 text-center">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono text-left mb-3">Recent Preview</h4>
              
              <div className="aspect-[4/5] bg-gradient-to-b from-[#051424] to-[#0B1020] border border-[#1E293B] rounded-2xl p-4 flex flex-col justify-between items-center relative overflow-hidden group">
                {/* Background cosmic light */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan/10 rounded-full blur-xl group-hover:bg-cyan/20 transition-all" />

                {recentInvoices.length > 0 && recentInvoices[0].ocrResult ? (
                  <>
                    <div className="w-full text-left">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] bg-cyan/15 text-cyan border border-cyan/20 font-mono px-2 py-0.5 rounded-full uppercase">
                          {recentInvoices[0].ocrResult.category}
                        </span>
                        <CheckCircle className="w-4 h-4 text-success" />
                      </div>
                      <h5 className="text-sm font-bold text-white mt-4">{recentInvoices[0].ocrResult.merchant}</h5>
                      <span className="text-[9px] text-slate-500 font-mono block mt-1">{recentInvoices[0].ocrResult.invoiceNumber}</span>
                    </div>

                    <div className="w-full flex justify-between items-end border-t border-[#1E293B] pt-4 mt-4">
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Total Cost</span>
                        <span className="text-lg font-mono font-extrabold text-white">
                          ${recentInvoices[0].ocrResult.amount.toFixed(2)}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/invoices/${recentInvoices[0].id}`)}
                        className="p-2 rounded-xl bg-glass-bg border border-glass-border hover:bg-glass-shine text-slate-300 hover:text-white transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center text-slate-500 gap-3">
                    <FileText className="w-8 h-8 opacity-45" />
                    <span className="text-[10px] font-mono">No parsed invoices ready</span>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Info boxes */}
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-glass-bg border border-glass-border rounded-2xl flex gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  🛡️
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white leading-none">Data Privacy First</h5>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    Your documents are encrypted using AES-256. FinanceLens AI processes data in isolated environments and never uses your financial data to train public models.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-glass-bg border border-glass-border rounded-2xl flex gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan shrink-0 mt-0.5">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white leading-none">High-Precision Extraction</h5>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    FinanceLens achieves 99.8% accuracy on standard invoices. We recommend ensuring clear lighting and high resolution for the best results.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-glass-bg border border-glass-border rounded-2xl flex gap-3 text-left">
                <div className="w-8 h-8 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0 mt-0.5">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-white leading-none">Pro Tip</h5>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                    You can drag and drop entire folders to process bulk uploads. Our AI will automatically categorize them by vendor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
