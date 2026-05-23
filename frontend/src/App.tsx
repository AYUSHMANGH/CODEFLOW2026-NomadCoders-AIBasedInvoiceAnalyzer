import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Processing } from './pages/Processing';
import { Expenses } from './pages/Expenses';
import { InvoiceDetails } from './pages/InvoiceDetails';
import { Analytics } from './pages/Analytics';
import { Insights } from './pages/Insights';
import { Advisor } from './pages/Advisor';
import { Settings } from './pages/Settings';
import './App.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Auth />} />

            {/* Authenticated Application routes protected by AppLayout */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/processing/:id" element={<Processing />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/invoices/:id" element={<InvoiceDetails />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/advisor" element={<Advisor />} />
            <Route path="/settings" element={<Settings />} />

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/landing" replace />} />
            <Route path="*" element={<Navigate to="/landing" replace />} />
          </Routes>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
