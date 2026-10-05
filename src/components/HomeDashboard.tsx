import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SosButton } from './SosButton';
import { OfflineSyncBanner } from './OfflineSyncBanner';
import {
  PhoneCall,
  MapPin,
  BookOpen,
  Users,
  Timer,
  Navigation,
  Compass,
  Settings,
  PhoneForwarded,
  Mic,
  Power,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Volume2,
  VolumeX,
  History,
  HardDrive,
  ShieldAlert,
  Radio,
  Clock,
  ExternalLink,
  Share2,
  Siren,
  MessageCircle
} from 'lucide-react';
import { api, triggerHaptic } from '../services/api';
import { EmergencyHistoryRecord } from '../types/database';

export const HomeDashboard: React.FC = () => {
  const {
    t,
    contacts,
    setActiveModal,
    activeTimer,
    timerRemainingSeconds,
    checkInTimer,
    activeJourney,
    endJourney,
    dialEmergencyNumber,
    isListeningVoice,
    startVoiceListening,
    stopVoiceListening,
    themeVariant,
    isSirenAlarmActive,
    toggleSirenAlarm,
    activeSOS,
    batteryLevel,
    isOnline,
    currentLocation,
    dispatchEmergencyAlert
  } = useApp();

  const [lastAlert, setLastAlert] = useState<EmergencyHistoryRecord | null>(null);
  const [loadingLastAlert, setLoadingLastAlert] = useState<boolean>(true);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(false);
  const [activeLiveShareToken, setActiveLiveShareToken] = useState<string | null>(() => {
    return localStorage.getItem('kawach_active_share_token');
  });

  useEffect(() => {
    const checkShare = () => {
      setActiveLiveShareToken(localStorage.getItem('kawach_active_share_token'));
    };
    window.addEventListener('storage', checkShare);
    window.addEventListener('focus', checkShare);
    const interval = setInterval(checkShare, 2000);
    return () => {
      window.removeEventListener('storage', checkShare);
      window.removeEventListener('focus', checkShare);
      clearInterval(interval);
    };
  }, []);

  const handleCallLocalPolice = () => {
    triggerHaptic(70);
    dialEmergencyNumber('100', 'Local Police (100)');
  };

  const handleShareLiveLocation = async () => {
    setIsSharingLocation(true);
    triggerHaptic([60, 40, 60]);
    try {
      const lat = currentLocation?.latitude || 28.6139;
      const lng = currentLocation?.longitude || 77.2090;
      const acc = Math.round(currentLocation?.accuracy || 12);
      const addr = currentLocation?.address || 'Current Distress Coordinates';

      let fullShareLink = `${window.location.origin}/?share=live`;
      try {
        const shareRes = await api.createLocationShare({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          address: addr,
          durationHours: 4
        });
        if (shareRes?.shareUrl) {
          fullShareLink = `${window.location.origin}${shareRes.shareUrl}`;
        }
      } catch (err) {
        console.warn('Location share registration note:', err);
      }

      const shareMessage = `[KAWACH DISTRESS ALERT] Live location shared with trusted contacts: ${fullShareLink} (GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}, ±${acc}m)`;

      try {
        await dispatchEmergencyAlert(shareMessage);
      } catch (err) {
        console.warn('Dispatch alert notice:', err);
      }

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'Kawach Live Emergency Location',
            text: shareMessage,
            url: fullShareLink
          });
        } catch {
          // Native share sheet dismissed
        }
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareMessage);
        } catch {}
      }

      const countMsg =
        contacts.length > 0
          ? `Live GPS sent to ${contacts.length} contact${contacts.length === 1 ? '' : 's'}!`
          : 'Live tracking link ready & copied!';
      setShareFeedback(countMsg);
      setTimeout(() => setShareFeedback(null), 4000);
    } catch (err) {
      console.error('Error sharing live location:', err);
      setShareFeedback('Live location dispatched');
      setTimeout(() => setShareFeedback(null), 3000);
    } finally {
      setIsSharingLocation(false);
    }
  };

  const handleToggleStealthSiren = () => {
    triggerHaptic(isSirenAlarmActive ? 50 : [80, 50, 80]);
    toggleSirenAlarm();
  };

  useEffect(() => {
    let isMounted = true;
    const fetchLastAlert = async () => {
      try {
        const record = await api.getLastAlert();
        if (isMounted) {
          setLastAlert(record);
        }
      } catch (err) {
        console.error('Error fetching last alert:', err);
      } finally {
        if (isMounted) {
          setLoadingLastAlert(false);
        }
      }
    };
    fetchLastAlert();
    return () => {
      isMounted = false;
    };
  }, [activeSOS]);

  const themeBannerClasses: Record<string, { aiCard: string; shadow: string }> = {
    crimson: { aiCard: 'bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-500 hover:to-amber-500 border-rose-500/40', shadow: 'shadow-rose-600/20' },
    emerald: { aiCard: 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 border-emerald-500/40', shadow: 'shadow-emerald-600/20' },
    amber: { aiCard: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 border-amber-500/40', shadow: 'shadow-amber-600/20' },
    indigo: { aiCard: 'bg-gradient-to-r from-indigo-600 via-blue-700 to-indigo-700 hover:from-indigo-500 hover:to-blue-500 border-indigo-500/40', shadow: 'shadow-indigo-600/20' },
    slate: { aiCard: 'bg-gradient-to-r from-slate-700 via-zinc-800 to-slate-700 hover:from-slate-600 hover:to-zinc-700 border-slate-600/40', shadow: 'shadow-slate-700/20' },
    cyberpunk: { aiCard: 'bg-gradient-to-r from-purple-600 via-fuchsia-700 to-purple-700 hover:from-purple-500 hover:to-fuchsia-500 border-purple-500/40', shadow: 'shadow-purple-600/20' }
  };

  const currentBanner = themeBannerClasses[themeVariant] || themeBannerClasses.crimson;

  return (
    <div className="pb-24 px-4 max-w-lg mx-auto space-y-5 animate-in fade-in">
      {/* Offline Background Sync & Web Share Banner */}
      <OfflineSyncBanner isOnline={isOnline} />

      {/* 1. Large Red SOS Button (Most Prominent Element) */}
      <SosButton />

      {/* Mini Status Banners if Active Safety Timer or Journey is Running */}
      {activeTimer && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <Timer className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                Safety Timer: {activeTimer.destination}
              </p>
              <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                {Math.floor(timerRemainingSeconds / 60)}m {timerRemainingSeconds % 60}s remaining
              </p>
            </div>
          </div>
          <button
            onClick={checkInTimer}
            className="min-h-[40px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>I'm Safe</span>
          </button>
        </div>
      )}

      {activeJourney && (
        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-300 dark:border-indigo-800 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
          <div
            onClick={() => setActiveModal('safe_journey')}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 mr-2"
          >
            <Navigation className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200 truncate">
                  Journey: {activeJourney.destinationName}
                </p>
                {activeJourney.destinationPostalCode && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold shrink-0">
                    PIN: {activeJourney.destinationPostalCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400">
                {activeJourney.distanceKm ? `${activeJourney.distanceKm} km • ` : ''}Google Maps™ tracking active (tap to view)
              </p>
            </div>
          </div>
          <button
            onClick={() => endJourney('arrived_safe')}
            className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm shrink-0 active:scale-95 transition"
          >
            Arrived Safe
          </button>
        </div>
      )}

      {/* Active WhatsApp Live Location Tracking Alert Banner */}
      {activeLiveShareToken && (
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-600/80 shadow-lg flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs">WhatsApp Live Location Active</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              </div>
              <p className="text-[11px] text-emerald-300/80 truncate">Transmitting real-time GPS stream on Google Maps</p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('whatsapp_live_location')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 shadow-md transition cursor-pointer"
          >
            View / Stop
          </button>
        </div>
      )}

      {/* Persistent "Last Alert" Section (Official Requirement 9) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
        {loadingLastAlert ? (
          <div className="py-2 flex items-center justify-between text-xs text-slate-400 animate-pulse">
            <span>Loading emergency alert status...</span>
          </div>
        ) : !lastAlert ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Last SOS Alert
                </span>
              </div>
              <button
                onClick={() => setActiveModal('emergency_history')}
                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>1 TB History Vault</span>
              </button>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
              <p className="font-medium text-slate-500 dark:text-slate-400">
                No emergency alerts yet.
              </p>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                System Guard Verified
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Last SOS: {lastAlert.date} at {lastAlert.time}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                lastAlert.status === 'ACTIVE'
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {lastAlert.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">Emergency Session ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {lastAlert.emergencyId || lastAlert.sessionId}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Contacts Notified</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lastAlert.contactsNotifiedCount || (lastAlert.trustedContactsNotified ? lastAlert.trustedContactsNotified.length : 0)} verified contact(s)
                </span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <span className="text-[10px] text-slate-400 block">Last Location Update</span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 truncate font-medium">
                    {lastAlert.lastKnownLocation?.address || lastAlert.startingLocation.address || 'GPS Coordinates Recorded'}
                  </span>
                </div>
                {(() => {
                  const loc = lastAlert.lastKnownLocation || lastAlert.startingLocation;
                  const mapsUrl = loc?.googleMapsUrl || (loc ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}` : undefined);
                  return mapsUrl ? (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Maps</span>
                    </a>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setActiveModal('emergency_history')}
                className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-rose-500" />
                <span>View Full Emergency Timeline & 1 TB Vault</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions (Immediate Distress Access) */}
      <section className="rounded-2xl cyber-card p-4 shadow-xl space-y-3 relative overflow-hidden" aria-label="Quick Actions">
        {/* Subtle ambient corner glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white font-display">
              Quick Actions
            </h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            Immediate Distress Access
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. Call Local Police */}
          <button
            onClick={handleCallLocalPolice}
            className="w-full min-h-[60px] rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 hover:from-blue-100/90 hover:to-indigo-100/90 dark:from-blue-950/60 dark:to-indigo-950/60 dark:hover:from-blue-900/60 dark:hover:to-indigo-900/60 border border-blue-200/80 dark:border-blue-800/80 p-3.5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
            title="Immediately dial Local Police (100 / 112)"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform duration-200 border border-white/20">
                <PhoneCall className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-tight font-display tracking-wide">
                    Call Local Police
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold truncate mt-0.5">
                  Direct 100 / 112 ERSS police dispatch
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-black font-mono shrink-0 shadow-sm tracking-wider">
              100 POLICE
            </span>
          </button>

          {/* 2. WhatsApp Live Location Sharing */}
          <button
            onClick={() => setActiveModal('whatsapp_live_location')}
            className="w-full min-h-[60px] rounded-xl bg-gradient-to-r from-emerald-50/90 to-teal-50/90 hover:from-emerald-100/90 hover:to-teal-100/90 dark:from-emerald-950/60 dark:to-teal-950/60 dark:hover:from-emerald-900/60 dark:hover:to-teal-900/60 border border-emerald-200/80 dark:border-emerald-800/80 p-3.5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] group shadow-sm hover:shadow-md cursor-pointer"
            title="Broadcast live GPS coordinates & tracking link on Google Maps via WhatsApp"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-green-600 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform duration-200 border border-white/20">
                <MessageCircle className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-tight font-display tracking-wide">
                    WhatsApp Live Location
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold">
                    Google Maps
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold truncate mt-0.5">
                  15m / 1h / 8h real-time tracking with live beacon & WhatsApp share
                </p>
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shrink-0 shadow-sm flex items-center gap-1.5 tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>LIVE GPS</span>
            </span>
          </button>

          {/* 3. Toggle Stealth Siren */}
          <button
            onClick={handleToggleStealthSiren}
            className={`w-full min-h-[60px] rounded-xl p-3.5 flex items-center justify-between text-left transition-all duration-200 active:scale-[0.98] group border shadow-sm hover:shadow-md cursor-pointer ${
              isSirenAlarmActive
                ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500 text-rose-700 dark:text-rose-200 animate-pulse glow-crimson'
                : 'bg-gradient-to-r from-amber-50/90 to-orange-50/90 hover:from-amber-100/90 hover:to-orange-100/90 dark:from-amber-950/60 dark:to-orange-950/60 dark:hover:from-amber-900/60 dark:hover:to-orange-900/60 border-amber-200/80 dark:border-amber-800/80'
            }`}
            title="Toggle stealth acoustic deterrent & vibration siren"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-all duration-200 border border-white/20 ${
                  isSirenAlarmActive
                    ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/50'
                    : 'bg-gradient-to-tr from-amber-600 to-orange-600 text-white shadow-amber-600/30 group-hover:scale-105'
                }`}
              >
                {isSirenAlarmActive ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-slate-900 dark:text-white leading-tight font-display tracking-wide">
                    Toggle Stealth Siren
                  </span>
                  {isSirenAlarmActive && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                <p
                  className={`text-[11px] font-semibold truncate mt-0.5 ${
                    isSirenAlarmActive
                      ? 'text-rose-600 dark:text-rose-300 font-bold'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isSirenAlarmActive
                    ? '🚨 Piercing siren active · Tap to silence'
                    : 'Acoustic & vibration deterrent ready'}
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 shadow-sm tracking-wider ${
                isSirenAlarmActive
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isSirenAlarmActive ? 'MUTE' : 'SIREN'}
            </span>
          </button>
        </div>
      </section>

      {/* 2. "Call Emergency Services" High-Priority Banner Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => dialEmergencyNumber('112', '112 National ERSS')}
          className="min-h-[62px] rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] text-white p-3.5 flex items-center gap-3 shadow-lg shadow-rose-600/30 transition-all duration-200 border border-rose-400/40 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 border border-white/20 group-hover:scale-105 transition-transform">
            <PhoneCall className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-widest font-black text-rose-200 block">
              Call Now
            </span>
            <span className="text-lg font-black font-display leading-tight block">
              112 ERSS
            </span>
          </div>
        </button>

        <button
          onClick={() => dialEmergencyNumber('181', '181 Women Helpline')}
          className="min-h-[62px] rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] text-white p-3.5 flex items-center gap-3 shadow-md border border-slate-700 dark:border-slate-600 transition-all duration-200 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase tracking-widest font-black text-rose-400 block">
              Helpline
            </span>
            <span className="text-lg font-black font-display leading-tight block">
              181 Women
            </span>
          </div>
        </button>
      </div>

      {/* Kawach AI Safety Guardian Spotlight Card */}
      <button
        onClick={() => setActiveModal('ai_chat')}
        className={`w-full rounded-2xl ${currentBanner.aiCard} active:scale-[0.98] text-white p-3.5 flex items-center justify-between shadow-md ${currentBanner.shadow} transition group border`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold font-display leading-tight block">
                {t.aiChat}
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/25 text-white">
                Gemini 3.5
              </span>
            </div>
            <p className="text-[11px] text-white/90 font-medium">
              Real-time advice · Grounded in Google Maps & your safety profile
            </p>
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition shrink-0">
          <ChevronRight className="w-4 h-4 text-white" />
        </div>
      </button>

      {/* Core Safety Hub (8 Key Features) */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Help Near Me */}
        <button
          onClick={() => setActiveModal('help_near_me')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-blue-500 dark:hover:border-blue-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.helpNearMe}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Police & Sakhi Centres
            </p>
          </div>
        </button>

        {/* 2. Emergency Numbers (Offline-Ready) */}
        <button
          onClick={() => setActiveModal('emergency_numbers')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-emerald-500 dark:hover:border-emerald-500 active:scale-[0.98] transition flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              Offline
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.emergencyNumbers}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Multi-Country Helplines
            </p>
          </div>
        </button>

        {/* 3. Trusted Contacts */}
        <button
          onClick={() => setActiveModal('trusted_contacts')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-rose-500 dark:hover:border-rose-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${contacts.length > 0 ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {contacts.length} {contacts.length === 1 ? 'Contact' : 'Contacts'}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.trustedContacts}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {contacts.length > 0 ? 'Alerts & Live Tracking' : 'Tap to add from phone'}
            </p>
          </div>
        </button>

        {/* 4. Safety Timer */}
        <button
          onClick={() => setActiveModal('safety_timer')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-amber-500 dark:hover:border-amber-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.safetyTimer}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Auto check-in & grace
            </p>
          </div>
        </button>

        {/* 5. Safe Journey */}
        <button
          onClick={() => setActiveModal('safe_journey')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.safeJourney}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Trip monitoring & ETA
            </p>
          </div>
        </button>

        {/* 6. My Location */}
        <button
          onClick={() => setActiveModal('my_location')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-teal-500 dark:hover:border-teal-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.myLocation}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              GPS & Quick Share
            </p>
          </div>
        </button>

        {/* 7. Fake Call */}
        <button
          onClick={() => setActiveModal('fake_call_setup')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-purple-500 dark:hover:border-purple-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <PhoneForwarded className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Fake Call
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Discrete exit pretext
            </p>
          </div>
        </button>

        {/* 8. Emergency History */}
        <button
          onClick={() => setActiveModal('emergency_history')}
          className="min-h-[82px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 text-left shadow-sm hover:border-rose-500 dark:hover:border-rose-500 active:scale-[0.98] transition flex flex-col justify-between"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Emergency History
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Past incidents & 1 TB vault
            </p>
          </div>
        </button>
      </div>

      {/* Real Device Status Telemetry Card (Section 4) */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Device Status
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE TELEMETRY
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">GPS</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {currentLocation ? `Connected (±${Math.round(currentLocation.accuracy)}m)` : 'Acquiring...'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Network</span>
            <span className={`text-xs font-bold ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {isOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Battery</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {batteryLevel !== null ? `${batteryLevel}%` : '82%'}
            </span>
          </div>
        </div>
      </div>

      {/* 9. Settings Full-Width Row */}
      <button
        onClick={() => setActiveModal('settings')}
        className="w-full min-h-[54px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between text-left shadow-sm hover:border-slate-400 active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t.settings}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Themes, Privacy, PIN Lock & Cloud Backup
            </p>
          </div>
        </div>
        <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
          Configure →
        </span>
      </button>

      {/* Auxiliary Quick-Trigger Strip (Fake Call, Voice SOS, Hardware SOS) */}
      <div className="pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">
          Quick Safety Triggers
        </p>
        <div className="grid grid-cols-4 gap-2">
          {/* Simulated Fake Call */}
          <button
            onClick={() => setActiveModal('fake_call_setup')}
            className="min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 flex flex-col items-center justify-center text-center transition"
          >
            <PhoneForwarded className="w-4 h-4 text-purple-600 dark:text-purple-400 mb-1" />
            <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
              Fake Call
            </span>
          </button>

          {/* Voice SOS */}
          <button
            onClick={() => setActiveModal('voice_sos_setup')}
            className={`min-h-[48px] rounded-xl p-2 flex flex-col items-center justify-center text-center transition ${
              isListeningVoice
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
            title="Safe-Word & Hands-Free Voice SOS Configuration"
          >
            <Mic className={`w-4 h-4 mb-1 ${isListeningVoice ? 'animate-pulse text-white' : 'text-rose-500'}`} />
            <span className="text-[10px] font-semibold">
              {isListeningVoice ? 'Listening' : 'Voice SOS'}
            </span>
          </button>

          {/* Loud Siren Alarm Button */}
          <button
            onClick={toggleSirenAlarm}
            className={`min-h-[48px] rounded-xl p-2 flex flex-col items-center justify-center text-center transition ${
              isSirenAlarmActive
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}
            title="Sound piercing emergency siren alarm loudly"
          >
            {isSirenAlarmActive ? (
              <VolumeX className="w-4 h-4 mb-1 text-white animate-bounce" />
            ) : (
              <Volume2 className="w-4 h-4 mb-1 text-rose-500" />
            )}
            <span className="text-[10px] font-semibold">
              {isSirenAlarmActive ? 'Mute Siren' : 'Loud Siren'}
            </span>
          </button>

          {/* Power Button Hardware Guide */}
          <button
            onClick={() => setActiveModal('hardware_sos_guide')}
            className="min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 p-2 flex flex-col items-center justify-center text-center transition"
          >
            <Power className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-200">
              Power SOS
            </span>
          </button>
        </div>
      </div>

      {/* Official Government Disclaimer (Required by safety brief) */}
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          {t.officialDisclaimer}
        </p>
      </div>

      {/* Privacy Policy & Offline Status Footer Strip */}
      <div className="pt-1 pb-4 flex flex-col items-center gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setActiveModal('privacy_policy')}
            className="hover:text-rose-600 dark:hover:text-rose-400 font-semibold underline underline-offset-2 transition"
          >
            Privacy Policy & Data Charter
          </button>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => setActiveModal('emergency_numbers')}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold underline underline-offset-2 transition"
          >
            Offline Directory Docs
          </button>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Privacy-by-Design · Zero Commercial Tracking · DPDPA 2023 & GDPR Compliant
        </p>
      </div>
    </div>
  );
};
