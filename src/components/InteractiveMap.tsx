import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { EmergencyFacility, LocationPoint } from '../types/database';
import {
  tileCacheService,
  CacheProgress,
  OfflineNavigationGuidance
} from '../services/tileCacheService';
import {
  Compass,
  Navigation,
  Download,
  Wifi,
  WifiOff,
  CheckCircle2,
  Phone,
  Crosshair,
  Shield,
  Building2,
  X,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Database,
  Layers
} from 'lucide-react';

interface InteractiveMapProps {
  userLocation: LocationPoint | null;
  facilities: EmergencyFacility[];
  selectedFacility?: EmergencyFacility | null;
  onSelectFacility?: (fac: EmergencyFacility | null) => void;
  className?: string;
  showOfflineControls?: boolean;
  enableNavigationHUD?: boolean;
}

// Custom Leaflet TileLayer that pulls from CacheStorage and falls back gracefully offline
class OfflineCachedTileLayer extends L.TileLayer {
  override createTile(coords: L.Coords, done: (error: any, tile: HTMLImageElement) => void): HTMLImageElement {
    const tile = document.createElement('img');
    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const url = this.getTileUrl(coords);

    tileCacheService
      .getTileBlobUrl(url, { x: coords.x, y: coords.y, z: coords.z })
      .then(blobOrDataUrl => {
        tile.src = blobOrDataUrl;
        L.DomEvent.on(tile, 'load', () => done(null, tile));
        L.DomEvent.on(tile, 'error', err => done(err, tile));
      })
      .catch(() => {
        tile.src = url;
        L.DomEvent.on(tile, 'load', () => done(null, tile));
        L.DomEvent.on(tile, 'error', err => done(err, tile));
      });

    return tile;
  }
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  userLocation,
  facilities,
  selectedFacility,
  onSelectFacility,
  className = 'h-72 w-full rounded-2xl overflow-hidden',
  showOfflineControls = true,
  enableNavigationHUD = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const navigationRouteLayerRef = useRef<L.LayerGroup | null>(null);

