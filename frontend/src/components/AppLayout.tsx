import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  /** Lock main area height so only inner panels scroll (e.g. AI Advisor chat) */
  lockScroll?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, lockScroll }) => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen zen-app-shell flex flex-col items-center justify-center">
        {/* Shimmer layout */}
        <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-xs text-slate-400 animate-pulse">Initializing Financial Audit Workspace...</p>
      </div>
    );
  }

  // Protected route checking
  if (!user) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <div className="flex min-h-screen zen-app-shell text-slate-200">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main scrolling content area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden h-[100dvh]">
        {/* Top Header bar */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Dynamic page contents */}
        <main
          className={`flex-1 min-h-0 relative ${
            lockScroll
              ? 'p-3 sm:p-4 overflow-hidden flex flex-col'
              : 'zen-app-main p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden'
          }`}
        >
          {!lockScroll && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
              <div className="zen-glow-orb zen-glow-orb--tl" />
              <div className="zen-glow-orb zen-glow-orb--br" />
              <div className="zen-glow-orb zen-glow-orb--center" />
            </div>
          )}
          <div className={`relative z-10 ${lockScroll ? 'h-full min-h-0 flex flex-col' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
