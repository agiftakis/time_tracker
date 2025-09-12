const CACHE_NAME = 'timetracker-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cache for API requests
  if (event.request.url.includes('/api/')) {
    return fetch(event.request);
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
      .catch(() => {
        // Return offline page if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Background sync for offline time entries
self.addEventListener('sync', (event) => {
  if (event.tag === 'time-entry-sync') {
    event.waitUntil(syncTimeEntries());
  }
});

async function syncTimeEntries() {
  try {
    // Get pending time entries from IndexedDB
    const pendingEntries = await getPendingTimeEntries();
    
    for (const entry of pendingEntries) {
      try {
        const response = await fetch('/api/time-entries/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        });
        
        if (response.ok) {
          await removePendingTimeEntry(entry.id);
        }
      } catch (error) {
        console.log('Sync failed for entry:', entry.id);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Mock functions for IndexedDB operations
async function getPendingTimeEntries() {
  // Implementation would use IndexedDB to store offline entries
  return [];
}

async function removePendingTimeEntry(id) {
  // Implementation would remove synced entry from IndexedDB
  return Promise.resolve();
}
