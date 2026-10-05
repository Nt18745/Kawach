// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  MapCameraChangedEvent
} from '@vis.gl/react-google-maps';
import {
  Search,
  MapPin,
  Navigation,
  Check,
  X,
  Building,
  Home,
  Briefcase,
  Compass,
  Train,
  ShieldAlert,
  Loader2,
  Globe
} from 'lucide-react';
import { api } from '../services/api';

const GOOGLE_MAPS_API_KEY =
  (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
  'AIzaSyBVpLJpt-i95RDx50VBNKr0DDPsJ_nJtGs';

export interface SelectedLocationData {
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  postalCode: string;
  city?: string;
  state?: string;
  country?: string;
}

interface GoogleLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  initialLocation?: {
    name: string;
    latitude: number;
    longitude: number;
    postalCode?: string;
  };
  onSelectLocation: (loc: SelectedLocationData) => void;
}

// Sub-component to manage map bounds and center smoothly
const MapController: React.FC<{ targetCoords: { lat: number; lng: number } | null }> = ({
  targetCoords
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCoords) return;
    map.panTo({ lat: targetCoords.lat, lng: targetCoords.lng });
    map.setZoom(16);
  }, [map, targetCoords]);

  return null;
};

export const GoogleLocationPicker: React.FC<GoogleLocationPickerProps> = ({
  isOpen,
  onClose,
  title = 'Select Location on Google Maps',
  initialLocation,
  onSelectLocation
}) => {
  const defaultLat = initialLocation?.latitude || 28.6139;
  const defaultLng = initialLocation?.longitude || 77.2090;

  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: defaultLat,
    lng: defaultLng
  });
  const [selectedDetails, setSelectedDetails] = useState<SelectedLocationData>({
    name: initialLocation?.name || 'Selected Destination',
    formattedAddress: initialLocation?.name || 'Search or tap on Google Maps to pin address',
    latitude: defaultLat,
    longitude: defaultLng,
    postalCode: initialLocation?.postalCode || ''
  });

  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [predictions, setPredictions] = useState<
    Array<{
      placeId: string;
      description: string;
      mainText: string;
      secondaryText: string;
    }>
  >([]);
  const [showPredictions, setShowPredictions] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const sessionTokenRef = useRef<string>(Math.random().toString(36).substring(2));

  // Initialize initial location reverse geocode if needed
  useEffect(() => {
    if (isOpen && initialLocation) {
      setSelectedCoords({
        lat: initialLocation.latitude,
        lng: initialLocation.longitude
      });
      setSelectedDetails({
        name: initialLocation.name,
        formattedAddress: initialLocation.name,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        postalCode: initialLocation.postalCode || ''
      });
    }
  }, [isOpen, initialLocation]);

  // Debounced Place & Pin Code search
  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await api.searchPlaces(
          searchInput.trim(),
          sessionTokenRef.current,
          selectedCoords.lat,
          selectedCoords.lng
        );
        setPredictions(results);
        setShowPredictions(results.length > 0);
      } catch (err) {
        console.warn('Autocomplete lookup:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchInput, selectedCoords.lat, selectedCoords.lng]);

  // Handle place selection from autocomplete dropdown
  const handleSelectPrediction = async (placeId: string, mainText: string) => {
    setIsSearching(true);
    setShowPredictions(false);
    setSearchInput(mainText);

    try {
      const details = await api.getPlaceDetails(placeId, sessionTokenRef.current);
      // Reset session token after completion
      sessionTokenRef.current = Math.random().toString(36).substring(2);

      if (details) {
        const coords = { lat: details.latitude, lng: details.longitude };
        setSelectedCoords(coords);
        setSelectedDetails({
          name: details.name || mainText,
          formattedAddress: details.formattedAddress,
          latitude: details.latitude,
          longitude: details.longitude,
          postalCode: details.postalCode || '',
          city: details.city,
          state: details.state,
          country: details.country
        });
      }
    } catch (err) {
      console.error('Error fetching place details:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Direct Pin Code or address submit
  const handleDirectSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsSearching(true);
    setShowPredictions(false);

    try {
      const results = await api.geocodeQuery(searchInput.trim());
      if (results && results.length > 0) {
        const first = results[0];
        const coords = { lat: first.latitude, lng: first.longitude };
        setSelectedCoords(coords);
        setSelectedDetails({
          name: first.city || first.formattedAddress.split(',')[0] || searchInput.trim(),
          formattedAddress: first.formattedAddress,
          latitude: first.latitude,
          longitude: first.longitude,
          postalCode: first.postalCode,
          city: first.city,
          state: first.state,
          country: first.country
        });
      }
    } catch (err) {
      console.warn('Geocoding query failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Map Click Handler — Pin anywhere in the world and reverse-geocode
  const handleMapClick = useCallback(async (e: any) => {
    if (!e.detail?.latLng) return;
    const lat = e.detail.latLng.lat;
    const lng = e.detail.latLng.lng;

    setSelectedCoords({ lat, lng });
    setIsReverseGeocoding(true);

    try {
      const rev = await api.reverseGeocode(lat, lng);
      if (rev) {
        setSelectedDetails({
          name: rev.city || rev.formattedAddress.split(',')[0] || 'Pinned Location',
          formattedAddress: rev.formattedAddress,
          latitude: lat,
          longitude: lng,
          postalCode: rev.postalCode || '',
          city: rev.city,
          state: rev.state,
          country: rev.country
        });
        setSearchInput(rev.formattedAddress.split(',')[0] || '');
      } else {
        setSelectedDetails({
          name: `Pinned (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          formattedAddress: `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          latitude: lat,
          longitude: lng,
          postalCode: ''
        });
      }
    } catch (err) {
      console.warn('Reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Quick Preset Location Helper
  const handlePresetSearch = (query: string) => {
    setSearchInput(query);
    setIsSearching(true);
    api.geocodeQuery(query).then((results) => {
      setIsSearching(false);
      if (results && results.length > 0) {
        const first = results[0];
        setSelectedCoords({ lat: first.latitude, lng: first.longitude });
        setSelectedDetails({
          name: first.city || first.formattedAddress.split(',')[0] || query,
          formattedAddress: first.formattedAddress,
          latitude: first.latitude,
          longitude: first.longitude,
          postalCode: first.postalCode,
          city: first.city,
          state: first.state,
          country: first.country
        });
      }
    });
  };

  // Use Current GPS
  const handleUseCurrentGps = () => {
    if ('geolocation' in navigator) {
      setIsReverseGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setSelectedCoords({ lat, lng });
          const rev = await api.reverseGeocode(lat, lng);
          setIsReverseGeocoding(false);
          if (rev) {
            setSelectedDetails({
              name: 'My Current Location',
              formattedAddress: rev.formattedAddress,
              latitude: lat,
              longitude: lng,
              postalCode: rev.postalCode || '',
              city: rev.city,
              state: rev.state,
              country: rev.country
            });
            setSearchInput(rev.formattedAddress.split(',')[0]);
          }
        },
        () => {
          setIsReverseGeocoding(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl h-[92vh] max-h-[760px] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-display">
                {title}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Google Maps™ Search across all cities, pin codes & landmarks worldwide
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Auto-suggestions */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 relative z-20 shrink-0">
          <form onSubmit={handleDirectSearch} className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                placeholder="Search place, street, city or PIN code (e.g. 110001, Times Square, Hauz Khas)..."
                className="w-full h-11 pl-9 pr-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-rose-500 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
              ) : searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setPredictions([]);
                    setShowPredictions(false);
                  }}
                  className="w-5 h-5 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleUseCurrentGps}
              title="Use current verified GPS position"
              className="h-11 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">My GPS</span>
            </button>
          </form>

          {/* Autocomplete Predictions Dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-56 overflow-y-auto z-50 divide-y divide-slate-100 dark:divide-slate-800">
              {predictions.map((p) => (
                <button
                  key={p.placeId}
                  type="button"
                  onClick={() => handleSelectPrediction(p.placeId, p.mainText)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 flex items-start gap-2.5 transition"
                >
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {p.mainText}
                    </p>
                    {p.secondaryText && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {p.secondaryText}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Popular Categories / Preset Chips */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            <span className="text-slate-400 font-medium shrink-0">Suggestions:</span>
            <button
              type="button"
              onClick={() => handlePresetSearch('Nearest Police Station')}
              className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 border border-rose-200/50 dark:border-rose-900/50 font-medium shrink-0 flex items-center gap-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition"
            >
              <ShieldAlert className="w-3 h-3" /> Police
            </button>
            <button
              type="button"
              onClick={() => handlePresetSearch('Metro Station')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shrink-0 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Train className="w-3 h-3" /> Metro
            </button>
            <button
              type="button"
              onClick={() => handlePresetSearch('Airport')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shrink-0 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Compass className="w-3 h-3" /> Airport
            </button>
            <button
              type="button"
              onClick={() => handlePresetSearch('Central Railway Station')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium shrink-0 flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Building className="w-3 h-3" /> Station
            </button>
          </div>
        </div>

        {/* Interactive Google Map with @vis.gl/react-google-maps */}
        <div className="flex-1 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-950">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} solutionChannel="GMP_devsite_samples_v3_rgmautocomplete">
            <Map
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={{ lat: defaultLat, lng: defaultLng }}
              defaultZoom={15}
              gestureHandling="greedy"
              disableDefaultUI={false}
              onClick={handleMapClick}
              className="w-full h-full"
            >
              <MapController targetCoords={selectedCoords} />
              <AdvancedMarker position={selectedCoords}>
                <div className="relative -translate-x-1/2 -translate-y-full cursor-pointer flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-rose-600 text-white shadow-xl ring-4 ring-rose-500/30 flex items-center justify-center animate-bounce">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full bg-black/40 blur-[1px] mt-0.5" />
                </div>
              </AdvancedMarker>
            </Map>
          </APIProvider>

          {/* Map Helper Badge */}
          <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none">
            <Compass className="w-3.5 h-3.5 text-rose-500 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Tap or click anywhere on the map to pin exact location</span>
          </div>

          {isReverseGeocoding && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xl flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              <span>Resolving postal pin code & address...</span>
            </div>
          )}
        </div>

        {/* Selected Location Details Card & Confirm Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-rose-600 dark:text-rose-400">
                  Target Destination
                </span>
                {selectedDetails.postalCode && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold border border-rose-200 dark:border-rose-800">
                    PIN / ZIP: {selectedDetails.postalCode}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {selectedDetails.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {selectedDetails.formattedAddress}
              </p>
            </div>

            <div className="text-right shrink-0 hidden sm:block">
              <span className="text-[10px] text-slate-400 block font-mono">
                {selectedCoords.lat.toFixed(4)}, {selectedCoords.lng.toFixed(4)}
              </span>
              {selectedDetails.city && (
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {selectedDetails.city}, {selectedDetails.country || ''}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[46px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectLocation(selectedDetails);
                onClose();
              }}
              className="flex-[2] min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-95 transition"
            >
              <Check className="w-4 h-4" />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
