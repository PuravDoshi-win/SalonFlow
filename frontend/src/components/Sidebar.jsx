import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import {
  Scissors,
  Users,
  Calendar,
  Settings,
  Tv,
  BarChart3,
  UserCheck,
  Clock,
  Sparkles,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const role = user?.role || 'customer';

  const navLinks = [
    // Customer links
    ...(role === 'customer' ? [
      { to: '/', label: t('nav.home'), icon: Scissors },
      { to: '/join', label: t('nav.join'), icon: Sparkles },
      { to: '/profile', label: t('nav.profile'), icon: UserCheck },
    ] : []),

    // Receptionist links
    ...(role === 'receptionist' || role === 'admin' ? [
      { to: '/reception', label: t('nav.reception'), icon: Users },
    ] : []),

    // Barber links
    ...(role === 'barber' || role === 'admin' ? [
      { to: '/barber', label: t('nav.barber'), icon: Scissors },
    ] : []),

    // Admin links
    ...(role === 'admin' ? [
      { to: '/admin', label: t('nav.admin'), icon: BarChart3 },
    ] : []),

    // Display TV for all staff
    { to: '/display', label: t('nav.display'), icon: Tv, target: '_blank' },
  ];

  return (
    <aside className="w-64 bg-navy-700 text-slate-300 flex flex-col min-h-screen border-r border-navy-800">
      {/* Brand header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-navy-800">
        <div className="w-9 h-9 rounded-xl bg-navy-800 border border-gold-500/30 flex items-center justify-center text-gold-500">
          <Scissors className="w-5 h-5 -rotate-45" />
        </div>
        <div>
          <span className="text-lg font-bold text-white tracking-tight">Salon<span className="text-indigo-400">Flow</span></span>
          <span className="block text-[9px] uppercase tracking-widest text-gold-400 font-semibold">Console</span>
        </div>
      </div>

      {/* User profile card */}
      <div className="p-4 mx-3 my-4 rounded-xl bg-navy-800/60 border border-navy-600/30 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 flex items-center justify-center font-bold text-sm">
          {user?.full_name?.charAt(0) || 'U'}
        </div>
        <div className="overflow-hidden">
          <h4 className="text-sm font-semibold text-white truncate">{user?.full_name || 'Staff User'}</h4>
          <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-medium uppercase tracking-wider bg-gold-500/10 text-gold-400 border border-gold-500/20 rounded">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Nav navigation items */}
      <nav className="flex-1 px-3 space-y-1">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              target={item.target}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive && !item.target
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800'
                }`
              }
            >
              <Icon className="w-4 h-4 opacity-80" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer sign out */}
      <div className="p-4 border-t border-navy-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-navy-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
