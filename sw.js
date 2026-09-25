/* El Empratour Cashier — offline cache.
   Cache first, so the till opens instantly with no network at all, and
   quietly refreshes itself in the background whenever there is one.   */

var CACHE = "ee-cashier-v23";

/* "./" and "index.html" are the SAME document. Caching both meant only the
   one the person happened to navigate to got refreshed, and the other stayed
   frozen on whatever build was installed first — so opening the till by its
   full address could serve a version from months ago, with no symptom. One
   entry now, and every navigation resolves to it. */
var PAGE = "./";
var SHELL = [PAGE, "config.js", "manifest.json", "icon-192.png", "icon-512.png"];

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

/* Is this request for the app's own page? Any navigation is — "./",
   "index.html", and either of them carrying a ?utm= or ?v= that a shared
   link or a cache-buster tacked on. Those used to miss the cache entirely
   and, offline, return undefined from respondWith — a dead page. */
function isPage(req, url) {
  if (req.mode === "navigate") return true;
  if (url.origin !== self.location.origin) return false;
  var p = url.pathname;
  return p === self.registration.scope.replace(self.location.origin, "") ||
         /(^|\/)index\.html$/.test(p) || /\/$/.test(p);
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

  var page = isPage(req, url);

  e.respondWith(
    caches.open(CACHE).then(function (c) {
      var key = page ? PAGE : req;
      return c.match(key, { ignoreSearch: true }).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && (res.ok || res.type === "opaque")) {
            var copy = res.clone();
            c.put(key, copy).catch(function () {});
          }
          return res;
        }).catch(function () {
          // offline and nothing cached for this exact thing: for a page,
          // fall back to the app shell rather than showing a dead tab
          return hit || (page ? c.match(PAGE) : undefined);
        });
        return hit || net;
      });
    })
  );
});

/* The page asks for the new version the moment one is waiting, instead of
   the person having to reload twice and guess whether it worked. */
self.addEventListener("message", function (e) {
  if (e.data === "skipWaiting") self.skipWaiting();
});
