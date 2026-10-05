/**
 * IndexedDB Tile Storage Engine for Kawach (कवच)
 * Provides persistent, structured, client-side storage for OpenStreetMap tiles
 * ensuring offline emergency maps and navigation remain fully functional
 * during severe network loss, internet blackouts, or remote areas.
 */

export interface IndexedDbTileRecord {
  key: string; // "${z}/${x}/${y}"
  url: string; // OpenStreetMap tile URL
  blob: Blob; // Raw tile image blob stored in IndexedDB
  size: number; // Size in bytes
  mimeType: string; // "image/png"
  zoom: number; // Zoom level (13 to 17)
  x: number;
  y: number;
  timestamp: number; // Unix timestamp
  areaId?: string; // Associated area identifier if pre-cached
}

export interface IndexedDbAreaRecord {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  tileCount: number;
  sizeBytes: number;
  minZoom: number;
  maxZoom: number;
  timestamp: number;
}

export interface UserVicinityData {
  id: string; // 'last_known_vicinity'
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
  facilities: any[];
  cachedTileCount: number;
  cachedRadiusKm: number;
  zoomLevels: number[];
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  lastSyncedAt: string;
  syncedWhenOnline: boolean;
}

const DB_NAME = 'kawach_indexeddb_tiles_v1';
const DB_VERSION = 2;
const TILES_STORE = 'tiles';
const AREAS_STORE = 'areas';
const VICINITY_STORE = 'vicinity_data';

class IndexedDbTileStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Check if IndexedDB is supported in current environment
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Open or initialize the IndexedDB database
   */
  open(): Promise<IDBDatabase> {
    if (!this.isSupported()) {
      return Promise.reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // 1. Create Tiles Object Store
          if (!db.objectStoreNames.contains(TILES_STORE)) {
            const tileStore = db.createObjectStore(TILES_STORE, { keyPath: 'key' });
            tileStore.createIndex('url', 'url', { unique: false });
            tileStore.createIndex('zoom', 'zoom', { unique: false });
            tileStore.createIndex('timestamp', 'timestamp', { unique: false });
            tileStore.createIndex('areaId', 'areaId', { unique: false });
          }

          // 2. Create Cached Areas Store
          if (!db.objectStoreNames.contains(AREAS_STORE)) {
            const areaStore = db.createObjectStore(AREAS_STORE, { keyPath: 'id' });
            areaStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 3. Create Last Known Vicinity Store
          if (!db.objectStoreNames.contains(VICINITY_STORE)) {
            const vicinityStore = db.createObjectStore(VICINITY_STORE, { keyPath: 'id' });
            vicinityStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        request.onsuccess = (event: Event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          db.onclose = () => {
            this.dbPromise = null;
          };
          db.onversionchange = () => {
            db.close();
            this.dbPromise = null;
          };
          resolve(db);
        };

        request.onerror = (event: Event) => {
          this.dbPromise = null;
          reject((event.target as IDBOpenDBRequest).error || new Error('Failed to open IndexedDB'));
        };

        request.onblocked = () => {
          console.warn('Kawach IndexedDB upgrade blocked by open tab.');
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Save a single tile record to IndexedDB
   */
  async putTile(record: IndexedDbTileRecord): Promise<void> {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(TILES_STORE, 'readwrite');
        const store = tx.objectStore(TILES_STORE);
        const req = store.put(record);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Store multiple tiles in a single atomic transaction
   */
  async putTilesBatch(records: IndexedDbTileRecord[]): Promise<void> {
    if (records.length === 0) return;
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(TILES_STORE, 'readwrite');
        const store = tx.objectStore(TILES_STORE);

        for (const r of records) {
          store.put(r);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('Batch transaction aborted'));
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Retrieve a tile record by its key ("${z}/${x}/${y}")
   */
  async getTile(key: string): Promise<IndexedDbTileRecord | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.open();
      return new Promise<IndexedDbTileRecord | null>((resolve, reject) => {
        const tx = db.transaction(TILES_STORE, 'readonly');
        const store = tx.objectStore(TILES_STORE);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Retrieve a tile by full URL via URL index
   */
  async getTileByUrl(url: string): Promise<IndexedDbTileRecord | null> {
    if (!this.isSupported()) return null;
    try {
      const db = await this.open();
      return new Promise<IndexedDbTileRecord | null>((resolve, reject) => {
        const tx = db.transaction(TILES_STORE, 'readonly');
        const store = tx.objectStore(TILES_STORE);
        const index = store.index('url');
        const req = index.get(url);

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  /**
   * Check if a tile key exists in IndexedDB
   */
  async hasTile(key: string): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const db = await this.open();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction(TILES_STORE, 'readonly');
        const store = tx.objectStore(TILES_STORE);
        const req = store.count(key);

        req.onsuccess = () => {
          resolve(req.result > 0);
        };
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Count total stored tiles in IndexedDB
   */
  async countTiles(): Promise<number> {
    if (!this.isSupported()) return 0;
    try {
      const db = await this.open();
      return new Promise<number>((resolve) => {
        const tx = db.transaction(TILES_STORE, 'readonly');
        const store = tx.objectStore(TILES_STORE);
        const req = store.count();

        req.onsuccess = () => {
          resolve(req.result || 0);
        };
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Calculate exact storage footprint of cached tiles in IndexedDB
   */
  async getStorageUsage(): Promise<{
    count: number;
    totalSizeBytes: number;
    sizeMb: string;
  }> {
    if (!this.isSupported()) {
      return { count: 0, totalSizeBytes: 0, sizeMb: '0.00' };
    }

    try {
      const db = await this.open();
      return new Promise((resolve) => {
        const tx = db.transaction(TILES_STORE, 'readonly');
        const store = tx.objectStore(TILES_STORE);

        let count = 0;
        let totalSizeBytes = 0;

        // Use cursor for streaming byte calculation without loading all blobs into memory simultaneously
        const cursorReq = store.openCursor();
        cursorReq.onsuccess = (e: Event) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            count++;
            const record = cursor.value as IndexedDbTileRecord;
            if (record.size) {
              totalSizeBytes += record.size;
            } else if (record.blob && record.blob.size) {
              totalSizeBytes += record.blob.size;
            } else {
              totalSizeBytes += 18 * 1024; // Average 18KB fallback
            }
            cursor.continue();
          } else {
            const sizeMb = (totalSizeBytes / (1024 * 1024)).toFixed(2);
            resolve({ count, totalSizeBytes, sizeMb });
          }
        };

        cursorReq.onerror = () => {
          resolve({ count: 0, totalSizeBytes: 0, sizeMb: '0.00' });
        };
      });
    } catch {
      return { count: 0, totalSizeBytes: 0, sizeMb: '0.00' };
    }
  }

  /**
   * Save metadata for a pre-cached emergency perimeter
   */
  async saveArea(area: IndexedDbAreaRecord): Promise<void> {
    const db = await this.open();
    return new Promise<void>((resolve, reject) => {
      try {
        const tx = db.transaction(AREAS_STORE, 'readwrite');
        const store = tx.objectStore(AREAS_STORE);
        const req = store.put(area);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Get all registered cached areas
   */
  async getAllAreas(): Promise<IndexedDbAreaRecord[]> {
    if (!this.isSupported()) return [];
    try {
      const db = await this.open();
      return new Promise<IndexedDbAreaRecord[]>((resolve) => {
        const tx = db.transaction(AREAS_STORE, 'readonly');
        const store = tx.objectStore(AREAS_STORE);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve(req.result || []);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  /**
   * Clear all tiles and areas from IndexedDB
   */
  async clearAll(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const db = await this.open();
      return new Promise<boolean>((resolve) => {
        const tx = db.transaction([TILES_STORE, AREAS_STORE], 'readwrite');
        tx.objectStore(TILES_STORE).clear();
        tx.objectStore(AREAS_STORE).clear();

        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Prune tiles older than specified days (default 30 days) to prevent device storage bloat
   */
  async pruneOldTiles(maxAgeDays: number = 30): Promise<number> {
    if (!this.isSupported()) return 0;
    const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

    try {
      const db = await this.open();
      return new Promise<number>((resolve) => {
        const tx = db.transaction(TILES_STORE, 'readwrite');
        const store = tx.objectStore(TILES_STORE);
        const index = store.index('timestamp');
        const range = IDBKeyRange.upperBound(cutoff);

        let deletedCount = 0;
        const cursorReq = index.openCursor(range);

        cursorReq.onsuccess = (e: Event) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        cursorReq.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }

  /**
   * Save the user's last known vicinity data (coordinates, nearby facilities, cached bounds)
   * Also mirrors to localStorage synchronously for instant instant zero-latency recovery
   */
  async saveLastKnownVicinity(data: UserVicinityData): Promise<void> {
    // 1. Synchronous localStorage fallback
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('kawach_last_known_vicinity', JSON.stringify(data));
      } catch (e) {
        console.warn('LocalStorage vicinity mirror failed:', e);
      }
    }

    if (!this.isSupported()) return;

    try {
      const db = await this.open();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(VICINITY_STORE, 'readwrite');
        const store = tx.objectStore(VICINITY_STORE);
        const req = store.put({ ...data, id: 'last_known_vicinity' });

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('IndexedDB saveLastKnownVicinity error:', err);
    }
  }

  /**
   * Retrieve the user's last known vicinity data from IndexedDB (or localStorage fallback)
   */
  async getLastKnownVicinity(): Promise<UserVicinityData | null> {
    // Check IndexedDB first
    if (this.isSupported()) {
      try {
        const db = await this.open();
        const fromDb = await new Promise<UserVicinityData | null>((resolve) => {
          const tx = db.transaction(VICINITY_STORE, 'readonly');
          const store = tx.objectStore(VICINITY_STORE);
          const req = store.get('last_known_vicinity');

          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });

        if (fromDb) return fromDb;
      } catch (err) {
        console.warn('IndexedDB getLastKnownVicinity fallback triggered:', err);
      }
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('kawach_last_known_vicinity');
        if (raw) {
          return JSON.parse(raw) as UserVicinityData;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Clear vicinity data store
   */
  async clearVicinity(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('kawach_last_known_vicinity');
    }
    if (!this.isSupported()) return;
    try {
      const db = await this.open();
      return new Promise<void>((resolve) => {
        const tx = db.transaction(VICINITY_STORE, 'readwrite');
        tx.objectStore(VICINITY_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // Ignore
    }
  }
}

export const indexedDbTileStore = new IndexedDbTileStore();

