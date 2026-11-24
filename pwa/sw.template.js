/* Companion service worker.
   Makes the app installable, quick to open, and readable offline.
   The build fills in VERSION and PRECACHE (see the pwa plugin in vite.config.ts). */

var VERSION = '__VERSION__';
var PRECACHE = __PRECACHE__;

var SHELL = 'gc-shell-' + VERSION; // the app itself: page, scripts, styles, icons
var DATA = 'gc-data'; // last known library, profile, Codex and quests
var MEDIA = 'gc-media'; // covers, screenshots and uploaded pictures already seen
var MEDIA_MAX = 400;
var KEEP_SHELLS = 2; // an app left open on the old version can still load its pieces

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(SHELL)
      .then(function (cache) {
        // One missing file shouldn't fail the whole install.
        return Promise.all(
          PRECACHE.map(function (url) {
            return cache.add(new Request(url, { cache: 'reload' })).catch(function () {});
          }),
        );
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        var shells = keys
          .filter(function (key) {
            return key.indexOf('gc-shell-') === 0;
          })
          .sort(function (a, b) {
            return Number(b.slice(9)) - Number(a.slice(9));
          });
        var keep = shells.slice(0, KEEP_SHELLS).concat([DATA, MEDIA]);
        return Promise.all(
          keys.map(function (key) {
            if (keep.indexOf(key) < 0) return caches.delete(key);
          }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

function save(cacheName, key, response) {
  return caches.open(cacheName).then(function (cache) {
    // Partial responses can't be stored, so a failed put is fine.
    return cache.put(key, response).catch(function () {});
  });
}

function trim(cacheName, max) {
  caches.open(cacheName).then(function (cache) {
    cache.keys().then(function (keys) {
      for (var i = 0; i < keys.length - max; i++) cache.delete(keys[i]);
    });
  });
}

// The page: fresh when online, the cached copy when not.
function page(request) {
  return fetch(request)
    .then(function (response) {
      if (response && response.ok) save(SHELL, './', response.clone());
      return response;
    })
    .catch(function () {
      return caches.match('./').then(function (hit) {
        return hit || caches.match('./index.html');
      });
    });
}

// Built files have a hash in their name, so a stored copy never goes stale.
function cacheFirst(request, cacheName, key, max) {
  var cacheKey = key || request;
  return caches.match(cacheKey).then(function (hit) {
    if (hit) return hit;
    return fetch(request).then(function (response) {
      if (response && (response.ok || response.type === 'opaque')) {
        save(cacheName, cacheKey, response.clone()).then(function () {
          if (max) trim(cacheName, max);
        });
      }
      return response;
    });
  });
}

// Data: always ask the server, and keep the answer for when there's no signal.
function networkFirst(request, cacheName) {
  return fetch(request)
    .then(function (response) {
      if (response && response.ok) save(cacheName, request.url, response.clone());
      return response;
    })
    .catch(function () {
      return caches.match(request.url).then(function (hit) {
        return hit || Response.error();
      });
    });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return; // saving always goes to the network

  var url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(page(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL));
    return;
  }

  // Box art and screenshots from IGDB never change at a given address.
  if (url.hostname === 'images.igdb.com') {
    event.respondWith(cacheFirst(request, MEDIA, null, MEDIA_MAX));
    return;
  }

  if (/\.supabase\.co$/.test(url.hostname)) {
    // Uploaded pictures: signed links change, so store them by path and ignore the token.
    if (url.pathname.indexOf('/storage/v1/object') > -1) {
      event.respondWith(cacheFirst(request, MEDIA, url.origin + url.pathname, MEDIA_MAX));
      return;
    }
    if (url.pathname.indexOf('/rest/v1/') > -1) {
      event.respondWith(networkFirst(request, DATA));
    }
    // Sign-in and the IGDB function always go straight to the network.
  }
});

self.addEventListener('message', function (event) {
  // Signing out forgets the stored data, so the next account doesn't see it.
  if (event.data === 'signed-out') caches.delete(DATA);
});
