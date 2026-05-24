import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AppLayout } from '../components/AppLayout';
import { GlassCard } from '../components/GlassCard';
import { DeleteAccountModal } from '../components/DeleteAccountModal';
import {
  User,
  Shield,
  Bell,
  Database,
  Download,
  AlertCircle,
  Sparkles,
  Check,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { budgetLimit, updateBudgetLimit, invoices } = useApp();
  const [targetBudget, setTargetBudget] = useState(budgetLimit);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [weeklyAlerts, setWeeklyAlerts] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBudgetLimit(targetBudget);
    setSaveSuccess(true);
    confetti({
      particleCount: 50,
      spread: 60,
      colors: ['#22D3EE', '#1ED760']
    });
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleExportWorkspace = () => {
    const backupPayload = {
      user: {
        email: user?.email,
        displayName: user?.displayName,
        isGuest: user?.isGuest
      },
      exportDate: new Date().toISOString(),
      invoices: invoices
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupPayload, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `financelens_full_workspace_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    confetti({ particleCount: 80, colors: ['#7C5CFC'] });
    alert('Workspace backup successfully generated!');
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 text-left">
        {/* Title */}
        <div>
          <h2 className="text-2xl font-geist font-black text-white">System Settings</h2>
          <p className="text-xs text-slate-400 mt-1">Manage your financial targets, compliance preferences, and backups.</p>
        </div>

        {/* Setting grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT AREA: Form settings */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Financial profile Form */}
            <form onSubmit={handleSaveSettings}>
              <GlassCard className="border border-glass-border flex flex-col gap-5 !p-6">
                <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
                  <User className="w-4.5 h-4.5 text-cyan" />
                  <h4 className="text-xs font-bold text-white tracking-wide font-mono">Financial Target Parameters</h4>
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-success/15 border border-success/35 text-success rounded-xl text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Compliance parameters successfully saved!</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target budget limit */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase pl-1">Monthly Budget Limit (INR, ₹)</label>
                    <input
                      type="number"
                      required
                      value={targetBudget}
                      onChange={(e) => setTargetBudget(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300 font-mono"
                    />
                  </div>

                  {/* System Currency */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-mono text-slate-400 uppercase pl-1">Base Valuation Currency</label>
                    <select
                      className="w-full px-4 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300 cursor-pointer"
                      defaultValue="INR"
                    >
                      <option value="USD">USD ($) - United States Dollar</option>
                      <option value="EUR">EUR (€) - European Euro</option>
                      <option value="GBP">GBP (£) - British Pound</option>
                      <option value="INR">INR (₹) - Indian Rupee</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-3 self-end bg-cyan text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-cyan/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer mt-2"
                >
                  Save Workspace Parameters
                </button>
              </GlassCard>
            </form>

            {/* Notification and alert toggles */}
            <GlassCard className="border border-glass-border flex flex-col gap-5 !p-6">
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
                <Bell className="w-4.5 h-4.5 text-cyan" />
                <h4 className="text-xs font-bold text-white tracking-wide font-mono">Notification Toggles</h4>
              </div>

              <div className="flex flex-col gap-4">
                {/* Toggle 1 */}
                <div className="flex justify-between items-center text-xs">
                  <div className="text-left">
                    <h5 className="font-semibold text-white leading-none">Instant Duplicates Warnings</h5>
                    <p className="text-[10px] text-slate-400 mt-1.5">Receive warnings in system banner if identical uploads occur.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-[#334155] bg-[#051424] text-cyan focus:ring-cyan/30 cursor-pointer"
                  />
                </div>

                <hr className="border-[#1E293B]/40" />

                {/* Toggle 2 */}
                <div className="flex justify-between items-center text-xs">
                  <div className="text-left">
                    <h5 className="font-semibold text-white leading-none">Weekly Spend Insights</h5>
                    <p className="text-[10px] text-slate-400 mt-1.5">Dispatch weekly email reports summaries generated by Zen AI Advisor.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={weeklyAlerts}
                    onChange={(e) => setWeeklyAlerts(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-[#334155] bg-[#051424] text-cyan focus:ring-cyan/30 cursor-pointer"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* RIGHT AREA: Backups & Security */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Backup export card */}
            <GlassCard className="border border-glass-border flex flex-col gap-5 !p-6">
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
                <Database className="w-4.5 h-4.5 text-cyan" />
                <h4 className="text-xs font-bold text-white tracking-wide font-mono">Workspace Backups</h4>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed text-left">
                Export all invoices, itemized tables, extracted ledger metadata, and AI reports as a unified backup payload file. You can import this into any external database.
              </p>

              <button
                onClick={handleExportWorkspace}
                className="w-full py-3 bg-[#051424] hover:bg-glass-bg border border-[#334155] text-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Entire Workspace</span>
              </button>
            </GlassCard>

            {/* Platform security card */}
            <GlassCard className="border border-glass-border flex flex-col gap-5 !p-6">
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3">
                <Shield className="w-4.5 h-4.5 text-cyan" />
                <h4 className="text-xs font-bold text-white tracking-wide font-mono">Security Assurances</h4>
              </div>

              <div className="flex flex-col gap-3 text-left">
                <div className="flex gap-2.5 items-start">
                  <span className="text-xs">🛡️</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-white">AES-256 Cloud Encryption</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">Documents securely sealed inside Firestore.</p>
                  </div>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="text-xs">⚖️</span>
                  <div>
                    <h5 className="text-[11px] font-bold text-white">Isolated Tenant Model</h5>
                    <p className="text-[9px] text-slate-500 mt-0.5">Financial details are private to your workspace.</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Danger Zone — only shown for real (non-guest) users */}
            {user && !user.isGuest && (
              <GlassCard className="border border-error/30 flex flex-col gap-5 !p-6">
                <div className="flex items-center gap-2 border-b border-error/20 pb-3">
                  <Trash2 className="w-4.5 h-4.5 text-error" />
                  <h4 className="text-xs font-bold text-error tracking-wide font-mono">Danger Zone</h4>
                </div>

                <div className="flex flex-col gap-3 text-left">
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Permanently delete your account and all associated session data.
                    This action <span className="text-error font-bold">cannot be undone</span>.
                  </p>

                  <button
                    id="open-delete-account-modal-btn"
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full py-3 rounded-xl bg-error/10 border border-error/30 text-error font-black text-xs flex items-center justify-center gap-2 hover:bg-error/20 hover:border-error/60 active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </AppLayout>
  );
};
