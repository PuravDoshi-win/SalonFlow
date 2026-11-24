import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext';
import { useQueueSocket } from '../context/QueueContext';
import api from '../services/api';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Scissors,
  XCircle,
  Star,
  ArrowRight
} from 'lucide-react';

export default function QueueStatus() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { lastEvent } = useQueueSocket();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewed, setReviewed] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await api.get(`/queue/status/${id}`);
      setTicket(res.data);
    } catch (err) {
      console.error('Error fetching ticket status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [id, lastEvent]);

  const handleCancel = async () => {
    if (!window.confirm(t('ticket.cancelConfirm'))) return;
    setCancelling(true);
    try {
      await api.post(`/queue/${ticket.id}/cancel`);
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to cancel ticket.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        queue_entry_id: ticket.id,
        rating,
        comment: comment || null
      });
      setReviewed(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Could not submit review.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center">
        <h3 className="text-lg font-bold text-navy-700">Ticket Not Found</h3>
        <p className="text-xs text-slate-500 mt-2">The requested token identifier is invalid or expired.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-4 py-2 bg-navy-700 text-white rounded-xl text-xs font-semibold"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const isWaiting = ticket.status === 'WAITING';
  const isCalled = ticket.status === 'CALLED';
  const isInChair = ticket.status === 'IN_CHAIR';
  const isDone = ticket.status === 'DONE';
  const isCancelled = ticket.status === 'CANCELLED';
  const isNoShow = ticket.status === 'NO_SHOW';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      
      {/* Dynamic Celebration Banner when Called */}
      {isCalled && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 text-navy-900 shadow-xl animate-gold-pulse text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-2" />
          <h2 className="text-2xl font-black tracking-tight">{t('ticket.itsYourTurn')}</h2>
          <p className="text-sm font-semibold mt-1">
            {t('ticket.proceedTo')} <span className="underline font-bold">{ticket.chair_number || 'Chair'} ({ticket.assigned_barber_name})</span>
          </p>
        </div>
      )}

      {/* Almost Next Alert (Position <= 2) */}
      {isWaiting && ticket.queue_position && ticket.queue_position <= 2 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{t('ticket.almostNext')}</p>
        </div>
      )}

      {/* Main Big Token Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-8 text-center relative overflow-hidden">
        
        {/* Status pill */}
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 ${
          isWaiting ? 'bg-amber-50 text-amber-700 border border-amber-200' :
          isCalled ? 'bg-gold-100 text-gold-800 border border-gold-300' :
          isInChair ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
          isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
          'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {t(`status.${ticket.status}`)}
        </span>

        {/* Big Token Number */}
        <h1 className="text-5xl sm:text-6xl font-black text-navy-700 tracking-tight my-2">
          {ticket.token_number}
        </h1>
        <p className="text-xs text-slate-400 font-medium">Customer: {ticket.customer_name}</p>

        {/* Position & Estimated Wait (if waiting) */}
        {isWaiting && (
          <div className="mt-8 grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs text-slate-400 block">{t('ticket.position')}</span>
              <span className="text-2xl font-black text-navy-700">{ticket.queue_position ?? 1}</span>
              <span className="text-[10px] text-slate-400 block">{t('ticket.inLineAhead')}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">{t('home.estWait')}</span>
              <span className="text-2xl font-black text-indigo-600">~{ticket.estimated_wait_minutes} {t('common.mins')}</span>
              <span className="text-[10px] text-slate-400 block">updates in real-time</span>
            </div>
          </div>
        )}

        {/* Stylist & Services Breakdown */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Assigned Stylist:</span>
            <span className="font-bold text-slate-700">{ticket.assigned_barber_name || ticket.preferred_barber_name}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Services:</span>
            <span className="font-semibold text-slate-700">{ticket.services.map(s => s.service_name).join(', ')}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total Price:</span>
            <span className="font-bold text-navy-700">{t('common.currency')}{ticket.total_price}</span>
          </div>
        </div>

        {/* Cancel Action (Only while waiting) */}
        {isWaiting && (
          <div className="mt-8">
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
            >
              {t('ticket.cancelButton')}
            </button>
          </div>
        )}

      </div>

      {/* Review Section upon Completion */}
      {isDone && !reviewed && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6">
          <h3 className="text-base font-bold text-navy-700 mb-1">{t('ticket.rateVisit')}</h3>
          <p className="text-xs text-slate-500 mb-4">How was your grooming session today?</p>
          
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-gold-400 hover:scale-110 transition-transform"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-gold-400' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a short comment (optional)..."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-navy-700 hover:bg-navy-800 text-white rounded-xl text-xs font-bold"
            >
              {t('ticket.submitFeedback')}
            </button>
          </form>
        </div>
      )}

      {reviewed && (
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center text-xs font-semibold text-emerald-800">
          ✓ Thank you for your feedback!
        </div>
      )}

    </div>
  );
}
