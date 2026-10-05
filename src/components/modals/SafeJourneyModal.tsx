// Source: Google Maps Platform Code Assist
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  APIProvider,
  Map,
  AdvancedMarker
} from '@vis.gl/react-google-maps';
import {
  X,
  Navigation,
  MapPin,
  CheckCircle2,
  Share2,
  Clock,
  Compass,
  ArrowRight,
  Search,
  Globe,
  Route,
  Car,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { GoogleLocationPicker, SelectedLocationData } from '../GoogleLocationPicker';
import { api } from '../../services/api';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBVpLJpt-i95RDx50VBNKr0DDPsJ_nJtGs';

export const SafeJourneyModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    activeJourney,
    startJourney,
    endJourney,
    currentLocation,
    contacts,
    t
  } = useApp();

  const [startName, setStartName] = useState<string>('Current Verified GPS Location');
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerTarget, setPickerTarget] = useState<'destination' | 'start'>('destination');
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  const [selectedDestination, setSelectedDestination] = useState<SelectedLocationData | null>(null);
  const [routeSummary, setRouteSummary] = useState<{
    distanceText: string;
    distanceKm: number | null;
    durationText: string;
    durationMins: number | null;
  } | null>(null);
  const [calculatingRoute, setCalculatingRoute] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize start location if GPS is available
  useEffect(() => {
    if (currentLocation?.address) {
      setStartName(currentLocation.address);
    }
  }, [currentLocation]);

  // When selected destination changes, calculate route directions
  useEffect(() => {
    if (!selectedDestination || !currentLocation) return;

    let isMounted = true;
    setCalculatingRoute(true);

    api
      .getDirections(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedDestination.latitude,
        selectedDestination.longitude
      )
      .then((dir) => {
        if (!isMounted || !dir) return;
        setRouteSummary({
          distanceText: dir.distanceText,
          distanceKm: dir.distanceKm,
          durationText: dir.durationText,
          durationMins: dir.durationMins
        });
      })
      .catch((err) => {
        console.warn('Directions preview calculation:', err);
      })
      .finally(() => {
        if (isMounted) setCalculatingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDestination, currentLocation]);

  if (activeModal !== 'safe_journey') return null;

  const handleOpenPicker = (target: 'destination' | 'start') => {
    setPickerTarget(target);
    setIsPickerOpen(true);
  };

  const handleLocationPicked = (loc: SelectedLocationData) => {
    if (pickerTarget === 'destination') {
      setSelectedDestination(loc);
    } else {
      setStartName(loc.formattedAddress || loc.name);
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestination) return;

    setLoading(true);

    const extra: {
      destinationLatitude?: number;
      destinationLongitude?: number;
      destinationPostalCode?: string;
      distanceKm?: number;
      estimatedDurationMins?: number;
      expectedArrivalTime?: string;
    } = {
      destinationLatitude: selectedDestination.latitude,
      destinationLongitude: selectedDestination.longitude,
      destinationPostalCode: selectedDestination.postalCode || undefined,
      distanceKm: routeSummary?.distanceKm || undefined,
      estimatedDurationMins: routeSummary?.durationMins || undefined
    };

    if (routeSummary?.durationMins) {
      extra.expectedArrivalTime = new Date(
        Date.now() + (routeSummary.durationMins + 15) * 60000
      ).toISOString();
    }

    await startJourney(startName, selectedDestination.name, extra);
    setLoading(false);
  };

  const startTime = activeJourney
    ? new Date(activeJourney.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const liveShareUrl = activeJourney?.shareToken
    ? `${window.location.origin}/share/${activeJourney.shareToken}`
    : '';

  const handleCopyShareLink = () => {
    if (!liveShareUrl) return;
    navigator.clipboard.writeText(liveShareUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!activeJourney || !liveShareUrl) return;
    const msg = `🛡️ HER-SAFE Alert: I have started a Safe Journey to ${activeJourney.destinationName}. Track my live GPS location here: ${liveShareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const userLat = currentLocation?.latitude || 28.6139;
  const userLng = currentLocation?.longitude || 77.2090;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
        <div className="w-full max-w-lg max-h-[92vh] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
          {/* Top Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  {t.safeJourney}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Google Maps™ Live Route & Pin Code Tracking
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-4">
            {activeJourney ? (
              /* Active Journey Tracking View */
              <div className="space-y-4">
                {/* Live Google Map view */}
                <div className="h-52 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative bg-slate-100 dark:bg-slate-950">
                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
                    <Map
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={{
                        lat: activeJourney.destinationCoordinates?.latitude || userLat,
                        lng: activeJourney.destinationCoordinates?.longitude || userLng
                      }}
                      defaultZoom={13}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      {/* Live User Marker */}
                      <AdvancedMarker position={{ lat: userLat, lng: userLng }}>
                        <div className="relative -translate-x-1/2 -translate-y-full">
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-500/30 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                          </div>
                        </div>
                      </AdvancedMarker>

                      {/* Destination Marker */}
                      {activeJourney.destinationCoordinates && (
                        <AdvancedMarker
                          position={{
                            lat: activeJourney.destinationCoordinates.latitude,
                            lng: activeJourney.destinationCoordinates.longitude
                          }}
                        >
                          <div className="relative -translate-x-1/2 -translate-y-full">
                            <div className="w-7 h-7 rounded-full bg-rose-600 text-white shadow-lg ring-4 ring-rose-500/30 flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </AdvancedMarker>
                      )}
                    </Map>
                  </APIProvider>

                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-indigo-600/90 text-white text-[11px] font-bold backdrop-blur-sm flex items-center gap-1.5 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Live GPS Tracking Active</span>
                  </div>
                </div>

                {/* Journey Information Card */}
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-300">
                    <span className="font-extrabold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-indigo-500" />
                      Kawach Escort Shield
                    </span>
                    <span>Started: {startTime}</span>
                  </div>

                  <div className="space-y-2 pt-1 border-t border-indigo-200/50 dark:border-indigo-800/50">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Origin</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {activeJourney.startLocationName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400">
                            Destination
                          </span>
                          {activeJourney.destinationPostalCode && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                              PIN: {activeJourney.destinationPostalCode}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {activeJourney.destinationName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(activeJourney.distanceKm || activeJourney.estimatedDurationMins) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 text-center">
                      <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Distance
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {activeJourney.distanceKm ? `${activeJourney.distanceKm} km` : 'Calculated'}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/60">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                          Est. Time
                        </span>
                        <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {activeJourney.estimatedDurationMins
                            ? `${activeJourney.estimatedDurationMins} mins`
                            : '45 mins'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Share With Trusted Contacts */}
                {liveShareUrl && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-indigo-500" />
                        Share Live Route with Contacts
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {contacts.length} registered
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyShareLink}
                        className="flex-1 min-h-[40px] px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedShare ? 'Copied Link!' : 'Copy Live Link'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleWhatsAppShare}
                        className="min-h-[40px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* End Journey Button */}
                <button
                  onClick={() => endJourney('arrived_safe')}
                  className="w-full min-h-[50px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>I Have Arrived Safely (End Journey)</span>
                </button>
              </div>
            ) : (
              /* Start New Journey */
              <form onSubmit={handleStart} className="space-y-4">
                {/* Origin */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Starting Location
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenPicker('start')}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                    >
                      Change on Map
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={startName}
                      onChange={(e) => setStartName(e.target.value)}
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 truncate"
                    />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 ring-2 ring-emerald-400/30" />
                  </div>
                </div>

                {/* Destination Selector via Google Maps */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Destination (Google Maps Worldwide)
                    </label>
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                      Any PIN Code / Place
                    </span>
                  </div>

                  {selectedDestination ? (
                    <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {selectedDestination.name}
                            </span>
                            {selectedDestination.postalCode && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold shrink-0">
                                PIN: {selectedDestination.postalCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {selectedDestination.formattedAddress}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenPicker('destination')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      {/* Route Preview Distance & ETA */}
                      {calculatingRoute ? (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1.5 pt-1">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Calculating route with Google Maps Directions...</span>
                        </div>
                      ) : routeSummary ? (
                        <div className="flex items-center gap-3 pt-2 border-t border-rose-200/50 dark:border-rose-900/40 text-xs font-semibold">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                            <Route className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{routeSummary.distanceText}</span>
                          </div>
                          <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                            <Car className="w-3.5 h-3.5" />
                            <span>{routeSummary.durationText} est. drive</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenPicker('destination')}
                      className="w-full min-h-[52px] px-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-rose-50/30 dark:hover:bg-rose-950/20 text-slate-600 dark:text-slate-300 flex items-center justify-between gap-2 transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                            Search Destination or PIN Code
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Tap to search Google Maps places, pin codes & landmarks
                          </span>
                        </div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold shrink-0">
                        Pick on Map
                      </div>
                    </button>
                  )}
                </div>

                {/* Safety Monitoring Guarantee */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/50 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Active Route Protection</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Once started, Kawach monitors your breadcrumb GPS trail toward the destination, shares a live tracking link with your {contacts.length} trusted contacts, and flags uncharacteristic stops or route diversions.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !selectedDestination}
                    className="w-full min-h-[50px] rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>{loading ? 'Starting Safe Journey...' : t.startJourney}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Embedded Google Location Picker Modal */}
      <GoogleLocationPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        title={pickerTarget === 'destination' ? 'Select Destination on Google Maps' : 'Select Starting Point'}
        initialLocation={
          pickerTarget === 'destination' && selectedDestination
            ? {
                name: selectedDestination.name,
                latitude: selectedDestination.latitude,
                longitude: selectedDestination.longitude,
                postalCode: selectedDestination.postalCode
              }
            : {
                name: startName,
                latitude: currentLocation?.latitude || 28.6139,
                longitude: currentLocation?.longitude || 77.2090
              }
        }
        onSelectLocation={handleLocationPicked}
      />
    </>
  );
};
