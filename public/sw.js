// Kawach (HER-SAFE) Service Worker
// Offline First Emergency Resilience & Background Sync Handler for SOS Alerts
const CACHE_NAME = 'kawach-core-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

const SYNC_TAG_SOS = 'sos-offline-alert-sync';
const SYNC_TAG_SOS_LEGACY = 'sos-alert-sync';

// 1. Installation & Cache Pre-caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activation & Cache Migration
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && !key.startsWith('kawach-offline-map-tiles')) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Background Sync API Event Handler
// Triggered automatically by the browser as soon as network connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG_SOS || event.tag === SYNC_TAG_SOS_LEGACY) {
    event.waitUntil(handleSosBackgroundSync(event.tag));
  }
});

// 4. Background Sync Processing & Client Notification
async function handleSosBackgroundSync(syncTag) {
  try {
    // Notify all active browser window clients that network reconnection was detected
    const clientList = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    const notifyPayload = {
      type: 'BACKGROUND_SYNC_RECONNECTED',
      tag: syncTag,
      timestamp: Date.now(),
      readyForWebShare: true,
      message: 'Network connection restored. Queued emergency SOS alerts ready to dispatch via Web Share.'
    };

    let clientNotified = false;
    for (const client of clientList) {
      client.postMessage(notifyPayload);
      clientNotified = true;
    }

    // If app is not in the foreground or active tab, display a high-priority system notification
    if (!clientNotified || clientList.length === 0) {
      await self.registration.showNotification('🚨 Kawach Emergency SOS - Reconnected', {
        body: 'Network restored! Tap to immediately send your queued emergency SOS alert to trusted contacts.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: 'sos-sync-notification',
        requireInteraction: true,
        vibrate: [300, 100, 300, 100, 300],
        data: {
          url: '/?action=dispatch-queued-sos'
        }
      });
    }
  } catch (err) {
    console.warn('[SW Background Sync] Error during SOS sync dispatch:', err);
  }
}

// 5. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'DISPATCH_QUEUED_SOS_NOW' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 6. Client Message Communication
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  if (type === 'PING') {
    event.ports && event.ports[0] && event.ports[0].postMessage({ type: 'PONG', status: 'active' });
    return;
  }

  if (type === 'REGISTER_SOS_SYNC') {
    if ('sync' in self.registration) {
      self.registration.sync.register(SYNC_TAG_SOS)
        .then(() => {
          event.source && event.source.postMessage({
            type: 'SOS_SYNC_REGISTERED',
            success: true
          });
        })
        .catch((err) => {
          event.source && event.source.postMessage({
            type: 'SOS_SYNC_REGISTERED',
            success: false,
            error: err.message
          });
        });
    }
  }
});

// 7. Network Request Interceptor
self.addEventListener('fetch', (event) => {
  // Pass non-GET and mutations through network directly
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // If calling local /api/
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        // Fallback for offline API query if cached in cache API
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({
          offline: true,
          error: 'Network unavailable. Offline queue and cached databases active.'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
