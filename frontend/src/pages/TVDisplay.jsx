import React, { useState, useEffect } from 'react';
import { useQueueSocket } from '../context/QueueContext';
import api from '../services/api';
import { Scissors, Sparkles, Clock, Volume2 } from 'lucide-react';

export default function TVDisplay() {
  const { lastEvent } = useQueueSocket();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [barbers, setBarbers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [calledAlert, setCalledAlert] = useState(null);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      const [barRes, qRes] = await Promise.all([
        api.get('/barbers'),
        api.get('/queue/live')
      ]);
      setBarbers(barRes.data);
      setQueue(qRes.data);
    } catch (e) {
      console.error('Failed to load TV display:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [lastEvent]);

  // Flash celebration alert if event is CUSTOMER_CALLED
  useEffect(() => {
    if (lastEvent?.event === 'CUSTOMER_CALLED') {
      setCalledAlert(lastEvent);
      const timer = setTimeout(() => setCalledAlert(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  const waitingOnly = queue.filter(q => q.status === 'WAITING').slice(0, 5);

  return (
    <div className="min-h-screen bg-[#121924] text-white flex flex-col font-sans select-none overflow-hidden">
      
      {/* Top TV Banner */}
      <header className="h-24 px-8 border-b border-white/10 flex items-center justify-between bg-navy-900/80">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-500 flex items-center justify-center text-navy-900 shadow-lg">
            <Scissors className="w-8 h-8 -rotate-45" />
          </div>
          <div>
            <span className="text-3xl font-black tracking-tight text-white">Salon<span className="text-indigo-400">Flow</span></span>
            <span className="block text-xs uppercase tracking-widest text-gold-400 font-bold">Smart Salon Waiting Lounge</span>
          </div>
        </div>

        {/* Live Digital Clock */}
        <div className="text-right">
          <div className="text-3xl font-mono font-black text-gold-400">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">
            {currentTime.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main Split Screen */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side (65%): Now Serving / In Chair */}
        <div className="col-span-8 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-wider text-gold-400 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gold-400 animate-ping"></span>
              Now Serving In Chair
            </h2>
            <span className="text-xs text-slate-400 font-medium">Proceed directly to your assigned chair</span>
          </div>

          <div className="grid grid-cols-2 gap-5 flex-1">
            {barbers.map((b) => (
              <div
                key={b.id}
                className="bg-navy-800/90 border border-white/10 rounded-3xl p-6 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold uppercase tracking-widest text-slate-400">{b.chair_number}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      b.status === 'BUSY' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white mt-2">{b.name}</h3>
                </div>

                <div className="my-6">
                  {b.active_token ? (
                    <div className="text-center p-4 bg-navy-900/80 rounded-2xl border border-gold-500/30">
                      <span className="text-5xl font-black text-gold-400 tracking-tight block">
                        {b.active_token}
                      </span>
                      <span className="text-sm font-semibold text-slate-300 block mt-1">
                        {b.active_customer_name}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm italic">
                      Chair currently available
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-medium">
                  ★ {b.rating_avg} Rating · {b.specialties}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side (35%): Next in Line (Up to 5) */}
        <div className="col-span-4 bg-navy-800/60 border border-white/10 rounded-3xl p-6 flex flex-col">
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-300 pb-3 border-b border-white/10">
            Up Next In Line
          </h2>

          <div className="mt-4 flex-1 space-y-3">
            {waitingOnly.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No customers waiting in line
              </div>
            ) : (
              waitingOnly.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 bg-navy-900/90 border border-white/5 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center font-bold text-sm text-gold-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-2xl font-black text-white tracking-tight">{item.token_number}</span>
                      <span className="text-xs text-slate-400 block">{item.customer_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-300 block">~{item.estimated_wait_minutes} min</span>
                    <span className="text-[10px] text-slate-500 uppercase">{item.preferred_barber_name || 'Any'}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-400">
            Complimentary Wi-Fi: <span className="font-bold text-white">SalonFlow-Guest</span>
          </div>
        </div>

      </main>

      {/* Celebratory Alert Overlay when Customer Called */}
      {calledAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
          <div className="bg-gradient-to-r from-gold-500 via-amber-400 to-gold-600 text-navy-900 p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center border-4 border-white/40 animate-bounce-subtle">
            <Sparkles className="w-16 h-16 mx-auto mb-4" />
            <span className="text-sm font-black tracking-widest uppercase">NOW CALLING</span>
            <h1 className="text-7xl font-black tracking-tight my-4">
              {calledAlert.token}
            </h1>
            <p className="text-2xl font-bold">
              Please proceed to <span className="underline">{calledAlert.chair_number} ({calledAlert.barber_name})</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
