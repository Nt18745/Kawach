/**
 * Tile Cache Service & Offline Navigation Engine for Leaflet & Kawach
 * Implements client-side Map Tile Caching using IndexedDB as the primary persistent binary store
 * (with CacheStorage API and dynamic tactical canvas fallback) ensuring essential navigation
 * remains functional when internet connection is lost or unstable during an emergency.
 */

import {
  indexedDbTileStore,
  IndexedDbTileRecord,
  IndexedDbAreaRecord,
  UserVicinityData
} from './indexedDbTileStore';

export interface VicinityCacheOptions {
  radiusKm?: number;
  minZoom?: number;
  maxZoom?: number;
  autoPersistFacilities?: boolean;
}

export interface TileCoordinate {
  x: number;
  y: number;
  z: number;
  url: string;
}

export interface CacheProgress {
  total: number;
  completed: number;
  successful: number;
  failed: number;
  percent: number;
  status: 'idle' | 'caching' | 'completed' | 'cancelled' | 'error';
  error?: string;
  storageEngine?: 'IndexedDB' | 'CacheStorage' | 'hybrid';
  savedBytes?: number;
}

export interface CachedAreaMetadata {
  center: { lat: number; lng: number };
  radiusKm: number;
  timestamp: number;
  tileCount: number;
  minZoom: number;
  maxZoom: number;
  storageEngine?: string;
}

export interface CacheStatsResult {
  count: number;
  estimatedSizeBytes: number;
  estimatedSizeMb: string;
  metadata: CachedAreaMetadata | null;
  storageEngine: 'IndexedDB' | 'CacheStorage' | 'hybrid';
  isIndexedDB: boolean;
  areasCount?: number;
}

export interface OfflineNavigationGuidance {
  targetName: string;
  distanceMeters: number;
  distanceFormatted: string;
  bearingDegrees: number;
  cardinalDirection: string;
  estimatedWalkingMinutes: number;
  estimatedRunningMinutes: number;
  guidanceText: string;
  urgencyLevel: 'close' | 'medium' | 'far';
}

const CACHE_NAME = 'kawach-offline-map-tiles-v1';
const METADATA_KEY = 'kawach_offline_tile_metadata';
const TILE_SUBDOMAINS = ['a', 'b', 'c'];

class TileCacheService {
  private activeAbortController: AbortController | null = null;
  private memoryBlobUrls: Map<string, string> = new Map();
  private lastAutoCachedLat: number | null = null;
  private lastAutoCachedLng: number | null = null;
  private lastAutoCachedTimestamp: number = 0;
  private autoCacheTimeout: any = null;

  /**
   * Check if IndexedDB is available
   */
  isIndexedDBSupported(): boolean {
    return indexedDbTileStore.isSupported();
  }

  /**
   * Check if CacheStorage API is available in current browser/environment
   */
  isCacheSupported(): boolean {
    return typeof window !== 'undefined' && 'caches' in window;
  }

  /**
   * Build OpenStreetMap tile URL given coordinate
   */
  getTileUrl(x: number, y: number, z: number): string {
    const s = TILE_SUBDOMAINS[Math.abs(x + y) % TILE_SUBDOMAINS.length];
    return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }

