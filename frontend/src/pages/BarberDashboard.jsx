import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useQueueSocket } from '../context/QueueContext';
import api from '../services/api';
import {
  Scissors,
  Clock,
  Play,
  CheckCircle,
  Coffee,
  AlertCircle,
  User,
  Sparkles
} from 'lucide-react';

export default function BarberDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { lastEvent } = useQueueSocket();

  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadStation = async () => {
    try {
      const res = await api.get('/barbers/me');
      setStationData(res.data);
    } catch (err) {
      console.error('Failed to load barber station:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStation();
  }, [lastEvent]);

  // Timer tick for active customer in chair
  useEffect(() => {
    let interval;
    if (stationData?.active_customer?.status === 'IN_CHAIR' && stationData.active_customer.service_started_at) {
      const start = new Date(stationData.active_customer.service_started_at).getTime();
      interval = setInterval(() => {
        const now = Date.now();
        setElapsedSeconds(Math.max(0, Math.floor((now - start) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [stationData]);

  const handleStartService = async (entryId) => {
    try {
      await api.post(`/queue/${entryId}/start`);
      loadStation();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to start service.');
    }
  };

  const handleCompleteService = async (entryId) => {
    try {
      await api.post(`/queue/${entryId}/complete`);
      loadStation();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to complete service.');
    }
  };

  const handleCallNextCustomer = async () => {
    if (!stationData?.barber?.id) return;
    try {
      await api.post(`/queue/${stationData.barber.id}/call-next`);
      loadStation();
    } catch (err) {
      alert(err.response?.data?.detail || 'No eligible customers waiting.');
    }
  };

  const handleToggleBreak = async () => {
    if (!stationData?.barber?.id) return;
    const newStatus = stationData.barber.status === 'ON_BREAK' ? 'AVAILABLE' : 'ON_BREAK';
    try {
      await api.put(`/barbers/${stationData.barber.id}/availability`, { status: newStatus });
      loadStation();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to toggle break status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const barber = stationData?.barber;
  const activeCustomer = stationData?.active_customer;
  const nextInLine = stationData?.next_in_line;

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Barber Station Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-navy-700 text-gold-500 flex items-center justify-center font-bold text-lg shadow-md">
            {barber?.name?.charAt(0) || 'B'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-navy-700">{barber?.name}</h1>
            <p className="text-xs text-slate-500">{barber?.chair_number} · {barber?.specialties}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                barber?.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                barber?.status === 'BUSY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {t(`status.${barber?.status}`)}
              </span>
              <span className="text-xs text-slate-400">★ {barber?.rating_avg}</span>
            </div>
          </div>
        </div>

        {/* Break toggle button */}
        <button
          onClick={handleToggleBreak}
          disabled={barber?.status === 'BUSY'}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            barber?.status === 'ON_BREAK'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
          } disabled:opacity-40`}
        >
          <Coffee className="w-4 h-4" />
          <span>{barber?.status === 'ON_BREAK' ? t('barber.resumeDuty') : t('barber.goOnBreak')}</span>
        </button>
      </div>

      {/* Main Chair / Current Customer Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
          {t('barber.currentClient')}
        </h2>

        {activeCustomer ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <span className="text-3xl font-black text-navy-700">{activeCustomer.token_number}</span>
                <h3 className="text-lg font-bold text-slate-800 mt-1">{activeCustomer.customer_name}</h3>
                <p className="text-xs text-slate-400">{activeCustomer.customer_phone}</p>
              </div>

              {/* Live Elapsed Service Timer */}
              {activeCustomer.status === 'IN_CHAIR' && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold block">{t('barber.serviceTimer')}</span>
                  <span className="text-3xl font-mono font-black text-indigo-600">
                    {formatTimer(elapsedSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Est. {activeCustomer.total_duration_minutes} min service
                  </span>
                </div>
              )}
            </div>

            {/* Requested services */}
            <div>
              <h4 className="text-xs font-semibold text-slate-500 mb-2">Requested Services</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCustomer.services.map((s, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{s.name}</span>
                    <span className="text-slate-500">{s.duration}m · ₹{s.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Big Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              {activeCustomer.status === 'CALLED' && (
                <button
                  onClick={() => handleStartService(activeCustomer.id)}
                  className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t('barber.startService')}</span>
                </button>
              )}

              {activeCustomer.status === 'IN_CHAIR' && (
                <button
                  onClick={() => handleCompleteService(activeCustomer.id)}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('barber.completeService')}</span>
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Scissors className="w-8 h-8 -rotate-45" />
            </div>
            <div>
              <h3 className="text-base font-bold text-navy-700">{t('barber.noActiveClient')}</h3>
              <p className="text-xs text-slate-400">Ready to take the next waiting customer</p>
            </div>
            {barber?.status === 'AVAILABLE' && (
              <button
                onClick={handleCallNextCustomer}
                className="px-6 py-3 bg-navy-700 hover:bg-navy-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                {t('reception.callNext')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Next Client in Line Preview */}
      {nextInLine && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-50 text-gold-600 flex items-center justify-center font-black text-xs">
              NEXT
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">{t('barber.nextInLine')}</span>
              <h4 className="font-bold text-slate-800 text-sm">
                {nextInLine.token_number} — {nextInLine.customer_name} ({nextInLine.services.join(', ')})
              </h4>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-500">~{nextInLine.total_duration_minutes}m</span>
        </div>
      )}

    </div>
  );
}
