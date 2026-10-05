import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  PhoneForwarded,
  Phone,
  PhoneOff,
  User,
  Clock,
  Mic,
  Volume2
} from 'lucide-react';

export const FakeCallModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    isFakeCallRinging,
    fakeCallerName,
    isFakeCallAnswered,
    fakeCallDuration,
    scheduleFakeCall,
    answerFakeCall,
    declineFakeCall
  } = useApp();

  const [callerNameInput, setCallerNameInput] = useState<string>('Dad');
  const [delaySeconds, setDelaySeconds] = useState<number>(5);

  // If fake call is ringing or answered, render realistic incoming full screen UI
  if (isFakeCallRinging) {
    const mins = Math.floor(fakeCallDuration / 60);
    const secs = fakeCallDuration % 60;
    const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between p-8 animate-in fade-in select-none">
        {/* Top Caller Identification */}
        <div className="text-center pt-16 space-y-4">
          <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-slate-700 mx-auto flex items-center justify-center text-slate-300 shadow-xl">
            <User className="w-12 h-12" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display tracking-tight">
              {fakeCallerName}
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1 font-mono">
              {isFakeCallAnswered ? timeFormatted : 'Incoming Call...'}
            </p>
          </div>
        </div>

        {/* Center Simulated Audio Waves / Call Status */}
        {isFakeCallAnswered && (
          <div className="flex items-center justify-center gap-8 text-slate-400 py-6">
            <button className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-slate-900 border border-slate-800">
              <Mic className="w-6 h-6" />
              <span className="text-[10px]">Mute</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 p-3 rounded-full bg-slate-900 border border-slate-800">
              <Volume2 className="w-6 h-6" />
              <span className="text-[10px]">Speaker</span>
            </button>
          </div>
        )}

        {/* Bottom Accept / Decline Buttons */}
        <div className="pb-12">
          {!isFakeCallAnswered ? (
            <div className="flex items-center justify-around max-w-xs mx-auto">
              {/* Decline Button */}
              <button
                onClick={declineFakeCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition"
                aria-label="Decline Call"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>

              {/* Accept Button */}
              <button
                onClick={answerFakeCall}
                className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-95 transition animate-bounce"
                aria-label="Answer Call"
              >
                <Phone className="w-7 h-7 text-white" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={declineFakeCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition"
                aria-label="End Call"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Setup Modal
  if (activeModal !== 'fake_call_setup') return null;

  const presets = ['Dad', 'Mom', 'Inspector Sharma', 'Brother', 'Driver'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleFakeCall(callerNameInput, delaySeconds);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <PhoneForwarded className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Simulated Incoming Call
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Discreet Exit Strategy
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Caller ID Name
            </label>
            <input
              type="text"
              required
              value={callerNameInput}
              onChange={e => setCallerNameInput(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {presets.map(name => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setCallerNameInput(name)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                    callerNameInput === name
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ring Delay
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[5, 15, 30].map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setDelaySeconds(s)}
                  className={`min-h-[40px] text-xs font-bold rounded-lg border transition ${
                    delaySeconds === s
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {s} seconds
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400">
            When triggered, your phone will ring with a realistic call screen, providing a natural pretext to exit an uncomfortable or unsafe situation.
          </div>

          <button
            type="submit"
            className="w-full min-h-[50px] rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95 transition"
          >
            <Clock className="w-4 h-4" />
            <span>Trigger Ring in {delaySeconds}s</span>
          </button>
        </form>
      </div>
    </div>
  );
};
