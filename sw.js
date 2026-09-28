/* El Empratour Cashier — offline cache.
   The till must open instantly with no network at all, and must never be left
   running last month's build because somebody uploaded one file and not the
   other. So: the app's own page is fetched fresh when there is a network and
   falls back to the cache the moment there is not; everything else is served
   from the cache and refreshed behind the scenes. */

var CACHE = "ee-cashier-v28";

/* "./" and "index.html" are the SAME document. Caching both meant only the
   one the person happened to navigate to got refreshed, and the other stayed
   frozen on whatever build was installed first — so opening the till by its
   full address could serve a version from months ago, with no symptom. One
   entry now, and every navigation resolves to it. */
var PAGE = "./";
var SHELL = [PAGE, "config.js", "manifest.json", "icon-192.png", "icon-512.png"];

/* How long the page is allowed to take before the cached copy is used instead.
   Long enough for a restaurant's wifi on a bad night, short enough that nobody
   standing at the till thinks it has hung. */
var PAGE_WAIT = 2500;

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE)
      // the page itself MUST cache or the install is worthless; the rest may
      // fail without leaving the till unable to open
      .then(function (c) {
        return c.add(PAGE).then(function () {
          return Promise.all(SHELL.slice(1).map(function (u) {
            return c.add(u).catch(function () {});
          }));
        });
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* Is this request for the app's own page? Any navigation is, and so is the
   scope root or an explicit index.html — with or without the ?utm= or ?v= a
   shared link or a cache-buster tacked on. Those used to miss the cache
   entirely and, offline, return undefined from respondWith — a dead page.
   It is deliberately NOT "anything ending in a slash": answering some other
   folder with the till's own page would hide a real 404 for ever. */
function isPage(req, url) {
  if (req.mode === "navigate") return true;
  if (url.origin !== self.location.origin) return false;
  var scope = self.registration.scope.replace(self.location.origin, "");
  var p = url.pathname;
  return p === scope || p === scope + "index.html" || /(^|\/)index\.html$/.test(p);
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  var sameOrigin = url.origin === self.location.origin;
  var isFont = url.host === "fonts.googleapis.com" || url.host === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return;                 // never touch data calls
  // works under a sub-path too (…/till/api/…), not only at a domain root
  if (sameOrigin && url.pathname.indexOf("/api/") >= 0) return;

  // a range request must not be answered with the whole file and a 200
  if (req.headers && req.headers.get("range")) return;

  if (isPage(req, url)) { e.respondWith(page(e)); return; }
  e.respondWith(asset(e, req));
});

/* The page: whatever the network gives, if it gives it quickly. A new build
   therefore arrives the first time the till is opened with a signal, instead
   of one launch later — or never, on a tablet left open all night. */
function page(e) {
  return caches.open(CACHE).then(function (c) {
    return c.match(PAGE, { ignoreSearch: true }).then(function (hit) {
      var net = fetch(e.request, { cache: "no-store" }).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          // keep the worker alive until the new copy is actually written, or
          // it can be killed the moment the page is handed over and the till
          // stays on the old build indefinitely
          e.waitUntil(c.put(PAGE, copy).catch(function () {}));
        }
        return res;
      });
      if (!hit) return net.catch(function () { return c.match(PAGE); });
      // race it: the cached page appears if the network has not answered in time
      return Promise.race([
        net.catch(function () { return hit; }),
        new Promise(function (ok) { setTimeout(function () { ok(hit); }, PAGE_WAIT); })
      ]);
    });
  }).catch(function () { return fetch(e.request); });
}

/* Everything else: from the cache at once, refreshed behind it. Matched on the
   full URL including its query — answering every ?v= with the first one ever
   seen would freeze a versioned file for good. */
function asset(e, req) {
  return caches.open(CACHE).then(function (c) {
    return c.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) {
          var copy = res.clone();
          e.waitUntil(c.put(req, copy).catch(function () {}));
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }).catch(function () { return fetch(req); });
}

/* The page asks for the new version the moment one is waiting, instead of
   the person having to reload twice and guess whether it worked. */
self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});
