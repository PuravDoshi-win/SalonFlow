import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { useQueueSocket } from '../context/QueueContext';
import api from '../services/api';
import {
  Users,
  Clock,
  Scissors,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Star
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const { lang, t } = useTranslation();
  const { lastEvent } = useQueueSocket();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [myActiveToken, setMyActiveToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [sumRes, barRes, svcRes] = await Promise.all([
        api.get('/queue/summary'),
        api.get('/barbers'),
        api.get('/services')
      ]);
      setSummary(sumRes.data);
      setBarbers(barRes.data);
      setServices(svcRes.data);

      if (user) {
        try {
          const actRes = await api.get('/queue/my-active');
          setMyActiveToken(actRes.data);
        } catch (e) {
          // No active token
        }
      }
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, lastEvent]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Top Salon Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h4 className="text-sm font-bold text-navy-700">SalonFlow Luxury Studio</h4>
            <p className="text-xs text-slate-500">{t('home.openBadge')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary?.is_online_queue_open ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('home.onlineQueueOpen')}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              {t('home.onlineQueueClosed')}
            </span>
          )}
        </div>
      </div>

      {/* Hero Live Wait Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 text-white p-8 md:p-10 shadow-xl border border-navy-600/40">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/20 text-gold-400 text-xs font-bold border border-gold-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {t('brand.tagline')}
          </span>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            {t('home.welcome')}
          </h1>
          <p className="mt-3 text-slate-300 text-sm md:text-base leading-relaxed">
            {t('home.subheading')}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {myActiveToken ? (
              <Link
                to={`/status/${myActiveToken.token_number}`}
                className="px-6 py-3.5 rounded-2xl bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold text-sm shadow-lg shadow-gold-500/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>{t('home.trackCurrent')} ({myActiveToken.token_number})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/join"
                className="px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
              >
                <span>{t('home.joinNow')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              to="/display"
              target="_blank"
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm backdrop-blur-md border border-white/20 transition-colors"
            >
              {t('nav.display')} ↗
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-navy-700">{summary?.total_waiting ?? 0}</span>
            <p className="text-xs font-medium text-slate-500">{t('home.waitingCount')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-navy-700">~{summary?.estimated_wait_minutes ?? 15} {t('common.mins')}</span>
            <p className="text-xs font-medium text-slate-500">{t('home.estWait')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Scissors className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-extrabold text-navy-700">
              {barbers.filter(b => b.is_on_duty_today && b.status !== 'OFF_DUTY').length} of {barbers.length}
            </span>
            <p className="text-xs font-medium text-slate-500">{t('home.barbersOnDuty')}</p>
          </div>
        </div>
      </div>

      {/* Barbers Duty Strip */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-navy-700">{t('home.dutyBarbers')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {barbers.map((b) => (
            <div key={b.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-sm shrink-0 border border-navy-200">
                {b.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="overflow-hidden flex-1">
                <h4 className="text-sm font-bold text-slate-800 truncate">{b.name}</h4>
                <p className="text-xs text-slate-400">{b.chair_number}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${
                    b.status === 'AVAILABLE' ? 'bg-emerald-500' :
                    b.status === 'BUSY' ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}></span>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {t(`status.${b.status}`)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-navy-700">{t('home.ourServices')}</h3>
          <Link to="/join" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            <span>{t('join.confirmButton')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.slice(0, 6).map((svc) => (
            <div key={svc.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-navy-700 text-base">{lang === 'gu' ? svc.name_gu : svc.name_en}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {svc.duration_minutes} {t('common.mins')}
                </span>
                <span className="font-bold text-indigo-600 text-sm">
                  {t('common.currency')}{svc.price}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
