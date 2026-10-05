/**
 * Leaflet Map Layer Cache for User Vicinity Data
 * Seamlessly delivers cached map tiles, nearby emergency facilities, and tactical fallback
 * directly from client-side IndexedDB when mobile data or network connectivity is interrupted.
 */

import L from 'leaflet';
import { tileCacheService } from './tileCacheService';
import { UserVicinityData } from './indexedDbTileStore';

export interface VicinityTileLayerOptions extends L.TileLayerOptions {
  onTileResolved?: (source: 'cache' | 'network' | 'fallback', coords: L.Coords) => void;
  showTileMetrics?: boolean;
}

export interface VicinityLayerMetrics {
  cacheHits: number;
  networkHits: number;
  fallbackHits: number;
  totalRequested: number;
  cacheRatio: number;
}

/**
 * Production Leaflet TileLayer that intercepts all tile requests to prioritize
 * locally cached vicinity tiles from IndexedDB, caching newly fetched tiles automatically,
 * and falling back gracefully to high-contrast tactical navigation tiles when offline.
 */
export class VicinityCachedTileLayer extends L.TileLayer {
  private cacheHitCount: number = 0;
  private networkHitCount: number = 0;
  private fallbackHitCount: number = 0;
  private optionsRef: VicinityTileLayerOptions;

  constructor(
    urlTemplate: string = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: VicinityTileLayerOptions = {}
  ) {
    super(urlTemplate, {
      maxZoom: 19,
      minZoom: 1,
      subdomains: ['a', 'b', 'c'],
      crossOrigin: true,
      ...options
    });
    this.optionsRef = options;
  }

  override createTile(coords: L.Coords, done: (error: any, tile: HTMLImageElement) => void): HTMLImageElement {
    const tile = document.createElement('img');
    tile.alt = `Map Tile ${coords.z}/${coords.x}/${coords.y}`;
    tile.setAttribute('role', 'presentation');

    const url = this.getTileUrl(coords);

    tileCacheService
      .getTileBlobUrl(url, { x: coords.x, y: coords.y, z: coords.z })
      .then(blobOrDataUrl => {
        const isTacticalFallback = blobOrDataUrl.startsWith('data:image/png;base64,');
        const isFromBlob = blobOrDataUrl.startsWith('blob:');

        if (isTacticalFallback) {
          this.fallbackHitCount++;
          if (this.optionsRef.onTileResolved) {
            this.optionsRef.onTileResolved('fallback', coords);
          }
          this.fire('tilefallback', { coords, url });
        } else if (isFromBlob) {
          this.cacheHitCount++;
          if (this.optionsRef.onTileResolved) {
            this.optionsRef.onTileResolved('cache', coords);
          }
          this.fire('tilefromcache', { coords, url });
        } else {
          this.networkHitCount++;
          if (this.optionsRef.onTileResolved) {
            this.optionsRef.onTileResolved('network', coords);
          }
          this.fire('tilefromnetwork', { coords, url });
        }

        tile.src = blobOrDataUrl;
        L.DomEvent.on(tile, 'load', () => done(null, tile));
        L.DomEvent.on(tile, 'error', (err) => {
          // If loaded blob fails, gracefully draw offline placeholder
          tile.src = tileCacheService.generateOfflinePlaceholderDataUrl(coords.x, coords.y, coords.z);
          done(null, tile);
        });
      })
      .catch(() => {
        this.fallbackHitCount++;
        tile.src = tileCacheService.generateOfflinePlaceholderDataUrl(coords.x, coords.y, coords.z);
        L.DomEvent.on(tile, 'load', () => done(null, tile));
        L.DomEvent.on(tile, 'error', (err) => done(err, tile));
      });

    return tile;
  }

  /**
   * Returns live metrics of cache efficiency
   */
  getMetrics(): VicinityLayerMetrics {
    const total = this.cacheHitCount + this.networkHitCount + this.fallbackHits;
    return {
      cacheHits: this.cacheHitCount,
      networkHits: this.networkHitCount,
      fallbackHits: this.fallbackHitCount,
      totalRequested: total,
      cacheRatio: total > 0 ? Math.round((this.cacheHitCount / total) * 100) : 0
    };
  }

  /**
   * Reset runtime counter stats
   */
  resetMetrics(): void {
    this.cacheHitCount = 0;
    this.networkHitCount = 0;
    this.fallbackHitCount = 0;
  }
}

/**
 * Factory helper to construct a VicinityCachedTileLayer for any Leaflet map instance
 */
export function createVicinityMapLayer(options?: VicinityTileLayerOptions): VicinityCachedTileLayer {
  return new VicinityCachedTileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options
  );
}
