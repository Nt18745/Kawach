import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { InteractiveMap } from '../InteractiveMap';
import { api, triggerHaptic } from '../../services/api';
import { EmergencyFacility, LocationPoint } from '../../types/database';
import {
  X,
  MapPin,
  Phone,
  Navigation,
  ShieldCheck,
  Building2,
  Clock,
  ExternalLink,
  LocateFixed,
  RefreshCw,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  Settings,
  Compass,
  WifiOff
} from 'lucide-react';

interface CityPreset {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const POPULAR_CITIES: CityPreset[] = [
  { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, address: 'Central Delhi, New Delhi' },
  { name: 'Mumbai', lat: 18.9998, lng: 72.8427, address: 'Parel / South Mumbai, Maharashtra' },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946, address: 'MG Road / Central Bengaluru, Karnataka' },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, address: 'Abids / Hyderabad, Telangana' },
  { name: 'Pune', lat: 18.5204, lng: 73.8567, address: 'Shivajinagar, Pune, Maharashtra' },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, address: 'Anna Salai, Chennai, Tamil Nadu' },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639, address: 'BBD Bagh / Central Kolkata, West Bengal' },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873, address: 'MI Road / Jaipur, Rajasthan' },
  { name: 'Lucknow', lat: 26.8467, lng: 80.9462, address: 'Hazratganj, Lucknow, Uttar Pradesh' }
];

