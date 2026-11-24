import React, { useState, useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  Sliders,
  Shield,
  Star
} from 'lucide-react';

const COLORS = ['#596FE0', '#D4AF72', '#10B981', '#F59E0B', '#EF4444'];

export default function AdminDashboard() {
  const { lang, t } = useTranslation();

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, services, barbers, staff, settings
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState(null);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // New service modal
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [newSvcNameEn, setNewSvcNameEn] = useState('');
  const [newSvcNameGu, setNewSvcNameGu] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState('');

  // Settings form
  const [salonName, setSalonName] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [onlineQueueOpen, setOnlineQueueOpen] = useState(true);
  const [maxCapacity, setMaxCapacity] = useState(30);

  const loadAdminData = async () => {
    try {
      const [kpiRes, chartRes, svcRes, barRes, stfRes, setRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/analytics'),
        api.get('/services/all'),
        api.get('/barbers'),
        api.get('/admin/staff'),
        api.get('/admin/settings')
      ]);
      setKpis(kpiRes.data);
      setCharts(chartRes.data);
      setServices(svcRes.data);
      setBarbers(barRes.data);
      setStaff(stfRes.data);
      setSettings(setRes.data);

      setSalonName(setRes.data.salon_name);
      setOpenTime(setRes.data.opening_time);
      setCloseTime(setRes.data.closing_time);
      setOnlineQueueOpen(setRes.data.is_online_queue_open);
      setMaxCapacity(setRes.data.max_online_queue_capacity);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await api.post('/services', {
        name_en: newSvcNameEn,
        name_gu: newSvcNameGu,
        price: parseFloat(newSvcPrice),
        duration_minutes: parseInt(newSvcDuration),
        is_active: true
      });
      setShowAddServiceModal(false);
      setNewSvcNameEn('');
      setNewSvcNameGu('');
      setNewSvcPrice('');
      setNewSvcDuration('');
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create service.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/admin/settings', {
        salon_name: salonName,
        opening_time: openTime,
        closing_time: closeTime,
        is_online_queue_open: onlineQueueOpen,
        max_online_queue_capacity: parseInt(maxCapacity)
      });
      alert('Settings updated successfully!');
      loadAdminData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update settings.');
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
    <div className="space-y-6 pb-16">
      
      {/* Admin Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-navy-700">{t('admin.title')}</h1>
          <p className="text-xs text-slate-500">Live PostgreSQL Analytics, Catalog & Salon Controls</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-white text-navy-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            {t('admin.tabAnalytics')}
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'services' ? 'bg-white text-navy-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            {t('admin.tabServices')}
          </button>
          <button
            onClick={() => setActiveTab('barbers')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'barbers' ? 'bg-white text-navy-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            {t('admin.tabBarbers')}
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'staff' ? 'bg-white text-navy-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            {t('admin.tabStaff')}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'settings' ? 'bg-white text-navy-700 shadow-sm' : 'hover:text-slate-900'
            }`}
          >
            {t('admin.tabSettings')}
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS & RECHARTS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400">{t('admin.kpiRevenue')}</span>
              <p className="text-2xl font-black text-indigo-600 mt-1">₹{kpis?.total_estimated_revenue ?? 0}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400">Total Served Today</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{kpis?.completed_services_today ?? 0}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400">Current Queue</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{kpis?.current_waiting ?? 0}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-400">Avg. Wait Time</span>
              <p className="text-2xl font-black text-navy-700 mt-1">{kpis?.average_wait_time_minutes ?? 22}m</p>
            </div>
          </div>

          {/* Recharts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Hourly Customer Traffic (Bar Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-navy-700 mb-4">{t('admin.trafficChart')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.traffic || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="customers" fill="#596FE0" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Revenue Trend (Line Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-navy-700 mb-4">{t('admin.revenueChart')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts?.revenue_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#D4AF72" strokeWidth={3} dot={{ fill: '#D4AF72', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Service Distribution (Pie Chart) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-navy-700 mb-4">{t('admin.servicePopularity')}</h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={charts?.popular_services || []}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(charts?.popular_services || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barber Throughput */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-navy-700 mb-4">{t('admin.barberPerformance')}</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.barber_performance || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={80} />
                    <Tooltip />
                    <Bar dataKey="served" fill="#253247" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: SERVICES CATALOG */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-navy-700">Services Catalog</h3>
            <button
              onClick={() => setShowAddServiceModal(true)}
              className="px-3.5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('admin.addService')}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Name (English)</th>
                  <th className="py-3 px-4">Name (Gujarati)</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((svc) => (
                  <tr key={svc.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-navy-700">{svc.name_en}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{svc.name_gu}</td>
                    <td className="py-3 px-4 text-slate-600">{svc.duration_minutes} min</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">₹{svc.price}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        svc.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {svc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BARBER ROSTER */}
      {activeTab === 'barbers' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-navy-700">Barbers & Stylists</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {barbers.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-sm">
                    {b.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{b.name}</h4>
                    <p className="text-xs text-slate-400">{b.chair_number}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                  <p><span className="text-slate-400">Specialties:</span> {b.specialties}</p>
                  <p><span className="text-slate-400">Rating:</span> ★ {b.rating_avg}</p>
                  <p><span className="text-slate-400">Status:</span> {t(`status.${b.status}`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: STAFF ACCOUNTS */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-navy-700">Salon Staff Users</h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-navy-700">{s.full_name}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-600 uppercase text-[10px]">{s.role}</td>
                    <td className="py-3 px-4 text-slate-600">{s.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{s.email || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: SALON SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-xl">
          <h3 className="text-base font-bold text-navy-700 mb-4">{t('admin.tabSettings')}</h3>
          
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Salon Brand Name</label>
              <input
                type="text"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Opening Time</label>
                <input
                  type="text"
                  value={openTime}
                  onChange={(e) => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Closing Time</label>
                <input
                  type="text"
                  value={closeTime}
                  onChange={(e) => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Max Online Queue Capacity</label>
              <input
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="qOpen"
                checked={onlineQueueOpen}
                onChange={(e) => setOnlineQueueOpen(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <label htmlFor="qOpen" className="font-semibold text-slate-700">
                Online Queue Joining Enabled (Master Switch)
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 px-5 py-2.5 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{t('admin.saveSettings')}</span>
            </button>
          </form>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6">
            <h3 className="text-base font-bold text-navy-700 mb-4">{t('admin.addService')}</h3>
            <form onSubmit={handleCreateService} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Name (English) *</label>
                <input
                  type="text"
                  value={newSvcNameEn}
                  onChange={(e) => setNewSvcNameEn(e.target.value)}
                  placeholder="e.g. Skin Whitening Facial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Name (Gujarati) *</label>
                <input
                  type="text"
                  value={newSvcNameGu}
                  onChange={(e) => setNewSvcNameGu(e.target.value)}
                  placeholder="e.g. સ્કીન વ્હાઇટનિંગ ફેશિયલ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    value={newSvcPrice}
                    onChange={(e) => setNewSvcPrice(e.target.value)}
                    placeholder="350"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Mins) *</label>
                  <input
                    type="number"
                    value={newSvcDuration}
                    onChange={(e) => setNewSvcDuration(e.target.value)}
                    placeholder="30"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddServiceModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-navy-700 text-white font-bold rounded-xl shadow-md"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
