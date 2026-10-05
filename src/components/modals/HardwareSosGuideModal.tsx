import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Power,
  Smartphone,
  Sliders,
  Lock,
  PhoneCall,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export const HardwareSosGuideModal: React.FC = () => {
  const { activeModal, setActiveModal, triggerSOSInitiation } = useApp();

  if (activeModal !== 'hardware_sos_guide') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Power className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Hardware & Power Button Guide
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Android & iOS System Integration
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

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Real-time Device Triggers */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Live Hardware Triggers Active</span>
            </div>
            <ul className="text-[11px] text-emerald-700 dark:text-emerald-300/90 space-y-1 list-disc list-inside">
              <li><b>Shake-to-SOS:</b> Shake your phone vigorously 3 times to initiate emergency dispatch.</li>
              <li><b>Emergency Hotkey:</b> Press <b>Ctrl + Shift + S</b> or triple-tap <b>Escape</b> anytime.</li>
            </ul>
          </div>

          {/* Quick Hardware Simulator */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Simulate Power Button 5-Tap
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tests immediate SOS sequence as if triggered by hardware
              </p>
            </div>
            <button
              onClick={() => {
                setActiveModal(null);
                triggerSOSInitiation('hardware_power_button');
              }}
              className="min-h-[40px] px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm active:scale-95 transition"
            >
              Test Hardware SOS
            </button>
          </div>

          {/* Android Step-by-Step Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Android OS Setup Steps (India 112 Standard)
            </h3>

            {/* 1. Power Button 5-Click */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Power className="w-4 h-4 text-amber-500" />
                <span>1. Power Button Rapid 5-Press (Emergency SOS)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Go to <b>Settings → Safety & Emergency → Emergency SOS</b>. Toggle ON. Under "Call emergency services", ensure <b>112</b> is selected.
              </p>
            </div>

            {/* 2. Quick Settings Tile */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>2. Quick Settings Notification Tile</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Swipe down twice from the top of your screen, tap the pencil (Edit) icon, and drag the <b>HER-SAFE Emergency Tile</b> into your top quick settings.
              </p>
            </div>

            {/* 3. Lock Screen Emergency Shortcut */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Lock className="w-4 h-4 text-emerald-500" />
                <span>3. Lock Screen Emergency Dialer</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Even without unlocking your phone, tap <b>Emergency Call</b> on the lock screen to directly dial 112 or view your Medical ID notes.
              </p>
            </div>

            {/* 4. PWA Installation */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                <Smartphone className="w-4 h-4 text-purple-500" />
                <span>4. Home Screen Shortcut (Install App)</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Tap <b>Add to Home Screen</b> in your browser menu to pin the HER-SAFE icon directly next to your phone dialer for 1-tap access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
