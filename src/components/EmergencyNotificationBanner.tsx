import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  Share2,
  PhoneCall,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertOctagon
} from 'lucide-react';

export const EmergencyNotificationBanner: React.FC = () => {
  const {
    activeSOS,
    contacts,
    currentLocation,
    user,
    lastDispatchedNotification,
    clearNotificationBanner,
    discreetAlertBanner,
    dismissDiscreetAlertBanner
  } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(false);

  // Show if active SOS is ongoing, notification dispatched, or discreet confirmation banner active
  if (!activeSOS && !lastDispatchedNotification && !discreetAlertBanner) {
    return null;
  }

  const shareToken = activeSOS?.shareToken || lastDispatchedNotification?.shareToken;
  const shareUrl = shareToken
    ? `${window.location.origin}/?share=${shareToken}`
    : `${window.location.origin}/?share=live`;

  const recipients = contacts.length > 0
    ? contacts
    : (user?.phone ? [{ id: 'usr-phone', name: user.name || 'Emergency Contact', phone: user.phone }] : []);

  const handleOpenSms = () => {
    if (lastDispatchedNotification?.smsUrl) {
      window.location.href = lastDispatchedNotification.smsUrl;
      return;
    }
    const phones = recipients.map(c => c.phone.replace(/[^\d+]/g, '')).join(',');
    const text = `🚨 [KAWACH EMERGENCY ALERT] I need immediate help! Live Location: ${shareUrl}`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.location.href = `sms:${phones}${isIOS ? '&' : '?'}body=${encodeURIComponent(text)}`;
  };

  const handleOpenWhatsApp = () => {
    const text = `🚨 *[KAWACH EMERGENCY ALERT]*\nI have triggered an emergency SOS! I need immediate help.\n📍 Live GPS Tracking: ${shareUrl}\nCall 112 ERSS if I do not answer.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none animate-in slide-in-from-top duration-300">
      {/* Discreet Visual Confirmation: "Emergency alert sent." */}
      {discreetAlertBanner && (
        <div className="max-w-lg mx-auto pointer-events-auto bg-slate-950/95 border-2 border-emerald-500/80 rounded-2xl shadow-2xl backdrop-blur-md text-white p-3 mb-2 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-emerald-300">
                {discreetAlertBanner.message}
              </p>
              <p className="text-[11px] text-slate-300">
                Discreet confirmation &bull; {discreetAlertBanner.timestamp} &bull; Silent mode active on this phone
              </p>
            </div>
          </div>
          <button
            onClick={dismissDiscreetAlertBanner}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
            aria-label="Dismiss alert confirmation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {(activeSOS || lastDispatchedNotification) && (
      <div className="max-w-lg mx-auto pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 border-2 border-red-600/90 rounded-2xl shadow-2xl backdrop-blur-md text-white overflow-hidden">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3.5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <AlertOctagon className="w-4 h-4 text-white" />
              <span className="font-black text-xs uppercase tracking-wider text-white">
                Emergency Alert Dispatched
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition"
              aria-label={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={clearNotificationBanner}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-white/10 transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Banner Body */}
        {!collapsed && (
          <div className="p-3.5 space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  SMS & Cellular alerts transmitted to {recipients.length} contacts
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Live encrypted link active with ±{currentLocation?.accuracy || 15}m GPS accuracy
                </p>
              </div>
            </div>

            {/* Recipient Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
              {recipients.map((c, idx) => {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const pillSmsUrl = `sms:${c.phone.replace(/[^\d+]/g, '')}${isIOS ? '&' : '?'}body=${encodeURIComponent(`🚨 [KAWACH EMERGENCY ALERT] I need immediate help! Live Location: ${shareUrl}`)}`;
                return (
                  <div
                    key={c.id || idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-200 text-[11px] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="font-medium truncate max-w-[110px]">{c.name}</span>
                      <span className="text-slate-400 text-[10px] font-mono">({c.phone})</span>
                    </div>
                    <a
                      href={pillSmsUrl}
                      className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline px-1 py-0.5 rounded hover:bg-slate-700 transition"
                      title={`Send direct emergency SMS to ${c.phone}`}
                    >
                      SMS
                    </a>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons: Open SMS, WhatsApp, Dial 112 */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                onClick={handleOpenSms}
                className="min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Open SMS</span>
              </button>

              <button
                onClick={handleOpenWhatsApp}
                className="min-h-[38px] rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-600 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>WhatsApp</span>
              </button>

              <a
                href="tel:112"
                className="min-h-[38px] rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 112</span>
              </a>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};