  /**
   * Convert latitude, longitude and zoom level to OSM tile coordinate
   */
  latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number; z: number } {
    const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const latRad = (clampedLat * Math.PI) / 180;
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
    );
    const maxIndex = Math.pow(2, zoom) - 1;
    return {
      x: Math.max(0, Math.min(maxIndex, x)),
      y: Math.max(0, Math.min(maxIndex, y)),
      z: zoom
    };
  }

  /**
   * Generate lightweight placeholder tile when offline and tile not yet cached
   */
  generateOfflinePlaceholderDataUrl(x: number, y: number, z: number): string {
    if (typeof document === 'undefined') return '';
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Subtle dark-friendly emergency grid
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 256, 256);

      // Grid pattern
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let i = 0; i < 256; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 256);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(256, i);
        ctx.stroke();
      }

      // Border
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 256, 256);

      // Offline notice text
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ Kawach Offline Map', 128, 115);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillText('IndexedDB Storage Ready', 128, 132);

      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(`Tile ${z}/${x}/${y}`, 128, 150);

      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }

  /**
   * Retrieve tile blob URL
   * Pipeline:
   * 1. In-memory object URL cache (0ms)
   * 2. IndexedDB persistent tile store (primary local storage)
   * 3. CacheStorage API (secondary web cache)
   * 4. Network fetch (when online) with auto-storage to IndexedDB
   * 5. Emergency tactical grid placeholder fallback (when offline)
   */
  async getTileBlobUrl(url: string, coords?: { x: number; y: number; z: number }): Promise<string> {
    // 1. In-memory object URL cache
    if (this.memoryBlobUrls.has(url)) {
      return this.memoryBlobUrls.get(url)!;
    }

    const key = coords ? `${coords.z}/${coords.x}/${coords.y}` : null;

    // 2. IndexedDB Check (Primary Persistent Tile Store)
    if (this.isIndexedDBSupported()) {
      try {
        let record = key ? await indexedDbTileStore.getTile(key) : null;
        if (!record) {
          record = await indexedDbTileStore.getTileByUrl(url);
        }

        if (record && record.blob) {
          const objectUrl = URL.createObjectURL(record.blob);
          this.memoryBlobUrls.set(url, objectUrl);
          return objectUrl;
        }
      } catch (idbErr) {
        console.warn('IndexedDB tile lookup notice:', idbErr);
      }
    }

    // 3. CacheStorage Check (Secondary fallback)
    if (this.isCacheSupported()) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(url);

        if (match) {
          const blob = await match.blob();
          const objectUrl = URL.createObjectURL(blob);
          this.memoryBlobUrls.set(url, objectUrl);

          // Asynchronously migrate/store copy to IndexedDB
          if (this.isIndexedDBSupported() && coords) {
            indexedDbTileStore
              .putTile({
                key: `${coords.z}/${coords.x}/${coords.y}`,
                url,
                blob,
                size: blob.size,
                mimeType: blob.type || 'image/png',
                zoom: coords.z,
                x: coords.x,
                y: coords.y,
                timestamp: Date.now()
              })
              .catch(() => {});
          }

          return objectUrl;
        }
      } catch {
        // Cache match failed, continue to network
      }
    }

    // 4. Online Network Fetch with auto-caching to IndexedDB & CacheStorage
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const fetchPromise = fetch(url, {
          mode: 'cors',
          credentials: 'omit',
          cache: 'force-cache'
        });

        // Timeout fetch after 3.5s to prevent stalled map rendering in flaky networks
        const timeoutPromise = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Tile fetch timeout')), 3500)
        );

        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (response && response.status === 200) {
          const blob = await response.blob();

          // Save directly to IndexedDB
          if (this.isIndexedDBSupported() && coords) {
            indexedDbTileStore
              .putTile({
                key: `${coords.z}/${coords.x}/${coords.y}`,
                url,
                blob,
                size: blob.size,
                mimeType: blob.type || 'image/png',
                zoom: coords.z,
                x: coords.x,
                y: coords.y,
                timestamp: Date.now()
              })
              .catch(() => {});
          }

          // Save clone to CacheStorage if supported
          if (this.isCacheSupported()) {
            caches
              .open(CACHE_NAME)
              .then(c => c.put(url, new Response(blob.slice(), {
                headers: { 'Content-Type': blob.type || 'image/png' }
              })))
              .catch(() => {});
          }

          const objectUrl = URL.createObjectURL(blob);
          this.memoryBlobUrls.set(url, objectUrl);
          return objectUrl;
        }
      } catch {
        // Network fetch failed, will fallback to placeholder below
      }
    }

    // 5. Stylized offline tactical placeholder fallback
    if (coords) {
      return this.generateOfflinePlaceholderDataUrl(coords.x, coords.y, coords.z);
    }

    return url;
  }

  /**
   * Calculate all tile coordinates covering a circular radius around lat/lng
   */
  getTilesInRadius(
    lat: number,
    lng: number,
    radiusKm: number = 2.5,
    minZoom: number = 13,
    maxZoom: number = 16
  ): TileCoordinate[] {
    const tiles: TileCoordinate[] = [];
    const seen = new Set<string>();

    // Approximate lat/lng delta for radius in km
    const latDelta = radiusKm / 111.0;
    const lngDelta = radiusKm / (111.0 * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLng = lng - lngDelta;
    const maxLng = lng + lngDelta;

    for (let z = minZoom; z <= maxZoom; z++) {
      const nw = this.latLngToTile(maxLat, minLng, z);
      const se = this.latLngToTile(minLat, maxLng, z);

      const minX = Math.min(nw.x, se.x);
      const maxX = Math.max(nw.x, se.x);
      const minY = Math.min(nw.y, se.y);
      const maxY = Math.max(nw.y, se.y);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${z}/${x}/${y}`;
          if (!seen.has(key)) {
            seen.add(key);
            tiles.push({
              x,
              y,
              z,
              url: this.getTileUrl(x, y, z)
            });
          }
        }
      }
    }

    return tiles;
  }

  /**
   * Pre-cache tiles for user's current area using IndexedDB as the primary store
   */
  async cacheArea(
    lat: number,
    lng: number,
    radiusKm: number = 2.5,
    minZoom: number = 13,
    maxZoom: number = 16,
    onProgress?: (progress: CacheProgress) => void
  ): Promise<CacheProgress> {
    const useIndexedDB = this.isIndexedDBSupported();
    const useCacheStorage = this.isCacheSupported();

    if (!useIndexedDB && !useCacheStorage) {
      const errRes: CacheProgress = {
        total: 0,
        completed: 0,
        successful: 0,
        failed: 0,
        percent: 0,
        status: 'error',
        error: 'Neither IndexedDB nor Cache Storage are supported on this device.'
      };
      if (onProgress) onProgress(errRes);
      return errRes;
    }

    // Cancel existing caching job if any
    if (this.activeAbortController) {
      this.activeAbortController.abort();
    }
    this.activeAbortController = new AbortController();
    const signal = this.activeAbortController.signal;

    const tiles = this.getTilesInRadius(lat, lng, radiusKm, minZoom, maxZoom);
    const total = tiles.length;

    let completed = 0;
    let successful = 0;
    let failed = 0;
    let totalBytesSaved = 0;

    const areaId = `area_${Math.round(lat * 1000)}_${Math.round(lng * 1000)}_${radiusKm}km`;

    const report = (status: CacheProgress['status'] = 'caching') => {
      const progress: CacheProgress = {
        total,
        completed,
        successful,
        failed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 100,
        status,
        storageEngine: useIndexedDB ? 'IndexedDB' : 'CacheStorage',
        savedBytes: totalBytesSaved
      };
      if (onProgress) onProgress(progress);
      return progress;
    };

    report('caching');

    try {
      const CONCURRENCY = 6;
      let currentIndex = 0;

      let cacheStorageRef: Cache | null = null;
      if (useCacheStorage) {
        try {
          cacheStorageRef = await caches.open(CACHE_NAME);
        } catch {}
      }

      const worker = async () => {
        while (currentIndex < tiles.length) {
          if (signal.aborted) {
            throw new Error('Aborted by user');
          }

          const index = currentIndex++;
          const tile = tiles[index];
          const tileKey = `${tile.z}/${tile.x}/${tile.y}`;

          try {
            // 1. Check if already stored in IndexedDB
            let alreadyStored = false;
            if (useIndexedDB) {
              alreadyStored = await indexedDbTileStore.hasTile(tileKey);
            }

            if (!alreadyStored && cacheStorageRef) {
              const matched = await cacheStorageRef.match(tile.url);
              if (matched) alreadyStored = true;
            }

            if (!alreadyStored) {
              const res = await fetch(tile.url, {
                mode: 'cors',
                signal,
                cache: 'force-cache'
              });

              if (res.ok) {
                const blob = await res.blob();
                totalBytesSaved += blob.size;

                // Save to IndexedDB (Primary)
                if (useIndexedDB) {
                  await indexedDbTileStore.putTile({
                    key: tileKey,
                    url: tile.url,
                    blob,
                    size: blob.size,
                    mimeType: blob.type || 'image/png',
                    zoom: tile.z,
                    x: tile.x,
                    y: tile.y,
                    timestamp: Date.now(),
                    areaId
                  });
                }

                // Also save to CacheStorage (Secondary)
                if (cacheStorageRef) {
                  cacheStorageRef
                    .put(tile.url, new Response(blob.slice(), {
                      headers: { 'Content-Type': blob.type || 'image/png' }
                    }))
                    .catch(() => {});
                }

                successful++;
              } else {
                failed++;
              }
            } else {
              successful++;
            }
          } catch (err: any) {
            if (err?.name === 'AbortError') throw err;
            failed++;
          } finally {
            completed++;
            report('caching');
          }
        }
      };

      // Run concurrency pool
      const workers = Array.from({ length: Math.min(CONCURRENCY, tiles.length) }, () => worker());
      await Promise.all(workers);

      // Save Area Record into IndexedDB
      if (useIndexedDB) {
        const areaRecord: IndexedDbAreaRecord = {
          id: areaId,
          name: `Emergency Area (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
          centerLat: lat,
          centerLng: lng,
          radiusKm,
          tileCount: successful,
          sizeBytes: totalBytesSaved,
          minZoom,
          maxZoom,
          timestamp: Date.now()
        };
        await indexedDbTileStore.saveArea(areaRecord).catch(() => {});
      }

      // Save metadata to localStorage for instant synchronous lookups
      const meta: CachedAreaMetadata = {
        center: { lat, lng },
        radiusKm,
        timestamp: Date.now(),
        tileCount: successful,
        minZoom,
        maxZoom,
        storageEngine: useIndexedDB ? 'IndexedDB' : 'CacheStorage'
      };
      localStorage.setItem(METADATA_KEY, JSON.stringify(meta));

      return report('completed');
    } catch (err: any) {
      if (err?.message === 'Aborted by user' || signal.aborted) {
        return report('cancelled');
      }
      const errorProgress: CacheProgress = {
        total,
        completed,
        successful,
        failed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        status: 'error',
        error: err?.message || 'Failed to cache map area'
      };
      if (onProgress) onProgress(errorProgress);
      return errorProgress;
    } finally {
      this.activeAbortController = null;
    }
  }

  /**
   * Cancel ongoing area caching
   */
  cancelCaching(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  /**
   * Cache the user's last known vicinity data locally in IndexedDB
   * Stores:
   * - Leaflet map tiles for zoom 13-16 covering the perimeter
   * - Nearby verified emergency facilities (police, hospitals, Sakhi centres)
   * - Geographical bounding box, GPS accuracy, and sync timestamp
   */
  async cacheUserVicinity(
    lat: number,
    lng: number,
    facilities: any[] = [],
    options: VicinityCacheOptions = {},
    onProgress?: (progress: CacheProgress) => void
  ): Promise<{
    progress: CacheProgress;
    vicinityData: UserVicinityData;
  }> {
    const radiusKm = options.radiusKm || 2.5;
    const minZoom = options.minZoom || 13;
    const maxZoom = options.maxZoom || 16;

    // 1. Download and store all vicinity tiles into IndexedDB
    const progress = await this.cacheArea(lat, lng, radiusKm, minZoom, maxZoom, onProgress);

    // 2. Build the vicinity dataset
    const latDelta = radiusKm / 111.0;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const lngDelta = radiusKm / (111.0 * (cosLat || 1));

    const vicinityData: UserVicinityData = {
      id: 'last_known_vicinity',
      latitude: lat,
      longitude: lng,
      accuracy: 15,
      timestamp: Date.now(),
      address: `User Vicinity (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
      facilities: facilities || [],
      cachedTileCount: progress.successful,
      cachedRadiusKm: radiusKm,
      zoomLevels: Array.from({ length: maxZoom - minZoom + 1 }, (_, i) => minZoom + i),
      bounds: {
        north: lat + latDelta,
        south: lat - latDelta,
        east: lng + lngDelta,
        west: lng - lngDelta
      },
      lastSyncedAt: new Date().toISOString(),
      syncedWhenOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };

    // 3. Persist to IndexedDB vicinity store (and localStorage sync fallback)
    await indexedDbTileStore.saveLastKnownVicinity(vicinityData);

    this.lastAutoCachedLat = lat;
    this.lastAutoCachedLng = lng;
    this.lastAutoCachedTimestamp = Date.now();

    return { progress, vicinityData };
  }

  /**
   * Save a snapshot of the user's vicinity coordinates and facilities
   * without blocking on tile downloading
   */
  async saveUserVicinitySnapshot(
    lat: number,
    lng: number,
    facilities: any[] = [],
    radiusKm: number = 2.5
  ): Promise<UserVicinityData> {
    const latDelta = radiusKm / 111.0;
    const cosLat = Math.cos((lat * Math.PI) / 180);
    const lngDelta = radiusKm / (111.0 * (cosLat || 1));

    const existing = await indexedDbTileStore.getLastKnownVicinity();

    const vicinityData: UserVicinityData = {
      id: 'last_known_vicinity',
      latitude: lat,
      longitude: lng,
      accuracy: 15,
      timestamp: Date.now(),
      address: `User Vicinity (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`,
      facilities: facilities.length > 0 ? facilities : (existing?.facilities || []),
      cachedTileCount: existing?.cachedTileCount || 0,
      cachedRadiusKm: radiusKm,
      zoomLevels: existing?.zoomLevels || [13, 14, 15, 16],
      bounds: {
        north: lat + latDelta,
        south: lat - latDelta,
        east: lng + lngDelta,
        west: lng - lngDelta
      },
      lastSyncedAt: new Date().toISOString(),
      syncedWhenOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };

    await indexedDbTileStore.saveLastKnownVicinity(vicinityData);
    return vicinityData;
  }

  /**
   * Retrieve the user's stored vicinity data
   */
  async getLastKnownVicinity(): Promise<UserVicinityData | null> {
    return await indexedDbTileStore.getLastKnownVicinity();
  }

  /**
   * Check if user's coordinates are currently covered by the cached vicinity
   */
  async isVicinityCached(lat: number, lng: number, maxRadiusKm: number = 2.5): Promise<boolean> {
    const vicinity = await this.getLastKnownVicinity();
    if (!vicinity || vicinity.cachedTileCount === 0) return false;
    const dist = this.calculateDistanceKm(vicinity.latitude, vicinity.longitude, lat, lng);
    return dist <= (vicinity.cachedRadiusKm || maxRadiusKm);
  }

  /**
   * Debounced automatic background vicinity caching
   * Fires only if moved > 250m or > 15 minutes since last auto-cache, saving battery and bandwidth
   */
  autoCacheVicinityDebounced(
    lat: number,
    lng: number,
    facilities: any[] = [],
    delayMs: number = 2500
  ): void {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Offline, do not attempt network tile fetches
      return;
    }

    const now = Date.now();
    if (
      this.lastAutoCachedLat !== null &&
      this.lastAutoCachedLng !== null &&
      now - this.lastAutoCachedTimestamp < 15 * 60 * 1000
    ) {
      const movedKm = this.calculateDistanceKm(this.lastAutoCachedLat, this.lastAutoCachedLng, lat, lng);
      if (movedKm < 0.25) {
        return;
      }
    }

    if (this.autoCacheTimeout) {
      clearTimeout(this.autoCacheTimeout);
    }

    this.autoCacheTimeout = setTimeout(() => {
      this.cacheUserVicinity(lat, lng, facilities, { radiusKm: 2.5, minZoom: 13, maxZoom: 16 }).catch(err => {
        console.warn('Auto-cache vicinity notice:', err);
      });
    }, delayMs);
  }

  /**
   * Get cached tile stats from IndexedDB (with CacheStorage fallback/complement)
   */
  async getCacheStats(): Promise<CacheStatsResult> {
    const isIndexedDB = this.isIndexedDBSupported();

    let idbCount = 0;
    let idbSizeBytes = 0;
    let idbSizeMb = '0.00';
    let areasCount = 0;

    if (isIndexedDB) {
      try {
        const usage = await indexedDbTileStore.getStorageUsage();
        idbCount = usage.count;
        idbSizeBytes = usage.totalSizeBytes;
        idbSizeMb = usage.sizeMb;

        const areas = await indexedDbTileStore.getAllAreas();
        areasCount = areas.length;
      } catch (err) {
        console.warn('IndexedDB stats error:', err);
      }
    }

    // Check CacheStorage as fallback or supplement
    let cacheCount = 0;
    if (this.isCacheSupported()) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        cacheCount = keys.length;
      } catch {}
    }

    const effectiveCount = Math.max(idbCount, cacheCount);
    const effectiveBytes = idbSizeBytes > 0 ? idbSizeBytes : effectiveCount * 18 * 1024;
    const effectiveMb = (effectiveBytes / (1024 * 1024)).toFixed(2);

    let metadata: CachedAreaMetadata | null = null;
    try {
      const raw = localStorage.getItem(METADATA_KEY);
      if (raw) metadata = JSON.parse(raw);
    } catch {}

    return {
      count: effectiveCount,
      estimatedSizeBytes: effectiveBytes,
      estimatedSizeMb: effectiveMb,
      metadata,
      storageEngine: isIndexedDB ? 'IndexedDB' : 'CacheStorage',
      isIndexedDB,
      areasCount
    };
  }

  /**
   * Clear all cached map tiles and memory object URLs from both IndexedDB and CacheStorage
   */
  async clearCache(): Promise<boolean> {
    try {
      // 1. Revoke in-memory object URLs to prevent memory leaks
      this.memoryBlobUrls.forEach(url => URL.revokeObjectURL(url));
      this.memoryBlobUrls.clear();

      // 2. Clear IndexedDB
      if (this.isIndexedDBSupported()) {
        await indexedDbTileStore.clearAll();
      }

      // 3. Clear CacheStorage
      if (this.isCacheSupported()) {
        await caches.delete(CACHE_NAME);
      }

      // 4. Remove localStorage metadata
      localStorage.removeItem(METADATA_KEY);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Haversine formula to compute great-circle distance in kilometers
   */
  calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's mean radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Compute initial compass bearing angle in degrees from point 1 to point 2
   */
  calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const theta = Math.atan2(y, x);
    const bearing = ((theta * 180) / Math.PI + 360) % 360;
    return Math.round(bearing);
  }

  /**
   * Convert bearing angle to 16-point cardinal compass text
   */
  getCardinalDirection(bearing: number): string {
    const directions = [
      'N', 'NNE', 'NE', 'ENE',
      'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW',
      'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(bearing / 22.5) % 16;
    return directions[index];
  }

  /**
   * Generate comprehensive offline navigation guidance card for emergency use
   */
  generateNavigationGuidance(
    userLat: number,
    userLng: number,
    destLat: number,
    destLng: number,
    destName: string
  ): OfflineNavigationGuidance {
    const distanceKm = this.calculateDistanceKm(userLat, userLng, destLat, destLng);
    const distanceMeters = Math.round(distanceKm * 1000);
    const bearing = this.calculateBearing(userLat, userLng, destLat, destLng);
    const cardinal = this.getCardinalDirection(bearing);

    // Walking speed: ~4.5 km/h -> ~75 meters/min
    const walkingMinutes = Math.max(1, Math.round(distanceMeters / 75));
    // Emergency sprint: ~10 km/h -> ~166 meters/min
    const runningMinutes = Math.max(1, Math.round(distanceMeters / 166));

    let distanceFormatted = `${distanceMeters} m`;
    if (distanceMeters >= 1000) {
      distanceFormatted = `${(distanceMeters / 1000).toFixed(1)} km`;
    }

    let urgencyLevel: OfflineNavigationGuidance['urgencyLevel'] = 'close';
    if (distanceMeters > 2000) urgencyLevel = 'far';
    else if (distanceMeters > 700) urgencyLevel = 'medium';

    let guidanceText = '';
    if (distanceMeters <= 100) {
      guidanceText = `Destination is directly in your immediate vicinity (${cardinal}). Look for the entrance or illuminated safety signage.`;
    } else if (distanceMeters <= 500) {
      guidanceText = `Head ${cardinal} (${bearing}°). You are just ${distanceFormatted} away (~${walkingMinutes} min walk). Stay on well-lit thoroughfares.`;
    } else {
      guidanceText = `Maintain heading ${cardinal} (${bearing}°). Proceed steadily toward ${destName}. In emergency, keep your phone in hand ready to dial 112.`;
    }

    return {
      targetName: destName,
      distanceMeters,
      distanceFormatted,
      bearingDegrees: bearing,
      cardinalDirection: cardinal,
      estimatedWalkingMinutes: walkingMinutes,
      estimatedRunningMinutes: runningMinutes,
      guidanceText,
      urgencyLevel
    };
  }
}

export const tileCacheService = new TileCacheService();
export { indexedDbTileStore };
