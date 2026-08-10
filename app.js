/* 食单 · 主应用逻辑 */
(function () {
  'use strict';

  const C = window.MealCore;
  const S = window.Storage;
  const state = S.loadState();

  // 换菜记忆（仅内存，刷新即清）：同一槽位最近换出的菜，几轮内不再排回来，避免两菜来回轮询
  const swapRecent = new Map();

  const CATEGORIES = ['全部', '荤菜', '素菜', '蛋豆', '水产', '汤羹', '主食', '凉菜'];
  const COMMON_GROUPS = [
    {
      g: '肉蛋水产',
      items: ['猪肉', '猪里脊', '猪瘦肉', '五花肉', '猪肉末', '牛肉', '牛里脊', '牛腩', '羊肉', '鸡胸肉', '鸡腿肉', '鸡翅', '鸡腿', '排骨', '火腿', '腊肠', '大虾', '虾仁', '鲈鱼', '草鱼', '带鱼', '鱼头', '鸡蛋', '皮蛋']
    },
    {
      g: '蔬菜菌菇',
      items: ['西红柿', '土豆', '青椒', '洋葱', '胡萝卜', '西兰花', '包菜', '大白菜', '娃娃菜', '生菜', '油麦菜', '菠菜', '菜心', '油菜', '芹菜', '蒜苔', '韭菜', '茄子', '黄瓜', '冬瓜', '白萝卜', '山药', '莲藕', '豆芽', '四季豆', '玉米', '香菇', '木耳', '金针菇', '海带', '紫菜', '酸菜', '香菜', '小米辣']
    },
    {
      g: '主食豆制品',
      items: ['米饭', '大米', '面条', '面粉', '粉丝', '粉条', '饺子', '豆腐', '嫩豆腐', '老豆腐', '香干', '腐竹', '花生米', '蒜苗', '白芝麻', '虾皮']
    },
    {
      g: '调味香料',
      items: ['盐', '生抽', '老抽', '蚝油', '料酒', '醋', '白糖', '冰糖', '淀粉', '豆瓣酱', '甜面酱', '番茄酱', '黄豆酱', '干辣椒', '花椒', '八角', '桂皮', '胡椒粉', '辣椒粉', '孜然粉', '芝麻油', '食用油', '小葱', '生姜', '大蒜', '可乐', '剁椒']
    }
  ];

  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return Array.from(document.querySelectorAll(sel)); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function allRecipes() {
    return RECIPES.concat(state.customRecipes);
  }

  // 未被禁用的菜谱：排菜、换菜、购物清单只在这些菜里选
  function enabledRecipes() {
    return allRecipes().filter(function (r) { return state.disabledRecipes.indexOf(r.id) === -1; });
  }

  function recipesById() {
    const map = {};
    allRecipes().forEach(function (r) { map[r.id] = r; });
    return map;
  }

  function save() {
    S.saveState(state);
    Sync.push(); // 推送服务器（离线时无副作用）
  }

  // 同步用：服务器端状态的 7 键快照
  function syncSnapshot() {
    return {
      inventory: state.inventory,
      customRecipes: state.customRecipes,
      disabledRecipes: state.disabledRecipes,
      settings: state.settings,
      plan: state.plan,
      shopping: state.shopping,
      cravings: state.cravings
    };
  }

  // 应用服务器端状态；返回 true 表示可消费该版本（false = 编辑中暂缓）
  function applyRemoteState(data) {
    if ($('#modal-root').innerHTML !== '') return false; // 模态框开着：不顶掉正在编辑的内容
    const repaired = S.repairState(data);
    const before = JSON.stringify(state);
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, repaired);
    S.saveState(state); // 服务器为准，localStorage 降级为缓存
    if (before !== JSON.stringify(state)) {
      // 重渲染前保存聚焦输入框的未提交值（库存输入、设置数字/下拉等），渲染后恢复
      const act = document.activeElement;
      let typing = null;
      if (act && (act.tagName === 'INPUT' || act.tagName === 'SELECT' || act.tagName === 'TEXTAREA') &&
          act.type !== 'checkbox' && act.type !== 'radio') {
        const loc = act.id ? '#' + act.id : (act.dataset.setting ? '[data-setting="' + act.dataset.setting + '"]' : null);
        if (loc) typing = { loc: loc, value: act.value };
      }
      renderAll();
      if (typing) {
        const el = typing.loc.charAt(0) === '#' ? document.getElementById(typing.loc.slice(1)) : document.querySelector(typing.loc);
        if (el) { el.focus(); el.value = typing.value; }
      }
    }
    return true;
  }

  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.hidden = true; }, 2200);
  }

  function switchTab(tab) {
    $$('.nav-item').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === tab); });
    $$('.tab-panel').forEach(function (p) { p.classList.toggle('active', p.id === 'tab-' + tab); });
    window.scrollTo({ top: 0 });
  }

  function openModal(html) {
    $('#modal-root').innerHTML = '<div class="modal-overlay"><div class="modal">' + html + '</div></div>';
  }

  function closeModal() {
    $('#modal-root').innerHTML = '';
    // 编辑期间错过的远端变更：关闭时补拉一次（提交在途时由 PUT 回显送达，无需补拉）
    if (Sync.wasSkipped() && !Sync.isPushing()) {
      Sync.clearSkipped();
      Sync.refresh();
    }
  }

  function difficultyStars(n) {
    return '★'.repeat(n || 1) + '☆'.repeat(Math.max(0, 3 - (n || 1)));
  }

  // 全家折算成人份：2 大人 + 1 小孩(0.5份) ≈ 2.5 人份
  function familyTotal(settings) {
    const s = settings || state.settings;
    const adults = Number(s.adults) || 2;
    const kids = Number(s.kids) || 0;
    const portion = Number(s.kidPortion) || 0.5;
    return Math.round((adults + kids * portion) * 10) / 10;
  }

  // 小孩年龄 → 建议饭量（成人份）
  function autoKidPortion(age) {
    const a = Number(age) || 5;
    if (a <= 2) return 0.3;
    if (a <= 4) return 0.4;
    if (a <= 6) return 0.5;
    if (a <= 8) return 0.65;
    if (a <= 10) return 0.8;
    if (a <= 12) return 0.9;
    return 1;
  }

  function dishRole(dish, meal) {
    if (meal.soups.indexOf(dish) !== -1) return '汤';
    if (dish.recipe.category === '主食') return '主';
    // 荤素按常识口径：必备配料含动物性食材为荤、豆腐算素（与 core.isMeat 一致）
    return C.isMeat(dish.recipe) ? '荤' : '素';
  }

  function spiceValue(name) {
    if (name === 'none') return 0;
    if (name === 'mild') return 1;
    return 2;
  }

  // 全家和孩子同时满足的辣度上限；小孩人数为 0 时只看全家
  function maxSpice() {
    const s = state.settings;
    if ((Number(s.kids) || 0) <= 0) return spiceValue(s.familySpice);
    return Math.min(spiceValue(s.familySpice), spiceValue(s.kidSpice));
  }

  function spiceBadgeHtml(recipe) {
    const lv = C.spiceLevel(recipe);
    if (lv === 0) return '';
    return '<span class="spice-badge' + (lv === 2 ? ' hot' : '') + '">' + (lv === 2 ? '🌶️🌶️ 辣' : '🌶️ 微辣') + '</span>';
  }

  function substituteHtml(ingredientName) {
    const subs = C.findSubstitutes(ingredientName, state.inventory);
    if (!subs.length) return '';
    return '<span class="sub-chip">可用库存 ' + esc(subs.join('、')) + ' 替代</span>';
  }

  function stockBadge(recipe) {
    if (!state.inventory.length) return '';
    const m = C.matchRecipe(recipe, C.buildInventorySet(state.inventory));
    if (m.missingCount === 0) return '<div class="rc-stock stock-ok">✅ 库存食材齐</div>';
    return '<div class="rc-stock stock-miss">缺 ' + m.missingCount + ' 样食材</div>';
  }

  // ==================== 计划 ====================
  function renderPlan() {
    const panel = $('#tab-plan');
    const plan = state.plan;
    if (!plan) {
      panel.innerHTML =
        '<div class="hero"><h2>🍳 今天吃什么？</h2><p>两条路，任选一条：</p></div>' +
        '<div class="workflow-wrap">' +
        '<div class="workflow-card"><div class="wf-ico">🧺</div><div>' +
        '<h3>我有食材，安排一周</h3><p>把买回来的菜登记进库存，自动生成一周午餐 + 晚餐 + 配菜。</p>' +
        '<button class="btn btn-primary" data-act="goto-inventory">去登记食材</button></div></div>' +
        '<div class="workflow-card"><div class="wf-ico">😋</div><div>' +
        '<h3>我想吃这些菜</h3><p>在菜谱里勾选想吃的菜，自动汇总需要购买的食材。</p>' +
        '<button class="btn btn-primary" data-act="goto-recipes">去挑菜</button></div></div>' +
        '</div>';
      $('#headerActions').innerHTML = '';
      return;
    }

    const st = plan.stats;
    const missingCount = st.missing.length;
    const po = plan.opts || {};
    const fam = po.servings || familyTotal();
    const dinnerLimit = Math.round((Number(po.quickLimit) || 25) * 1.5);
    const timeLimitText = state.settings.dinnerOnly
      ? '晚餐 ≤' + dinnerLimit + '分钟'
      : '午餐 ≤' + (Number(po.quickLimit) || 25) + '分钟 · 晚餐 ≤' + dinnerLimit + '分钟';
    const hasKids = (Number(po.kids) || 0) > 0;
    const spiceText = hasKids
      ? (po.kidSpice === 'none' ? '孩子不辣' : (po.kidSpice === 'mild' ? '孩子微辣' : '孩子正常'))
      : (po.familySpice === 'none' ? '全家不辣' : (po.familySpice === 'mild' ? '全家微辣' : '全家正常'));
    $('#headerActions').innerHTML = '<button class="btn btn-sm" data-act="copy-plan">📋 复制计划</button>';

    panel.innerHTML =
      '<div class="plan-summary">' +
      '<div class="stat"><b>' + st.avgMinutes + '分</b><span>平均每餐用时</span></div>' +
      '<div class="stat"><b>' + st.uniqueRecipes + '道</b><span>本周用到的菜</span></div>' +
      '<div class="stat"><b>' + missingCount + '种</b><span>需补食材</span></div>' +
      '</div>' +
      '<div class="muted" style="margin:0 0 12px;font-size:13px;">👨‍👩‍👦 ' + (hasKids ? (Number(po.adults) || 2) + ' 大人 + ' + (Number(po.kids) || 0) + ' 小孩（' + (Number(po.kidAge) || 5) + '岁 ≈ ' + (Number(po.kidPortion) || 0.5) + ' 成人份）' : (Number(po.adults) || 2) + ' 大人') + ' ≈ ' + fam + ' 人份 · ' + timeLimitText + ' · 忌口：' + spiceText + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' +
      '<button class="btn btn-primary" data-act="regen-plan">🔄 重新生成</button>' +
      '<button class="btn" data-act="plan-missing-shopping">🛒 补缺采购清单</button>' +
      '<button class="btn btn-ghost" data-act="goto-inventory">修改库存</button>' +
      '</div>' +
      (missingCount ? '<div class="missing-row" style="margin-bottom:12px;">' + st.missing.slice(0, 12).map(function (m) {
        return '<span class="missing-chip">' + esc(m.name) + ' ' + esc(m.amount) + '</span>';
      }).join('') + (st.missing.length > 12 ? '<span class="missing-chip">+更多</span>' : '') + '</div>' : '') +
      '<div class="week-grid">' +
      plan.days.map(function (d, i) { return dayCard(d, i); }).join('') +
      '</div>';
  }

  function dayCard(day, dayIdx) {
    const meals = [];
    if (!state.settings.dinnerOnly) meals.push({ key: 'lunch', name: '午餐' });
    meals.push({ key: 'dinner', name: '晚餐' });
    const minutes = state.settings.dinnerOnly
      ? (day.dinner ? day.dinner.totalMinutes : 0)
      : (day.lunch && day.dinner ? day.lunch.totalMinutes + day.dinner.totalMinutes : 0);
    return '<div class="card day-card">' +
      '<div class="day-head"><span>' + esc(day.label) + '</span><span class="sub">' + (minutes ? '共' + minutes + '分钟' : '') + '</span></div>' +
      '<div class="day-body">' +
      meals.map(function (m) { return mealCard(day, m.key, m.name, dayIdx); }).join('') +
      '</div></div>';
  }

  function mealCard(day, mealKey, mealName, dayIdx) {
    const meal = day[mealKey];
    if (!meal) {
      return '<div class="meal-card muted">' + esc(mealName) + '：无法安排（菜谱不足）</div>';
    }
    const main = meal.main;
    const dishes = meal.dishes;
    const rows = dishes.map(function (d, i) {
      const role = dishRole(d, meal);
      return '<div class="dish-row' + (i === 0 ? ' main-dish' : '') + '">' +
        '<span class="role">' + role + '</span>' +
        '<span>' + esc(d.recipe.emoji) + ' ' + esc(d.recipe.name) + '</span>' +
        '<span class="dish-badge">' + d.recipe.minutes + '分钟</span>' +
        '<button class="btn btn-sm dish-swap" data-act="replace-dish" data-day="' + dayIdx + '" data-meal="' + mealKey + '" data-dish="' + i + '">换菜</button>' +
        '</div>';
    }).join('');

    const missing = meal.missing.length
      ? '<div class="missing-row">' + meal.missing.map(function (m) {
        return '<span class="missing-chip">缺 ' + esc(m.name) + ' ' + esc(m.amount) + substituteHtml(m.name) + '</span>';
      }).join('') + '</div>'
      : '<div class="missing-row"><span class="stock-ok" style="font-size:12px;">✅ 库存可做</span></div>';

    const stepsHtml = '<details class="steps"><summary>📖 做法（' + meal.totalMinutes + '分钟）</summary><div class="steps-body">' +
      dishes.map(function (d) {
        return '<div class="step-dish">' + esc(d.recipe.emoji) + ' ' + esc(d.recipe.name) + '</div><ol>' +
          d.recipe.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
          '</ol>';
      }).join('') + '</div></details>';

    return '<div class="meal-card">' +
      '<div class="meal-head">' +
      '<span class="meal-tag">' + mealName + '</span>' +
      '<span class="meal-time">⏱ ' + meal.totalMinutes + '分钟 · 难度' + difficultyStars(main.recipe.difficulty) + '</span>' +
      '<span class="meal-actions">' +
      '<button class="btn btn-sm" data-act="replace-meal" data-day="' + dayIdx + '" data-meal="' + mealKey + '" title="重排这一整餐">换整餐</button>' +
      '<button class="btn btn-sm btn-primary" data-act="meal-detail" data-day="' + dayIdx + '" data-meal="' + mealKey + '">做法</button>' +
      '</span></div>' +
      rows + missing + stepsHtml +
      '</div>';
  }

  function buildPlan() {
    swapRecent.clear(); // 计划整体重排，旧换菜记忆作废
    const opts = Object.assign({}, state.settings);
    opts.servings = familyTotal(state.settings);
    opts.maxSpice = maxSpice();
    state.plan = C.planWeek(enabledRecipes(), state.inventory, opts);
    save();
    renderAll();
  }

  function generatePlan() {
    buildPlan();
    switchTab('plan');
    if (!state.inventory.length) {
      toast('库存为空，已生成“全部需采购”的计划');
    } else {
      toast('一周计划已生成');
    }
  }

  function planMissingShopping() {
    const plan = state.plan;
    if (!plan) return;
    const map = new Map();
    plan.days.forEach(function (d) {
      ['lunch', 'dinner'].forEach(function (m) {
        const meal = d[m];
        if (!meal) return;
        (meal.missing || []).forEach(function (mi) {
          const key = C.normName(mi.name);
          if (!map.has(key)) map.set(key, { name: mi.name, amount: mi.amount, recipes: ['周计划补缺'] });
          else map.get(key).amount += ' + ' + mi.amount;
        });
      });
    });
    const items = Array.from(map.values()).map(function (e) {
      return { name: e.name, amount: e.amount, optional: false, recipes: e.recipes, have: false, checked: false };
    });
    state.shopping = { items: items, source: 'plan' };
    save();
    renderAll();
    switchTab('shopping');
    toast('已生成补缺采购清单');
  }

  function replaceMeal(dayIdx, mealKey) {
    const plan = state.plan;
    if (!plan) return;
    const opts = Object.assign({}, state.settings);
    opts.servings = familyTotal(state.settings);
    opts.maxSpice = maxSpice();
    const key = dayIdx + '-' + mealKey;
    const recent = swapRecent.get(key) || [];
    const meal = plan.days[dayIdx] && plan.days[dayIdx][mealKey];
    const oldIds = (meal && meal.dishes || []).map(function (d) { return d.recipe.id; });
    const changed = C.replaceMeal(plan, enabledRecipes(), state.inventory, opts, Number(dayIdx), mealKey, recent);
    if (changed && oldIds.length) {
      swapRecent.set(key, oldIds.concat(recent.filter(function (id) { return oldIds.indexOf(id) === -1; })).slice(0, 6));
    }
    save();
    renderAll();
    toast(changed ? '已重排这一餐' : '暂无其他可选');
  }

  function replaceDish(dayIdx, mealKey, dishIdx) {
    const plan = state.plan;
    if (!plan) return;
    const opts = Object.assign({}, state.settings);
    opts.servings = familyTotal(state.settings);
    opts.maxSpice = maxSpice();
    const key = dayIdx + '-' + mealKey + '-' + dishIdx;
    const recent = swapRecent.get(key) || [];
    const meal = plan.days[dayIdx] && plan.days[dayIdx][mealKey];
    const oldId = meal && meal.dishes[dishIdx] && meal.dishes[dishIdx].recipe
      ? meal.dishes[dishIdx].recipe.id : null;
    const changed = C.replaceDish(plan, enabledRecipes(), state.inventory, opts, Number(dayIdx), mealKey, Number(dishIdx), recent);
    if (changed && oldId) {
      swapRecent.set(key, [oldId].concat(recent.filter(function (id) { return id !== oldId; })).slice(0, 3));
    }
    save();
    renderAll();
    toast(changed ? '已换一道菜' : '暂无其他可选');
  }

  function mealDetailModal(dayIdx, mealKey) {
    const meal = state.plan.days[Number(dayIdx)][mealKey];
    if (!meal) return;
    const invSet = C.buildInventorySet(state.inventory);
    const fam = (state.plan && state.plan.opts && state.plan.opts.servings) || familyTotal();
    openModal(
      '<button class="modal-close" data-act="close-modal">✕</button>' +
      '<h3>' + (mealKey === 'lunch' ? '午餐' : '晚餐') + ' · ' + esc(state.plan.days[Number(dayIdx)].label) + ' <span class="muted" style="font-size:13px;font-weight:400;">按约 ' + fam + ' 人份</span></h3>' +
      meal.dishes.map(function (d) {
        const factor = fam / d.recipe.servings;
        const ing = d.recipe.ingredients.map(function (i) {
          const have = C.ingredientCovered(i.name, invSet);
          return '<li><span class="' + (have ? 'have' : 'lack') + '">' + (have ? '✓' : '✗') + ' ' + esc(i.name) + '</span><span>' + esc(C.scaleAmount(i.amount, factor)) + (i.optional ? '（可选）' : '') + '</span>' + (!have && !i.optional ? substituteHtml(i.name) : '') + '</li>';
        }).join('');
        return '<div class="dish-detail">' +
          '<h4>' + esc(d.recipe.emoji) + ' ' + esc(d.recipe.name) +
          spiceBadgeHtml(d.recipe) +
          '<span class="dish-badge" style="margin-left:6px;">' + esc(d.recipe.category) + ' · ' + d.recipe.minutes + '分钟</span></h4>' +
          '<ul class="ing-list">' + ing + '</ul>' +
          '<div class="steps-body"><div class="step-dish">做法</div><ol>' +
          d.recipe.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
          '</ol></div></div>';
      }).join('') +
      '<div class="modal-actions"><button class="btn btn-primary" data-act="close-modal">好</button></div>'
    );
  }

  // ==================== 菜谱库 ====================
  const recipeFilter = { q: '', cat: '全部' };

  function renderRecipes() {
    const panel = $('#tab-recipes');
    const list = allRecipes();
    const idMap = recipesById();
    const q = C.normName(recipeFilter.q);
    const filtered = list.filter(function (r) {
      if (recipeFilter.cat !== '全部' && r.category !== recipeFilter.cat) return false;
      if (!q) return true;
      return C.normName(r.name).includes(q) || r.ingredients.some(function (i) { return C.normName(i.name).includes(q); });
    });

    const pickedCount = state.cravings.filter(function (id) { return state.disabledRecipes.indexOf(id) === -1; }).length;
    panel.innerHTML =
      '<div class="toolbar">' +
      '<div class="search-box"><span>🔍</span><input id="recipeSearch" type="search" placeholder="搜菜名或食材" value="' + esc(recipeFilter.q) + '"></div>' +
      '<button class="btn" data-act="import-recipes">📥 导入菜谱</button>' +
      '<button class="btn btn-primary" data-act="custom-recipe-form">＋ 自建菜谱</button>' +
      '</div>' +
      '<div class="cat-chips">' + CATEGORIES.map(function (c) {
        return '<button class="cat-chip' + (recipeFilter.cat === c ? ' active' : '') + '" data-cat="' + c + '">' + c + '</button>';
      }).join('') + '</div>' +
      (pickedCount ? '<div class="pick-bar"><button class="btn btn-green" data-act="cravings-shopping">✅ 已选 ' + pickedCount + ' 道 · 生成购物清单</button></div>' : '') +
      (filtered.length
        ? '<div class="recipe-grid">' + filtered.map(function (r) {
          const picked = state.cravings.indexOf(r.id) !== -1;
          const disabled = state.disabledRecipes.indexOf(r.id) !== -1;
          const isCustom = r.id.indexOf('custom-') === 0;
          const isImported = r.id.indexOf('imported-') === 0;
          return '<div class="recipe-card' + (disabled ? ' disabled' : '') + '" data-recipe="' + esc(r.id) + '">' +
            (isImported ? '<span class="rc-custom" style="background:var(--primary-soft);color:var(--primary-dark);">导入</span>' : (isCustom ? '<span class="rc-custom">自建</span>' : '')) +
            '<span class="rc-emoji">' + esc(r.emoji || '🍽️') + '</span>' +
            '<div class="rc-name">' + esc(r.name) + '</div>' +
            '<div class="rc-meta"><span class="rc-cat">' + esc(r.category) + '</span>' +
            spiceBadgeHtml(r) +
            '<span>⏱' + r.minutes + '分</span><span>' + difficultyStars(r.difficulty) + '</span></div>' +
            stockBadge(r) +
            '<button class="rc-pick' + (picked ? ' picked' : '') + '" data-act="toggle-pick" data-recipe="' + esc(r.id) + '">' + (picked ? '✓' : '＋') + '</button>' +
            '<button class="rc-toggle' + (disabled ? ' off' : '') + '" data-act="toggle-disable" data-recipe="' + esc(r.id) + '" title="' + (disabled ? '已禁用，点击启用' : '点击禁用，排菜/换菜时将跳过') + '">' + (disabled ? '▶' : '⏸') + '</button>' +
            (isCustom || isImported
              ? '<div style="display:flex;gap:6px;margin-top:8px;">' +
                '<button class="btn btn-sm" data-act="edit-recipe" data-recipe="' + esc(r.id) + '">编辑</button>' +
                '<button class="btn btn-sm btn-danger" data-act="delete-recipe" data-recipe="' + esc(r.id) + '">删除</button></div>'
              : '') +
            '</div>';
        }).join('') + '</div>'
        : '<div class="empty-state"><span class="es-ico">🔍</span>没有找到匹配的菜谱</div>');
  }

  function toggleDisable(recipeId) {
    const idx = state.disabledRecipes.indexOf(recipeId);
    if (idx === -1) {
      state.disabledRecipes.push(recipeId);
      // 禁用的菜不再出现在"想吃"勾选里
      const cIdx = state.cravings.indexOf(recipeId);
      if (cIdx !== -1) state.cravings.splice(cIdx, 1);
      toast('已禁用，排菜/换菜时将跳过，重新生成计划后生效');
    } else {
      state.disabledRecipes.splice(idx, 1);
      toast('已启用');
    }
    save();
    renderRecipes();
  }

  function togglePick(recipeId) {
    // 禁用的菜不允许勾选，避免计数与购物清单不一致
    if (state.disabledRecipes.indexOf(recipeId) !== -1) {
      toast('这道菜已禁用，先启用再勾选');
      return;
    }
    const idx = state.cravings.indexOf(recipeId);
    if (idx === -1) state.cravings.push(recipeId);
    else state.cravings.splice(idx, 1);
    save();
    renderRecipes();
  }

  function cravingsShopping() {
    const idMap = recipesById();
    const selected = state.cravings.map(function (id) { return idMap[id]; }).filter(Boolean)
      .filter(function (r) { return state.disabledRecipes.indexOf(r.id) === -1; });
    if (!selected.length) {
      toast('还没有选菜');
      return;
    }
    const fam = familyTotal(state.settings);
    state.shopping = {
      items: C.aggregateShopping(selected.map(function (r) { return { recipe: r, servings: fam }; }), state.inventory),
      source: 'cravings'
    };
    save();
    renderAll();
    switchTab('shopping');
    toast('购物清单已生成');
  }

  function recipeDetailModal(recipeId) {
    const r = recipesById()[recipeId];
    if (!r) return;
    const invSet = C.buildInventorySet(state.inventory);
    const picked = state.cravings.indexOf(r.id) !== -1;
    const factor = familyTotal() / r.servings;
    openModal(
      '<button class="modal-close" data-act="close-modal">✕</button>' +
      '<h3>' + esc(r.emoji || '🍽️') + ' ' + esc(r.name) + spiceBadgeHtml(r) + '</h3>' +
      '<div class="muted" style="margin-bottom:10px;">' + esc(r.category) + ' · ' + r.minutes + '分钟 · 难度' + difficultyStars(r.difficulty) + ' · ' + r.servings + '人份</div>' +
      '<ul class="ing-list">' + r.ingredients.map(function (i) {
        const have = C.ingredientCovered(i.name, invSet);
        return '<li><span class="' + (have ? 'have' : 'lack') + '">' + (have ? '✓' : '✗') + ' ' + esc(i.name) + (i.optional ? '（可选）' : '') + '</span><span>' + esc(C.scaleAmount(i.amount, factor)) + '</span>' + (!have && !i.optional ? substituteHtml(i.name) : '') + '</li>';
      }).join('') + '</ul>' +
      '<div class="steps-body"><div class="step-dish">做法</div><ol>' +
      r.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') +
      '</ol></div>' +
      '<div class="modal-actions">' +
      '<button class="btn ' + (picked ? 'btn-ghost' : 'btn-green') + '" data-act="toggle-pick" data-recipe="' + esc(r.id) + '">' + (picked ? '已选，再点取消' : '＋ 选这道菜') + '</button>' +
      '<button class="btn" data-act="close-modal">关闭</button></div>'
    );
  }

  function customRecipeForm(editId) {
    const r = editId ? recipesById()[editId] : null;
    const ingText = r ? r.ingredients.map(function (i) {
      return i.name + ' ' + i.amount + (i.optional ? ' (可选)' : '');
    }).join('\n') : '';
    const stepText = r ? r.steps.join('\n') : '';
    openModal(
      '<button class="modal-close" data-act="close-modal">✕</button>' +
      '<h3>' + (r ? '编辑菜谱' : '自建菜谱') + '</h3>' +
      '<form id="recipeForm">' +
      '<div class="form-row2">' +
      '<div class="form-field"><label>菜名 *</label><input name="name" required value="' + esc(r ? r.name : '') + '"></div>' +
      '<div class="form-field"><label>图标（emoji）</label><input name="emoji" maxlength="4" value="' + esc(r ? r.emoji : '') + '" placeholder="🍳"></div>' +
      '</div>' +
      '<div class="form-row2">' +
      '<div class="form-field"><label>分类</label><select name="category">' +
      CATEGORIES.slice(1).map(function (c) { return '<option' + (r && r.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-field"><label>用时（分钟）</label><input name="minutes" type="number" min="1" max="240" value="' + (r ? r.minutes : 20) + '"></div>' +
      '</div>' +
      '<div class="form-row2">' +
      '<div class="form-field"><label>难度</label><select name="difficulty">' +
      [1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (r && r.difficulty === n ? ' selected' : '') + '>' + (n === 1 ? '简单' : n === 2 ? '中等' : '较难') + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-field"><label>份量（人）</label><input name="servings" type="number" min="1" max="10" value="' + (r ? r.servings : 2) + '"></div>' +
      '</div>' +
      '<div class="form-field"><label>食材（每行：名称 用量，末尾加 (可选) 表示可缺）</label>' +
      '<textarea name="ingredients" required placeholder="土豆 2个&#10;盐 适量">' + esc(ingText) + '</textarea></div>' +
      '<div class="form-field"><label>做法（每行一步）</label>' +
      '<textarea name="steps" required placeholder="土豆切丝，泡水去淀粉。&#10;热油爆香，大火快炒。">' + esc(stepText) + '</textarea></div>' +
      '<div class="modal-actions">' +
      '<button type="submit" class="btn btn-primary">保存</button>' +
      '<button type="button" class="btn" data-act="close-modal">取消</button></div>' +
      '<input type="hidden" name="recipeId" value="' + esc(editId || '') + '">' +
      '</form>'
    );
  }

  function parseIngredientLine(line) {
    let s = String(line).trim();
    if (!s) return null;
    let optional = false;
    if (/[（(]可选[)）]$/.test(s)) { optional = true; s = s.replace(/[（(]可选[)）]$/, '').trim(); }
    const m = s.match(/^(.*?)[\s,，:：]+(.+)$/);
    if (m) return { name: m[1].trim(), amount: m[2].trim(), optional: optional };
    return { name: s, amount: '', optional: optional };
  }

  function submitRecipeForm(form) {
    const fd = new FormData(form);
    const id = fd.get('recipeId');
    const ingredients = String(fd.get('ingredients') || '').split('\n').map(parseIngredientLine).filter(Boolean);
    const steps = String(fd.get('steps') || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    if (!ingredients.length || !steps.length) {
      toast('食材和做法都要填哦');
      return;
    }
    const data = {
      id: id || ('custom-' + Date.now()),
      name: String(fd.get('name') || '').trim(),
      emoji: String(fd.get('emoji') || '').trim() || '🍽️',
      category: String(fd.get('category')),
      difficulty: Number(fd.get('difficulty')) || 1,
      minutes: Number(fd.get('minutes')) || 20,
      servings: Number(fd.get('servings')) || 2,
      ingredients: ingredients,
      steps: steps,
      tags: ['自建']
    };
    if (!data.name) { toast('请填写菜名'); return; }
    if (id) {
      const idx = state.customRecipes.findIndex(function (r) { return r.id === id; });
      if (idx !== -1) state.customRecipes[idx] = data;
      else state.customRecipes.push(data);
      toast('菜谱已更新');
    } else {
      state.customRecipes.push(data);
      toast('菜谱已添加');
    }
    save();
    closeModal();
    renderAll();
  }

  function deleteRecipe(recipeId) {
    const r = recipesById()[recipeId];
    if (!r) return;
    if (!window.confirm('删除菜谱「' + r.name + '」？')) return;
    state.customRecipes = state.customRecipes.filter(function (x) { return x.id !== recipeId; });
    state.cravings = state.cravings.filter(function (x) { return x !== recipeId; });
    save();
    renderAll();
    toast('已删除');
  }

  // ==================== 菜谱导入 ====================
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-lib="' + src + '"]')) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.dataset.lib = src;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('网络加载失败，请检查网络后重试')); };
      document.head.appendChild(s);
    });
  }

  function importRecipesModal() {
    openModal(
      '<button class="modal-close" data-act="close-modal">✕</button>' +
      '<h3>📥 导入菜谱</h3>' +
      '<div class="muted" style="margin-bottom:10px;">支持文档、网页链接、截图文字，也可以直接粘贴。导入后与内置菜谱一起参与排菜和购物清单。</div>' +
      '<div class="import-sources">' +
      '<button class="btn" data-act="import-source" data-src="file">📄 文档</button>' +
      '<button class="btn" data-act="import-source" data-src="link">🌐 链接</button>' +
      '<button class="btn" data-act="import-source" data-src="image">🖼️ 截图</button>' +
      '</div>' +
      '<div id="importSourceArea" style="margin:10px 0;"></div>' +
      '<div class="form-field"><label>菜谱文字（可编辑 / 粘贴）</label>' +
      '<textarea id="importText" placeholder="支持一次多道菜，例如：&#10;&#10;红烧肉&#10;五花肉 500克&#10;冰糖 20克&#10;生姜 3片&#10;做法：&#10;1. 五花肉切块焯水&#10;2. 小火炒糖色后下肉块&#10;3. 加热水炖60分钟"></textarea></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
      '<button class="btn btn-primary" data-act="parse-import-text">🔍 解析菜谱</button>' +
      '<button class="btn btn-ghost" data-act="clear-import-text">清空</button>' +
      '</div>' +
      '<div id="importPreview" style="margin-top:12px;"></div>' +
      '<div id="importCommitArea"></div>'
    );
  }

  function handleImportSource(src) {
    const area = $('#importSourceArea');
    if (src === 'file') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.txt,.text,.md,.markdown,.docx';
      input.onchange = async function () {
        const f = input.files[0];
        if (!f) return;
        toast('正在读取 ' + f.name + '…');
        try {
          $('#importText').value = await readRecipeFile(f);
          toast('已读取，点击「解析菜谱」');
        } catch (err) {
          toast('读取失败：' + err.message);
        }
      };
      input.click();
    } else if (src === 'link') {
      area.innerHTML =
        '<div style="display:flex;gap:8px;">' +
        '<input id="importUrl" type="url" placeholder="https://… 菜谱网页链接" style="flex:1;border:1px solid var(--gray-300);border-radius:10px;padding:9px 11px;outline:none;">' +
        '<button class="btn btn-primary" data-act="link-fetch">获取</button></div>' +
        '<div class="muted" style="margin-top:6px;">部分网站禁止自动抓取，获取失败时可以把网页文字复制后粘贴到下面。</div>';
    } else if (src === 'image') {
      area.innerHTML =
        '<button class="btn" data-act="pick-image">🖼️ 选择截图</button>' +
        '<div class="muted" style="margin-top:6px;">在线识别截图中文字（中文效果较好，需联网）；识别结果填入下方文本框，可修改后解析。没网时可直接把文字粘贴到文本框。</div>';
    }
  }

  async function readRecipeFile(file) {
    const name = String(file.name || '').toLowerCase();
    if (name.endsWith('.docx')) {
      await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js');
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return result.value || '';
    }
    return await file.text();
  }

  async function fetchLinkText(url) {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) {
        const ct = res.headers.get('content-type') || '';
        if (ct.indexOf('text/') !== -1 || ct.indexOf('html') !== -1 || ct.indexOf('json') !== -1) {
          return window.RecipeParser.htmlToText(await res.text());
        }
      }
    } catch (e) { /* 跨域被拦，走本地代理 */ }
    const res = await fetch('/api/fetch?url=' + encodeURIComponent(url));
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || '抓取失败');
    return data.text;
  }

  async function linkFetch() {
    const url = $('#importUrl').value.trim();
    if (!url) { toast('请先输入链接'); return; }
    toast('正在获取网页内容…');
    try {
      $('#importText').value = await fetchLinkText(url);
      toast('已获取，点击「解析菜谱」');
    } catch (err) {
      toast('获取失败：' + err.message);
    }
  }

  async function ocrImage(file) {
    toast('正在加载文字识别组件…');
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
    toast('正在识别截图文字，可能需要一会儿…');
    const result = await window.Tesseract.recognize(file, 'chi_sim+eng');
    return result.data.text || '';
  }

  function pickImportImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async function () {
      const f = input.files[0];
      if (!f) return;
      try {
        const text = await ocrImage(f);
        $('#importText').value = text;
        toast(text ? '识别完成，请检查后解析' : '没识别到文字，可手动粘贴');
      } catch (err) {
        toast('识别失败：' + err.message);
      }
    };
    input.click();
  }

  function parseImportText() {
    const text = $('#importText').value;
    if (!String(text || '').trim()) { toast('请先粘贴或读取菜谱文字'); return; }
    const recipes = window.RecipeParser.parse(text);
    if (!recipes.length) {
      $('#importPreview').innerHTML = '<div class="muted">没有解析出菜谱，请检查文字里是否包含食材用量和做法。</div>';
      $('#importCommitArea').innerHTML = '';
      toast('没有解析出菜谱');
      return;
    }
    renderImportPreview(recipes);
    toast('解析出 ' + recipes.length + ' 道菜谱，可修改后导入');
  }

  function renderImportPreview(recipes) {
    $('#importPreview').innerHTML =
      '<div class="card-title">解析结果（可编辑）</div>' +
      recipes.map(function (r, i) { return importCardHtml(r, i); }).join('');
    $('#importCommitArea').innerHTML =
      '<button class="btn btn-green btn-block" data-act="commit-import">✅ 导入所选菜谱（' + recipes.length + '）</button>';
  }

  function importCardHtml(r, i) {
    const ingText = r.ingredients.map(function (x) {
      return x.name + (x.amount ? ' ' + x.amount : '') + (x.optional ? ' (可选)' : '');
    }).join('\n');
    return '<div class="import-card">' +
      '<label class="import-check"><input type="checkbox" data-idx="' + i + '" checked> <b>' + esc(r.name) + '</b></label>' +
      '<div class="form-row2">' +
      '<div class="form-field"><label>菜名</label><input data-f="name" value="' + esc(r.name) + '"></div>' +
      '<div class="form-field"><label>分类</label><select data-f="category">' +
      CATEGORIES.slice(1).map(function (c) { return '<option' + (r.category === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="form-field"><label>用时（分钟）</label><input data-f="minutes" type="number" min="1" max="300" value="' + r.minutes + '"></div>' +
      '<div class="form-field"><label>难度</label><select data-f="difficulty">' +
      [1, 2, 3].map(function (n) { return '<option value="' + n + '"' + (r.difficulty === n ? ' selected' : '') + '>' + (n === 1 ? '简单' : n === 2 ? '中等' : '较难') + '</option>'; }).join('') +
      '</select></div>' +
      '</div>' +
      '<div class="form-field"><label>食材（每行：名称 用量，末尾可加 (可选)）</label>' +
      '<textarea data-f="ingredients">' + esc(ingText) + '</textarea></div>' +
      '<div class="form-field"><label>做法（每行一步）</label>' +
      '<textarea data-f="steps">' + esc(r.steps.join('\n')) + '</textarea></div>' +
      '</div>';
  }

  function commitImport() {
    const cards = $$('.import-card');
    let count = 0;
    cards.forEach(function (card, idx) {
      if (!card.querySelector('input[data-idx]').checked) return;
      const name = card.querySelector('[data-f="name"]').value.trim();
      if (!name) return;
      const ingredients = card.querySelector('[data-f="ingredients"]').value.split('\n').map(parseIngredientLine).filter(Boolean);
      const steps = card.querySelector('[data-f="steps"]').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      if (!ingredients.length || !steps.length) return;
      state.customRecipes.push({
        id: 'imported-' + Date.now() + '-' + idx,
        name: name,
        emoji: '📄',
        category: card.querySelector('[data-f="category"]').value,
        minutes: Number(card.querySelector('[data-f="minutes"]').value) || 25,
        difficulty: Number(card.querySelector('[data-f="difficulty"]').value) || 2,
        servings: 2,
        ingredients: ingredients,
        steps: steps,
        tags: ['导入']
      });
      count++;
    });
    if (!count) {
      toast('没有可导入的菜谱（请检查勾选、菜名、食材和做法）');
      return;
    }
    save();
    closeModal();
    renderAll();
    switchTab('recipes');
    toast('已导入 ' + count + ' 道菜谱');
  }

  // ==================== 库存 ====================
  function renderInventory() {
    const panel = $('#tab-inventory');
    const invSet = C.buildInventorySet(state.inventory);
    const chips = state.inventory.length
      ? '<div class="inv-chips">' + state.inventory.map(function (n) {
        return '<span class="inv-chip">' + esc(n) + '<button class="x" data-act="remove-inv" data-name="' + esc(n) + '">✕</button></span>';
      }).join('') + '</div>'
      : '<div class="muted" style="margin-bottom:10px;">还没有登记食材，先添加你买回来的菜吧。</div>';

    panel.innerHTML =
      '<div class="card">' +
      '<div class="card-title"><span>🧺 我的食材库存</span><button class="btn btn-sm btn-danger" data-act="clear-inv">清空</button></div>' +
      '<div class="inventory-input-row">' +
      '<input id="invInput" list="invDatalist" placeholder="输入食材，如：五花肉、鸡蛋" autocomplete="off">' +
      '<datalist id="invDatalist">' + allIngredientNames().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
      '<button class="btn btn-primary" data-act="add-inv-input">添加</button>' +
      '</div>' + chips +
      '<button class="btn btn-green btn-block" style="margin-top:12px;" data-act="generate-plan">🍳 用这些食材安排一周</button>' +
      '<div class="muted" style="margin-top:8px;">提示：填入的食材越多，计划越贴合你的冰箱；缺的食材会标出来，可一键生成补购清单。</div>' +
      '</div>' +
      '<div class="card"><div class="card-title">✨ 常用食材</div><div class="muted" style="margin-bottom:10px;">点一下加入库存，再点一下移除。</div>' +
      COMMON_GROUPS.map(function (g) {
        return '<div class="suggest-group"><h4>' + esc(g.g) + '</h4><div class="suggest-chips">' +
          g.items.map(function (n) {
            const added = invSet.has(C.normName(n)) || invSet.has(C.SYNONYMS[C.normName(n)] || '');
            return '<button class="suggest-chip' + (added ? ' added' : '') + '" data-act="toggle-inv" data-name="' + esc(n) + '" title="点击添加，再点移除">' + esc(n) + (added ? ' ✓' : '') + '</button>';
          }).join('') +
          '</div></div>';
      }).join('') +
      '</div>';
  }

  function allIngredientNames() {
    const set = new Set();
    allRecipes().forEach(function (r) {
      r.ingredients.forEach(function (i) { set.add(i.name); });
    });
    COMMON_GROUPS.forEach(function (g) { g.items.forEach(function (n) { set.add(n); }); });
    return Array.from(set);
  }

  function addInventory(name) {
    const n = String(name || '').trim().replace(/[，,]/g, ' ');
    if (!n) return;
    const invSet = new Set(state.inventory.map(C.normName));
    const added = [];
    n.split(/\s+/).forEach(function (one) {
      if (!one) return;
      const key = C.normName(one);
      if (!invSet.has(key)) { state.inventory.push(one); invSet.add(key); added.push(one); }
    });
    if (added.length) {
      save();
      renderAll();
      toast('已添加：' + added.join('、'));
    } else {
      toast('这些食材已经在库存里了');
    }
  }

  // 判断某食材是否已在库存（含同义词两个方向）
  function inventoryHasName(name) {
    const key = C.normName(name);
    const canon = C.SYNONYMS[key];
    return state.inventory.some(function (x) {
      const k = C.normName(x);
      if (k === key || k === canon) return true;
      return !!(C.SYNONYMS[k] && C.SYNONYMS[k] === key);
    });
  }

  // 从库存移除某食材（含同义词两个方向）
  function removeInventoryName(name) {
    const key = C.normName(name);
    const canon = C.SYNONYMS[key];
    const before = state.inventory.length;
    state.inventory = state.inventory.filter(function (x) {
      const k = C.normName(x);
      if (k === key || k === canon) return false;
      if (C.SYNONYMS[k] && C.SYNONYMS[k] === key) return false;
      return true;
    });
    return before !== state.inventory.length;
  }

  // 快捷按钮开关：未加入则加入，已加入则移除
  function toggleInventory(name) {
    const n = String(name || '').trim();
    if (!n) return;
    if (inventoryHasName(n)) {
      const removed = removeInventoryName(n);
      if (removed) {
        save();
        renderAll();
        toast('已从库存移除：' + n);
      }
    } else {
      addInventory(n);
    }
  }

  function removeInventory(name) {
    state.inventory = state.inventory.filter(function (x) { return x !== name; });
    save();
    renderAll();
  }

  // ==================== 购物 ====================
  function renderShopping() {
    const panel = $('#tab-shopping');
    const shop = state.shopping;
    if (!shop || !shop.items.length) {
      panel.innerHTML =
        '<div class="empty-state"><span class="es-ico">🛒</span>' +
        '<b>购物清单还是空的</b><br>去菜谱里选几道想吃的菜，一键汇总要买的食材。' +
        '<br><button class="btn btn-primary" data-act="goto-recipes">去挑菜</button></div>';
      return;
    }
    const need = shop.items.filter(function (i) { return !i.have && !i.optional; });
    const optional = shop.items.filter(function (i) { return i.optional && !i.have; });
    const have = shop.items.filter(function (i) { return i.have; });
    const done = need.filter(function (i) { return i.checked; }).length;
    const sourceText = (shop.source === 'plan' ? '来自「一周计划」缺料补购' : '来自「想吃」的菜谱') + ' · 按约 ' + familyTotal() + ' 人份';

    function itemRow(i) {
      const status = i.have ? 'have' : (i.optional ? 'optional' : 'need');
      const statusText = i.have ? '已有' : (i.optional ? '可选' : '需购买');
      return '<div class="shop-item' + (i.checked ? ' done' : '') + '" data-item="' + esc(i.name) + '">' +
        '<span class="si-check">✓</span>' +
        '<div><div><span class="si-name">' + esc(i.name) + '</span><span class="si-amount">' + esc(i.amount || '') + '</span></div>' +
        '<div class="si-meta">用于：' + esc(i.recipes.join('、')) + '</div>' +
        (!i.have && !i.optional ? substituteHtml(i.name) : '') +
        '</div>' +
        '<span class="si-status ' + status + '">' + statusText + '</span>' +
        '</div>';
    }

    panel.innerHTML =
      '<div class="card">' +
      '<div class="card-title"><span>🛒 购物清单</span><span class="muted">' + esc(sourceText) + '</span></div>' +
      '<div class="shop-toolbar">' +
      '<button class="btn btn-primary" data-act="copy-shopping">📋 复制清单</button>' +
      '<button class="btn" data-act="clear-checked">清除已买</button>' +
      '<button class="btn btn-ghost" data-act="clear-shopping">清空</button>' +
      '</div>' +
      (done ? '<div class="muted" style="margin-bottom:8px;">已买 ' + done + ' / ' + need.length + ' 项</div>' : '') +
      (need.length ? '<div class="shop-group-title">需要购买（' + need.length + '）</div>' + need.map(itemRow).join('') : '') +
      (optional.length ? '<div class="shop-group-title">可选（' + optional.length + '）</div>' + optional.map(itemRow).join('') : '') +
      (have.length ? '<div class="shop-group-title">家中已有（' + have.length + '）</div>' + have.map(itemRow).join('') : '') +
      '</div>';
  }

  function toggleShoppingItem(name) {
    const item = state.shopping.items.find(function (i) { return i.name === name; });
    if (item) { item.checked = !item.checked; save(); renderShopping(); }
  }

  function clearChecked() {
    const before = state.shopping.items.length;
    state.shopping.items = state.shopping.items.filter(function (i) { return !i.checked; });
    save();
    renderAll();
    toast('已移除 ' + (before - state.shopping.items.length) + ' 项');
  }

  // ==================== 设置 ====================
  function renderSettings() {
    const panel = $('#tab-settings');
    const s = state.settings;
    const fam = familyTotal(s);
    const dinnerLimit = Math.round((Number(s.quickLimit) || 25) * 1.5);
    const ratio = autoKidPortion(s.kidAge);
    panel.innerHTML =
      '<div class="card"><div class="card-title">👨‍👩‍👦 家庭饭量</div>' +
      '<div class="setting-row"><div><div class="lbl">成人人数</div><div class="hint">按成人标准份计算</div></div>' +
      '<input type="number" min="1" max="8" value="' + (Number(s.adults) || 2) + '" data-setting="adults"></div>' +
      '<div class="setting-row"><div><div class="lbl">小孩人数</div><div class="hint">没有小孩可设为 0</div></div>' +
      '<input type="number" min="0" max="5" value="' + (Number(s.kids) || 0) + '" data-setting="kids"></div>' +
      '<div class="setting-row"><div><div class="lbl">小孩年龄</div><div class="hint">年龄越大，建议饭量自动增加</div></div>' +
      '<input type="number" min="1" max="18" value="' + (Number(s.kidAge) || 5) + '" data-setting="kidAge"></div>' +
      '<div class="setting-row"><div><div class="lbl">小孩饭量</div><div class="hint">' + (Number(s.kidAge) || 5) + ' 岁建议约 ' + ratio + ' 成人份，可手动微调</div></div>' +
      '<input type="range" min="0.2" max="1.2" step="0.05" value="' + (Number(s.kidPortion) || ratio) + '" data-setting="kidPortion" style="width:130px;flex:none;"></div>' +
      '<div class="muted" style="padding-top:10px;border-top:1px solid var(--gray-100);">全家合计约 <b>' + fam + '</b> 人份（' + (Number(s.adults) || 2) + ' 成人' + (((Number(s.kids) || 0) > 0) ? ' + ' + (Number(s.kids) || 0) + ' 小孩 × ' + (Number(s.kidPortion) || ratio) : '') + '）</div>' +
      '</div>' +
      '<div class="card"><div class="card-title">🚫 忌口</div>' +
      '<div class="setting-row"><div><div class="lbl">全家辣度</div><div class="hint">微辣只保留“微辣/不辣”的菜</div></div>' +
      '<select data-setting="familySpice">' +
      '<option value="normal"' + (s.familySpice === 'normal' ? ' selected' : '') + '>正常</option>' +
      '<option value="mild"' + (s.familySpice === 'mild' ? ' selected' : '') + '>微辣</option>' +
      '<option value="none"' + (s.familySpice === 'none' ? ' selected' : '') + '>不辣</option>' +
      '</select></div>' +
      '<div class="setting-row"><div><div class="lbl">小孩辣度</div><div class="hint">孩子不吃辣就选“不辣”；小孩人数为 0 时忽略此项</div></div>' +
      '<select data-setting="kidSpice">' +
      '<option value="none"' + (s.kidSpice === 'none' ? ' selected' : '') + '>不辣</option>' +
      '<option value="mild"' + (s.kidSpice === 'mild' ? ' selected' : '') + '>微辣</option>' +
      '<option value="normal"' + (s.kidSpice === 'normal' ? ' selected' : '') + '>正常</option>' +
      '</select></div>' +
      '<div class="muted">生成计划时按“全家”和“小孩”中更严格的一档筛选（小孩人数为 0 时只看全家）；辣度标注：🌶️ 微辣、🌶️🌶️ 辣。</div>' +
      '</div>' +
      '<div class="card"><div class="card-title">⚙️ 计划偏好</div>' +
      '<div class="setting-row"><div><div class="lbl">每周天数</div><div class="hint">' + (s.dinnerOnly ? '生成几天的晚餐' : '生成几天的午餐和晚餐') + '</div></div>' +
      '<select data-setting="days" data-num><option value="5"' + (Number(s.days) === 5 ? ' selected' : '') + '>5 天</option><option value="7"' + (Number(s.days) === 7 ? ' selected' : '') + '>7 天</option></select></div>' +
      '<div class="setting-row"><div><div class="lbl">只计划晚餐</div><div class="hint">开启后每天只排晚餐（含配菜和汤），不排午餐</div></div>' +
      '<label class="switch"><input type="checkbox" data-setting="dinnerOnly"' + (s.dinnerOnly ? ' checked' : '') + '><span class="slider"></span></label></div>' +
      '<div class="setting-row"><div><div class="lbl">丰盛晚餐</div><div class="hint">晚餐排满两荤一素一汤，适合 3 人以上家庭</div></div>' +
      '<label class="switch"><input type="checkbox" data-setting="richDinner"' + (s.richDinner ? ' checked' : '') + '><span class="slider"></span></label></div>' +
      '<div class="setting-row"><div><div class="lbl">快手优先</div><div class="hint">优先选总用时 ≤ ' + s.quickLimit + ' 分钟的菜</div></div>' +
      '<label class="switch"><input type="checkbox" data-setting="quick"' + (s.quick ? ' checked' : '') + '><span class="slider"></span></label></div>' +
      '<div class="setting-row"><div><div class="lbl">缺料容忍度</div><div class="hint">每道菜允许缺几种食材仍会被选中</div></div>' +
      '<select data-setting="maxMissing" data-num>' + [0, 1, 2, 3].map(function (n) {
        return '<option value="' + n + '"' + (Number(s.maxMissing) === n ? ' selected' : '') + '>' + n + ' 种</option>';
      }).join('') + '</select></div>' +
      '<div class="setting-row"><div><div class="lbl">' + (s.dinnerOnly ? '快手基准（分钟）' : '午餐快手上限（分钟）') + '</div><div class="hint">' + (s.dinnerOnly ? '晚餐主菜按基准放宽 50%（约 ' + dinnerLimit + ' 分钟）' : '晚餐自动放宽 50%（约 ' + dinnerLimit + ' 分钟）') + '</div></div>' +
      '<input type="number" min="10" max="90" step="5" value="' + s.quickLimit + '" data-setting="quickLimit"></div>' +
      '</div>' +
      '<div class="card"><div class="card-title">💾 数据</div>' +
      '<div class="setting-row"><div><div class="lbl">导出数据</div><div class="hint">库存、自建菜谱、设置保存为 JSON 文件</div></div>' +
      '<button class="btn btn-sm" data-act="export-data">导出</button></div>' +
      '<div class="setting-row"><div><div class="lbl">导入数据</div><div class="hint">从备份文件恢复</div></div>' +
      '<button class="btn btn-sm" data-act="import-data">导入</button></div>' +
      '<div class="setting-row"><div><div class="lbl">清空全部数据</div><div class="hint">清空家庭共享数据（服务器与所有设备同步清空）</div></div>' +
      '<button class="btn btn-sm btn-danger" data-act="reset-data">清空</button></div>' +
      '</div>' +
      '<div class="card muted">🍳 食单 · 一周食谱规划<br>服务器模式下数据保存在服务器并供全家实时共享，离线时暂存本浏览器；换设备打开同一地址即可，也可用“导出/导入”迁移。</div>';
  }

  // ==================== 复制 / 导出 ====================
  function copyText(text, okMsg) {
    const done = function () { toast(okMsg || '已复制'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动复制'); }
    document.body.removeChild(ta);
  }

  function exportData() {
    const data = S.exportData(state);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '食单数据-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('已导出');
  }

  function importDataFile(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        S.importData(JSON.parse(String(reader.result)), state);
        save();
        renderAll();
        switchTab('settings');
        toast('导入成功');
      } catch (e) {
        toast('导入失败：' + e.message);
      }
    };
    reader.readAsText(file);
  }

  function resetData() {
    if (!window.confirm('确定清空所有数据？此操作不可恢复。')) return;
    ['inventory', 'customRecipes', 'disabledRecipes', 'settings', 'plan', 'shopping', 'cravings', 'rev'].forEach(S.remove);
    const fresh = S.loadState();
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, fresh);
    save(); // 清空本地并推送服务器，全设备同步清空
    renderAll();
    switchTab('settings');
    toast('已清空');
  }

  // ==================== 事件 ====================
  function renderAll() {
    renderPlan();
    renderRecipes();
    renderInventory();
    renderShopping();
    renderSettings();
  }

  document.addEventListener('click', function (e) {
    const target = e.target.closest('[data-act],[data-cat],[data-recipe],[data-item]');
    if (!target) return;
    const act = target.dataset.act;
    if (act) {
      switch (act) {
        case 'goto-inventory': switchTab('inventory'); return;
        case 'goto-recipes': switchTab('recipes'); return;
        case 'generate-plan': generatePlan(); return;
        case 'regen-plan': generatePlan(); return;
        case 'replace-meal': replaceMeal(target.dataset.day, target.dataset.meal); return;
        case 'replace-dish': replaceDish(target.dataset.day, target.dataset.meal, target.dataset.dish); return;
        case 'meal-detail': mealDetailModal(target.dataset.day, target.dataset.meal); return;
        case 'copy-plan':
          if (state.plan) copyText(C.planText(state.plan, recipesById()), '计划已复制');
          return;
        case 'plan-missing-shopping': planMissingShopping(); return;
        case 'toggle-pick': togglePick(target.dataset.recipe); return;
        case 'toggle-disable': toggleDisable(target.dataset.recipe); return;
        case 'cravings-shopping': cravingsShopping(); return;
        case 'import-recipes': importRecipesModal(); return;
        case 'import-source': handleImportSource(target.dataset.src); return;
        case 'link-fetch': linkFetch(); return;
        case 'pick-image': pickImportImage(); return;
        case 'parse-import-text': parseImportText(); return;
        case 'clear-import-text':
          $('#importText').value = '';
          $('#importPreview').innerHTML = '';
          $('#importCommitArea').innerHTML = '';
          return;
        case 'commit-import': commitImport(); return;
        case 'custom-recipe-form': customRecipeForm(null); return;
        case 'edit-recipe': customRecipeForm(target.dataset.recipe); return;
        case 'delete-recipe': deleteRecipe(target.dataset.recipe); return;
        case 'toggle-inv': toggleInventory(target.dataset.name); return;
        case 'add-inv-input': {
          const input = $('#invInput');
          addInventory(input ? input.value : '');
          if (input) input.value = '';
          return;
        }
        case 'remove-inv': removeInventory(target.dataset.name); return;
        case 'clear-inv':
          if (window.confirm('清空库存？')) { state.inventory = []; save(); renderAll(); toast('库存已清空'); }
          return;
        case 'copy-shopping': copyText(C.shoppingText(state.shopping.items), '清单已复制'); return;
        case 'clear-checked': clearChecked(); return;
        case 'clear-shopping':
          state.shopping = { items: [], source: null };
          save(); renderAll(); toast('已清空');
          return;
        case 'export-data': exportData(); return;
        case 'import-data': $('#importFile').click(); return;
        case 'reset-data': resetData(); return;
        case 'close-modal': closeModal(); return;
      }
    }
    if (target.dataset.cat) {
      recipeFilter.cat = target.dataset.cat;
      renderRecipes();
      return;
    }
    if (target.dataset.recipe && !target.dataset.act) {
      recipeDetailModal(target.dataset.recipe);
      return;
    }
    if (target.dataset.item && target.classList.contains('shop-item')) {
      toggleShoppingItem(target.dataset.item);
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) closeModal();
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'recipeSearch') {
      recipeFilter.q = e.target.value;
      renderRecipes();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'invInput') {
      e.preventDefault();
      addInventory(e.target.value);
      e.target.value = '';
    }
    if (e.key === 'Escape') closeModal();
  });

  document.addEventListener('change', function (e) {
    const el = e.target;
    if (el.dataset.setting) {
      const key = el.dataset.setting;
      let value;
      if (el.type === 'checkbox') value = el.checked;
      else if (el.dataset.num !== undefined || el.type === 'number' || el.type === 'range') value = Number(el.value);
      else value = el.value;
      if (key === 'kidAge') {
        state.settings.kidAge = value;
        state.settings.kidPortion = autoKidPortion(value);
        save();
        renderSettings();
        toast('已按 ' + value + ' 岁调整饭量：约 ' + autoKidPortion(value) + ' 成人份');
        return;
      }
      if (key === 'familySpice' || key === 'kidSpice' || key === 'dinnerOnly' || key === 'richDinner') {
        state.settings[key] = value;
        save();
        renderSettings();
        if (state.plan) {
          buildPlan();
          toast('已保存，计划已按新设置重新生成');
        } else {
          toast('已保存，生成计划时生效');
        }
        return;
      }
      state.settings[key] = value;
      save();
      renderSettings();
      toast('已保存，重新生成计划后生效');
      return;
    }
    if (el.id === 'importFile' && el.files && el.files[0]) {
      importDataFile(el.files[0]);
      el.value = '';
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id === 'recipeForm') {
      e.preventDefault();
      submitRecipeForm(e.target);
    }
  });

  $$('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
  });

  // ==================== 启动 ====================
  function init() {
    renderAll();
    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      // 禁用 HTTP 缓存参与更新检查，避免 Authentik 会话恢复后仍继续使用旧 Worker。
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function () { /* 离线功能不可用时静默 */ });
    }
    Sync.init({
      getState: syncSnapshot,
      applyState: applyRemoteState,
      hasLocalData: S.hasLocalData,
      confirmSeed: function () { // 服务器无数据时，由用户确认是否上传本机数据（防止陈旧设备自动播种）
        return window.confirm('服务器上还没有共享数据，是否把本机数据上传作为家庭共享数据？');
      },
      onStatus: function (s) {
        const el = $('#syncBadge');
        if (!el) return;
        el.hidden = s !== 'offline';
        el.textContent = '离线（仅本地）';
      }
    });
  }

  init();
})();
