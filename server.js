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

function staticHeaders(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const headers = { 'Content-Type': MIME[ext] || 'application/octet-stream' };
  // 文件名未带内容哈希；入口与 Worker 必须每次校验，才能可靠切换认证状态和应用版本。
  if (path.basename(filePath) === 'sw.js') {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  } else if (ext === '.html' || ext === '.js' || ext === '.css' || ext === '.webmanifest') {
    headers['Cache-Control'] = 'no-cache, must-revalidate';
  }
  return headers;
}

// 防 DNS rebinding：攻击者域名解析到家庭 IP 后可"同源"读取/覆写共享数据。
// 放行 IP/localhost/单段主机名/*.local（家庭常见访问方式）；自定义域名需配 SHIDAN_HOSTS（逗号分隔）。
function isTrustedHost(hostHeader) {
  if (!hostHeader) return false;
  const raw = String(hostHeader).toLowerCase();
  let host;
  if (raw.charAt(0) === '[') { // IPv6 字面量：[::1]:8765 → ::1
    const close = raw.indexOf(']');
    host = close > 0 ? raw.slice(1, close) : raw;
  } else {
    host = raw.split(':')[0];
  }
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;      // IPv4
  if (host.indexOf(':') !== -1 && /^[a-f0-9:.%]+$/i.test(host)) return true; // IPv6
  if (/^[a-z0-9-]+$/.test(host)) return true;                  // 单段主机名（如 nas）
  if (host.slice(-6) === '.local') return true;                // mDNS（如 nas.local）
  const extra = String(process.env.SHIDAN_HOSTS || '').split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  return extra.indexOf(host) !== -1;
}

// ===== 家庭共享数据：state.json + SSE 实时广播 =====
const DATA_DIR = path.join(ROOT, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const sseClients = new Set();

function loadDb() {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
      return { rev: Number(parsed.rev) || 0, data: parsed.data };
    }
  } catch (e) { /* 缺失或损坏：从零开始 */ }
  try { fs.unlinkSync(STATE_FILE + '.tmp'); } catch (e) { /* 无残留临时文件 */ }
  return { rev: 0, data: null };
}

const db = loadDb();

// 原子落盘：先写临时文件再重命名，崩溃不会留下半截数据；返回是否成功
function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(db));
    fs.renameSync(STATE_FILE + '.tmp', STATE_FILE);
    return true;
  } catch (e) {
    console.error('数据落盘失败', e);
    return false;
  }
}

function broadcast() {
  if (sseClients.size === 0) return;
  const payload = 'event: state\ndata: ' + JSON.stringify({ rev: db.rev, data: db.data }) + '\n\n';
  sseClients.forEach(function (res) {
    try { res.write(payload); } catch (e) { sseClients.delete(res); }
  });
}

function isValidState(d) {
  return d && typeof d === 'object' &&
    Array.isArray(d.inventory) &&
    Array.isArray(d.customRecipes) &&
    Array.isArray(d.disabledRecipes) &&
    d.settings && typeof d.settings === 'object' &&
    (d.plan === null || (d.plan && typeof d.plan === 'object')) &&
    d.shopping && typeof d.shopping === 'object' && Array.isArray(d.shopping.items) &&
    Array.isArray(d.cravings);
}

function handleState(req, res) {
  if (req.method === 'GET') {
    const since = Number(new URL(req.url, 'http://localhost').searchParams.get('rev')) || 0;
    if (db.data === null) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ rev: 0, data: null }));
      return;
    }
    if (since > 0 && since >= db.rev) { // 客户端已是最新
      res.writeHead(304);
      res.end();
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ rev: db.rev, data: db.data }));
    return;
  }
  if (req.method === 'PUT') {
    const chunks = [];
    let size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > 1024 * 1024) return; // 超限则不再累积，由 end 统一拒绝
      chunks.push(chunk);
    });
    req.on('end', function () {
      if (size > 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: '请求过大' }));
        return;
      }
      let data;
      try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: '数据格式错误' }));
        return;
      }
      if (!isValidState(data)) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: '数据字段不完整' }));
        return;
      }
      const prevRev = db.rev;
      const prevData = db.data;
      db.rev += 1;
      db.data = data;
      if (!persist()) { // 落盘失败：回滚并返回 500，不递增 rev、不广播，避免各设备误信已持久化
        db.rev = prevRev;
        db.data = prevData;
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: '数据保存失败' }));
        return;
      }
      broadcast();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, rev: db.rev }));
    });
    return;
  }
  res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ ok: false, error: '仅支持 GET/PUT' }));
}

function handleEvents(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write(': connected\n\n'); // 立即冲刷响应头
  sseClients.add(res);
  res.on('close', function () { sseClients.delete(res); });
}

// 心跳：保持连接存活，顺带清理已断开的客户端
setInterval(function () {
  sseClients.forEach(function (res) {
    try { res.write(': ping\n\n'); } catch (e) { sseClients.delete(res); }
  });
}, 25000).unref();

http.createServer(function (req, res) {
  let urlPath;
  try { urlPath = decodeURIComponent(req.url.split('?')[0]); }
  catch (e) { // 畸形百分号编码：拒绝请求而非让整个服务器崩溃
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }
  if (!isTrustedHost(req.headers.host)) { // Host 校验须在任何路由之前
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  if (urlPath.indexOf('/api/fetch') === 0) {
    handleFetch(req, res);
    return;
  }
  if (urlPath === '/api/state') {
    handleState(req, res);
    return;
  }
  if (urlPath === '/api/events') {
    handleEvents(req, res);
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
      res.writeHead(200, staticHeaders(filePath));
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
