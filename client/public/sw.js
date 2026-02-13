// Offchat Service Worker for PWA functionality
const CACHE_NAME = 'offchat-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline usage
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/icon.png',
  '/offline.html',
  // Add other critical assets here
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(CACHE_ASSETS);
      })
      .catch(err => {
        console.error('[ServiceWorker] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // Handle navigation requests
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then(cache => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
  } else {
    // Handle other requests
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
        })
    );
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: '/logo.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Offchat',
        icon: '/logo.png'
      },
      {
        action: 'close',
        title: 'Close notification',
        icon: '/icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Offchat', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[ServiceWorker] Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline message sending
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[ServiceWorker] Background sync');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline message queue
  try {
    const cache = await caches.open(CACHE_NAME);
    const offlineRequests = await cache.match('/offline-requests');
    
    if (offlineRequests) {
      const requests = await offlineRequests.json();
      
      for (const request of requests) {
        try {
          await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body
          });
        } catch (error) {
          console.error('[ServiceWorker] Failed to sync request:', error);
        }
      }
      
      // Clear the offline requests after successful sync
      await cache.delete('/offline-requests');
    }
  } catch (error) {
    console.error('[ServiceWorker] Background sync failed:', error);
  }
}