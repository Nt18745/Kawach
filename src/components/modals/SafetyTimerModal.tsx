import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Timer,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play
} from 'lucide-react';

export const SafetyTimerModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    activeTimer,
    timerRemainingSeconds,
    startSafetyTimer,
    checkInTimer,
    cancelTimer,
    t
  } = useApp();

  const [destination, setDestination] = useState<string>('Home / Metro');
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [gracePeriodSeconds, setGracePeriodSeconds] = useState<number>(120);

  if (activeModal !== 'safety_timer') return null;

  const presets = [15, 25, 45, 60];

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    await startSafetyTimer(destination, durationMinutes, gracePeriodSeconds);
  };

  const minutesLeft = Math.floor(timerRemainingSeconds / 60);
  const secondsLeft = timerRemainingSeconds % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {t.safetyTimer}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Automatic Emergency Escalation
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {activeTimer ? (
            /* Active Timer Status View */
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Destination
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
                  {activeTimer.destination}
                </h3>
              </div>

              {/* Remaining Countdown Timer */}
              <div className="py-4 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alerts will trigger automatically if you do not check in before expiry.
                </p>
              </div>

              {/* Action Buttons: Check-in & Cancel */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={checkInTimer}
                  className="min-h-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 active:scale-95 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I'm Safe</span>
                </button>

                <button
                  onClick={cancelTimer}
                  className="min-h-[50px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
                >
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>Cancel Timer</span>
                </button>
              </div>
            </div>
          ) : (
            /* Configure New Timer */
            <form onSubmit={handleStart} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Destination
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="e.g. Metro station, Home, College hostel"
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Duration Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {presets.map(mins => (
                    <button
                      type="button"
                      key={mins}
                      onClick={() => setDurationMinutes(mins)}
                      className={`min-h-[40px] text-xs font-bold rounded-lg transition ${
                        durationMinutes === mins
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={240}
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white text-center font-mono"
                />
              </div>

              {/* Grace Period */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Grace Period Before Alert (Seconds)
                </label>
                <select
                  value={gracePeriodSeconds}
                  onChange={e => setGracePeriodSeconds(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value={60}>60 seconds (1 min)</option>
                  <option value={120}>120 seconds (2 mins)</option>
                  <option value={300}>300 seconds (5 mins)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[50px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>{t.startTimer}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
