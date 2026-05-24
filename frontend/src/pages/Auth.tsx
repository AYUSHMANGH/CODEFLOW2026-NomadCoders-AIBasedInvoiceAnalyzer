import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from '../components/GlassCard';
import { Mail, Lock, User, Key, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import financelensLogo from '../assets/financelens-logo.svg';

export const Auth: React.FC = () => {
  const { loginWithEmail, signupWithEmail, loginWithGoogle, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      confetti({ particleCount: 120, spread: 80, colors: ['#5B8CFF', '#22D3EE', '#7C5CFC'] });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Auth aborted.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = () => {
    loginAsGuest();
    confetti({ particleCount: 80, spread: 60, colors: ['#1ED760', '#22D3EE'] });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0B1020] relative flex items-center justify-center px-4 overflow-hidden py-12">
      {/* Background neon blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5B8CFF]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7C5CFC]/15 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        {/* Title logo */}
        <div className="text-center mb-8">
          <img
            src={financelensLogo}
            alt="FinanceLens Logo"
            className="w-32 h-32 object-contain mx-auto drop-shadow-[0_0_16px_rgba(0,229,255,0.55)] animate-bounce"
          />
          <p className="text-slate-400 text-xs mt-1.5 font-mono">Turn invoices into financial intelligence.</p>
        </div>

        {/* Auth Glass Card */}
        <GlassCard className="!p-8 border border-glass-border">
          {/* Custom Auth Tabs */}
          <div className="flex bg-[#051424] p-1 rounded-xl mb-6 border border-[#1E293B]">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isLogin ? 'bg-primary text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                !isLogin ? 'bg-primary text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error/10 border border-error/30 rounded-xl flex items-center gap-2.5 text-error text-xs">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase pl-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase pl-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset links are routed to email under standard configurations.')}
                    className="text-[10px] text-primary hover:underline font-mono"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-[#051424] border border-[#334155] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan focus:ring-1 focus:ring-cyan/35 transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#5B8CFF] to-[#7C5CFC] hover:brightness-110 disabled:opacity-50 text-slate-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary/10 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? 'Sign In Workspace' : 'Create Accountant Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social login division */}
          <div className="relative my-6 text-center">
            <hr className="border-[#1E293B]" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0F172A] px-3 text-[10px] font-mono text-slate-500">
              OR POWERED DEPLOY
            </span>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-[#051424] hover:bg-glass-bg border border-[#334155] text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all mb-3 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5a5.99 5.99 0 0 1 5.991-6.014c1.615 0 3.088.625 4.185 1.638l3.079-3.079C19.345 3.237 16.86 2 13.99 2 8.13 2 3.39 6.74 3.39 12.6s4.74 10.6 10.6 10.6c5.858 0 10.6-4.74 10.6-10.6 0-.74-.085-1.455-.24-2.115H12.24z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Guest Demo Sign In */}
          <button
            onClick={handleGuestSignIn}
            disabled={loading}
            className="w-full py-3 bg-[#1ED760]/10 hover:bg-[#1ED760]/15 border border-[#1ED760]/30 text-[#1ED760] font-bold rounded-xl text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4.5 h-4.5" />
            <span>Enter Demo Sandbox Mode</span>
          </button>
        </GlassCard>
      </div>
    </div>
  );
};
