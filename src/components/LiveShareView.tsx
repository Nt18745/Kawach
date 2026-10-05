import React, { useState, useEffect } from 'react';
import { GoogleLiveMap } from './GoogleLiveMap';
import {
  ShieldAlert,
  Radio,
  Clock,
  PhoneCall,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  Navigation,
  Battery,
  Gauge,
  Share2,
  MessageCircle,
  Copy,
  Layers,
  Crosshair,
  Compass
} from 'lucide-react';
import { LocationPoint } from '../types/database';
import { firebaseService } from '../services/firebaseService';

interface LiveShareViewProps {
  token: string;
  onExit?: () => void;
}

export const LiveShareView: React.FC<LiveShareViewProps> = ({ token, onExit }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [copiedFeedback, setCopiedFeedback] = useState<boolean>(false);
  const [remainingFormatted, setRemainingFormatted] = useState<string>('');

  useEffect(() => {
    let isSubscribed = true;

    // 1. Subscribe to real-time Firestore public_shares document
    const unsub = firebaseService.subscribePublicShare(token, (liveDoc) => {
      if (!isSubscribed) return;
      if (liveDoc) {
        if (!liveDoc.active) {
          setError('This live location sharing session has been stopped or expired.');
          setData(null);
        } else {
          const lat = Number(liveDoc.latitude) || 28.5694;
          const lng = Number(liveDoc.longitude) || 77.2062;
          setData({
            valid: true,
            active: true,
            userName: liveDoc.userName || 'Live Location User',
            userPhone: liveDoc.userPhone || '',
            latitude: lat,
            longitude: lng,
            accuracyMeters: liveDoc.accuracy || 15,
            address: liveDoc.address || 'Real-time GPS Location',
            batteryLevel: liveDoc.batteryLevel,
            speedKmh: liveDoc.speedKmh,
            heading: liveDoc.heading,
            comment: liveDoc.comment,
            breadcrumbs: liveDoc.breadcrumbs || [],
            expiresAt: liveDoc.expiresAt,
            lastUpdatedAt: liveDoc.lastUpdated || liveDoc.updatedAt || liveDoc.createdAt || new Date().toISOString(),
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            googleMapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
            notice: 'WhatsApp-style live location sharing. Real-time Google Maps telemetry.'
          });
          setError(null);
        }
        setLoading(false);
      } else {
        // Fallback to backend API
        fetch(`/api/share/${token}`)
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errData) => {
                throw new Error(errData.error || 'Live location sharing has expired.');
              });
            }
            return res.json();
          })
          .then((json) => {
            if (isSubscribed) {
              setData(json);
              setError(null);
              setLoading(false);
            }
          })
          .catch((err) => {
            if (isSubscribed) {
              setError(err.message || 'Live location sharing not found.');
            }
          });
      }
    });

    // 2. Periodic polling interval to keep synchronizing
    const pollInterval = setInterval(() => {
      fetch(`/api/share/${token}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (isSubscribed && json && json.valid && json.active) {
            setData((prev: any) => ({
              ...prev,
              ...json,
              latitude: json.latitude,
              longitude: json.longitude,
              lastUpdatedAt: json.lastUpdatedAt || prev?.lastUpdatedAt
            }));
          }
        })
        .catch(() => {});
    }, 4000);

    return () => {
      isSubscribed = false;
      unsub();
      clearInterval(pollInterval);
    };
  }, [token]);

  // Freshness counter
  useEffect(() => {
    if (!data?.lastUpdatedAt) return;
    const updateTimer = () => {
      const updatedMs = new Date(data.lastUpdatedAt).getTime();
      const diffSecs = Math.max(0, Math.floor((Date.now() - updatedMs) / 1000));
      setSecondsAgo(diffSecs);

      // Remaining session countdown
      if (data?.expiresAt) {
        const remainingMs = new Date(data.expiresAt).getTime() - Date.now();
        if (remainingMs > 0) {
          const totalSecs = Math.floor(remainingMs / 1000);
          const hours = Math.floor(totalSecs / 3600);
          const mins = Math.floor((totalSecs % 3600) / 60);
          const secs = totalSecs % 60;
          if (hours > 0) {
            setRemainingFormatted(`${hours}h ${mins}m`);
          } else {
            setRemainingFormatted(`${mins}m ${secs < 10 ? '0' : ''}${secs}s`);
          }
        } else {
          setRemainingFormatted('Ended');
        }
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [data?.lastUpdatedAt, data?.expiresAt]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedFeedback(true);
      setTimeout(() => setCopiedFeedback(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const text = `🟢 *LIVE LOCATION (KAWACH / WHATSAPP)*\n\nTrack ${data.userName}'s live location on Google Maps:\n🔗 ${window.location.href}\n\n📍 *Current Address:* ${data.address}\n🗺️ *Direct Navigation:* ${data.googleMapsDirectionsUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <span className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>
          <h2 className="text-base font-bold text-white font-display">
            Connecting to Live Google Maps Feed...
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Establishing secure encrypted telemetry socket with device GPS.
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-slate-800 text-amber-500 mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Live Location Session Ended
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'This live location session was stopped by the user or has expired.'}
          </p>
          {onExit && (
            <button
              onClick={onExit}
              className="w-full min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Close Viewer
            </button>
          )}
        </div>
      </div>
    );
  }

  const isStale = secondsAgo > 45;
  const lat = Number(data.latitude) || 28.5694;
  const lng = Number(data.longitude) || 77.2062;
  const acc = Number(data.accuracyMeters) || 15;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-3 sm:p-5 font-sans">
      <div className="w-full max-w-lg mx-auto space-y-3.5">
        {/* WhatsApp-Style Live Session Header Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-800/80 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                WhatsApp Live Location
              </span>
            </div>

            {remainingFormatted && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-900/60 border border-emerald-700/60 text-emerald-300 font-bold">
                Ends in {remainingFormatted}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-black text-white tracking-tight font-display">
                {data.userName || 'Live User'}
              </h1>
              <p className="text-xs text-slate-400">
                Sharing live GPS location in real time
              </p>
            </div>

            {data.batteryLevel !== undefined && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
                <Battery className="w-4 h-4" />
                <span className="font-bold">{data.batteryLevel}%</span>
              </div>
            )}
          </div>

          {/* User's comment note */}
          {data.comment && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-900/50 text-xs text-emerald-200 italic flex items-start gap-2">
              <span className="text-base select-none">💬</span>
              <p className="leading-relaxed">"{data.comment}"</p>
            </div>
          )}

          {/* Telemetry info pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                isStale
                  ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              <Clock className="w-4 h-4 shrink-0 text-emerald-400" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block">Status</span>
                <span className="font-bold truncate">
                  {secondsAgo <= 3 ? 'Live (Just now)' : `${secondsAgo}s ago`}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block">Precision</span>
                <span className="font-bold text-white">
                  &plusmn;{Math.round(acc)}m accuracy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Real Google Map with AdvancedMarker & WhatsApp Beacon */}
        <div className="rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
          <GoogleLiveMap
            latitude={lat}
            longitude={lng}
            accuracy={acc}
            userName={data.userName || 'Live User'}
            userPhone={data.userPhone}
            batteryLevel={data.batteryLevel}
            speedKmh={data.speedKmh}
            heading={data.heading}
            breadcrumbs={data.breadcrumbs || []}
            className="w-full h-80 sm:h-96"
            zoom={16}
          />
        </div>

        {/* Quick Action Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* 1. Open Google Maps Navigation */}
          <a
            href={data.googleMapsDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-blue-950 active:scale-95 transition"
          >
            <Navigation className="w-4 h-4" />
            <span>Get Directions</span>
          </a>

          {/* 2. Forward to WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-950 active:scale-95 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Share WhatsApp</span>
          </button>

          {/* 3. Call User */}
          {data.userPhone ? (
            <a
              href={`tel:${data.userPhone.replace(/[^\d+]/g, '')}`}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Call User</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 border border-slate-700 active:scale-95 transition cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-400" />
              <span>{copiedFeedback ? 'Copied!' : 'Copy Link'}</span>
            </button>
          )}

          {/* 4. Official 112 SOS */}
          <a
            href="tel:112"
            className="py-3 px-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-lg shadow-red-950 active:scale-95 transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Dial 112 SOS</span>
          </a>
        </div>

        {/* Location Details Card */}
        <div className="bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-slate-200">Current Geocoded Address:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed font-medium">
                {data.address || 'Real-time GPS Coordinate Recorded'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Coordinates:</span>
            <span className="text-slate-200">
              {lat.toFixed(5)}&deg; N, {lng.toFixed(5)}&deg; E
            </span>
          </div>

          {data.speedKmh !== undefined && data.speedKmh > 0 && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Traveling Speed:</span>
              <span className="text-cyan-400 font-bold">{data.speedKmh} km/h</span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Google Maps Platform:</span>
            <span className="text-emerald-400 font-bold">Live Synchronized</span>
          </div>
        </div>
      </div>

      {/* Exit Button */}
      <div className="w-full max-w-lg mx-auto pt-4 text-center">
        {onExit && (
          <button
            onClick={onExit}
            className="w-full min-h-[44px] rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            Exit Live View & Return to Kawach
          </button>
        )}
      </div>
    </div>
  );
};
