import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { Scissors, Lock, Phone, Mail, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both your phone/email and password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(username, password, rememberMe);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'receptionist') navigate('/reception');
      else if (user.role === 'barber') navigate('/barber');
      else navigate(location.state?.from || '/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid login credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoUser, demoPass) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-12 h-12 rounded-2xl bg-navy-700 flex items-center justify-center text-gold-500 shadow-md transition-transform group-hover:scale-105">
            <Scissors className="w-6 h-6 -rotate-45" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-navy-700">Salon<span className="text-indigo-500">Flow</span></span>
        </Link>
        <h2 className="text-xl font-bold text-slate-900">{t('auth.loginTitle')}</h2>
        <p className="mt-1 text-xs text-slate-500">{t('auth.loginSub')}</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-8 rounded-3xl border border-slate-200/80 shadow-md">
          
          {/* Quick Demo Accounts Pill Selector */}
          <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-500" />
              <span>{t('auth.demoAccounts')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('owner@salonflow.com', 'Owner@123')}
                className="px-2.5 py-1.5 bg-white hover:bg-navy-50 hover:border-navy-300 border border-slate-200 rounded-xl text-left font-medium text-slate-700 transition-colors"
              >
                👑 <span className="font-bold">Owner</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('reception@salonflow.com', 'Staff@123')}
                className="px-2.5 py-1.5 bg-white hover:bg-navy-50 hover:border-navy-300 border border-slate-200 rounded-xl text-left font-medium text-slate-700 transition-colors"
              >
                📋 <span className="font-bold">Reception</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ravi@salonflow.com', 'Barber@123')}
                className="px-2.5 py-1.5 bg-white hover:bg-navy-50 hover:border-navy-300 border border-slate-200 rounded-xl text-left font-medium text-slate-700 transition-colors"
              >
                💈 <span className="font-bold">Barber Ravi</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('customer@salonflow.com', 'Customer@123')}
                className="px-2.5 py-1.5 bg-white hover:bg-navy-50 hover:border-navy-300 border border-slate-200 rounded-xl text-left font-medium text-slate-700 transition-colors"
              >
                👤 <span className="font-bold">Customer</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.emailLabel')} / {t('auth.phoneLabel')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 9876543210 or owner@salonflow.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-600">{t('auth.rememberMe')}</span>
              </label>
              <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">
                {t('auth.forgotPassword')}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-navy-700 hover:bg-navy-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                t('auth.signInBtn')
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            <span>{t('auth.noAccount')} </span>
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
              {t('auth.registerBtn')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
