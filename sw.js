/* 简易离线缓存：首次访问后，核心文件离线可用 */
const CACHE = 'shidan-v10';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './recipes.js',
  './classifier.js',
  './core.js',
  './parser.js',
  './storage.js',
  './sync.js',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ASSETS);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (res) {
        // /api/ 动态数据绝不入缓存（否则会缓存 state、破坏 SSE 流）
        if (res && res.status === 200 && event.request.url.indexOf(location.origin) === 0 && event.request.url.indexOf(location.origin + '/api/') === -1) {
          const copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      }).catch(function () {
        // API 请求失败返回空 503（而非 index.html）：SSE 会触发重连、状态接口能正确识别失败
        if (event.request.url.indexOf(location.origin + '/api/') === 0) {
          return new Response(null, { status: 503, statusText: 'Offline' });
        }
        return caches.match('./index.html');
      });
    })
  );
});
