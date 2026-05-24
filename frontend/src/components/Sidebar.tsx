import React from 'react';
import financelensLogo from '../assets/logo.png';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  Receipt,
  BarChart3,
  Sparkles,
  MessagesSquare,
  Settings,
  LogOut,
  Plus
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { serverOffline } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload', path: '/upload', icon: UploadCloud },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'AI Insights', path: '/insights', icon: Sparkles },
    { name: 'AI Advisor', path: '/advisor', icon: MessagesSquare },
  ];

  if (!user) return null;

  return (
    <>
      {/* Mobile Drawer Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          w-64 bg-[#051424] border-r border-[#1E293B] flex flex-col justify-between p-6 shrink-0 z-50
          transition-transform duration-300 ease-in-out
          
          /* Desktop Layout */
          lg:flex lg:translate-x-0 lg:static lg:h-screen lg:sticky lg:top-0
          
          /* Mobile Overlay Layout */
          fixed inset-y-0 left-0 h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col gap-8">
          {/* App Logo & Header - Fixed smaller logo */}
          <div className="flex items-center justify-center select-none py-2">
            <img
              src={financelensLogo}
              alt="FinanceLens Logo"
              className="w-20 h-20 object-contain rounded-2xl drop-shadow-[0_0_12px_rgba(0,229,255,0.55)] transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* User Card */}
          <div className="p-3 bg-glass-bg border border-glass-border rounded-2xl flex items-center gap-3">
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-10 h-10 rounded-xl object-cover border border-[#334155]"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">{user.displayName}</h4>
              <span className="text-[10px] bg-secondary/20 text-[#bdc2ff] font-mono px-2 py-0.5 rounded-full inline-block mt-0.5">
                {user.isGuest ? 'Demo Guest' : 'Analyst'}
              </span>
            </div>
          </div>

          {/* Navigation items - With smooth hover micro-animations */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <motion.div
                key={item.name}
                whileHover={{ x: 4, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/25 to-secondary/15 border-l-4 border-primary text-white shadow-md shadow-primary/5'
                        : 'text-slate-400 hover:text-white hover:bg-glass-bg border-l-4 border-transparent'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </NavLink>
              </motion.div>
            ))}
          </nav>

          {/* Quick New Analysis Action button */}
          <button
            onClick={() => { navigate('/upload'); onClose?.(); }}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan to-primary text-slate-900 text-sm font-bold shadow-lg shadow-cyan/20 hover:shadow-cyan/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 pointer-events-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Analysis</span>
          </button>
        </div>

        {/* Footer Nav */}
        <div className="flex flex-col gap-1.5 pt-6 border-t border-[#1E293B]">
          {/* Status Indicator */}
          <div className="px-4 py-2 bg-glass-bg border border-glass-border rounded-xl flex items-center gap-2.5 mb-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${serverOffline ? 'bg-warning' : 'bg-success'}`}></span>
            <span className="text-[10px] text-slate-400 font-mono">
              {serverOffline ? 'Sandbox Mode' : 'Cloud Connected'}
            </span>
          </div>

          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
              ${
                isActive
                  ? 'bg-glass-bg text-white border-l-4 border-secondary'
                  : 'text-slate-400 hover:text-white hover:bg-glass-bg border-l-4 border-transparent'
              }
            `}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-l-4 border-transparent transition-all duration-200 w-full text-left cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
