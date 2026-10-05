/**
 * Kawach (कवच) Offline SOS Background Sync Service
 * Manages queuing of SOS alerts during network blackouts, registers Background Sync
 * with the Service Worker, and coordinates immediate dispatch via the Web Share API
 * when network connectivity is restored.
 */

import { api } from './api';

export interface QueuedSosAlert {
  id: string;
  timestamp: number;
  userName: string;
  contacts: Array<{ name: string; phone: string; priority?: string; relationship?: string }>;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  } | null;
  batteryLevel?: number | null;
  shareToken: string;
  shareUrl: string;
  smsMessage: string;
  status: 'pending' | 'syncing' | 'dispatched' | 'cancelled';
  queuedWhileOffline: boolean;
  syncAttempts: number;
  error?: string;
}

const DB_NAME = 'kawach_offline_sync_v1';
const DB_VERSION = 1;
const STORE_NAME = 'sos_queue';
const LOCAL_STORAGE_KEY = 'kawach_pending_sos_alerts';
const SYNC_TAG = 'sos-offline-alert-sync';

class OfflineSyncService {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private listeners: Set<(alerts: QueuedSosAlert[]) => void> = new Set();
  private isListeningForReconnection = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initServiceWorker();
      this.setupReconnectionListeners();
    }
  }

  /**
   * Register Service Worker with Background Sync capabilities
   */
  async initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      // Listen for Background Sync messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        const data = event.data || {};
        if (data.type === 'BACKGROUND_SYNC_RECONNECTED' || data.type === 'DISPATCH_QUEUED_SOS_NOW') {
          this.handleReconnectionTrigger(data.tag || 'sync');
        }
      });

      return reg;
    } catch (err) {
      console.warn('[OfflineSync] SW registration notice:', err);
      return null;
    }
  }

  /**
   * Open or initialize the IndexedDB queue database
   */
  private openDb(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return Promise.reject(new Error('IndexedDB not supported in this environment.'));
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('status', 'status', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };

        req.onsuccess = (e: Event) => {
          const db = (e.target as IDBOpenDBRequest).result;
          db.onclose = () => { this.dbPromise = null; };
          resolve(db);
        };

        req.onerror = () => {
          this.dbPromise = null;
          reject(req.error);
        };
      } catch (err) {
        this.dbPromise = null;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * Synchronize queued alerts to both IndexedDB and localStorage
   */
  private async syncSaveAlert(alert: QueuedSosAlert): Promise<void> {
    // 1. IndexedDB
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(alert);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (idbErr) {
      console.warn('[OfflineSync] IDB save notice:', idbErr);
    }

    // 2. localStorage mirror for synchronous safety
    try {
      const all = this.getLocalStorageAlerts();
      const existingIdx = all.findIndex(a => a.id === alert.id);
      if (existingIdx >= 0) {
        all[existingIdx] = alert;
      } else {
        all.push(alert);
      }
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(all));
    } catch {}

    this.notifyListeners();
  }

  private getLocalStorageAlerts(): QueuedSosAlert[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Queue an emergency SOS alert when the device is offline
   */
  async queueSosAlert(params: {
    userName: string;
    contacts: Array<{ name: string; phone: string; priority?: string; relationship?: string }>;
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      address?: string;
    } | null;
    batteryLevel?: number | null;
    shareToken: string;
    shareUrl: string;
    smsMessage: string;
  }): Promise<QueuedSosAlert> {
    const alert: QueuedSosAlert = {
      id: `sos-alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      userName: params.userName,
      contacts: params.contacts,
      location: params.location,
      batteryLevel: params.batteryLevel,
      shareToken: params.shareToken,
      shareUrl: params.shareUrl,
      smsMessage: params.smsMessage,
      status: 'pending',
      queuedWhileOffline: true,
      syncAttempts: 0
    };

    await this.syncSaveAlert(alert);

    // Register Background Sync with Service Worker
    await this.registerBackgroundSyncTag();

    // Broadcast event for UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('kawach-sos-queued', {
          detail: { alert }
        })
      );
    }

    return alert;
  }

  /**
   * Request the Service Worker to register the Background Sync tag
   */
  async registerBackgroundSyncTag(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      if ('sync' in reg) {
        await (reg as any).sync.register(SYNC_TAG);
        return true;
      } else if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'REGISTER_SOS_SYNC'
        });
        return true;
      }
    } catch (err) {
      console.warn('[OfflineSync] Background Sync register notice:', err);
    }

    return false;
  }

  /**
   * Retrieve all pending queued SOS alerts
   */
  async getPendingAlerts(): Promise<QueuedSosAlert[]> {
    try {
      const db = await this.openDb();
      return new Promise<QueuedSosAlert[]>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          const list: QueuedSosAlert[] = req.result || [];
          const pending = list.filter(a => a.status === 'pending');
          resolve(pending);
        };
        req.onerror = () => {
          const local = this.getLocalStorageAlerts().filter(a => a.status === 'pending');
          resolve(local);
        };
      });
    } catch {
      return this.getLocalStorageAlerts().filter(a => a.status === 'pending');
    }
  }

  /**
   * Mark alert as dispatched
   */
  async markAlertDispatched(id: string): Promise<void> {
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const getReq = store.get(id);

        getReq.onsuccess = () => {
          if (getReq.result) {
            const item = getReq.result as QueuedSosAlert;
            item.status = 'dispatched';
            store.put(item);
          }
          resolve();
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch {}

    try {
      const local = this.getLocalStorageAlerts();
      const item = local.find(a => a.id === id);
      if (item) item.status = 'dispatched';
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(local));
    } catch {}

    this.notifyListeners();
  }

  /**
   * Clear all queued alerts
   */
  async clearAllAlerts(): Promise<void> {
    try {
      const db = await this.openDb();
      await new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
      });
    } catch {}

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    this.notifyListeners();
  }

  /**
   * Dispatch a queued alert immediately using the Web Share API
   */
  async dispatchViaWebShare(alert: QueuedSosAlert): Promise<{
    success: boolean;
    method: 'web_share' | 'native_sms' | 'clipboard';
    error?: string;
  }> {
    // 1. Try Web Share API (native sheet for SMS, WhatsApp, Contacts, Messages)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `🚨 EMERGENCY SOS - ${alert.userName}`,
          text: alert.smsMessage,
          url: alert.shareUrl
        });

        await this.markAlertDispatched(alert.id);
        this.triggerBackendNotification(alert).catch(() => {});

        return { success: true, method: 'web_share' };
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return { success: false, method: 'web_share', error: 'Share dialog was cancelled.' };
        }
        console.warn('[OfflineSync] Web Share API notice, attempting native SMS URI fallback:', err);
      }
    }

    // 2. Fallback to native SMS protocol URI (direct device dialer/composer)
    try {
      const phones = alert.contacts
        .map(c => c.phone.replace(/[^\d+]/g, ''))
        .filter(Boolean)
        .join(',');

      const smsUri = `sms:${phones}?body=${encodeURIComponent(alert.smsMessage)}`;
      const link = document.createElement('a');
      link.href = smsUri;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await this.markAlertDispatched(alert.id);
      this.triggerBackendNotification(alert).catch(() => {});

      return { success: true, method: 'native_sms' };
    } catch (fallbackErr: any) {
      // 3. Fallback to Clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(alert.smsMessage);
        return { success: true, method: 'clipboard' };
      }
      return { success: false, method: 'native_sms', error: fallbackErr?.message || 'Could not dispatch alert.' };
    }
  }

  /**
   * Forward alert to backend notification service upon reconnection as carrier backup
   */
  private async triggerBackendNotification(alert: QueuedSosAlert): Promise<void> {
    try {
      await api.dispatchNotifications({
        type: 'sos_alert',
        message: alert.smsMessage,
        shareToken: alert.shareToken,
        recipients: alert.contacts
      });
    } catch (err) {
      console.warn('[OfflineSync] Backend notification forward notice:', err);
    }
  }

  /**
   * Listen to browser reconnection events
   */
  private setupReconnectionListeners(): void {
    if (this.isListeningForReconnection) return;
    this.isListeningForReconnection = true;

    window.addEventListener('online', () => {
      this.handleReconnectionTrigger('online_event');
    });
  }

  /**
   * Handle reconnection trigger from either browser online event or Service Worker Background Sync
   */
  async handleReconnectionTrigger(source: string): Promise<void> {
    const pending = await this.getPendingAlerts();
    if (pending.length === 0) return;

    // Dispatch custom event to notify React UI to display the immediate Web Share trigger prompt
    window.dispatchEvent(
      new CustomEvent('kawach-sos-reconnected-ready', {
        detail: {
          pendingAlerts: pending,
          source,
          timestamp: Date.now()
        }
      })
    );
  }

  /**
   * Subscribe to changes in pending alerts
   */
  onPendingAlertsChange(callback: (alerts: QueuedSosAlert[]) => void): () => void {
    this.listeners.add(callback);
    this.getPendingAlerts().then(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private async notifyListeners(): Promise<void> {
    const pending = await this.getPendingAlerts();
    this.listeners.forEach(cb => cb(pending));
  }
}

export const offlineSyncService = new OfflineSyncService();
