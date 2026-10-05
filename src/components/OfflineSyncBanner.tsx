import React, { useState, useEffect } from 'react';
import { offlineSyncService, QueuedSosAlert } from '../services/offlineSyncService';
import { triggerHaptic } from '../services/api';
import {
  WifiOff,
  Wifi,
  Share2,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Send,
  MessageSquare
} from 'lucide-react';

interface OfflineSyncBannerProps {
  isOnline: boolean;
  className?: string;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({
  isOnline,
  className = ''
}) => {
  const [pendingAlerts, setPendingAlerts] = useState<QueuedSosAlert[]>([]);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<string | null>(null);
  const [justReconnected, setJustReconnected] = useState<boolean>(false);

  // Subscribe to queue changes
  useEffect(() => {
    const unsub = offlineSyncService.onPendingAlertsChange((alerts) => {
      setPendingAlerts(alerts);
    });

    const handleReconnected = () => {
      setJustReconnected(true);
      triggerHaptic([150, 80, 150]);
    };

    window.addEventListener('kawach-sos-reconnected-ready', handleReconnected);

    return () => {
      unsub();
      window.removeEventListener('kawach-sos-reconnected-ready', handleReconnected);
    };
  }, []);

  // When coming back online with pending alerts, highlight reconnection
  useEffect(() => {
    if (isOnline && pendingAlerts.length > 0) {
      setJustReconnected(true);
    }
  }, [isOnline, pendingAlerts.length]);

  if (pendingAlerts.length === 0) {
    return null;
  }

  const primaryAlert = pendingAlerts[0];

  const handleShareNow = async () => {
    if (!primaryAlert || isDispatching) return;
    setIsDispatching(true);
    setDispatchResult(null);
    triggerHaptic(60);

    try {
      const res = await offlineSyncService.dispatchViaWebShare(primaryAlert);
      if (res.success) {
        setDispatchResult(`✅ SOS alert dispatched via ${res.method === 'web_share' ? 'Web Share' : 'Direct SMS'}!`);
        triggerHaptic([100, 50, 100]);
        setTimeout(() => {
          setDispatchResult(null);
          setJustReconnected(false);
        }, 5000);
      } else if (res.error) {
        setDispatchResult(`Notice: ${res.error}`);
        setTimeout(() => setDispatchResult(null), 4000);
      }
    } catch {
      setDispatchResult('Dispatch error. Please try again.');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDismissAll = async () => {
    if (confirm('Dismiss pending offline SOS alerts?')) {
      await offlineSyncService.clearAllAlerts();
      setPendingAlerts([]);
      setJustReconnected(false);
    }
  };

  return (
    <div className={`w-full z-40 transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${className}`}>
      {/* Reconnected State: High-priority Web Share Dispatch Prompt */}
      {isOnline ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-500 shadow-2xl text-white space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30 animate-pulse">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-200 flex items-center gap-2 flex-wrap">
                  <span>Network Restored: Queued SOS Alert Ready!</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 font-bold border border-emerald-600">
                    {pendingAlerts.length} Queued
                  </span>
                </h4>
                <p className="text-[11px] sm:text-xs text-emerald-300/90 leading-snug mt-0.5">
                  Your device was offline when SOS triggered. Tap below to send your live location and distress message immediately via Web Share.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismissAll}
              className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-900 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {dispatchResult && (
            <div className="p-2 rounded-xl bg-emerald-900/60 border border-emerald-500 text-xs font-semibold text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{dispatchResult}</span>
            </div>
          )}

          {/* Action Button: Web Share Trigger */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={handleShareNow}
              disabled={isDispatching}
              className="flex-1 min-h-[46px] px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-98 transition"
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Launching Web Share Sheet...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share SOS Alert Now (Web Share API)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDismissAll}
              className="min-h-[44px] px-3 rounded-xl bg-emerald-900/60 hover:bg-emerald-900 text-emerald-200 text-xs font-semibold flex items-center justify-center gap-1 border border-emerald-700/50 transition"
            >
              <span>Dismiss</span>
            </button>
          </div>
        </div>
      ) : (
        /* Offline State: Reassuring Queued Status in Background Sync */
        <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-950/90 border border-amber-600/80 shadow-xl text-amber-100 space-y-2.5">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 animate-pulse">
                <WifiOff className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1.5 flex-wrap">
                  <span>Device Offline: SOS Alert Queued in Background Sync</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900 text-amber-300 font-bold border border-amber-700">
                    {pendingAlerts.length} Pending
                  </span>
                </h4>
                <p className="text-[11px] text-amber-300/90 leading-tight mt-0.5">
                  Service Worker background sync is monitoring connectivity. Your alert will prompt for immediate transmission via Web Share the moment signal returns.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismissAll}
              className="p-1 rounded-lg text-amber-400 hover:text-white transition"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleShareNow}
              className="flex-1 min-h-[38px] px-3 rounded-xl bg-amber-800/80 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-amber-600 active:scale-98 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send via Native SMS / WhatsApp Now</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
