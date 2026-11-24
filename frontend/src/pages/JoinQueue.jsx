import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import api from '../services/api';
import {
  Scissors,
  Clock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  User,
  ArrowRight
} from 'lucide-react';

export default function JoinQueue() {
  const { user, isAuthenticated } = useAuth();
  const { lang, t } = useTranslation();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedBarber, setSelectedBarber] = useState(null); // null means Any Available
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingToken, setExistingToken] = useState(null);

  useEffect(() => {
    // Check if user has an active token already
    const checkActive = async () => {
      try {
        const [svcRes, barRes, activeRes] = await Promise.all([
          api.get('/services'),
          api.get('/barbers'),
          isAuthenticated ? api.get('/queue/my-active') : Promise.resolve({ data: null })
        ]);
        setServices(svcRes.data);
        setBarbers(barRes.data);
        if (activeRes.data) {
          setExistingToken(activeRes.data);
        }
      } catch (err) {
        console.error('Failed to load join options:', err);
      } finally {
        setLoading(false);
      }
    };
    checkActive();
  }, [isAuthenticated]);

  const toggleService = (svc) => {
    if (selectedServices.some(s => s.id === svc.id)) {
      setSelectedServices(selectedServices.filter(s => s.id !== svc.id));
    } else {
      if (selectedServices.length >= 3) {
        setError('You can select a maximum of 3 services per visit.');
        return;
      }
      setError('');
      setSelectedServices([...selectedServices, svc]);
    }
  };

  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + parseFloat(s.price), 0);

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/join' } });
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least 1 service to join the queue.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/queue/join', {
        service_ids: selectedServices.map(s => s.id),
        preferred_barber_id: selectedBarber || null
      });
      navigate(`/status/${res.data.token_number}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to join queue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (existingToken) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white rounded-3xl border border-slate-200 shadow-md text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-navy-700">{t('join.alreadyActive')}</h3>
        <p className="text-3xl font-extrabold text-indigo-600 my-2">{existingToken.token_number}</p>
        <p className="text-xs text-slate-500 mb-6">Status: {t(`status.${existingToken.status}`)}</p>
        <Link
          to={`/status/${existingToken.token_number}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-700 hover:bg-navy-800 text-white font-bold text-sm rounded-xl transition-all"
        >
          <span>View My Live Ticket</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-700">{t('join.title')}</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('join.selectServicePrompt')}</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Services Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
          {t('join.step1')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {services.map((svc) => {
            const isSelected = selectedServices.some(s => s.id === svc.id);
            return (
              <div
                key={svc.id}
                onClick={() => toggleService(svc)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">{lang === 'gu' ? svc.name_gu : svc.name_en}</h4>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {svc.duration_minutes} {t('common.mins')}
                  </span>
                  <span className="font-bold text-navy-700">{t('common.currency')}{svc.price}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 2: Barber Selection */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-navy-700 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
          {t('join.step2')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Any Available Option */}
          <div
            onClick={() => setSelectedBarber(null)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedBarber === null
                ? 'bg-gold-50/70 border-gold-500 shadow-sm'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-sm">{t('join.anyBarber')}</h4>
                <p className="text-xs text-slate-500">{t('join.anyBarberSub')}</p>
              </div>
            </div>
          </div>

          {/* Individual Barbers */}
          {barbers.map((b) => {
            const isSelected = selectedBarber === b.id;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBarber(b.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50/60 border-indigo-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-xs border border-navy-200">
                    {b.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-bold text-slate-800 text-sm truncate">{b.name}</h4>
                    <p className="text-xs text-slate-400">{b.chair_number} · {b.specialties}</p>
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold rounded mt-1 ${
                      b.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700' :
                      b.status === 'BUSY' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {t(`status.${b.status}`)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Summary Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block">{t('join.totalDuration')}</span>
              <span className="font-bold text-navy-700 text-base">{totalDuration} {t('common.mins')}</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div>
              <span className="text-slate-400 block">{t('join.totalPrice')}</span>
              <span className="font-bold text-indigo-600 text-base">{t('common.currency')}{totalPrice}</span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:block">
              <span className="text-slate-400 block">{t('join.expectedWait')}</span>
              <span className="font-bold text-slate-700 text-base">~25 {t('common.mins')}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting || selectedServices.length === 0}
            className="px-6 py-3 bg-navy-700 hover:bg-navy-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{t('join.confirmButton')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
