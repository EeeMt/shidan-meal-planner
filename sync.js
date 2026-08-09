/* 家庭共享同步：初始对账、变更推送、SSE 实时接收、离线回退 */
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
  function timedFetch(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, 15000);
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
    if (body.rev < lastRev) return false; // 晚到的陈旧快照：不应用、不倒退（避免覆盖更新的他端修改）
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
  async function fullSync() {
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

  function onState(ev) {
    let body;
    try { body = JSON.parse(ev.data); } catch (e) { return; }
    if (dirty) {
      // 有未上传的本地修改：不应用远端（避免顶掉离线修改）；在途 PUT 完成后的回显会收敛
      if (pushing === 0) pushLocal();
    } else {
      applyRemote(body); // 自己 PUT 的回显会原样应用（JSON 全等比较后不重渲染）
      setStatus('online'); // 实时事件即证明连接健康：兜底 fullSync 偶发失败后徽标一直离线
    }
  }

  function onOpen() {
    failureCount = 0;
    fullSync();
  }

  function onError() {
    setStatus('offline');
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

  function init(options) {
    Object.assign(cfg, options || {});
    lastRev = loadRev();
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return; // file:// 纯本地模式
    // 初始上报一次状态：加载时服务器即不可达的离线情况要立即可见（连接成功后徽标自动隐藏）
    if (typeof cfg.onStatus === 'function') {
      try { cfg.onStatus(status); } catch (e) { /* 忽略 */ }
    }
    connect();
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
