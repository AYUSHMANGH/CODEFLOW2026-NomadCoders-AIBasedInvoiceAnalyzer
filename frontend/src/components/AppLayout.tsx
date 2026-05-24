import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex flex-col items-center justify-center">
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
    <div className="flex min-h-screen bg-[#0B1020] text-slate-200">
      {/* Fixed Sidebar */}
      <Sidebar isOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main scrolling content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header bar */}
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />

        {/* Dynamic page contents */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
