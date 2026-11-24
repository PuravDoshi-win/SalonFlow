import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import { useQueueSocket } from '../context/QueueContext';
import api from '../services/api';
import {
  Users,
  Clock,
  Scissors,
  CheckCircle,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  X,
  Phone,
  UserCheck
} from 'lucide-react';

export default function ReceptionistDashboard() {
  const { lang, t } = useTranslation();
  const { lastEvent } = useQueueSocket();

  const [summary, setSummary] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [queueEntries, setQueueEntries] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Walk-in modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServices, setWalkinServices] = useState([]);
  const [walkinBarber, setWalkinBarber] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    try {
      const [sumRes, barRes, qRes, svcRes] = await Promise.all([
        api.get('/queue/summary'),
        api.get('/barbers'),
        api.get('/queue/live'),
        api.get('/services')
      ]);
      setSummary(sumRes.data);
      setBarbers(barRes.data);
      setQueueEntries(qRes.data);
      setServices(svcRes.data);
    } catch (err) {
      console.error('Failed to load reception data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastEvent]);

  // Actions
  const handleCallNext = async (barberId) => {
    try {
      await api.post(`/queue/${barberId}/call-next`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to call next customer.');
    }
  };

  const handleMarkNoShow = async (entryId) => {
    if (!window.confirm('Mark this customer as No-Show? The barber will become available.')) return;
    try {
      await api.post(`/queue/${entryId}/no-show`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark as no-show.');
    }
  };

  const handleCancelEntry = async (entryId) => {
    if (!window.confirm('Cancel this customer queue entry?')) return;
    try {
      await api.post(`/queue/${entryId}/cancel`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel customer.');
    }
  };

  const handleAddWalkinSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!walkinName.trim()) {
      setModalError('Customer name is required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(walkinPhone)) {
      setModalError('Valid 10-digit mobile number is required.');
      return;
    }
    if (walkinServices.length === 0) {
      setModalError('Select at least one service.');
      return;
    }

    setModalSubmitting(true);
    try {
      await api.post('/queue/walkin', {
        customer_name: walkinName,
        customer_phone: walkinPhone,
        service_ids: walkinServices,
        preferred_barber_id: walkinBarber || null
      });
      setShowWalkinModal(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinServices([]);
      setWalkinBarber(null);
      loadData();
    } catch (err) {
      setModalError(err.response?.data?.detail || 'Failed to admit walk-in.');
    } finally {
      setModalSubmitting(false);
    }
  };

  // Filtered queue table
  const filteredQueue = queueEntries.filter((entry) => {
    const matchesSearch =
      entry.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.customer_phone.includes(searchTerm) ||
      entry.token_number.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || entry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Walk-in CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-700">{t('reception.title')}</h1>
          <p className="text-xs text-slate-500">Real-Time Floor Management & Queue Desk</p>
        </div>

        <button
          onClick={() => setShowWalkinModal(true)}
          className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('reception.addWalkin')}</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold">{t('reception.kpiWaiting')}</span>
          <p className="text-2xl font-black text-amber-600 mt-1">{summary?.total_waiting ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold">{t('reception.kpiInChair')}</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{summary?.total_in_chair ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold">{t('reception.kpiCompleted')}</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{summary?.total_served_today ?? 0}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-400 font-semibold">{t('reception.kpiAvgWait')}</span>
          <p className="text-2xl font-black text-navy-700 mt-1">~{summary?.average_wait_minutes ?? 20}m</p>
        </div>
      </div>

      {/* Barber Station Status Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-navy-700 uppercase tracking-wider">{t('reception.chairStatus')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {barbers.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{b.chair_number}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    b.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    b.status === 'BUSY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {t(`status.${b.status}`)}
                  </span>
                </div>
                <h4 className="font-bold text-navy-700 text-sm mt-1">{b.name}</h4>

                {b.active_token ? (
                  <div className="mt-3 p-2 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs">
                    <span className="text-[10px] text-indigo-500 font-semibold uppercase block">Serving</span>
                    <span className="font-bold text-navy-800">{b.active_token} — {b.active_customer_name}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-3 italic">Chair available</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleCallNext(b.id)}
                  disabled={b.status !== 'AVAILABLE'}
                  className="w-full py-1.5 px-3 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-navy-700"
                >
                  {t('reception.callNext')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Queue Table with Search & Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('reception.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">{t('reception.filterAll')}</option>
              <option value="WAITING">{t('status.WAITING')}</option>
              <option value="CALLED">{t('status.CALLED')}</option>
              <option value="IN_CHAIR">{t('status.IN_CHAIR')}</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Services</th>
                <th className="py-3 px-4">Stylist Preference</th>
                <th className="py-3 px-4">Est. Wait</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    {t('common.emptyQueue')}
                  </td>
                </tr>
              ) : (
                filteredQueue.map((entry) => {
                  const isLongWait = entry.status === 'WAITING' && entry.estimated_wait_minutes > 50;
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLongWait ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-black text-navy-700">
                        {entry.token_number}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {entry.customer_name}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{entry.customer_phone}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {entry.services.map(s => s.service_name).join(', ')}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {entry.assigned_barber_name ? (
                          <span className="font-bold text-indigo-600">{entry.assigned_barber_name}</span>
                        ) : (
                          entry.preferred_barber_name || 'Any Barber'
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {entry.status === 'WAITING' ? `~${entry.estimated_wait_minutes}m` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          entry.status === 'WAITING' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          entry.status === 'CALLED' ? 'bg-gold-50 text-gold-700 border border-gold-300 animate-pulse' :
                          'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {t(`status.${entry.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {entry.status === 'CALLED' && (
                          <button
                            onClick={() => handleMarkNoShow(entry.id)}
                            className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            {t('reception.markNoShow')}
                          </button>
                        )}
                        {entry.status === 'WAITING' && (
                          <button
                            onClick={() => handleCancelEntry(entry.id)}
                            className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            {t('reception.cancel')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Walk-in Modal */}
      {showWalkinModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-navy-700">{t('reception.addWalkin')}</h3>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="my-3 p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddWalkinSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  placeholder="e.g. Nilesh Patel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">10-Digit Mobile Phone *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={walkinPhone}
                  onChange={(e) => setWalkinPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Services * (max 3)</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {services.map((s) => {
                    const isSel = walkinServices.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => {
                          if (isSel) setWalkinServices(walkinServices.filter(id => id !== s.id));
                          else if (walkinServices.length < 3) setWalkinServices([...walkinServices, s.id]);
                        }}
                        className={`p-2 rounded-xl text-left text-xs border transition-all ${
                          isSel ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-700' : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <div>{lang === 'gu' ? s.name_gu : s.name_en}</div>
                        <div className="text-[10px] text-slate-400">₹{s.price} · {s.duration_minutes}m</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Stylist (Optional)</label>
                <select
                  value={walkinBarber || ''}
                  onChange={(e) => setWalkinBarber(e.target.value || null)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                >
                  <option value="">Any Available Stylist (Fastest)</option>
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} ({b.chair_number})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="px-5 py-2 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  {modalSubmitting ? 'Admitting...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
