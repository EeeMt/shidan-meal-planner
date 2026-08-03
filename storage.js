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

  function loadState() {
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
      quickLimit: 25
    };
    const saved = load('settings', {});
    const settings = Object.assign({}, defaults, saved);
    // 兼容旧数据/异常值
    ['days', 'servings', 'adults', 'kids', 'kidAge', 'maxMissing', 'quickLimit'].forEach(function (k) {
      if (!Number.isFinite(Number(settings[k]))) settings[k] = defaults[k];
    });
    if (!Number.isFinite(Number(settings.kidPortion))) settings.kidPortion = defaults.kidPortion;
    if (['normal', 'mild', 'none'].indexOf(settings.familySpice) === -1) settings.familySpice = defaults.familySpice;
    if (['normal', 'mild', 'none'].indexOf(settings.kidSpice) === -1) settings.kidSpice = defaults.kidSpice;
    return {
      inventory: load('inventory', []),
      customRecipes: load('customRecipes', []),
      settings: settings,
      plan: load('plan', null),
      shopping: load('shopping', { items: [], source: null }),
      cravings: load('cravings', [])
    };
  }

  function saveState(state) {
    save('inventory', state.inventory);
    save('customRecipes', state.customRecipes);
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
      settings: state.settings,
      shopping: state.shopping
    };
  }

  function importData(json, state) {
    if (!json || json.app !== 'mealplanner') throw new Error('不是本应用导出的数据文件');
    state.inventory = Array.isArray(json.inventory) ? json.inventory : [];
    state.customRecipes = Array.isArray(json.customRecipes) ? json.customRecipes : [];
    if (json.settings) state.settings = Object.assign(state.settings, json.settings);
    if (json.shopping) state.shopping = json.shopping;
    state.plan = null;
    state.cravings = [];
    return state;
  }

  root.Storage = { load: load, save: save, remove: remove, loadState: loadState, saveState: saveState, exportData: exportData, importData: importData };
})(typeof self !== 'undefined' ? self : this);
