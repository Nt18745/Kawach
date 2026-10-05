import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { tileCacheService } from '../../services/tileCacheService';
import {
  X,
  Compass,
  MapPin,
  Share2,
  Copy,
  CheckCircle2,
  BatteryWarning,
  ShieldAlert,
  ExternalLink,
  Radio,
  RefreshCw,
  Link2,
  Download,
  Navigation,
  Database,
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import { GoogleLiveMap } from '../GoogleLiveMap';

export const MyLocationModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentLocation,
    locationError,
    requestLocationPermission,
    lowBatteryMode,
    toggleLowBatteryMode,
    t
  } = useApp();

  const [copied, setCopied] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [createdShareUrl, setCreatedShareUrl] = useState<string | null>(null);
  const [cachedTileCount, setCachedTileCount] = useState<number>(0);
  const [cachedSizeMb, setCachedSizeMb] = useState<string>('0.00');
  const [cachingArea, setCachingArea] = useState<boolean>(false);
  const [cachePercent, setCachePercent] = useState<number>(0);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  useEffect(() => {
    tileCacheService.getCacheStats().then(s => {
      setCachedTileCount(s.count);
      setCachedSizeMb(s.estimatedSizeMb);
    });
  }, [activeModal]);

  if (activeModal !== 'my_location') return null;

  const latNum = currentLocation?.latitude;
  const lngNum = currentLocation?.longitude;
  const lat = latNum !== undefined ? latNum.toFixed(5) : 'Acquiring...';
  const lng = lngNum !== undefined ? lngNum.toFixed(5) : 'Acquiring...';
  const accuracy = currentLocation?.accuracy || 15;
  const address = currentLocation?.address || 'Current Device Coordinates';

  const mapLink = latNum && lngNum ? `https://www.google.com/maps?q=${latNum},${lngNum}` : 'https://www.google.com/maps';
  const locationText = `My Verified Location: ${address} (Lat: ${lat}, Lng: ${lng}, Accuracy: ±${accuracy}m). View: ${mapLink}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    await requestLocationPermission();
    setRefreshing(false);
  };

  const handleCacheArea = async () => {
    if (!latNum || !lngNum) return;
    setCachingArea(true);
    setCachePercent(0);
    setCacheNotice(null);
    try {
      const res = await tileCacheService.cacheArea(
        latNum,
        lngNum,
        2.5,
        13,
        16,
        prog => setCachePercent(prog.percent)
      );
      const stats = await tileCacheService.getCacheStats();
      setCachedTileCount(stats.count);
      setCachedSizeMb(stats.estimatedSizeMb);
      if (res.status === 'completed') {
        setCacheNotice(`✅ Stored ${res.successful} map tiles (${stats.estimatedSizeMb} MB) in IndexedDB for offline navigation.`);
      }
    } catch {
      setCacheNotice('Tile caching failed. Check network connection.');
    } finally {
      setCachingArea(false);
    }
  };

  const handleClearCache = async () => {
    if (confirm('Clear offline map tiles stored in IndexedDB?')) {
      await tileCacheService.clearCache();
      setCachedTileCount(0);
      setCachedSizeMb('0.00');
      setCacheNotice('IndexedDB offline map cache cleared.');
      setTimeout(() => setCacheNotice(null), 3000);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(locationText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const handleShare = async () => {
    if (latNum && lngNum) {
      try {
        const shareRes = await api.createLocationShare({
          latitude: latNum,
          longitude: lngNum,
          accuracy,
          address
        });
        const fullShareLink = `${window.location.origin}${shareRes.shareUrl}`;
        setCreatedShareUrl(fullShareLink);
        
        const shareMsg = `[KAWACH VERIFIED LOCATION] View live safe tracking: ${fullShareLink} (GPS: ${lat}, ${lng}, ±${accuracy}m)`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Kawach Verified Safety Location',
              text: shareMsg,
              url: fullShareLink
            });
            return;
          } catch {}
        }
        await navigator.clipboard.writeText(shareMsg);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        return;
      } catch {}
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kawach Verified Safety Location',
          text: locationText,
          url: mapLink
        });
        return;
      } catch {}
    }
    // Fallback to copy & open SMS/WhatsApp
    handleCopy();
    window.open(`sms:?body=${encodeURIComponent(locationText)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                {t.myLocation}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                W3C High-Accuracy GPS
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh GPS location"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Refresh GPS"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal-500' : ''}`} />
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {locationError && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{locationError}</span>
            </div>
          )}

          {/* Real Google Map Live Preview */}
          {latNum !== undefined && lngNum !== undefined && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
              <GoogleLiveMap
                latitude={latNum}
                longitude={lngNum}
                accuracy={accuracy}
                userName="You"
                className="w-full h-52"
                zoom={16}
              />
            </div>
          )}

          {/* Quick WhatsApp Live Location Button */}
          <button
            type="button"
            onClick={() => setActiveModal('whatsapp_live_location')}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 active:scale-98 transition cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Start WhatsApp Live Location (15m / 1h / 8h)</span>
          </button>

          {/* Coordinates & Accuracy Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                Live Coordinates
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Accuracy: ±{accuracy} meters
              </span>
            </div>

            <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{lat}° N, {lng}° E</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
                title="Copy coordinates"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="leading-snug">{address}</p>
              </div>
            </div>
          </div>

          {createdShareUrl && (
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-teal-600" />
                Live Tracking Link Generated:
              </span>
              <p className="font-mono text-[11px] truncate text-teal-700 dark:text-teal-300">
                {createdShareUrl}
              </p>
            </div>
          )}

          {/* Battery-Efficient Tracking Mode Selector */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BatteryWarning className={`w-5 h-5 ${lowBatteryMode ? 'text-amber-500' : 'text-slate-400'}`} />
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Low-Battery Emergency Mode
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {lowBatteryMode ? 'Throttled to 60s intervals to conserve power' : 'Normal 5s high precision'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleLowBatteryMode}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition ${
                lowBatteryMode
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {lowBatteryMode ? 'Active' : 'Off'}
            </button>
          </div>

          {/* Offline Map Tile Cache & Basic Navigation Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>IndexedDB Offline Map Cache</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      {cachedTileCount} tiles ({cachedSizeMb} MB)
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Saves map tiles directly to local IndexedDB for zero-network emergency navigation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCacheArea}
                  disabled={cachingArea || !latNum}
                  className="min-h-[34px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1 transition"
                >
                  {cachingArea ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-500" />
                      <span>{cachePercent}%</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-rose-500" />
                      <span>Cache (2.5 km)</span>
                    </>
                  )}
                </button>

                {cachedTileCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearCache}
                    title="Clear IndexedDB cached tiles"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {cacheNotice && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
                {cacheNotice}
              </p>
            )}

            <button
              type="button"
              onClick={() => setActiveModal('help_near_me')}
              className="w-full min-h-[36px] rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open IndexedDB Map & Safe Points</span>
            </button>
          </div>

          {/* Location Purpose & Privacy Explanation */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Why location is needed:
            </span>
            <p>
              Location is strictly used to direct first responders (ERSS 112) and your trusted contacts in the event of an SOS or safety timer expiry. Your history is not sold and can be cleared at any time in Settings.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleShare}
              className="min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Location</span>
            </button>

            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[48px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View on Maps</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
