import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import { User, Clock, Scissors, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [customerInfo, setCustomerInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profRes, histRes] = await Promise.all([
          api.get('/customers/me'),
          api.get('/customers/history')
        ]);
        setCustomerInfo(profRes.data);
        setHistory(histRes.data);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters.');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      });
      setPassMsg('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPassError(err.response?.data?.detail || 'Failed to change password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      
      {/* Profile Overview Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-navy-700 text-gold-500 flex items-center justify-center font-bold text-2xl shadow-md">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-700">{user?.full_name}</h1>
            <p className="text-xs text-slate-500">{user?.phone} · {user?.email || 'No email'}</p>
            <span className="inline-block px-2.5 py-0.5 mt-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase text-[10px]">
              {user?.role}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">Total Visits</span>
            <span className="text-2xl font-black text-navy-700">{customerInfo?.total_visits ?? 0}</span>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-semibold block">Total Spent</span>
            <span className="text-2xl font-black text-indigo-600">₹{customerInfo?.total_spent ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Change Password & Visit History Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left (1 col): Change Password Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy-700 flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-500" />
            <span>Change Password</span>
          </h3>

          {passMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passMsg}</span>
            </div>
          )}

          {passError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              Update Password
            </button>
          </form>
        </div>

        {/* Right (2 cols): Past Visit History */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-navy-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>Visit History & Services</span>
          </h3>

          <div className="space-y-3">
            {history.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">No past visits recorded.</p>
            ) : (
              history.map((h) => (
                <div key={h.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-navy-700 text-sm block">{h.token_number}</span>
                    <span className="text-slate-500">{h.services.map(s => s.service_name).join(', ')}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(h.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })} · Stylist: {h.assigned_barber_name || h.preferred_barber_name || 'Any'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-indigo-600 block">₹{h.total_price}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      h.status === 'DONE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {t(`status.${h.status}`)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
