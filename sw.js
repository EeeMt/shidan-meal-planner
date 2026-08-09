/* PWA 离线缓存：在线时 network-first（先访问网络，能及时发现新版本、进入 Authentik 登录流），
   仅网络不可用时才回退离线缓存；API 与 Authentik 响应绝不缓存 */
const CACHE_NAME = 'shidan-v11';

const APP_SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/recipes.js',
  '/classifier.js',
  '/core.js',
  '/parser.js',
  '/storage.js',
  '/sync.js',
  '/app.js',
  '/manifest.webmanifest'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  // API 永远访问网络，不缓存动态数据（否则会缓存 state、破坏 SSE 流）
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(function () {
        return new Response(null, {
          status: 503,
          statusText: 'Offline'
        });
      })
    );
    return;
  }

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  let response;
  try {
    response = await fetch(request);
  } catch {
    // 网络不可用：回退缓存。缓存本身出错（损坏等）也不至于抛异常，最后统一 503
    try {
      const cached = await caches.match(request);

      if (cached) {
        return cached;
      }

      if (request.mode === 'navigate') {
        const index = await caches.match('/index.html');
        if (index) {
          return index;
        }
      }
    } catch (e) { /* 走最后的 503 */ }

    return new Response(null, {
      status: 503,
      statusText: 'Offline'
    });
  }

  // 网络成功：直接返回新响应，写入缓存失败（如配额满）绝不影响本次响应
  try {
    // 只缓存本应用成功返回的内容
    // 不缓存 Authentik 重定向、登录页面或错误响应
    if (
      response.ok &&
      !response.redirected &&
      new URL(response.url).origin === self.location.origin
    ) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
  } catch (e) { /* 忽略缓存写入失败 */ }

  return response;
}