export const NearbyHelpModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currentLocation,
    isGPSVerified,
    locationPermissionStatus,
    checkLocationPermission,
    requestLocationPermission,
    setManualLocation,
    isOnline,
    t
  } = useApp();

  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const [facilities, setFacilities] = useState<EmergencyFacility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<EmergencyFacility | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCityName, setSelectedCityName] = useState<string>('');
  const [aiSummary, setAiSummary] = useState<string>('');
  const [, setGroundingCitations] = useState<any[]>([]);
  
  // Permission & Location state
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>(
    locationPermissionStatus || 'prompt'
  );
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);
  const [hasValidatedPermission, setHasValidatedPermission] = useState<boolean>(false);

  // Track active fetch requests to prevent race conditions
  const activeFetchIdRef = useRef<number>(0);

  const fetchFacilitiesData = useCallback(async (
    lat: number,
    lng: number,
    type: string,
    query?: string,
    city?: string
  ) => {
    const fetchId = ++activeFetchIdRef.current;
    setLoading(true);

    try {
      const res = await api.getNearbyFacilitiesGrounded(lat, lng, type, query, city);
      // Ensure response is for the most recent fetch call
      if (fetchId !== activeFetchIdRef.current) return;

      setFacilities(res.facilities || []);
      setAiSummary(res.aiSummary || '');
      setGroundingCitations(res.groundingCitations || []);
      if (res.facilities && res.facilities.length > 0) {
        setSelectedFacility(res.facilities[0]);
      } else {
        setSelectedFacility(null);
      }
    } catch {
      if (fetchId !== activeFetchIdRef.current) return;
      // Graceful offline fallback
      try {
        const data = await api.getNearbyFacilities(lat, lng, type, 50);
        setFacilities(data || []);
        if (data && data.length > 0) setSelectedFacility(data[0]);
      } catch {
        setFacilities([]);
      }
    } finally {
      if (fetchId === activeFetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // When modal opens, first explicitly check permission status before attempting fetch
  useEffect(() => {
    if (activeModal !== 'help_near_me') {
      setHasValidatedPermission(false);
      return;
    }

    let isMounted = true;

    const initializeLocationCheck = async () => {
      // 1. Query browser permissions API first
      const status = await checkLocationPermission();
      if (!isMounted) return;
      setPermissionState(status);

      if (status === 'granted') {
        // If already granted, use current or request freshest position
        const targetLat = currentLocation?.latitude || 28.6139;
        const targetLng = currentLocation?.longitude || 77.2090;
        setHasValidatedPermission(true);
        fetchFacilitiesData(targetLat, targetLng, filterType, searchQuery, selectedCityName);
      } else if (status === 'denied') {
        // Explicitly handle permission denial: explain clearly without crashing
        setHasValidatedPermission(true);
        setPermissionNotice(
          'Location access is blocked in your browser or system permissions. Kawach will show verified emergency facilities for Delhi NCR or your selected city below.'
        );
        const fallback = POPULAR_CITIES[0];
        setSelectedCityName(fallback.name);
        fetchFacilitiesData(fallback.lat, fallback.lng, filterType, searchQuery, fallback.name);
      } else {
        // 'prompt' state: check if verified coordinates available
        setHasValidatedPermission(true);
        // If we already have a verified location, use it; otherwise provide a friendly prompt
        if (currentLocation && isGPSVerified) {
          fetchFacilitiesData(currentLocation.latitude, currentLocation.longitude, filterType, searchQuery, selectedCityName);
        } else {
          // Pre-populate with default city safely, but keep banner open asking user to detect location
          const defaultCity = POPULAR_CITIES[0];
          setSelectedCityName(defaultCity.name);
          fetchFacilitiesData(defaultCity.lat, defaultCity.lng, filterType, searchQuery, defaultCity.name);
        }
      }
    };

    initializeLocationCheck();

    return () => {
      isMounted = false;
    };
  }, [activeModal, checkLocationPermission]);

  // Handle explicit user action to request location permissions and detect GPS
  const handleDetectLocation = async () => {
    setIsLocating(true);
    setPermissionNotice(null);
    triggerHaptic(40);

    const result = await requestLocationPermission();
    setIsLocating(false);
    setPermissionState(result.status);

    if (result.success && result.location) {
      setSelectedCityName('Current GPS');
      setPermissionNotice('Device location verified with high accuracy.');
      fetchFacilitiesData(
        result.location.latitude,
        result.location.longitude,
        filterType,
        searchQuery,
        'Current GPS'
      );
    } else {
      // Explicit non-crashing explanation of denial or failure
      if (result.status === 'denied') {
        setPermissionNotice(
          'Location permission was denied. Tap any city below (e.g. Delhi NCR, Mumbai, Bengaluru) to view verified emergency services in that area.'
        );
      } else {
        setPermissionNotice(
          result.errorMessage ||
          'Could not detect current location. Please verify device GPS / Wi-Fi is enabled or select a city below.'
        );
      }
    }
  };

  const handleSelectCity = (city: CityPreset) => {
    triggerHaptic(20);
    setSelectedCityName(city.name);
    setManualLocation(city.lat, city.lng, city.address);
    setPermissionNotice(`Showing verified facilities in ${city.name}.`);
    fetchFacilitiesData(city.lat, city.lng, filterType, searchQuery, city.name);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = currentLocation?.latitude || 28.6139;
    const lng = currentLocation?.longitude || 77.2090;
    fetchFacilitiesData(lat, lng, filterType, searchQuery, selectedCityName);
  };

  const handleCategoryFilter = (catId: string) => {
    setFilterType(catId);
    const lat = currentLocation?.latitude || 28.6139;
    const lng = currentLocation?.longitude || 77.2090;
    fetchFacilitiesData(lat, lng, catId, searchQuery, selectedCityName);
  };

  if (activeModal !== 'help_near_me') return null;

  const categories = [
    { id: 'all', label: 'All Emergency' },
    { id: 'one_stop_centre', label: '🌸 Sakhi Centres' },
    { id: 'women_help_desk', label: '🛡️ Women Desks' },
    { id: 'police_station', label: '🚓 Police' },
    { id: 'hospital', label: '🏥 Hospitals' },
    { id: 'fire_station', label: '🚒 Fire' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Help Near Me"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in"
    >
      <div className="w-full max-w-2xl max-h-[94vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-900/50">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {t.helpNearMe}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Google Maps Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verified 24/7 Police, Sakhi Centres & Hospitals
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Location Detection & Permission Action Card */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2.5">
          
          {/* Main Permission & Location Detection Box */}
          <div className={`p-3 rounded-2xl border transition shadow-sm ${
            permissionState === 'denied'
              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60'
              : isGPSVerified
              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                  permissionState === 'denied'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : isGPSVerified
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {permissionState === 'denied' ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : isGPSVerified ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <LocateFixed className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>
                      {permissionState === 'denied'
                        ? 'Location Permission Denied'
                        : isGPSVerified
                        ? 'Live GPS Location Verified'
                        : 'Detect Your Device Location'}
                    </span>
                    {isGPSVerified && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        ±{currentLocation?.accuracy || 10}m
                      </span>
                    )}
                    {permissionState === 'denied' && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        Fallback Mode
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {currentLocation?.address || 'Allow Kawach to locate the closest emergency services to you.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  aria-label="Request location permission and detect GPS"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>
                    {isLocating
                      ? 'Requesting GPS...'
                      : permissionState === 'denied'
                      ? 'Retry Location'
                      : isGPSVerified
                      ? 'Refresh GPS'
                      : 'Detect My Location'}
                  </span>
                </button>
              </div>
            </div>

            {/* Clear explanation banner for Permission Denial / Notices */}
            {permissionNotice && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800/80 flex items-start gap-2 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {permissionNotice}
                </span>
              </div>
            )}
          </div>

          {/* Quick City Switcher Pills (Always accessible so user is never blocked) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0 flex items-center gap-1">
              <Compass className="w-3 h-3 text-slate-400" />
              <span>Or Choose City:</span>
            </span>
            {POPULAR_CITIES.map(c => (
              <button
                key={c.name}
                onClick={() => handleSelectCity(c)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition shrink-0 ${
                  selectedCityName === c.name
                    ? 'bg-rose-600 text-white shadow-sm font-bold'
                    : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Category Filter Strip */}
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2 shrink-0">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search area, landmark, or specific facility name..."
              className="w-full pl-9 pr-20 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition"
            >
              Search
            </button>
          </form>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className={`min-h-[34px] px-3 text-xs font-semibold rounded-full whitespace-nowrap transition ${
                  filterType === cat.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grounding Summary Banner (if available) */}
        {aiSummary && (
          <div className="px-4 py-2 bg-rose-50/70 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-900 dark:text-rose-200 shrink-0">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="line-clamp-2 text-[11px] leading-relaxed">
                {aiSummary}
              </p>
            </div>
          </div>
        )}

        {/* Offline Emergency Warning Banner if disconnected */}
        {!isOnline && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2 shrink-0">
            <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="leading-snug">
              <strong>Offline Mode Active:</strong> Using local IndexedDB cached map tiles for your current area. Emergency compass navigation & verified safe points remain operational without internet.
            </span>
          </div>
        )}

        {/* Interactive Map Section */}
        <div ref={mapSectionRef} className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 shrink-0">
          <InteractiveMap
            userLocation={currentLocation}
            facilities={facilities}
            selectedFacility={selectedFacility}
            onSelectFacility={fac => setSelectedFacility(fac)}
            className="h-56 sm:h-64 w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800"
          />
        </div>

        {/* Facilities List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
              <span>Locating verified emergency facilities...</span>
            </div>
          ) : facilities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 px-4">
              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                No facilities matching current filters in this area.
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                Switch to &apos;All Emergency&apos; or pick a preset city above to see verified centres.
              </p>
            </div>
          ) : (
            facilities.map(fac => {
              const distanceText = (fac as any).distanceKm !== undefined
                ? `${(fac as any).distanceKm} km`
                : 'Nearby';
              const timeText = (fac as any).travelTimeMinutes !== undefined
                ? `~${(fac as any).travelTimeMinutes} mins`
                : '10 mins';
              const isSelected = selectedFacility?.id === fac.id;
              const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`;

              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-rose-500 shrink-0" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {fac.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {fac.address}, {fac.city}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono block">
                        {distanceText}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 justify-end font-mono">
                        <Clock className="w-3 h-3" />
                        {timeText}
                      </span>
                    </div>
                  </div>

                  {/* Verification source chip */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="font-medium">
                      Verified Official: {fac.dataSource}
                    </span>
                  </div>

                  {/* Notes / Services */}
                  {fac.notes && (
                    <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 italic">
                      {fac.notes}
                    </p>
                  )}

                  {/* Action buttons: CALL, OFFLINE NAVIGATE, GOOGLE MAPS */}
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedFacility(fac);
                        triggerHaptic(20);
                        mapSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex-1 min-w-[130px] min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate Map</span>
                    </button>

                    <a
                      href={`tel:${fac.phoneNumber}`}
                      onClick={e => e.stopPropagation()}
                      className="flex-1 min-w-[100px] min-h-[40px] rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{t.call}</span>
                    </a>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="px-3 min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1 transition"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Google Maps</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
