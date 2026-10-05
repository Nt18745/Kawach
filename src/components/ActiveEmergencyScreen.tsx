import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { notifications } from '../services/notifications';
import { tileCacheService } from '../services/tileCacheService';
import { api } from '../services/api';
import { EmergencyFacility } from '../types/database';
import { InteractiveMap } from './InteractiveMap';
import { OfflineSyncBanner } from './OfflineSyncBanner';
import {
  AlertTriangle,
  PhoneCall,
  Share2,
  MapPin,
  XCircle,
  Radio,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Copy,
  ExternalLink,
  MessageSquare,
  Volume2,
  VolumeX,
  Mic,
  WifiOff,
  Compass,
  ChevronDown,
  ChevronUp,
  Database
} from 'lucide-react';

export const ActiveEmergencyScreen: React.FC = () => {
  const {
    activeSOS,
    cancelActiveSOS,
    currentLocation,
    t,
    contacts,
    setActiveModal,
    isSirenAlarmActive,
    toggleSirenAlarm,
    safeWord,
    isOnline
  } = useApp();

  const [confirmCancelModal, setConfirmCancelModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [showInlineMap, setShowInlineMap] = useState<boolean>(false);
  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(null);
  const [cachedTileCount, setCachedTileCount] = useState<number>(0);

  // Auto-cache map tiles around current location for offline emergency navigation
  useEffect(() => {
    if (currentLocation?.latitude && currentLocation?.longitude) {
      tileCacheService.cacheArea(
        currentLocation.latitude,
        currentLocation.longitude,
        2.5,
        13,
        16
      ).then(() => {
        tileCacheService.getCacheStats().then(s => setCachedTileCount(s.count));
      });

      api.getNearbyFacilities(currentLocation.latitude, currentLocation.longitude, 'all', 25)
        .then(facs => {
          setFacilities(facs);
          if (facs && facs.length > 0) setSelectedFacility(facs[0]);
        })
        .catch(() => {});
    }
  }, [currentLocation?.latitude, currentLocation?.longitude]);

  // Read initial cache count
  useEffect(() => {
    tileCacheService.getCacheStats().then(s => setCachedTileCount(s.count));
  }, []);

  if (!activeSOS || activeSOS.status !== 'active') {
    return null;
  }

  const startTime = new Date(activeSOS.startedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const shareUrl = `${window.location.origin}/?share=${activeSOS.shareToken}`;

  const handleShareLocation = async () => {
    const text = `[HER-SAFE EMERGENCY ALERT] I triggered SOS. Here is my live encrypted location: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HER-SAFE Emergency Live Location',
          text,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to copy or WhatsApp/SMS
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch {}

    // Open WhatsApp link option
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleConfirmCancel = async () => {
    setCancelling(true);
    await cancelActiveSOS('User confirmed safe in UI');
    setCancelling(false);
    setConfirmCancelModal(false);
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 text-white flex flex-col justify-between overflow-y-auto p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Top Emergency Status Header */}
      <div>
        <div className="flex items-center justify-between border-b border-red-900/60 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping" />
            <h2 className="text-xl sm:text-2xl font-black tracking-widest text-red-500 font-display">
              {t.sosActive}
            </h2>
          </div>
          <div className="text-xs font-mono text-red-300 bg-red-950/80 px-2.5 py-1 rounded border border-red-800">
            ID: {activeSOS.id}
          </div>
        </div>

        {/* Offline Background Sync & Web Share Banner */}
        <OfflineSyncBanner isOnline={isOnline} className="mb-4" />

        {/* Triggered via Voice Safe-Word Banner */}
        {(activeSOS.triggerType === 'voice_sos' || activeSOS.triggerType === 'voice_scream') && (
          <div className="p-3 mb-4 rounded-xl bg-purple-950/80 border border-purple-600/70 flex items-center justify-between text-xs text-purple-200 shadow-md">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
              <span>
                Triggered hands-free via <strong>{activeSOS.triggerType === 'voice_scream' ? 'Acoustic Distress Detection' : `Voice Safe-Word ("${safeWord}")`}</strong>
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-900 border border-purple-700 text-purple-300 uppercase">
              Hands-Free
            </span>
          </div>
        )}

        {/* Loud Siren Alarm Control Strip */}
        <div className={`p-4 rounded-2xl mb-4 border flex items-center justify-between shadow-xl transition ${
          isSirenAlarmActive
            ? 'bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-red-500/80 text-white'
            : 'bg-slate-900 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isSirenAlarmActive
                ? 'bg-red-600/30 border-red-500 text-red-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}>
              {isSirenAlarmActive ? <Volume2 className="w-5 h-5 text-red-400 animate-bounce" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 font-display">
                {isSirenAlarmActive ? '🚨 LOUD SIREN ALARM ACTIVE' : '🔇 Siren Alarm Muted'}
                {isSirenAlarmActive && (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-red-600 text-white">
                    MAX SOUND
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-300">
                {isSirenAlarmActive
                  ? 'High-decibel acoustic siren deterrence sounding to scare attackers'
                  : 'Siren silenced. Tap unmute to blare high-decibel alarm.'}
              </p>
            </div>
          </div>

          <button
            onClick={toggleSirenAlarm}
            className={`min-h-[44px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0 ${
              isSirenAlarmActive
                ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-red-800'
                : 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
            }`}
          >
            {isSirenAlarmActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isSirenAlarmActive ? 'Mute Siren' : 'Sound Alarm Loudly'}</span>
          </button>
        </div>

        {/* Core Emergency Session Information Card */}
        <div className="bg-slate-900/90 rounded-2xl p-4 border border-red-800/60 space-y-3.5 shadow-xl">
          {/* Emergency started */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-400" />
              {t.sosStarted}:
            </span>
            <span className="font-bold text-white font-mono text-base">{startTime}</span>
          </div>

          {/* Location status */}
          <div className="flex items-start justify-between text-sm pt-2 border-t border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Location:
            </span>
            <div className="text-right">
              <span className="font-semibold text-emerald-400 block">
                Sharing with {contacts.length} trusted contacts
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {currentLocation ? `±${currentLocation.accuracy}m accuracy` : 'Acquiring GPS...'}
              </span>
            </div>
          </div>

          {/* Emergency service call status */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-blue-400" />
              Emergency service:
            </span>
            <span className="font-semibold text-blue-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              112 Dialed / Ready
            </span>
          </div>

          {/* Trusted contacts notified */}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
            <span className="text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              Trusted contacts:
            </span>
            <span className="font-semibold text-white">
              {(activeSOS.contactsTotalCount || contacts.length) > 0
                ? `${activeSOS.contactsNotifiedCount} of ${activeSOS.contactsTotalCount || contacts.length} notified`
                : 'None configured (Dialing 112)'}
            </span>
          </div>
        </div>

        {/* Live location coordinates strip */}
        <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="font-mono">
              {currentLocation
                ? `${currentLocation.latitude.toFixed(4)}° N, ${currentLocation.longitude.toFixed(4)}° E`
                : 'Safdarjung, New Delhi'}
            </span>
          </div>
          <button
            onClick={() => setActiveModal('my_location')}
            className="text-rose-400 hover:text-rose-300 font-medium underline flex items-center gap-1"
          >
            Details <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Offline Emergency Banner if connection lost */}
        {!isOnline && (
          <div className="mt-3 p-3 rounded-xl bg-amber-950/80 border border-amber-600/70 flex items-center justify-between text-xs text-amber-200 shadow-md">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Offline Emergency Mode:</strong> Internet lost. Serving cached map tiles from local IndexedDB & offline compass active.
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900 text-amber-300 font-bold shrink-0 flex items-center gap-1">
              <Database className="w-3 h-3" />
              IndexedDB
            </span>
          </div>
        )}

        {/* Inline Emergency Map & Offline Navigation Accordion */}
        <div className="mt-3 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <button
            type="button"
            onClick={() => setShowInlineMap(!showInlineMap)}
            className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Emergency Area Map & Navigation</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                <Database className="w-3 h-3 text-cyan-400" />
                {cachedTileCount} tiles (IndexedDB)
              </span>
            </div>
            {showInlineMap ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
          </button>

          {showInlineMap && (
            <div className="p-3 pt-0 border-t border-slate-800">
              <InteractiveMap
                userLocation={currentLocation}
                facilities={facilities}
                selectedFacility={selectedFacility}
                onSelectFacility={setSelectedFacility}
                className="h-64 w-full rounded-xl overflow-hidden border border-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Zone */}
      <div className="mt-6 space-y-3">
        {/* [CALL 112] */}
        <a
          href="tel:112"
          className="w-full min-h-[54px] rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 active:scale-98 transition"
        >
          <PhoneCall className="w-6 h-6" />
          <span>{t.call112}</span>
        </a>

        {/* 2-Column Action Grid: [SHARE LOCATION] & [VIEW MAP] */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleShareLocation}
            className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition"
          >
            {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-rose-400" />}
            <span>{copiedLink ? 'Link Copied' : t.shareLocation}</span>
          </button>

          <button
            onClick={() => setActiveModal('help_near_me')}
            className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 active:scale-95 transition"
          >
            <MapPin className="w-4 h-4 text-blue-400" />
            <span>{t.viewMap}</span>
          </button>
        </div>

        {/* 2-Column Action Grid: [OPEN SMS APP] & [WHATSAPP] */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={notifications.generateSmsUri(
              contacts.map(c => c.phone),
              `HER-SAFE SOS: Urgent safety help needed! Live GPS location: ${shareUrl}`
            )}
            className="min-h-[48px] rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open SMS App</span>
          </a>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(`[HER-SAFE EMERGENCY ALERT] I triggered SOS. Here is my live encrypted location: ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp Alert</span>
          </a>
        </div>

        {/* [CANCEL SOS] */}
        <button
          onClick={() => setConfirmCancelModal(true)}
          className="w-full min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 border border-slate-800 active:scale-95 transition"
        >
          <XCircle className="w-4 h-4 text-rose-500" />
          <span>{t.cancelSos}</span>
        </button>
      </div>

      {/* Confirmation Modal to avoid accidental SOS cancellation */}
      {confirmCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              {t.confirmCancel}
            </h3>
            <p className="text-xs text-slate-300">
              {contacts.length > 0
                ? `Cancelling will end live location tracking and notify your ${contacts.length} trusted contacts that you are safe.`
                : 'Cancelling will end live emergency tracking and close the emergency session.'}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmCancelModal(false)}
                className="min-h-[44px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Keep SOS Active
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"
              >
                {cancelling ? 'Sending All-Clear...' : t.safeConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
