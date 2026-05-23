import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { Search, Bell, HelpCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user } = useAuth();
  const { serverOffline, invoices } = useApp();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  // Compute active anomalies / flags for notification badge
  const flaggedInvoices = invoices.filter(i => i.ocrResult?.anomalyDetected);
  const totalAlerts = flaggedInvoices.length;

  if (!user) return null;

  return (
    <header className="h-20 border-b border-[#1E293B] px-8 flex items-center justify-between bg-[#0B1020]/80 backdrop-blur-md sticky top-0 z-10">
      {/* Search Input Bar */}
      <div className="relative w-96 max-w-full">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4.5 w-4.5 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Search invoices, merchants, or patterns..."
          className="w-full pl-10 pr-4 py-2 bg-glass-bg border border-glass-border rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
        />
      </div>

      {/* Right Toolbar Actions */}
      <div className="flex items-center gap-5">
        {/* Connection status badge */}
        <div className="flex items-center gap-2 px-3 py-1 bg-glass-bg border border-glass-border rounded-full">
          {serverOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-warning" />
              <span className="text-[10px] text-warning font-semibold font-mono">SANDBOX</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-success" />
              <span className="text-[10px] text-success font-semibold font-mono">CLOUD LIVE</span>
            </>
          )}
        </div>

        {/* Support Portal Link */}
        <button
          onClick={() => navigate('/settings')}
          title="Help & Guides"
          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <HelpCircle className="w-5.5 h-5.5" />
        </button>

        {/* Notifications Icon with active dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-slate-400 hover:text-white relative transition-colors cursor-pointer"
          >
            <Bell className="w-5.5 h-5.5" />
            {totalAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-error text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {totalAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-[#0F172A] border border-[#1E293B] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center pb-2 border-b border-[#1E293B] mb-2">
                <h4 className="text-xs font-semibold text-white">Financial Security Center</h4>
                <span className="text-[9px] bg-error/20 text-error px-2 py-0.5 rounded-full font-mono">
                  {totalAlerts} Flagged
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {flaggedInvoices.length > 0 ? (
                  flaggedInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate(`/invoices/${inv.id}`);
                      }}
                      className="p-2.5 bg-glass-bg border border-glass-border hover:border-error/50 rounded-xl flex gap-3.5 cursor-pointer transition-all duration-200"
                    >
                      <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <h5 className="text-[11px] font-bold text-white truncate">
                          Anomaly in {inv.ocrResult?.merchant}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                          {inv.ocrResult?.anomalyDescription || 'Suspicious spending limit flagged.'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-slate-500 text-center py-4">
                    Workspace secure. No anomalies detected.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Small avatar display */}
        <div className="w-8 h-8 rounded-full border border-glass-border overflow-hidden cursor-pointer" onClick={() => navigate('/settings')}>
          <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};
