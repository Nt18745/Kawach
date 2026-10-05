/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { Compass, Crosshair, Layers, Navigation, ZoomIn, ZoomOut } from 'lucide-react';

interface BreadcrumbPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
}

interface GoogleLiveMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  userName?: string;
  userPhone?: string;
  batteryLevel?: number;
  speedKmh?: number;
  heading?: number;
  breadcrumbs?: BreadcrumbPoint[];
  className?: string;
  interactive?: boolean;
  theme?: 'dark' | 'light' | 'whatsapp';
  zoom?: number;
  onPositionChange?: (lat: number, lng: number) => void;
}

// Inner helper component to draw accuracy circle and breadcrumb polyline using google.maps
const MapOverlayRenderer: React.FC<{
  lat: number;
  lng: number;
  accuracy: number;
  breadcrumbs?: BreadcrumbPoint[];
  followUser: boolean;
}> = ({ lat, lng, accuracy, breadcrumbs, followUser }) => {
  const map = useMap();
  const circleRef = useRef<google.maps.Circle | null>(null);
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Pan to user location when followUser is active
  useEffect(() => {
    if (map && followUser && !isNaN(lat) && !isNaN(lng)) {
      map.panTo({ lat, lng });
    }
  }, [map, followUser, lat, lng]);

  // Accuracy circle
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps || isNaN(lat) || isNaN(lng)) return;

    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map,
        center: { lat, lng },
        radius: Math.max(accuracy || 15, 10),
        fillColor: '#10B981',
        fillOpacity: 0.15,
        strokeColor: '#059669',
        strokeOpacity: 0.6,
        strokeWeight: 1.5,
        clickable: false
      });
    } else {
      circleRef.current.setCenter({ lat, lng });
      circleRef.current.setRadius(Math.max(accuracy || 15, 10));
    }

    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, [map, lat, lng, accuracy]);

  // Breadcrumbs polyline path
  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    if (!breadcrumbs || breadcrumbs.length < 2) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      return;
    }

    const path = breadcrumbs.map((b) => ({ lat: b.latitude, lng: b.longitude }));

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        map,
        path,
        geodesic: true,
        strokeColor: '#2563EB',
        strokeOpacity: 0.8,
        strokeWeight: 4
      });
    } else {
      polylineRef.current.setPath(path);
    }

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, breadcrumbs]);

  return null;
};

export const GoogleLiveMap: React.FC<GoogleLiveMapProps> = ({
  latitude,
  longitude,
  accuracy = 15,
  userName = 'You',
  batteryLevel,
  speedKmh,
  heading,
  breadcrumbs = [],
  className = 'w-full h-80 rounded-2xl overflow-hidden',
  interactive = true,
  theme = 'whatsapp',
  zoom = 16
}) => {
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [mapType, setMapType] = useState<string>('roadmap');

  const initial = {
    lat: isNaN(latitude) || latitude === 0 ? 28.5694 : latitude,
    lng: isNaN(longitude) || longitude === 0 ? 77.2062 : longitude
  };

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'U';

  return (
    <div className={`relative ${className} bg-slate-900 border border-slate-800 shadow-xl`}>
      <Map
        mapId="DEMO_MAP_ID"
        defaultCenter={initial}
        defaultZoom={zoom}
        gestureHandling={interactive ? 'greedy' : 'none'}
        disableDefaultUI={!interactive}
        mapTypeId={mapType}
        style={{ width: '100%', height: '100%' }}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      >
        <MapOverlayRenderer
          lat={initial.lat}
          lng={initial.lng}
          accuracy={accuracy}
          breadcrumbs={breadcrumbs}
          followUser={followUser}
        />

        {/* WhatsApp-Style Live Pulsing Avatar Beacon */}
        <AdvancedMarker position={initial} title={`${userName}'s Live Location`}>
          <div className="relative flex items-center justify-center -translate-y-1/2">
            {/* Pulsing Emerald Live Radar Ring */}
            <span className="absolute -inset-4 rounded-full bg-emerald-500/25 animate-ping pointer-events-none" />
            <span className="absolute -inset-2 rounded-full bg-emerald-500/40 pointer-events-none" />

            {/* Avatar Badge */}
            <div className="relative z-10 w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-500 p-0.5 shadow-2xl border-2 border-white ring-2 ring-emerald-500/50 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
                <span className="font-black text-xs text-emerald-400 tracking-wider">
                  {initials}
                </span>
              </div>

              {/* Live green dot indicator */}
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
            </div>

            {/* Compass Heading Indicator Arrow */}
            {heading !== undefined && heading !== null && !isNaN(heading) && (
              <div
                className="absolute -top-3 w-3 h-3 text-emerald-400 filter drop-shadow transition-transform pointer-events-none"
                style={{ transform: `rotate(${heading}deg)` }}
              >
                <Compass className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        </AdvancedMarker>
      </Map>

      {/* Floating HUD Controls */}
      {interactive && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {/* Follow User Toggle */}
          <button
            type="button"
            onClick={() => setFollowUser((prev) => !prev)}
            title={followUser ? 'Locking on Live Position' : 'Re-center on Position'}
            className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-md transition cursor-pointer ${
              followUser
                ? 'bg-emerald-600 text-white shadow-emerald-900/40'
                : 'bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${followUser ? 'animate-spin' : ''}`} />
          </button>

          {/* Map Layer Toggle (Roadmap vs Satellite) */}
          <button
            type="button"
            onClick={() =>
              setMapType((prev: string) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
            }
            title="Toggle Map Style"
            className="w-9 h-9 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center justify-center shadow-lg backdrop-blur-md transition cursor-pointer"
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* WhatsApp Live Badge Bottom Overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-200 px-3 py-1.5 rounded-xl text-[11px] shadow-lg flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-white">WhatsApp Live Location</span>
          {accuracy ? (
            <span className="text-slate-400 border-l border-slate-700 pl-2">
              &plusmn;{Math.round(accuracy)}m
            </span>
          ) : null}
          {speedKmh !== undefined && speedKmh > 1 ? (
            <span className="text-emerald-400 border-l border-slate-700 pl-2 font-mono">
              {Math.round(speedKmh)} km/h
            </span>
          ) : null}
        </div>

        {batteryLevel !== undefined && (
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800 text-slate-300 px-2.5 py-1.5 rounded-xl text-[11px] shadow-lg flex items-center gap-1.5 pointer-events-auto font-mono">
            <span>🔋</span>
            <span className="font-semibold text-white">{batteryLevel}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
