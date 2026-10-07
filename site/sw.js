/* The Storybook Table: offline saving.
 *
 * After the first visit this keeps the app, the content file, the fonts and every
 * story's main photo on the phone, so the book keeps working if the signal drops.
 *
 * - Pages, scripts, styles, content: network first (4 s), then the saved copy.
 * - Photos and fonts: the saved copy first, refreshed in the background.
 * - Audio and video stream from the network and are never cached.
 *
 * Bump VERSION only when this file's own logic changes; content and photo updates
 * are picked up without it.
 */
'use strict';

var VERSION = 'v1';
var CACHE = 'storybook-' + VERSION;
var TIMEOUT_MS = 4000;
var SCOPE_PATH = new URL(self.registration.scope).pathname;

var SHELL = [
  './',
  'assets/styles.css',
  'assets/app.js',
  'assets/icon.svg',
  'content/storybook.json',
  'assets/fonts/alegreya-latin-400-normal.woff2',
  'assets/fonts/alegreya-latin-400-italic.woff2',
  'assets/fonts/alegreya-latin-600-normal.woff2',
  'assets/fonts/nothing-you-could-do-latin-400-normal.woff2',
  'assets/fonts/dm-mono-latin-400-normal.woff2',
  'assets/fonts/dm-mono-latin-500-normal.woff2'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return cache.addAll(SHELL);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf('storybook-') === 0 && key !== CACHE;
            })
            .map(function (key) {
              return caches.delete(key);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

function inScope(url) {
  return url.origin === self.location.origin && url.pathname.indexOf(SCOPE_PATH) === 0;
}

function isMedia(request, url) {
  return (
    request.destination === 'image' ||
    request.destination === 'font' ||
    /\.(?:jpe?g|png|webp|avif|gif|svg|woff2?)$/i.test(url.pathname)
  );
}

/* Navigations share one saved copy of the page, whatever their ?t= value. */
function keyFor(request) {
  var url = new URL(request.url);
  if (request.mode === 'navigate') url.search = '';
  url.hash = '';
  return url.href;
}

function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () {
      reject(new Error('timeout'));
    }, ms);
    promise.then(
      function (value) {
        clearTimeout(timer);
        resolve(value);
      },
      function (error) {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function store(key, response) {
  if (!response || !response.ok) return Promise.resolve();
  var copy = response.clone();
  return caches.open(CACHE).then(function (cache) {
    return cache.put(key, copy);
  });
}

function networkFirst(request, finish) {
  var key = keyFor(request);
  var network = fetch(request);
  network
    .then(function (response) {
      return store(key, response);
    })
    .catch(function () {})
    .then(finish);
  return withTimeout(network, TIMEOUT_MS).catch(function () {
    return caches.match(key).then(function (saved) {
      return saved || network;
    });
  });
}

function savedFirst(request, finish) {
  return caches.match(request).then(function (saved) {
    var network = fetch(request);
    network
      .then(function (response) {
        return store(request, response);
      })
      .catch(function () {})
      .then(finish);
    return saved || network;
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  if (request.headers.has('range')) return;
  if (request.destination === 'audio' || request.destination === 'video') return;
  var url = new URL(request.url);
  if (!inScope(url)) return;

  var finish;
  event.waitUntil(
    new Promise(function (resolve) {
      finish = resolve;
    })
  );
  event.respondWith(isMedia(request, url) ? savedFirst(request, finish) : networkFirst(request, finish));
});

/* The page sends the main photos from the current content file; save any that are missing. */
self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type !== 'save' || !Array.isArray(data.urls)) return;
  var urls = data.urls.filter(function (href) {
    try {
      return inScope(new URL(href));
    } catch (e) {
      return false;
    }
  });
  event.waitUntil(
    caches
      .open(CACHE)
      .then(function (cache) {
        return Promise.all(
          urls.map(function (href) {
            return cache.match(href).then(function (hit) {
              if (hit) return true;
              return fetch(href)
                .then(function (response) {
                  if (!response.ok) return false;
                  return cache.put(href, response).then(function () {
                    return true;
                  });
                })
                .catch(function () {
                  return false;
                });
            });
          })
        );
      })
      .then(function (results) {
        var saved = results.filter(Boolean).length;
        if (event.source) {
          event.source.postMessage({ type: 'saved', saved: saved, total: urls.length, complete: saved === urls.length });
        }
      })
  );
});
