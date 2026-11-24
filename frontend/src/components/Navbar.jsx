import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Scissors, Globe, LogOut, User as UserIcon, Shield, Tv } from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { lang, toggleLanguage, t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'receptionist') return '/reception';
    if (user.role === 'barber') return '/barber';
    return '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center text-gold-500 shadow-md transition-transform group-hover:scale-105">
            <Scissors className="w-5 h-5 -rotate-45" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-navy-700">Salon<span className="text-indigo-500">Flow</span></span>
            <span className="block text-[10px] uppercase tracking-widest text-slate-400 font-semibold leading-none">Smart Queue</span>
          </div>
        </Link>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy-700 hover:bg-slate-50 rounded-lg transition-colors">
            {t('nav.home')}
          </Link>
          <Link to="/join" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy-700 hover:bg-slate-50 rounded-lg transition-colors">
            {t('nav.join')}
          </Link>
          <Link to="/display" target="_blank" className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-navy-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-slate-400" />
            {t('nav.display')}
          </Link>
          {user && user.role !== 'customer' && (
            <Link to={getDashboardLink()} className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {user.role.toUpperCase()}
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switch */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50/80 hover:bg-slate-100 transition-all"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-500" />
            <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          </button>

          {/* User Auth Info */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-xs border border-navy-200">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-slate-700">{user.full_name?.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title={t('nav.logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-semibold text-navy-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg shadow-sm transition-all"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
