import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, X, Trash2, Eye, EyeOff, ShieldAlert, CheckCircle } from 'lucide-react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, deleteAccount, isGoogleUser } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const googleUser = isGoogleUser();

  // Reset state whenever the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      setError(null);
      setIsLoading(false);
      setSucceeded(false);
      // Focus password field for email users
      if (!googleUser) {
        setTimeout(() => passwordInputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, googleUser]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Map Firebase error codes to friendly messages
  const getFriendlyError = (err: any): string => {
    const code: string = err?.code || '';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      return 'Incorrect password. Please try again.';
    }
    if (code === 'auth/too-many-requests') {
      return 'Too many failed attempts. Please wait a moment and try again.';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in was cancelled. Please try again.';
    }
    if (code === 'auth/requires-recent-login') {
      return 'Session expired. Please sign out and sign back in before deleting your account.';
    }
    return err?.message || 'Something went wrong. Please try again.';
  };

  const handleConfirmDelete = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await deleteAccount(googleUser ? undefined : password);
      setSucceeded(true);
      // Give the user a moment to see the success state, then redirect
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(getFriendlyError(err));
      setIsLoading(false);
    }
  };

  const canSubmit = googleUser ? true : password.length >= 1;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        // Close on backdrop click (unless loading or succeeded)
        if (e.target === e.currentTarget && !isLoading && !succeeded) onClose();
      }}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#1E293B] shadow-2xl"
        style={{ background: 'linear-gradient(145deg, #0F172A 0%, #051424 100%)' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >

        {/* ===== SUCCESS STATE ===== */}
        {succeeded && (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-geist font-black text-white">Account Deleted</h3>
              <p className="text-sm text-slate-400 mt-1">
                Your account has been permanently removed. Redirecting…
              </p>
            </div>
          </div>
        )}

        {/* ===== MAIN MODAL CONTENT ===== */}
        {!succeeded && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-error/15 border border-error/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5 text-error" />
                </div>
                <div>
                  <h2
                    id="delete-account-title"
                    className="text-sm font-geist font-black text-white leading-none"
                  >
                    Delete Account
                  </h2>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">PERMANENT ACTION · CANNOT BE UNDONE</p>
                </div>
              </div>
              {!isLoading && (
                <button
                  id="delete-account-modal-close"
                  onClick={onClose}
                  className="text-slate-500 hover:text-white transition-colors cursor-pointer ml-2"
                  aria-label="Close dialog"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-5">
              {/* Warning banner */}
              <div className="flex gap-3 p-4 rounded-xl bg-error/10 border border-error/25">
                <AlertTriangle className="w-4.5 h-4.5 text-error shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-xs font-bold text-error leading-none">This action is permanent and irreversible.</p>
                  <ul className="text-[10px] text-slate-400 mt-2 flex flex-col gap-1 list-disc list-inside">
                    <li>Your Firebase account will be permanently deleted</li>
                    <li>All session data and local storage will be cleared</li>
                    <li>You will be signed out immediately</li>
                  </ul>
                </div>
              </div>

              {/* User info pill */}
              {user && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-glass-bg border border-glass-border">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-lg object-cover border border-[#334155]"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              {/* Re-auth section */}
              {googleUser ? (
                /* Google users: just a note, no password field */
                <div className="p-3 rounded-xl bg-glass-bg border border-glass-border text-left">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    You signed in with <span className="font-bold text-white">Google</span>. Clicking confirm below will open a Google sign-in popup to verify your identity before deleting your account.
                  </p>
                </div>
              ) : (
                /* Email users: password field */
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="delete-account-password"
                    className="text-[9px] font-mono text-slate-400 uppercase pl-1"
                  >
                    Confirm your password to continue
                  </label>
                  <div className="relative">
                    <input
                      ref={passwordInputRef}
                      id="delete-account-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSubmit && !isLoading) handleConfirmDelete();
                      }}
                      placeholder="Enter your password"
                      disabled={isLoading}
                      className="w-full px-4 pr-10 py-2.5 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-error focus:ring-1 focus:ring-error/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-error/10 border border-error/25">
                  <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <p className="text-[11px] text-error">{error}</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  id="delete-account-cancel-btn"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-glass-bg border border-glass-border text-slate-300 text-xs font-semibold hover:bg-[#1E293B] hover:text-white transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  id="delete-account-confirm-btn"
                  onClick={handleConfirmDelete}
                  disabled={!canSubmit || isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-error text-white text-xs font-black flex items-center justify-center gap-2 hover:bg-[#e04248] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-error/20"
                >
                  {isLoading ? (
                    <>
                      {/* Spinner */}
                      <svg
                        className="animate-spin w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12" cy="12" r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{googleUser ? 'Continue with Google' : 'Delete My Account'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
