import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  Sliders,
  Play,
  Square,
  HelpCircle,
  Radio,
  Ear,
  EyeOff,
  Bell
} from 'lucide-react';

const PRESET_SAFE_WORDS = [
  { label: 'Help me Kawach', category: 'Standard', desc: 'Clear, high-reliability phrase' },
  { label: 'Emergency Code Red', category: 'High Alert', desc: 'Distinct military-grade trigger' },
  { label: 'बचाओ बचाओ (Bachao)', category: 'Hindi', desc: 'Traditional emergency shout' },
  { label: 'ಕಾಪಾಡಿ (Kaapaadi)', category: 'Kannada', desc: 'Regional distress command' },
  { label: 'Blue Sky', category: 'Stealth Code', desc: 'Discreet phrase attackers won’t suspect' },
  { label: 'Call Aunt Sarah', category: 'Conversational', desc: 'Sounds like normal phone talk' }
];

export const VoiceSosModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    safeWord,
    updateSafeWord,
    isListeningVoice,
    startVoiceListening,
    stopVoiceListening,
    voiceStatus,
    voiceAudioLevel,
    lastVoiceTranscript,
    voiceTestSuccess,
    isTestVoiceMode,
    isDiscreetVoiceMode,
    setIsDiscreetVoiceMode,
    voiceSensitivity,
    setVoiceSensitivity,
    t
  } = useApp();

  const [inputPhrase, setInputPhrase] = useState<string>(safeWord);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setInputPhrase(safeWord);
  }, [safeWord]);

  if (activeModal !== 'voice_sos_setup') return null;

  const handleSavePhrase = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPhrase.trim()) return;

    const ok = await updateSafeWord(inputPhrase.trim());
    if (ok) {
      setSaveSuccessMsg(`Safe-word saved: "${inputPhrase.trim()}"`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      // If currently listening in live mode, restart with the new safe word
      if (isListeningVoice && !isTestVoiceMode) {
        startVoiceListening({ isTestMode: false });
      }
    }
  };

  const handleSelectPreset = (phrase: string) => {
    setInputPhrase(phrase);
  };

  const handleToggleListening = () => {
    if (isListeningVoice) {
      stopVoiceListening();
    } else {
      startVoiceListening({ isTestMode: false });
    }
  };

  const handleToggleTestSandbox = () => {
    if (isListeningVoice && isTestVoiceMode) {
      stopVoiceListening();
    } else {
      startVoiceListening({ isTestMode: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-xl max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isListeningVoice
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Safe-Word & Voice SOS
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  Hands-Free
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trigger emergency protocol with your voice when you cannot tap the screen
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (isTestVoiceMode) {
                stopVoiceListening();
              }
              setActiveModal(null);
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {saveSuccessMsg && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Master Hands-Free Live Activation Banner */}
          <div className={`p-4 rounded-2xl border transition shadow-sm ${
            isListeningVoice && !isTestVoiceMode
              ? 'bg-gradient-to-r from-rose-950/90 via-red-950/90 to-rose-950/90 border-rose-500/80 text-white shadow-rose-900/30'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  isListeningVoice && !isTestVoiceMode
                    ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/50'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {isListeningVoice && !isTestVoiceMode ? <Radio className="w-6 h-6 animate-spin" /> : <MicOff className="w-6 h-6" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold font-display">
                      {isListeningVoice && !isTestVoiceMode ? 'Hands-Free Voice SOS: ACTIVE' : 'Hands-Free Voice SOS: STANDBY'}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isListeningVoice && !isTestVoiceMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5">
                    {isListeningVoice && !isTestVoiceMode
                      ? `Say "${safeWord}" aloud anytime to dispatch SOS`
                      : `Tap below to keep mic active while in transit, walking, or at night`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleListening}
                className={`min-h-[44px] px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0 ${
                  isListeningVoice && !isTestVoiceMode
                    ? 'bg-slate-100 hover:bg-white text-rose-800 border border-slate-200'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/25'
                }`}
              >
                {isListeningVoice && !isTestVoiceMode ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isListeningVoice && !isTestVoiceMode ? 'Stop Listening' : 'Activate Hands-Free'}</span>
              </button>
            </div>

            {/* Audio Waveform Meter when listening */}
            {isListeningVoice && (
              <div className="mt-3 pt-3 border-t border-rose-800/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ear className="w-3.5 h-3.5 text-rose-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-mono text-rose-200">
                    {voiceStatus}
                  </span>
                </div>
                {/* 5 Equalizer Bars */}
                <div className="flex items-end gap-1 h-5 shrink-0 px-2 py-0.5 rounded bg-black/30">
                  {[20, 45, 75, 55, 30].map((h, idx) => {
                    const dynamicHeight = Math.max(15, Math.min(100, (voiceAudioLevel * (h / 50))));
                    return (
                      <div
                        key={idx}
                        className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                        style={{ height: `${dynamicHeight}%` }}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Safe-Word Phrase Customization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Configure Emergency Safe-Word
              </label>
              <span className="text-[11px] text-slate-400">
                Spoken aloud to trigger SOS
              </span>
            </div>

            <form onSubmit={handleSavePhrase} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputPhrase}
                  onChange={e => setInputPhrase(e.target.value)}
                  placeholder="e.g. Help me Kawach"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shrink-0 shadow-sm transition active:scale-95"
              >
                Save Word
              </button>
            </form>

            {/* Quick-Select Safe-Word Presets */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Quick-select tested presets:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_SAFE_WORDS.map(preset => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleSelectPreset(preset.label)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      inputPhrase.toLowerCase() === preset.label.toLowerCase()
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 ring-1 ring-rose-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-400 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 inline-block mb-1">
                        {preset.category}
                      </span>
                      <p className="text-xs font-bold leading-tight truncate">
                        "{preset.label}"
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trigger Protocol Mode: Audible Siren vs Stealth / Silent */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Emergency Dispatch Sound Protocol
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Audible Siren */}
              <button
                type="button"
                onClick={() => setIsDiscreetVoiceMode(false)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  !isDiscreetVoiceMode
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Audible Siren Alarm</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-200/60 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                      Standard
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Blarest piercing siren to scare attacker, alert nearby public, and dial 112.
                  </p>
                </div>
              </button>

              {/* Option 2: Stealth / Discreet Mode */}
              <button
                type="button"
                onClick={() => setIsDiscreetVoiceMode(true)}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  isDiscreetVoiceMode
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-1 ring-purple-500'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Stealth / Silent SOS</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-200/60 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                      Discreet
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    No siren sound or countdown beep. Silently alerts trusted contacts with live GPS so attacker is unaware.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Safe-Word Testing Sandbox */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                  Interactive Safe-Word Test Sandbox
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Practice saying your safe-word without calling 112 or alerting contacts
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleTestSandbox}
                className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition ${
                  isListeningVoice && isTestVoiceMode
                    ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {isListeningVoice && isTestVoiceMode ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Test</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Practice Test</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Sandbox Feedback Panel */}
            {isListeningVoice && isTestVoiceMode && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                    Test Mic Active: Speak "{safeWord}" now
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Mic Volume: {voiceAudioLevel}%
                  </span>
                </div>

                {/* Real-time volume visualizer bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-rose-500 transition-all duration-75"
                    style={{ width: `${Math.max(5, voiceAudioLevel)}%` }}
                  />
                </div>

                {/* Speech Transcript Output */}
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-[10px] text-slate-400 block font-medium">Heard Speech Transcript:</span>
                  <p className="font-mono text-slate-800 dark:text-slate-200 font-semibold mt-0.5 min-h-[18px]">
                    {lastVoiceTranscript ? `"${lastVoiceTranscript}"` : 'Listening... Speak into your device microphone'}
                  </p>
                </div>

                {/* Match Banner on Success */}
                {voiceTestSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2.5 text-emerald-900 dark:text-emerald-200 animate-in zoom-in-95">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-extrabold">✓ Safe-Word Verified Successfully!</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                        In an emergency, saying this will immediately trigger full SOS protocols hands-free.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Acoustic Scream & Sensitivity Fallback */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Ear className="w-3.5 h-3.5 text-amber-500" />
                Acoustic Distress & Scream Detection
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                Always-On Fallback
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              If your phone is muffled in a pocket or bag, or speech-to-text is offline, sharp distress screams or loud panic shouts will automatically trigger the SOS protocol.
            </p>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                Acoustic Sensitivity Level:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setVoiceSensitivity(level)}
                    className={`py-2 px-3 rounded-xl border text-center text-xs font-bold capitalize transition ${
                      voiceSensitivity === level
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span>{level}</span>
                    <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                      {level === 'high' ? 'Normal shout' : level === 'medium' ? 'Loud scream' : 'Extreme screech'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Practical Emergency Scenarios Card */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              When to use Voice Safe-Word Activation:
            </span>
            <ul className="list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
              <li><strong>Hands Restrained or Pinned:</strong> Utter your safe-word clearly to notify authorities and loved ones.</li>
              <li><strong>Phone Mounted in Car / Driving:</strong> Trigger emergency without taking hands off the steering wheel.</li>
              <li><strong>Discreet Attacker Scenario:</strong> Choose a covert phrase like <em>"Blue Sky"</em> with Silent Mode enabled.</li>
              <li><strong>Nightstand or Desk Reach:</strong> Shouting your safe-word triggers help even from across the room.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current Safe-Word: <span className="font-bold text-slate-900 dark:text-white font-mono">"{safeWord}"</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isTestVoiceMode) {
                stopVoiceListening();
              }
              setActiveModal(null);
            }}
            className="min-h-[44px] px-5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
