/* 本地持久化：localStorage 封装 */
(function (root) {
  'use strict';

  const PREFIX = 'mealplanner.';

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('保存失败', key, e);
    }
  }

  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch (e) { /* ignore */ }
  }

  // 回填历史自建菜谱的 isMeat 标注（EEE-34 防御性：旧数据没有该字段，按 classifier 预填；已有标注不动）
  function backfillIsMeat(list) {
    if (!Array.isArray(list)) return [];
    const Classify = (typeof self !== 'undefined' && self.MealClassify) ||
      (typeof window !== 'undefined' && window.MealClassify);
    if (!Classify) return list;
    return list.map(function (r) {
      if (r && typeof r === 'object' && typeof r.isMeat !== 'boolean') {
        try { r.isMeat = Classify.classifyDish(r).isMeat; } catch (e) { r.isMeat = false; }
      }
      return r;
    });
  }

  // 修复/补全任意来源的原始状态（localStorage 或服务器），返回完整的 7 键对象
  function repairState(raw) {
    raw = raw || {};
    const defaults = {
      days: 7,
      servings: 2,
      adults: 2,
      kids: 1,
      kidAge: 5,
      kidPortion: 0.5,
      familySpice: 'normal',
      kidSpice: 'none',
      quick: true,
      maxMissing: 2,
      quickLimit: 25,
      dinnerOnly: false,
      richDinner: false
    };
    const saved = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    const settings = Object.assign({}, defaults, saved);
    // 兼容旧数据/异常值
    ['days', 'servings', 'adults', 'kids', 'kidAge', 'maxMissing', 'quickLimit'].forEach(function (k) {
      if (!Number.isFinite(Number(settings[k]))) settings[k] = defaults[k];
    });
    if (!Number.isFinite(Number(settings.kidPortion))) settings.kidPortion = defaults.kidPortion;
    if (['normal', 'mild', 'none'].indexOf(settings.familySpice) === -1) settings.familySpice = defaults.familySpice;
    if (['normal', 'mild', 'none'].indexOf(settings.kidSpice) === -1) settings.kidSpice = defaults.kidSpice;
    const shopping = raw.shopping && typeof raw.shopping === 'object' && Array.isArray(raw.shopping.items)
      ? raw.shopping
      : { items: [], source: null };
    return {
      inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
      customRecipes: backfillIsMeat(raw.customRecipes),
      disabledRecipes: Array.isArray(raw.disabledRecipes) ? raw.disabledRecipes : [],
      settings: settings,
      plan: raw.plan || null,
      shopping: shopping,
      cravings: Array.isArray(raw.cravings) ? raw.cravings : []
    };
  }

  function loadState() {
    return repairState({
      inventory: load('inventory', []),
      customRecipes: load('customRecipes', []),
      disabledRecipes: load('disabledRecipes', []),
      settings: load('settings', {}),
      plan: load('plan', null),
      shopping: load('shopping', { items: [], source: null }),
      cravings: load('cravings', [])
    });
  }

  // 本机是否保存过数据（供首次同步时向服务器播种迁移）
  function hasLocalData() {
    return ['inventory', 'customRecipes', 'disabledRecipes', 'settings', 'plan', 'shopping', 'cravings']
      .some(function (k) {
        try { return localStorage.getItem(PREFIX + k) !== null; } catch (e) { return false; }
      });
  }

  function saveState(state) {
    save('inventory', state.inventory);
    save('customRecipes', state.customRecipes);
    save('disabledRecipes', state.disabledRecipes);
    save('settings', state.settings);
    save('plan', state.plan);
    save('shopping', state.shopping);
    save('cravings', state.cravings);
  }

  function exportData(state) {
    return {
      app: 'mealplanner',
      version: 1,
      exportedAt: new Date().toISOString(),
      inventory: state.inventory,
      customRecipes: state.customRecipes,
      disabledRecipes: state.disabledRecipes,
      settings: state.settings,
      shopping: state.shopping
    };
  }

  function importData(json, state) {
    if (!json || json.app !== 'mealplanner') throw new Error('不是本应用导出的数据文件');
    state.inventory = Array.isArray(json.inventory) ? json.inventory : [];
    state.customRecipes = Array.isArray(json.customRecipes) ? json.customRecipes : [];
    state.disabledRecipes = Array.isArray(json.disabledRecipes) ? json.disabledRecipes : [];
    if (json.settings) state.settings = Object.assign(state.settings, json.settings);
    if (json.shopping) state.shopping = json.shopping;
    state.plan = null;
    state.cravings = [];
    return state;
  }

  root.Storage = { load: load, save: save, remove: remove, loadState: loadState, saveState: saveState, repairState: repairState, hasLocalData: hasLocalData, exportData: exportData, importData: importData };
})(typeof self !== 'undefined' ? self : this);
