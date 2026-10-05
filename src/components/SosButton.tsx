import React from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertOctagon,
  X,
  PhoneCall,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Radio,
  Sliders,
  EyeOff
} from 'lucide-react';

export const SosButton: React.FC = () => {
  const {
    t,
    triggerSOSInitiation,
    isCountingDown,
    countdownValue,
    cancelSOSCountdown,
    user,
    themeVariant,
    isSirenAlarmActive,
    toggleSirenAlarm,
    safeWord,
    isListeningVoice,
    startVoiceListening,
    stopVoiceListening,
    setActiveModal,
    voiceAudioLevel,
    isDiscreetVoiceMode
  } = useApp();

  const totalCountdown = user?.countdownSeconds || 3;
  const progressPercent = ((totalCountdown - countdownValue + 1) / totalCountdown) * 100;

  // Theme-aware radial aura styling
  const themeAuraClasses: Record<string, { aura: string; ring: string }> = {
    crimson: { aura: 'bg-rose-500/20 dark:bg-rose-500/15', ring: 'border-rose-500/40 dark:border-rose-400/30' },
    emerald: { aura: 'bg-emerald-500/20 dark:bg-emerald-500/15', ring: 'border-emerald-500/40 dark:border-emerald-400/30' },
    amber: { aura: 'bg-amber-500/20 dark:bg-amber-500/15', ring: 'border-amber-500/40 dark:border-amber-400/30' },
    indigo: { aura: 'bg-indigo-500/20 dark:bg-indigo-500/15', ring: 'border-indigo-500/40 dark:border-indigo-400/30' },
    slate: { aura: 'bg-slate-500/20 dark:bg-slate-500/15', ring: 'border-slate-500/40 dark:border-slate-400/30' },
    cyberpunk: { aura: 'bg-purple-500/20 dark:bg-purple-500/15', ring: 'border-purple-500/40 dark:border-purple-400/30' }
  };

  const currentAura = themeAuraClasses[themeVariant] || themeAuraClasses.crimson;

  return (
    <div className="flex flex-col items-center justify-center py-6 px-3">
      {/* Prominent SOS Trigger Container */}
      <div className="relative flex items-center justify-center">
        {/* Multi-Layered Rotating Holographic Defense Arcs */}
        <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-dashed border-rose-500/30 animate-[spin_20s_linear_infinite] pointer-events-none" />
        <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-dotted border-amber-400/25 animate-[spin_15s_linear_infinite_reverse] pointer-events-none" />
        
        {/* Pulsing Tactical Beacon Aura */}
        <div className={`absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full ${currentAura.aura} animate-beacon-ripple pointer-events-none transition-colors duration-300`} />
        <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-rose-600/10 blur-xl animate-pulse pointer-events-none" />

        {/* SOS Primary Button with 3D Tactile Metallic Bezel & Core Glow */}
        <button
          onClick={() => triggerSOSInitiation('sos_button')}
          aria-label={t.sos}
          className="group relative z-10 w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-rose-500 via-rose-600 to-red-800 text-white shadow-[0_0_50px_rgba(225,29,72,0.6)] hover:shadow-[0_0_70px_rgba(225,29,72,0.85)] active:scale-95 transition-all duration-300 flex flex-col items-center justify-center p-1 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-400 cursor-pointer"
        >
          {/* Outer Chamfered Metallic Edge Ring */}
          <div className="absolute inset-1 rounded-full border-2 border-rose-300/40 bg-gradient-to-tr from-white/20 via-transparent to-black/40 pointer-events-none" />
          
          {/* Inner Convex Lens / Glass Shield */}
          <div className="relative z-10 w-full h-full rounded-full flex flex-col items-center justify-center bg-gradient-to-b from-rose-500/90 via-red-600 to-rose-900 border border-white/30 overflow-hidden">
            {/* Holographic light sweep reflection */}
            <div className="absolute -top-12 -left-12 w-48 h-32 bg-gradient-to-b from-white/30 to-transparent rotate-45 rounded-full blur-sm pointer-events-none group-hover:translate-x-6 group-hover:translate-y-6 transition-transform duration-700" />
            
            <AlertOctagon className="w-9 h-9 sm:w-11 sm:h-11 mb-1 text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300" />
            
            <div className="flex items-center gap-1">
              <span className="text-3xl sm:text-4xl font-black tracking-widest font-display text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]">
                SOS
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-rose-100 bg-black/25 px-2 py-0.5 rounded-full border border-white/20">
                1-TAP DISTRESS
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Tagline & Guidance */}
      <div className="mt-4 text-center max-w-xs">
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {t.tagline}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {t.sosSubtext}
        </p>
      </div>

      {/* Dedicated Safe-Word / Hands-Free Voice SOS Module */}
      <div className="w-full max-w-md mt-4">
        {isListeningVoice ? (
          /* Active Hands-Free Voice Card */
          <div className="rounded-2xl p-3.5 bg-gradient-to-r from-rose-950/90 via-red-950/90 to-rose-950/90 border-2 border-rose-500/70 text-white shadow-lg shadow-rose-950/40 animate-in fade-in transition">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center shrink-0 animate-pulse text-white shadow-md shadow-rose-600/40">
                  <Radio className="w-5 h-5 animate-spin" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black tracking-wide uppercase text-rose-200">
                      Voice SOS Active
                    </span>
                    {isDiscreetVoiceMode && (
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-900/90 text-purple-200 text-[10px] font-bold flex items-center gap-0.5 border border-purple-700">
                        <EyeOff className="w-2.5 h-2.5" /> Stealth
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-white truncate mt-0.5">
                    Say: <span className="text-amber-300 font-mono underline decoration-amber-400">"{safeWord}"</span>
                  </p>
                </div>
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div className="flex items-end gap-1 h-6 px-2 py-1 rounded-lg bg-black/40 border border-rose-500/30 shrink-0">
                {[20, 50, 80, 60, 30].map((h, i) => {
                  const dynamicHeight = Math.max(18, Math.min(100, voiceAudioLevel * (h / 45)));
                  return (
                    <div
                      key={i}
                      className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                      style={{ height: `${dynamicHeight}%` }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-rose-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-rose-200/90">
                Hands restrained? Attacker near? Just speak clearly.
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModal('voice_sos_setup')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] flex items-center gap-1 transition"
                  title="Configure safe-word & sensitivity"
                >
                  <Sliders className="w-3 h-3 text-amber-300" />
                  <span>Configure</span>
                </button>
                <button
                  type="button"
                  onClick={stopVoiceListening}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 transition shadow-sm active:scale-95"
                >
                  <MicOff className="w-3 h-3" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Inactive Hands-Free Prompt Card */
          <div className="rounded-2xl p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3 hover:border-rose-400/50 transition">
            <div
              onClick={() => setActiveModal('voice_sos_setup')}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
            >
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Safe-Word: <span className="font-mono text-rose-600 dark:text-rose-400">"{safeWord}"</span>
                  </span>
                  {isDiscreetVoiceMode && (
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                      Silent
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  Cannot tap screen? Trigger emergency by voice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => startVoiceListening({ isTestMode: false })}
                className="min-h-[38px] px-3 rounded-xl bg-slate-900 dark:bg-rose-600 hover:bg-slate-800 dark:hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Listen</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('voice_sos_setup')}
                className="min-h-[38px] w-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition"
                title="Configure safe-word phrase and sensitivity"
                aria-label="Safe-Word Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3-Second Configurable Countdown Overlay Modal */}
      {isCountingDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl border border-rose-500/30 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3">
              <PhoneCall className="w-6 h-6 animate-bounce" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              {t.countdown}
            </h3>

            {/* Big Countdown Number with Radial Ring */}
            <div className="relative my-6 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-slate-100 dark:text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={339.29}
                  strokeDashoffset={339.29 - (339.29 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="text-rose-600 transition-all duration-300"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-5xl font-extrabold text-rose-600 dark:text-rose-400 font-display">
                {countdownValue}
              </span>
            </div>

            {/* Loud Siren Alarm Active Banner */}
            <div className={`w-full py-2 px-3 rounded-xl mb-4 border flex items-center justify-between text-xs transition ${
              isSirenAlarmActive
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isSirenAlarmActive ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
                <span className="font-bold">
                  {isSirenAlarmActive ? '🚨 LOUD SIREN ALARM SOUNDING' : '🔇 Siren Muted'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSirenAlarm}
                className="px-2 py-1 rounded bg-white dark:bg-slate-700 hover:bg-slate-50 text-[11px] font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1 transition"
              >
                {isSirenAlarmActive ? <VolumeX className="w-3 h-3 text-rose-600" /> : <Volume2 className="w-3 h-3 text-emerald-500" />}
                <span>{isSirenAlarmActive ? 'Mute' : 'Unmute'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Contacting Official ERSS 112 & alerting trusted contacts with live location.
            </p>

            {/* Cancel Action */}
            <button
              onClick={cancelSOSCountdown}
              className="w-full min-h-[52px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-base flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700 active:scale-95 transition"
            >
              <X className="w-5 h-5 text-rose-600" />
              <span>{t.tapToCancel}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
