/* 零依赖静态文件服务器：node server.js [端口] */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8765;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer(function (req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.indexOf('/api/fetch') === 0) {
    handleFetch(req, res);
    return;
  }
  let filePath = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, function (err, st) {
    if (!err && st.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, function (err2, data) {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
      res.end(data);
    });
  });
}).listen(PORT, function () {
  console.log('食单已启动：http://localhost:' + PORT);
});

// 链接抓取代理：解决网页跨域限制，返回纯文本
function handleFetch(req, res) {
  const u = new URL(req.url, 'http://localhost:' + PORT);
  const target = u.searchParams.get('url') || '';
  if (!/^https?:\/\//i.test(target)) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: '仅支持 http/https 链接' }));
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(function () { controller.abort(); }, 15000);
  fetch(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
      'Accept-Language': 'zh-CN,zh;q=0.9'
    },
    redirect: 'follow',
    signal: controller.signal
  }).then(async function (resp) {
    const buf = await resp.arrayBuffer();
    const text = decodeBuffer(buf, resp.headers.get('content-type') || '');
    const P = require('./parser.js');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: true, url: target, status: resp.status, text: P.htmlToText(text) }));
  }).catch(function (err) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ ok: false, error: String(err.message || err) }));
  }).finally(function () { clearTimeout(timer); });
}

function decodeBuffer(buf, contentType) {
  const m = /charset=([\w-]+)/i.exec(contentType || '');
  if (m) {
    try { return new TextDecoder(m[1]).decode(buf); } catch (e) { /* 忽略，继续默认 */ }
  }
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    return new TextDecoder('utf-8').decode(buf.subarray(3));
  }
  return new TextDecoder('utf-8').decode(buf);
}
