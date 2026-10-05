import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { GoogleLiveMap } from '../GoogleLiveMap';
import { api, triggerHaptic } from '../../services/api';
import { firebaseService } from '../../services/firebaseService';
import {
  X,
  Share2,
  Clock,
  Battery,
  MapPin,
  CheckCircle2,
  Copy,
  ExternalLink,
  Navigation,
  StopCircle,
  MessageCircle,
  Radio,
  Send,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface LiveLocationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveLocationShareModal: React.FC<LiveLocationShareModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, currentLocation, contacts, dispatchEmergencyAlert } = useApp();

  // Duration option: 15m, 60m (1h), 480m (8h)
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [comment, setComment] = useState<string>('');

  // Live session state
  const [activeShareToken, setActiveShareToken] = useState<string | null>(() => {
    return localStorage.getItem('kawach_active_share_token');
  });
  const [activeExpiresAt, setActiveExpiresAt] = useState<string | null>(() => {
    return localStorage.getItem('kawach_active_share_expiry');
  });
  const [timeLeftFormatted, setTimeLeftFormatted] = useState<string>('');
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [isStopping, setIsStopping] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Device telemetry
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [currentSpeed, setCurrentSpeed] = useState<number | undefined>(undefined);
  const [currentHeading, setCurrentHeading] = useState<number | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ latitude: number; longitude: number; timestamp: string; accuracy?: number; speed?: number }>
  >([]);

  const watchIdRef = useRef<number | null>(null);

  // Read Battery API if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setBatteryLevel(Math.round(battery.level * 100));
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(Math.round(battery.level * 100));
        });
      }).catch(() => {});
    }
  }, []);

  // Update speed & heading from geolocation
  useEffect(() => {
    if (currentLocation) {
      if (currentLocation.speed !== null && currentLocation.speed !== undefined) {
        setCurrentSpeed(Math.round(currentLocation.speed * 3.6)); // m/s to km/h
      }
      if (currentLocation.heading !== null && currentLocation.heading !== undefined) {
        setCurrentHeading(currentLocation.heading);
      }
    }
  }, [currentLocation]);

  // Live countdown timer for active session
  useEffect(() => {
    if (!activeExpiresAt) return;

    const tick = () => {
      const remainingMs = new Date(activeExpiresAt).getTime() - Date.now();
      if (remainingMs <= 0) {
        handleStopSharing();
        setTimeLeftFormatted('Expired');
        return;
      }
      const totalSecs = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      if (hours > 0) {
        setTimeLeftFormatted(`${hours}h ${mins}m remaining`);
      } else {
        setTimeLeftFormatted(`${mins}m ${secs < 10 ? '0' : ''}${secs}s remaining`);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeExpiresAt]);

  // Real-time GPS Watcher when live sharing is active
  useEffect(() => {
    if (!activeShareToken) {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = pos.coords.accuracy;
          const spd = pos.coords.speed !== null ? Math.round(pos.coords.speed * 3.6) : undefined;
          const hdg = pos.coords.heading !== null ? Math.round(pos.coords.heading) : undefined;

          setCurrentSpeed(spd);
          setCurrentHeading(hdg);

          const newPoint = {
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
            accuracy: acc,
            speed: spd
          };

          setBreadcrumbs((prev) => [...prev.slice(-49), newPoint]);

          // Update backend
          await api.updateLocationShare(activeShareToken, {
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            batteryLevel,
            speedKmh: spd,
            heading: hdg
          });

          // Update Firestore public_shares
          await firebaseService.updatePublicShareLocation(activeShareToken, {
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            batteryLevel,
            speedKmh: spd,
            heading: hdg
          });
        },
        (err) => console.warn('Live tracking watch note:', err.message),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeShareToken, batteryLevel]);

  if (!isOpen) return null;

  const lat = currentLocation?.latitude || 28.5694;
  const lng = currentLocation?.longitude || 77.2062;
  const acc = currentLocation?.accuracy || 15;
  const address = currentLocation?.address || 'Current Real-Time Location';
  const fullShareUrl = activeShareToken
    ? `${window.location.origin}/?share=${activeShareToken}`
    : '';

  // Start WhatsApp Live Location Sharing
  const handleStartSharing = async () => {
    setIsStarting(true);
    triggerHaptic(50);

    try {
      const res = await api.createLocationShare({
        latitude: lat,
        longitude: lng,
        accuracy: acc,
        address,
        durationMinutes,
        comment: comment.trim() || undefined,
        batteryLevel,
        speedKmh: currentSpeed,
        heading: currentHeading
      });

      if (res && res.shareToken) {
        setActiveShareToken(res.shareToken);
        setActiveExpiresAt(res.expiresAt);
        localStorage.setItem('kawach_active_share_token', res.shareToken);
        localStorage.setItem('kawach_active_share_expiry', res.expiresAt);

        // Also sync to Firestore public_shares
        await firebaseService.createPublicShare({
          shareToken: res.shareToken,
          userId: user?.id || 'usr-anonymous',
          userName: user?.name || 'Kawach User',
          userPhone: user?.phone || '',
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          address,
          batteryLevel,
          speedKmh: currentSpeed,
          heading: currentHeading,
          comment: comment.trim() || undefined,
          expiresAt: res.expiresAt
        });

        const shareUrl = `${window.location.origin}/?share=${res.shareToken}`;
        setFeedback('Live location sharing activated!');
        triggerHaptic([40, 60, 40]);

        // Auto open WhatsApp with the formatted live location message
        shareToWhatsApp(shareUrl, res.expiresAt);
      }
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to start live location sharing.');
    } finally {
      setIsStarting(false);
    }
  };

  // Stop WhatsApp Live Location Sharing
  const handleStopSharing = async () => {
    setIsStopping(true);
    triggerHaptic(80);

    if (activeShareToken) {
      await api.stopLocationShare(activeShareToken);
      await firebaseService.revokePublicShare(activeShareToken);
    }

    if (watchIdRef.current !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setActiveShareToken(null);
    setActiveExpiresAt(null);
    localStorage.removeItem('kawach_active_share_token');
    localStorage.removeItem('kawach_active_share_expiry');
    setBreadcrumbs([]);
    setIsStopping(false);
    setFeedback('Live location sharing stopped.');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Format message & launch WhatsApp
  const shareToWhatsApp = (targetUrl?: string, expiry?: string) => {
    const url = targetUrl || fullShareUrl;
    const durationLabel =
      durationMinutes === 15 ? '15 minutes' : durationMinutes === 480 ? '8 hours' : '1 hour';
    const noteText = comment.trim() ? `\n💬 *Note:* "${comment.trim()}"` : '';
    const battText = batteryLevel ? `\n🔋 *Battery:* ${batteryLevel}%` : '';

    const text = `🟢 *LIVE LOCATION SHARING (KAWACH / WHATSAPP)*\n\nI am sharing my live location with you in real time:\n🔗 ${url}\n\n👤 *Shared by:* ${user?.name || 'Kawach User'}\n⏳ *Duration:* ${durationLabel}${noteText}${battText}\n🗺️ *Google Maps Track:* https://www.google.com/maps/search/?api=1&query=${lat},${lng}\n\n_Updates continuously while I move. Tap link to view live on Google Maps._`;

    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  // Copy Link to Clipboard
  const handleCopyLink = () => {
    if (!fullShareUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      setFeedback('Live location link copied to clipboard!');
      triggerHaptic(40);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Native Device Share (Android / iOS)
  const handleNativeShare = async () => {
    if (!fullShareUrl) return;
    const durationLabel =
      durationMinutes === 15 ? '15 minutes' : durationMinutes === 480 ? '8 hours' : '1 hour';
    const shareData = {
      title: `${user?.name || 'Kawach'} Live Location`,
      text: `Track my live location in real time (${durationLabel}): ${comment.trim() ? `"${comment.trim()}"` : ''}`,
      url: fullShareUrl
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with WhatsApp Emerald Accent */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-b border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950 text-white">
              <MessageCircle className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base font-display">
                  WhatsApp Live Location
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
                  Google Maps
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Continuous real-time GPS tracking with dynamic beacon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{feedback}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* 1. Real Google Map with WhatsApp Beacon & Overlays */}
          <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
            <GoogleLiveMap
              latitude={lat}
              longitude={lng}
              accuracy={acc}
              userName={user?.name || 'You'}
              userPhone={user?.phone}
              batteryLevel={batteryLevel}
              speedKmh={currentSpeed}
              heading={currentHeading}
              breadcrumbs={breadcrumbs}
              className="w-full h-56 sm:h-64"
              zoom={16}
            />
          </div>

          {/* 2. Current Address & Telemetry Pill */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-200 truncate">{address}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                <span>GPS Accuracy: &plusmn;{Math.round(acc)}m</span>
                {batteryLevel !== undefined && (
                  <span className="flex items-center gap-1 font-mono text-emerald-400">
                    <Battery className="w-3.5 h-3.5" /> {batteryLevel}%
                  </span>
                )}
                {currentSpeed !== undefined && currentSpeed > 0 && (
                  <span className="font-mono text-cyan-400">{currentSpeed} km/h</span>
                )}
              </div>
            </div>
          </div>

          {/* Active Session Status Card vs Configuration Form */}
          {activeShareToken ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white text-sm">
                    Sharing Live Location with Contacts
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-700/50">
                  {timeLeftFormatted}
                </span>
              </div>

              {comment && (
                <p className="text-xs text-slate-300 italic bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  "{comment}"
                </p>
              )}

              {/* Action Buttons for Active Session */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => shareToWhatsApp()}
                  className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 active:scale-98 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Send via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-98 transition cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
              </div>

              {/* Stop Live Sharing Button */}
              <button
                type="button"
                onClick={handleStopSharing}
                disabled={isStopping}
                className="w-full py-2.5 px-4 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-red-500/50 shadow-lg shadow-red-950/40 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                <StopCircle className="w-4 h-4" />
                <span>{isStopping ? 'Stopping...' : 'Stop Sharing Live Location'}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Duration Selector (WhatsApp 15m / 1h / 8h) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Share Live Location For</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '15 Minutes', mins: 15 },
                    { label: '1 Hour', mins: 60, popular: true },
                    { label: '8 Hours', mins: 480 }
                  ].map((opt) => (
                    <button
                      key={opt.mins}
                      type="button"
                      onClick={() => setDurationMinutes(opt.mins)}
                      className={`relative py-2.5 px-2 rounded-xl text-xs font-bold border transition flex flex-col items-center justify-center cursor-pointer ${
                        durationMinutes === opt.mins
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.popular && (
                        <span className="text-[9px] text-emerald-400 font-mono mt-0.5">
                          Standard
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Comment Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add a comment (Optional)</span>
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Taking cab DL01-XXXX, on my way home..."
                  maxLength={120}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* WhatsApp Launch Action Button */}
              <button
                type="button"
                onClick={handleStartSharing}
                disabled={isStarting}
                className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 hover:from-emerald-500 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                <span>
                  {isStarting ? 'Initiating Live GPS...' : 'Share Live Location via WhatsApp'}
                </span>
              </button>

              {/* Direct Link Share options */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await handleStartSharing();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-98 transition cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-cyan-400" />
                  <span>System Share Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleStartSharing();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-98 transition cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>Generate Link</span>
                </button>
              </div>
            </div>
          )}

          {/* Privacy & Encryption Trust Notice */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-Time Google Maps Telemetry</span>
            </p>
            <p className="leading-relaxed">
              Your location updates continuously on Google Maps for the selected duration. You can
              stop sharing at any time. When stopped or expired, the link ceases to transmit updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
