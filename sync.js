/* 家庭共享同步：初始对账、SSE 实时接收、长轮询兼容通道、离线回退 */
(function () {
  'use strict';

  const S = window.Storage;

  const cfg = {};
  let es = null;           // EventSource
  let lastRev = 0;         // 本地已知的服务器版本
  let dirty = false;       // 有未上传到服务器的本地修改
  let skipped = false;     // 编辑中被暂缓的远端变更
  let pushing = 0;         // 在途 PUT 数量
  let pendingSnapshot = null; // 在途 PUT 期间产生的新快照，完成后补推
  let failureCount = 0;    // EventSource 连续失败次数
  let status = 'offline';
  let syncInFlight = null;
  let fallbackTimer = null;
  let longPollActive = false;
  let longPollRetry = null;
  let longPollSupported = true; // 旧服务器没有 /api/wait（404）→ 禁用通道
  let lastErrorSync = 0;        // onError 触发对账的节流时间戳
  const FOREGROUND_SYNC_MS = 3000;
  const BACKGROUND_SYNC_MS = 30000;
  const LONG_POLL_TIMEOUT_MS = 30000;  // 请求超时须大于服务器 25s 保持时长
  const LONG_POLL_BACKOFF_MS = 5000;   // 服务器立即回包（有变更但暂未消费）时的退避

  function loadRev() {
    try { return Number(S.load('rev', 0)) || 0; } catch (e) { return 0; }
  }

  function saveRev(n) {
    try { S.save('rev', n); } catch (e) { /* 忽略 */ }
  }

  function setStatus(s) {
    if (s === status) return;
    status = s;
    if (typeof cfg.onStatus === 'function') {
      try { cfg.onStatus(s); } catch (e) { /* 忽略 */ }
    }
  }

  // 播种确认被拒绝后，本标签页会话内不再重复询问
  function seedDeclined() {
    try { return sessionStorage.getItem('shidan.seedDeclined') === '1'; } catch (e) { return false; }
  }

  function markSeedDeclined() {
    try { sessionStorage.setItem('shidan.seedDeclined', '1'); } catch (e) { /* 忽略 */ }
  }

  // 带超时的请求：服务器假死（如磁盘卡死）时避免同步永久停摆，与 /api/fetch 代理的 15s 一致
  function timedFetch(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs || 15000);
    return fetch(url, Object.assign({ signal: controller.signal }, options))
      .finally(function () { clearTimeout(timer); });
  }

  // 条件拉取：rev 已知且未变时服务器返回 304（null）
  async function getState(rev) {
    const res = await timedFetch('/api/state' + (rev ? '?rev=' + rev : ''));
    if (res.status === 304) return null;
    if (!res.ok) throw new Error('state ' + res.status);
    return await res.json();
  }

  // 深拷贝快照：在途请求不被后续本地变更串改
  function snapshot() {
    return JSON.parse(JSON.stringify(cfg.getState()));
  }

  async function putState(data) {
    const res = await timedFetch('/api/state', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok || !json.ok) throw new Error('put ' + res.status);
    return json.rev;
  }

  // 应用远端状态；返回 true 表示该 rev 已消费
  function applyRemote(body) {
    if (body.rev <= lastRev) return false; // 已消费或晚到的快照：不重复应用（SSE 与长轮询会投递同一 rev）
    let ok = true;
    if (typeof cfg.applyState === 'function') {
      try { ok = cfg.applyState(body.data); } catch (e) { ok = false; }
    }
    if (ok) {
      lastRev = body.rev;
      saveRev(lastRev);
      skipped = false;
    } else {
      skipped = true; // 编辑中：暂缓，稍后由刷新补齐
    }
    return ok;
  }

  // 对账例程：EventSource open 时执行（首次连接与每次自动重连）
  async function fullSyncOnce() {
    try {
      const body = await getState(lastRev);
      if (body === null) {
        setStatus('online');
        if (dirty) await pushLocal(); // 已是最新，但还有离线期间未上传的本地修改
        return;
      }
      if (body.data === null) {
        // 服务器从零开始（首次部署或文件被删）：本机有数据则询问是否播种迁移
        lastRev = 0;
        saveRev(0);
        if (cfg.hasLocalData && cfg.hasLocalData() && !seedDeclined()) {
          if (cfg.confirmSeed && !cfg.confirmSeed()) {
            markSeedDeclined(); // 用户拒绝：本会话内不再重复询问
          } else {
            await pushLocal(); // 失败时 pushLocal 已置离线，此处不再覆盖为在线
          }
        }
        if (!dirty) setStatus('online');
        return;
      }
      if (dirty) {
        // 有未上传的本地修改：先推送（以"后写"身份胜出），不应用远端，由 PUT 回显收敛
        // （先应用远端会抹掉离线期间的修改，且推送的将是远端数据本身——静默数据丢失）
        await pushLocal();
      } else {
        applyRemote(body);
        setStatus('online');
      }
    } catch (e) {
      setStatus('offline');
      console.warn('同步拉取失败，继续使用本地数据', e);
    }
  }

  // 多个触发源（首屏、SSE、定时器）共用同一次网络请求，避免慢网下并发对账。
  function fullSync() {
    if (syncInFlight) return syncInFlight;
    syncInFlight = fullSyncOnce().finally(function () { syncInFlight = null; });
    return syncInFlight;
  }

  // 推送本地状态到服务器；失败则标记 dirty 待重试
  async function pushLocal() {
    if (!cfg.getState) return;
    if (pushing > 0) {
      pendingSnapshot = snapshot(); // 合并多次快速修改：只补推最新一份
      return;
    }
    pushing++;
    try {
      const data = pendingSnapshot || snapshot();
      pendingSnapshot = null;
      const rev = await putState(data);
      lastRev = Math.max(lastRev, rev);
      saveRev(lastRev);
      dirty = false;
      setStatus('online');
    } catch (e) {
      dirty = true;
      setStatus('offline');
      console.warn('同步失败，修改仅保存在本机', e);
    } finally {
      pushing--;
      if (pendingSnapshot !== null) pushLocal(); // 补推期间产生的新修改
    }
  }

  function receiveRemote(body) {
    if (dirty) {
      // 有未上传的本地修改：不应用远端（避免顶掉离线修改）；在途 PUT 完成后的回显会收敛
      if (pushing === 0) pushLocal();
    } else {
      applyRemote(body); // 自己 PUT 的回显会原样应用（JSON 全等比较后不重渲染）
      setStatus('online'); // 实时事件即证明连接健康：兜底 fullSync 偶发失败后徽标一直离线
    }
  }

  function onState(ev) {
    let body;
    try { body = JSON.parse(ev.data); } catch (e) { return; }
    receiveRemote(body);
  }

  function onOpen() {
    failureCount = 0;
    fullSync();
  }

  function onError() {
    // SSE 经反向代理断开不等于服务器不可达；走 HTTP 对账，由实际
    // /api/state 结果决定在线状态，避免在可同步时错误显示“离线”。
    // 浏览器约 3s 自动重连一次，重连失败会密集触发 onError：节流对账请求。
    const now = Date.now();
    if (now - lastErrorSync > 5000) {
      lastErrorSync = now;
      fullSync();
    }
    // 静态托管等 /api/events 不可用的场景：限制自动重连频率，避免风暴
    failureCount++;
    if (failureCount >= 10 && es) {
      es.close();
      es = null;
      setTimeout(connect, 30000);
    }
  }

  function connect() {
    if (es) return;
    es = new EventSource('/api/events');
    es.addEventListener('state', onState);
    es.onopen = onOpen;
    es.onerror = onError;
  }

  // 部分认证代理会一直缓冲不结束的 SSE 响应；长轮询只在状态变更或 25 秒
  // 超时时结束一次普通 HTTP 请求，能穿过这类链路，同时保持接近实时的同步。
  function scheduleLongPoll(delay) {
    if (longPollRetry !== null) return;
    if (!longPollSupported || document.hidden) return; // 旧服务器无此端点 / 后台标签页暂停
    longPollRetry = setTimeout(function () {
      longPollRetry = null;
      waitForState();
    }, delay);
  }

  async function waitForState() {
    if (longPollActive) return;
    longPollActive = true;
    let retryDelay = 0;
    try {
      const res = await timedFetch('/api/wait?rev=' + encodeURIComponent(lastRev), { cache: 'no-store' }, LONG_POLL_TIMEOUT_MS);
      if (res.status === 404) {
        longPollSupported = false; // 旧服务器没有 /api/wait：退回 SSE + 兜底轮询
        return;
      }
      if (res.status === 204) {
        // 服务器完整保持后超时：版本未变，立即续等（服务器会再次保持）
        setStatus('online');
      } else {
        if (!res.ok) throw new Error('wait ' + res.status);
        const body = await res.json();
        if (body.data === null) {
          // 仅旧版服务器会立即回包空状态；退避再询，避免零间隔轮询
          await fullSync();
          retryDelay = LONG_POLL_BACKOFF_MS;
        } else {
          // 立即回包说明有变更；无论是否被消费都退避再询，避免版本追不上时忙轮询
          receiveRemote(body);
          retryDelay = LONG_POLL_BACKOFF_MS;
        }
      }
    } catch (e) {
      retryDelay = 2000;
      // 长轮询是冗余通道：不据此判定离线，离线状态由 fullSync/SSE 判定
      console.warn('实时同步等待失败，稍后重试', e);
    } finally {
      longPollActive = false;
      scheduleLongPoll(retryDelay);
    }
  }

  function scheduleFallbackSync() {
    if (fallbackTimer !== null) clearTimeout(fallbackTimer);
    const delay = document.visibilityState === 'hidden' ? BACKGROUND_SYNC_MS : FOREGROUND_SYNC_MS;
    fallbackTimer = setTimeout(function () {
      scheduleFallbackSync(); // 固定节奏，不等待本次对账完成；重复触发由 syncInFlight 去重
      fullSync();
    }, delay);
  }

  function init(options) {
    Object.assign(cfg, options || {});
    lastRev = loadRev();
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return; // file:// 纯本地模式
    // 初始上报一次状态：加载时服务器即不可达的离线情况要立即可见（连接成功后徽标自动隐藏）
    if (typeof cfg.onStatus === 'function') {
      try { cfg.onStatus(status); } catch (e) { /* 忽略 */ }
    }
    // 三条通道并行启动，互不阻塞：SSE 实时推送、长轮询兼容不转发长响应的代理、
    // 定时对账兜底。首次 HTTP 对账不能绑在 onopen 上，否则 API 可用时仍可能显示“离线”；
    // fullSync 去重保证首屏各通道共用同一次对账请求。
    fullSync();
    connect();
    scheduleLongPoll(0);
    scheduleFallbackSync();
    document.addEventListener('visibilitychange', function () {
      scheduleFallbackSync();
      // 回到前台时若长轮询已暂停（后台暂停 / 退避期间），立即恢复
      if (document.visibilityState === 'visible' && longPollSupported && !longPollActive && longPollRetry === null) {
        scheduleLongPoll(0);
      }
    });
  }

  window.Sync = {
    init: init,
    push: pushLocal,
    refresh: fullSync,
    isPushing: function () { return pushing > 0; },
    wasSkipped: function () { return skipped; },
    clearSkipped: function () { skipped = false; },
    isOnline: function () { return status === 'online'; }
  };
})();
