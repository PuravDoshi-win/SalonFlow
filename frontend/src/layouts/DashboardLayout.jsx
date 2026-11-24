import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const isStaff = user && ['admin', 'receptionist', 'barber'].includes(user.role);

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex">
      {/* If staff, display sidebar; otherwise full width navbar layout */}
      {isStaff && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        {!isStaff && <Navbar />}

        {/* Staff top header bar */}
        {isStaff && (
          <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20">
            <div>
              <h2 className="text-base font-bold text-navy-700 capitalize">
                {user.role} Dashboard
              </h2>
              <p className="text-xs text-slate-400">Live Queue & Station Management</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Connected
              </span>
            </div>
          </header>
        )}

        {/* Content body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