  // Network & Cache State
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [cacheProgress, setCacheProgress] = useState<CacheProgress | null>(null);
  const [cachedTileCount, setCachedTileCount] = useState<number>(0);
  const [cachedSizeMb, setCachedSizeMb] = useState<string>('0.00');
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);

  // Navigation HUD state
  const [activeNavFacility, setActiveNavFacility] = useState<EmergencyFacility | null>(
    selectedFacility || null
  );
  const [guidance, setGuidance] = useState<OfflineNavigationGuidance | null>(null);

  // Sync activeNavFacility with selectedFacility prop
  useEffect(() => {
    if (selectedFacility) {
      setActiveNavFacility(selectedFacility);
    }
  }, [selectedFacility]);

  // Network online/offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial cache statistics check
    tileCacheService.getCacheStats().then(stats => {
      setCachedTileCount(stats.count);
      setCachedSizeMb(stats.estimatedSizeMb);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute navigation guidance whenever userLocation or activeNavFacility changes
  useEffect(() => {
    if (!userLocation || !activeNavFacility) {
      setGuidance(null);
      return;
    }

    const g = tileCacheService.generateNavigationGuidance(
      userLocation.latitude,
      userLocation.longitude,
      activeNavFacility.latitude,
      activeNavFacility.longitude,
      activeNavFacility.name
    );
    setGuidance(g);
  }, [userLocation, activeNavFacility]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = userLocation?.latitude || 28.6139;
      const initialLng = userLocation?.longitude || 77.2090;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([initialLat, initialLng], 14);

      // Add our custom offline-cached tile layer
      const tileLayer = new OfflineCachedTileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }
      );
      tileLayer.addTo(map);

      // Add custom minimal zoom control bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      const navGroup = L.layerGroup().addTo(map);

      markersLayerRef.current = markersGroup;
      navigationRouteLayerRef.current = navGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      // Do not destroy on simple re-renders to preserve smooth panning
    };
  }, []);

  // Update Markers & Navigation Route on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const navGroup = navigationRouteLayerRef.current;
    if (!map || !markersGroup || !navGroup) return;

    markersGroup.clearLayers();
    navGroup.clearLayers();

    // 1. Add User Location Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position:relative; width:28px; height:28px;">
            <div style="position:absolute; width:28px; height:28px; border-radius:50%; background:rgba(225, 29, 72, 0.35); animation:ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position:absolute; top:4px; left:4px; width:20px; height:20px; border-radius:50%; background:#e11d48; border:3px solid #ffffff; box-shadow:0 2px 8px rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center;">
              <div style="width:6px; height:6px; border-radius:50%; background:#ffffff;"></div>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000
      }).bindPopup(
        `<div style="font-family:system-ui; font-size:12px; font-weight:bold; color:#0f172a;">
          📍 You are here
          <div style="font-size:11px; font-weight:normal; color:#64748b; margin-top:2px;">
            GPS Accuracy: ±${userLocation.accuracy || 15}m
          </div>
        </div>`
      );
      markersGroup.addLayer(userMarker);

      // Add accuracy circle
      if (userLocation.accuracy) {
        const accuracyCircle = L.circle([userLocation.latitude, userLocation.longitude], {
          radius: Math.min(userLocation.accuracy, 250),
          color: '#e11d48',
          fillColor: '#e11d48',
          fillOpacity: 0.12,
          weight: 1.5
        });
        markersGroup.addLayer(accuracyCircle);
      }
    }

    // 2. Add Facility Markers
    facilities.forEach(fac => {
      let color = '#2563eb'; // blue for police
      let label = 'POL';
      if (fac.type === 'hospital') {
        color = '#059669'; // green
        label = 'HOS';
      } else if (fac.type === 'fire_station') {
        color = '#ea580c'; // orange
        label = 'FIR';
      } else if (fac.type === 'one_stop_centre' || fac.type === 'women_help_desk') {
        color = '#9333ea'; // purple for Sakhi / Women
        label = 'WHD';
      }

      const isTargeted = activeNavFacility && activeNavFacility.id === fac.id;
      const markerHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; cursor:pointer;">
          <div style="background:${color}; color:#fff; font-weight:800; font-size:10px; padding:3px 7px; border-radius:12px; border:2.5px solid ${isTargeted ? '#fbbf24' : '#fff'}; box-shadow:0 4px 10px rgba(0,0,0,0.35); transform:${isTargeted ? 'scale(1.3)' : 'scale(1)'}; transition:all 0.2s;">
            ${label}
          </div>
          <div style="width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent; border-top:6px solid ${color};"></div>
        </div>
      `;

      const facilityIcon = L.divIcon({
        className: 'custom-facility-marker',
        html: markerHtml,
        iconSize: [40, 34],
        iconAnchor: [20, 32]
      });

      const popupContent = `
        <div style="font-family:system-ui, sans-serif; min-width:200px; padding:4px;">
          <b style="font-size:13px; color:#0f172a; display:block;">${fac.name}</b>
          <div style="font-size:11px; color:#64748b; margin:3px 0;">${fac.address}, ${fac.city}</div>
          <div style="display:inline-block; font-size:10px; font-weight:700; color:#059669; background:#ecfdf5; padding:2px 6px; border-radius:4px; margin-bottom:8px;">
            Verified Safe Point
          </div>
          <div style="display:flex; gap:6px;">
            <a href="tel:${fac.phoneNumber}" style="flex:1; text-align:center; background:#e11d48; color:#fff; font-size:11px; font-weight:bold; padding:6px; border-radius:8px; text-decoration:none;">
              CALL
            </a>
            <button id="nav-btn-${fac.id}" style="flex:1; text-align:center; background:#0f172a; color:#fff; font-size:11px; font-weight:bold; padding:6px; border-radius:8px; border:none; cursor:pointer;">
              NAVIGATE
            </button>
          </div>
        </div>
      `;

      const marker = L.marker([fac.latitude, fac.longitude], { icon: facilityIcon })
        .bindPopup(popupContent);

      marker.on('click', () => {
        setActiveNavFacility(fac);
        if (onSelectFacility) onSelectFacility(fac);
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`nav-btn-${fac.id}`);
        if (btn) {
          btn.onclick = () => {
            setActiveNavFacility(fac);
            if (onSelectFacility) onSelectFacility(fac);
            marker.closePopup();
          };
        }
      });

      markersGroup.addLayer(marker);
    });

    // 3. Draw Offline Emergency Navigation Polyline & Destination Ring if a facility is targeted
    if (userLocation && activeNavFacility) {
      const userLatLng: [number, number] = [userLocation.latitude, userLocation.longitude];
      const targetLatLng: [number, number] = [activeNavFacility.latitude, activeNavFacility.longitude];

      // Route Polyline (high-contrast dash with glow)
      const routeLine = L.polyline([userLatLng, targetLatLng], {
        color: '#0284c7',
        weight: 4,
        opacity: 0.9,
        dashArray: '8, 8',
        lineCap: 'round'
      });
      navGroup.addLayer(routeLine);

      // Destination Target Pulse Circle
      const destCircle = L.circle(targetLatLng, {
        radius: 40,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.25,
        weight: 2
      });
      navGroup.addLayer(destCircle);

      // Fit bounds to show both user and destination with padding
      const bounds = L.latLngBounds([userLatLng, targetLatLng]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else if (userLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 14, { animate: true });
    }
  }, [userLocation, facilities, activeNavFacility, onSelectFacility]);

  // Handler to trigger pre-caching tiles for user's current area
  const handleCacheCurrentArea = async () => {
    if (!userLocation) {
      setCacheNotice('Unable to cache: Device GPS coordinates not acquired yet.');
      return;
    }

    setCacheNotice(null);
    try {
      const res = await tileCacheService.cacheArea(
        userLocation.latitude,
        userLocation.longitude,
        2.5, // 2.5 km perimeter
        13, // min zoom
        16, // max zoom
        prog => {
          setCacheProgress(prog);
        }
      );

      const stats = await tileCacheService.getCacheStats();
      setCachedTileCount(stats.count);
      setCachedSizeMb(stats.estimatedSizeMb);

      if (res.status === 'completed') {
        setCacheNotice(`✅ Successfully stored 2.5 km area in local IndexedDB (${res.successful} map tiles, ${stats.estimatedSizeMb} MB) ready for offline emergency use.`);
        setTimeout(() => setCacheNotice(null), 5000);
      }
    } catch {
      setCacheNotice('Tile caching encountered an error. Please try again.');
    }
  };

  // Handler to clear tile cache
  const handleClearCache = async () => {
    if (confirm('Clear offline map tiles from IndexedDB? Navigation when offline will require internet to re-cache.')) {
      await tileCacheService.clearCache();
      setCachedTileCount(0);
      setCachedSizeMb('0.00');
      setCacheNotice('IndexedDB offline map cache cleared.');
      setTimeout(() => setCacheNotice(null), 3000);
    }
  };

  // Re-center map on user
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true });
  };

  // Quick shortcut: Target nearest police station
  const handleSelectNearestPolice = () => {
    if (!userLocation || facilities.length === 0) return;
    const policeStations = facilities.filter(f => f.type === 'police_station');
    const pool = policeStations.length > 0 ? policeStations : facilities;

    let nearest = pool[0];
    let minD = Infinity;
    pool.forEach(fac => {
      const d = tileCacheService.calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        fac.latitude,
        fac.longitude
      );
      if (d < minD) {
        minD = d;
        nearest = fac;
      }
    });

    setActiveNavFacility(nearest);
    if (onSelectFacility) onSelectFacility(nearest);
  };

  // Quick shortcut: Target nearest hospital
  const handleSelectNearestHospital = () => {
    if (!userLocation || facilities.length === 0) return;
    const hospitals = facilities.filter(f => f.type === 'hospital');
    if (hospitals.length === 0) return;

    let nearest = hospitals[0];
    let minD = Infinity;
    hospitals.forEach(fac => {
      const d = tileCacheService.calculateDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        fac.latitude,
        fac.longitude
      );
      if (d < minD) {
        minD = d;
        nearest = fac;
      }
    });

    setActiveNavFacility(nearest);
    if (onSelectFacility) onSelectFacility(nearest);
  };

  return (
    <div className="relative w-full flex flex-col">
      {/* Map Header Status & Offline Bar */}
      {showOfflineControls && (
        <div className="bg-slate-900 border-b border-slate-800 px-3 py-2 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Online/Offline status badge */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isOnline
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950/90 text-amber-300 border border-amber-700 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" /> Online Mode
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" /> Offline: IndexedDB Active
                </>
              )}
            </span>

            {/* IndexedDB Cache Storage Counter */}
            <span className="text-[11px] text-slate-300 font-mono flex items-center gap-1.5 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
              <Database className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>IndexedDB: <strong>{cachedTileCount}</strong> tiles</span>
              <span className="text-slate-400">({cachedSizeMb} MB)</span>
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 ml-auto">
            {cacheProgress?.status === 'caching' ? (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] font-bold">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>IndexedDB: {cacheProgress.percent}%</span>
              </div>
            ) : (
              <button
                onClick={handleCacheCurrentArea}
                title="Download 2.5km radius map tiles into local IndexedDB for offline emergency navigation"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-[11px] font-semibold flex items-center gap-1 border border-slate-700 transition"
              >
                <Download className="w-3 h-3 text-rose-400" />
                <span>Cache to IndexedDB (2.5 km)</span>
              </button>
            )}

            {cachedTileCount > 0 && (
              <button
                onClick={handleClearCache}
                title="Clear cached map tiles from IndexedDB"
                className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cache feedback banner */}
      {cacheNotice && (
        <div className="bg-slate-950/90 border-b border-rose-900/60 px-3 py-1.5 text-[11px] text-rose-200 flex items-center justify-between">
          <span>{cacheNotice}</span>
          <button
            onClick={() => setCacheNotice(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Map Viewport */}
      <div className="relative w-full">
        <div ref={mapContainerRef} className={className} />

        {/* Floating Map Controls (Top Left & Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
          {/* Re-center button */}
          <button
            onClick={handleRecenter}
            title="Re-center on my live GPS location"
            className="w-8 h-8 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg border border-slate-700 active:scale-95 transition"
          >
            <Crosshair className="w-4 h-4 text-rose-400" />
          </button>

          {/* Quick Nearest Police */}
          <button
            onClick={handleSelectNearestPolice}
            title="Navigate to nearest police station"
            className="w-8 h-8 rounded-xl bg-blue-900/90 hover:bg-blue-800 text-white flex items-center justify-center shadow-lg border border-blue-700 active:scale-95 transition text-[10px] font-black"
          >
            POL
          </button>

          {/* Quick Nearest Hospital */}
          <button
            onClick={handleSelectNearestHospital}
            title="Navigate to nearest hospital"
            className="w-8 h-8 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-white flex items-center justify-center shadow-lg border border-emerald-700 active:scale-95 transition text-[10px] font-black"
          >
            HOS
          </button>
        </div>

        {/* Floating Emergency Navigation HUD (when a facility is targeted) */}
        {enableNavigationHUD && activeNavFacility && guidance && (
          <div className="absolute bottom-2.5 inset-x-2.5 z-20 rounded-2xl bg-slate-950/95 border border-blue-500/80 p-3 shadow-2xl backdrop-blur text-white animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between gap-2">
              {/* Compass Bearing & Arrow */}
              <div className="flex items-center gap-2.5">
                <div
                  title={`Heading: ${guidance.bearingDegrees}° ${guidance.cardinalDirection}`}
                  className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500 text-blue-400 flex items-center justify-center shrink-0 shadow-inner"
                >
                  <Navigation
                    className="w-5 h-5 text-blue-400 transition-transform duration-500"
                    style={{
                      transform: `rotate(${guidance.bearingDegrees}deg)`
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-blue-900 text-blue-300 border border-blue-700">
                      OFFLINE NAV
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {guidance.cardinalDirection} ({guidance.bearingDegrees}°)
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-[210px] sm:max-w-xs mt-0.5">
                    {activeNavFacility.name}
                  </h4>
                </div>
              </div>

              {/* Dismiss / Close Nav */}
              <button
                onClick={() => {
                  setActiveNavFacility(null);
                  if (onSelectFacility) onSelectFacility(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Distance & Time Row */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-white text-sm">
                  {guidance.distanceFormatted}
                </span>
                <span className="text-slate-400 text-[11px]">
                  🚶 ~{guidance.estimatedWalkingMinutes} min walk
                </span>
                <span className="text-rose-400 text-[11px] font-medium hidden sm:inline">
                  🏃 ~{guidance.estimatedRunningMinutes} min sprint
                </span>
              </div>

              {/* Direct Call Button */}
              {activeNavFacility.phoneNumber && (
                <a
                  href={`tel:${activeNavFacility.phoneNumber}`}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Safe Desk</span>
                </a>
              )}
            </div>

            {/* Emergency Guidance Step text */}
            <p className="mt-2 text-[11px] text-slate-300 leading-snug bg-slate-900/90 rounded-lg p-2 border border-slate-800">
              {guidance.guidanceText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
