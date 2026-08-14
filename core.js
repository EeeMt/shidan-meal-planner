/* 核心逻辑：食材匹配、一周计划、购物清单聚合
 * 纯函数模块，浏览器和 Node 均可运行。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MealCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SIDE_CATS = ['素菜', '凉菜'];
  const SOUP_CATS = ['汤羹'];
  const MAIN_CATS = ['荤菜', '水产', '蛋豆', '主食', '素菜', '汤羹'];
  // 荤素/蛋白判断不再调用运行时分类器：荤素读菜谱 isMeat 标注，蛋白按派生口径（EEE-34）
  const PROTEIN_CATS = ['荤菜', '水产', '蛋豆'];  // 有蛋白质来源的分类
  const MEAT_CATS = ['荤菜', '水产'];             // 荤菜分类（兜底）
  const VEG_CATS = ['素菜', '凉菜'];
  const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // 「最优带」分数容差：候选得分 = 缺料数×10 + 用时（分）。随机挑选时只允许得分
  // 在最优候选 + 容差以内的候选进入带内，让非并列最优槽位（如空库存首日首菜）也能
  // 在连续重新生成时产生可见变化；带外候选仍被缺料/忌口/荤素等硬约束过滤，质量不退化（EEE-37）
  const BEST_BAND_SCORE = 20;

  // 可互相替代的食材组（“缺 A 时，库存里有同组 B 就推荐 B”）
  const SUBSTITUTE_GROUPS = [
    ['猪里脊', '猪瘦肉', '猪肉', '猪肉末'],
    ['五花肉', '猪瘦肉'],
    ['牛肉', '牛里脊', '牛腩'],
    ['羊肉'],
    ['鸡胸肉', '鸡腿肉', '鸡翅', '鸡腿'],
    ['排骨'],
    ['大虾', '虾仁'],
    ['鱼头', '草鱼', '带鱼', '鲈鱼'],
    ['嫩豆腐', '老豆腐'],
    ['大白菜', '娃娃菜', '包菜'],
    ['生菜', '油麦菜', '菠菜', '菜心', '油菜', '时令蔬菜', '小白菜'],
    ['西兰花', '菜花'],
    ['香菇', '金针菇', '木耳', '蘑菇'],
    ['粉丝', '粉条'],
    ['花生米', '白芝麻']
  ];

  // 常见同义词 -> 菜谱中使用的规范名
  const SYNONYMS = {
    '番茄': '西红柿', '洋番茄': '西红柿', 'tomato': '西红柿',
    '马铃薯': '土豆', '洋芋': '土豆',
    '卷心菜': '包菜', '圆白菜': '包菜', '莲花白': '包菜', '椰菜': '包菜', 'cabbage': '包菜',
    '柿子椒': '青椒', '甜椒': '青椒', '彩椒': '青椒',
    '猪五花': '五花肉', '带皮五花肉': '五花肉',
    '鸡胸': '鸡胸肉', '鸡胸脯肉': '鸡胸肉',
    '鸡腿': '鸡腿肉',
    '白蘑菇': '蘑菇', '口蘑': '蘑菇',
    '绿菜花': '西兰花', 'broccoli': '西兰花',
    '花菜': '菜花',
    '紫茄子': '茄子',
    '豆角': '四季豆', '扁豆': '四季豆',
    '青瓜': '黄瓜',
    '红萝卜': '胡萝卜',
    '藕': '莲藕',
    '黑木耳': '木耳', '木耳(泡发)': '木耳', '水发木耳': '木耳',
    '鲜香菇': '香菇', '冬菇': '香菇',
    '北豆腐': '老豆腐', '老豆腐': '老豆腐', '卤水豆腐': '老豆腐',
    '内酯豆腐': '嫩豆腐', '绢豆腐': '嫩豆腐',
    '豆腐干': '香干',
    '鸡蛋液': '鸡蛋', '蛋': '鸡蛋',
    '里脊': '猪里脊', '里脊肉': '猪里脊', '猪里脊肉': '猪里脊',
    '瘦肉': '猪瘦肉',
    '牛肉末': '牛肉', '牛里脊肉': '牛里脊',
    '鸡翅中': '鸡翅',
    '猪排骨': '排骨', '肋排': '排骨', '小排': '排骨',
    '基围虾': '大虾', '鲜虾': '大虾', '海虾': '大虾',
    '虾仁(鲜)': '虾仁',
    '香肠': '腊肠',
    '挂面': '面条', '鲜面条': '面条', '面': '面条',
    '速冻饺子': '饺子',
    '大米': '大米', '米': '大米',
    '龙口粉丝': '粉丝',
    '红薯粉条': '粉条',
    '小葱': '小葱', '香葱': '小葱', '葱': '小葱',
    '姜': '生姜', '姜片': '生姜', '姜丝': '生姜', '姜末': '生姜',
    '蒜': '大蒜', '蒜瓣': '大蒜', '蒜末': '大蒜',
    '辣椒段': '干辣椒', '干辣椒段': '干辣椒',
    '花椒粒': '花椒',
    '大料': '八角',
    '酱油': '生抽', '鲜酱油': '生抽', '味极鲜': '生抽',
    '红烧酱油': '老抽',
    '黄酒': '料酒',
    '陈醋': '醋', '香醋': '醋', '米醋': '醋', '白醋': '醋',
    '糖': '白糖', '白砂糖': '白糖',
    '食盐': '盐',
    '白胡椒粉': '胡椒粉', '黑胡椒粉': '胡椒粉', '胡椒': '胡椒粉',
    '玉米淀粉': '淀粉', '生粉': '淀粉', '红薯淀粉': '淀粉',
    '郫县豆瓣酱': '豆瓣酱', '红油豆瓣酱': '豆瓣酱',
    '番茄沙司': '番茄酱',
    '香油': '芝麻油', '麻油': '芝麻油',
    '油': '食用油', '植物油': '食用油', '菜籽油': '食用油', '花生油': '食用油',
    '味精': '味精', '鸡精': '鸡精',
    '孜然': '孜然粉',
    '辣椒面': '辣椒粉',
    '酸白菜': '酸菜',
    '豆芽': '豆芽', '绿豆芽': '豆芽', '黄豆芽': '豆芽',
    '花生': '花生米', '油炸花生米': '花生米',
    '西芹': '芹菜',
    '蒜薹': '蒜苔',
    '通菜': '空心菜',
    '甜玉米': '玉米',
    '海带结': '海带',
    '干紫菜': '紫菜',
    '丝瓜': '丝瓜',
    '西葫芦': '西葫芦', '角瓜': '西葫芦'
  };

  function normName(s) {
    return String(s || '').trim().toLowerCase().replace(/\s+/g, '').replace(/[（(].*?[)）]/g, '');
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
  }

  function formatDate(d) {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return m + '月' + day + '日';
  }

  function dayLabel(d) {
    return DAY_NAMES[d.getDay()] + ' ' + formatDate(d);
  }

  // 是否荤菜：读菜谱 isMeat 标注（内置已回填、自建/导入录入时手工选择，缺省按素计）
  function isMeat(recipe) {
    return !!recipe.isMeat;
  }

  // 是否有蛋白质来源（派生，不落库）：荤标注，或分类属荤菜/水产/蛋豆
  function hasProtein(recipe) {
    return !!(recipe.isMeat || PROTEIN_CATS.indexOf(recipe.category) !== -1);
  }

  function isVegetable(recipe) {
    return VEG_CATS.indexOf(recipe.category) !== -1;
  }

  // 荤/素配菜池筛选：荤位只留荤菜，素位只留素菜
  // （番茄炒蛋、家常豆腐这类蛋/豆腐菜是素，可当素配菜；肉汤不进素位）
  function meatSideFilter(r) {
    return isMeat(r);
  }

  function vegSideFilter(r) {
    return !isMeat(r);
  }

  // 辣度：0 不辣 / 1 微辣 / 2 辣
  function spiceLevel(recipe) {
    if (recipe.spice !== undefined && recipe.spice !== null) return Number(recipe.spice) || 0;
    const tags = recipe.tags || [];
    if (tags.indexOf('辣') !== -1) return 2;
    if (tags.indexOf('微辣') !== -1) return 1;
    const names = (recipe.ingredients || []).map(function (i) { return i.name; }).join('');
    if (/小米辣|剁椒/.test(names)) return 2;
    if (/干辣椒|辣椒粉|辣椒面/.test(names)) return 1;
    if (/豆瓣酱/.test(names)) return 1;
    return 0;
  }

  // 库存替代推荐：返回库存里可替代该食材的规范名列表
  function findSubstitutes(ingredientName, inventory) {
    const n = normName(ingredientName);
    const invSet = buildInventorySet(inventory);
    if (!n || invSet.size === 0) return [];

    const matchGroup = function (item) {
      const m = normName(item);
      if (m === n) return true;
      if (m.length >= 2 && n.length >= 2 && (m.includes(n) || n.includes(m))) return true;
      return false;
    };
    const group = SUBSTITUTE_GROUPS.find(function (g) { return g.some(matchGroup); });
    if (!group) return [];

    const results = [];
    group.forEach(function (item) {
      const iname = normName(item);
      if (iname === n) return;
      for (const inv of invSet) {
        if (iname === inv || (iname.length >= 2 && inv.length >= 2 && (iname.includes(inv) || inv.includes(iname)))) {
          results.push(item);
          break;
        }
      }
    });
    return results;
  }

  // 把库存列表变成“规范名集合”，支持同义词
  function buildInventorySet(inventory, synonyms) {
    const map = synonyms || SYNONYMS;
    const set = new Set();
    (inventory || []).forEach(function (item) {
      const n = normName(item);
      if (!n) return;
      set.add(n);
      if (map[n]) set.add(map[n]);
    });
    return set;
  }

  // 判断某个食材是否被库存覆盖：先精确匹配，再做合理的包含匹配
  function ingredientCovered(ingName, invSet) {
    const n = normName(ingName);
    if (!n) return true; // 空食材名视为已覆盖
    if (invSet.has(n)) return true;
    for (const item of invSet) {
      if (item.length < 2 || n.length < 2) continue;
      if (item.includes(n) || n.includes(item)) return true;
    }
    return false;
  }

  function matchRecipe(recipe, invSet) {
    const essential = recipe.ingredients.filter(function (i) { return !i.optional; });
    const missing = [];
    essential.forEach(function (i) {
      if (!ingredientCovered(i.name, invSet)) missing.push({ name: i.name, amount: i.amount });
    });
    const covered = essential.length - missing.length;
    return {
      recipe: recipe,
      coverage: essential.length ? covered / essential.length : 1,
      missingCount: missing.length,
      missing: missing,
      totalEssential: essential.length
    };
  }

  // 排序候选：缺料少优先、用时短优先、难度低优先
  function rankRecipes(recipes, invSet, opts) {
    opts = opts || {};
    const maxMissing = (opts.maxMissing === undefined || opts.maxMissing === null) ? 2 : opts.maxMissing;
    const maxSpice = opts.maxSpice === undefined ? 2 : opts.maxSpice;
    return recipes
      .map(function (r) { return matchRecipe(r, invSet); })
      .filter(function (m) { return m.missingCount <= maxMissing && spiceLevel(m.recipe) <= maxSpice; })
      .sort(function (a, b) {
        if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
        if (a.recipe.minutes !== b.recipe.minutes) return a.recipe.minutes - b.recipe.minutes;
        if (a.recipe.difficulty !== b.recipe.difficulty) return a.recipe.difficulty - b.recipe.difficulty;
        return 0;
      });
  }

  // 候选得分：缺料数×10 + 用时（分），与 rankRecipes 的排序口径一致
  function candidateScore(c) {
    return c.missingCount * 10 + c.recipe.minutes;
  }

  // 带内均匀随机：避免「恒取第一名」导致最优槽位固定不变（EEE-37）
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickBest(candidates, constraints) {
    constraints = constraints || {};
    const excludeIds = constraints.excludeIds || new Set();
    const usedIds = constraints.usedIds || new Set();
    const preferCats = constraints.preferCats || null; // 数组或 null
    const avoidCats = constraints.avoidCats || new Set();
    const quick = constraints.quick;
    const quickLimit = constraints.quickLimit || 35;

    let pool = candidates.filter(function (c) {
      return !excludeIds.has(c.recipe.id) && !usedIds.has(c.recipe.id);
    });
    if (!pool.length) return null;

    let ordered = pool;
    if (preferCats && preferCats.length) {
      const preferred = pool.filter(function (c) { return preferCats.indexOf(c.recipe.category) !== -1; });
      if (preferred.length) ordered = preferred;
    }
    if (avoidCats.size) {
      const notAvoided = ordered.filter(function (c) { return !avoidCats.has(c.recipe.category); });
      if (notAvoided.length) ordered = notAvoided;
    }
    if (quick) {
      const fast = ordered.filter(function (c) { return c.recipe.minutes <= quickLimit; });
      if (fast.length) ordered = fast;
    }
    // 最优带均匀随机（EEE-37）：在「得分 ≤ 最优 + 容差」的带内等概率挑选，
    // 使非并列最优槽位（如首日首菜）随重新生成而变化；带外候选被硬约束过滤，不退化。
    // keepMeat（主菜槽）：带内还限定与最优候选同荤素，避免随机把主菜从荤翻成素（反之亦然）
    // keepProtein（主菜槽）：带内还限定与最优候选同蛋白口径，恢复「同分优先蛋白主菜」设计，
    // 避免随机把蛋白主菜翻成无蛋白主食（EEE-37 复核）
    const keepMeat = constraints.keepMeat;
    const keepProtein = constraints.keepProtein;
    const best = ordered[0];
    const bestScore = candidateScore(best);
    const band = ordered.filter(function (c) {
      return candidateScore(c) <= bestScore + BEST_BAND_SCORE &&
             (!keepMeat || !!c.recipe.isMeat === !!best.recipe.isMeat) &&
             (!keepProtein || hasProtein(c.recipe) === hasProtein(best.recipe));
    });
    return band.length > 1 ? pickRandom(band) : best;
  }

  // 为某一餐挑选主菜
  // constraints.meatReq：true 只要荤、false 只要素、undefined 不限（换菜时保持荤素类型）
  // constraints.onlyCats：严格限定候选类别（数组，如主食主菜只换主食）
  // constraints.banCats：严格排除候选类别（数组，如素主菜不得换成主食）
  function pickMain(recipes, invSet, opts, constraints) {
    constraints = constraints || {};
    const meatReq = constraints.meatReq;
    const onlyCats = constraints.onlyCats;
    const banCats = constraints.banCats;
    const reqOk = function (c) {
      if (meatReq !== undefined && isMeat(c.recipe) !== meatReq) return false;
      if (onlyCats && onlyCats.indexOf(c.recipe.category) === -1) return false;
      if (banCats && banCats.indexOf(c.recipe.category) !== -1) return false;
      return true;
    };
    const rank = function (o) {
      return rankRecipes(recipes, invSet, o)
        .filter(reqOk)
        // 同分时优先自带蛋白的菜（避免净挑无荤主食再临时补荤）
        .sort(function (a, b) {
          return (hasProtein(b.recipe) ? 1 : 0) - (hasProtein(a.recipe) ? 1 : 0);
        });
    };
    let ranked = rank({ maxMissing: opts.maxMissing, maxSpice: opts.maxSpice });
    let chosen = pickBest(ranked, Object.assign({}, constraints, { keepMeat: true, keepProtein: true }));
    if (!chosen && opts.maxMissing < 99) {
      // 放松缺料限制，保证每餐都有菜
      chosen = pickBest(rank({ maxMissing: 99, maxSpice: opts.maxSpice }), Object.assign({}, constraints, { keepMeat: true, keepProtein: true }));
      if (!chosen) {
        // 实在没有符合忌口的菜时，保证有菜可吃（如全部库存都是辣菜）
        chosen = pickBest(rank({ maxMissing: 99, maxSpice: 2 }), Object.assign({}, constraints, { keepMeat: true, keepProtein: true }));
      }
    }
    return chosen;
  }

  // 为某一餐挑选配菜
  function pickSides(recipes, invSet, opts, constraints, count, cats, filter) {
    const pool = recipes.filter(function (r) {
      return cats.indexOf(r.category) !== -1 && (!filter || filter(r));
    });
    let ranked = rankRecipes(pool, invSet, { maxMissing: opts.maxMissing, maxSpice: opts.maxSpice });
    if (!ranked.length && opts.maxMissing < 99) {
      ranked = rankRecipes(pool, invSet, { maxMissing: 99, maxSpice: opts.maxSpice });
    }
    if (!ranked.length) {
      ranked = rankRecipes(pool, invSet, { maxMissing: 99, maxSpice: 2 });
    }
    const picked = [];
    const localUsed = new Set(constraints.usedIds);
    const sideConstraints = function () {
      return {
        excludeIds: new Set([constraints.mainId, ...constraints.excludeIds, ...picked.map(function (p) { return p.recipe.id; })]),
        usedIds: localUsed,
        quick: opts.quick,
        quickLimit: 20
      };
    };
    for (let i = 0; i < count; i++) {
      let c = pickBest(ranked, sideConstraints());
      if (!c && opts.maxMissing < 99) {
        // 低缺料的候选被近餐占用时，放宽缺料限制重选，保证配菜位有菜
        ranked = rankRecipes(pool, invSet, { maxMissing: 99, maxSpice: 2 });
        c = pickBest(ranked, sideConstraints());
      }
      if (!c) break;
      picked.push(c);
      localUsed.add(c.recipe.id);
    }
    return picked;
  }

  function mealMissing(main, sides, servings) {
    const map = new Map();
    [main].concat(sides).forEach(function (m) {
      (m.missing || []).forEach(function (mi) {
        const key = normName(mi.name);
        if (!map.has(key)) map.set(key, []);
        const factor = servings ? servings / m.recipe.servings : 1;
        map.get(key).push({ name: mi.name, amount: scaleAmount(mi.amount, factor) });
      });
    });
    return Array.from(map.entries()).map(function (e) {
      return { name: e[1][0].name, amount: e[1].map(function (x) { return x.amount; }).join(' + ') };
    });
  }

  // 构建一餐
  function buildMeal(recipes, invSet, opts, dayIndex, mealType, state) {
    const mainUsed = new Set(state.usedHistory.slice(-15));
    const usedIds = new Set(state.usedHistory.slice(-9));
    const sameDayMainId = mealType === 'dinner' && state.dayPlan.lunch && state.dayPlan.lunch.main
      ? state.dayPlan.lunch.main.recipe.id : null;
    const sameDayMainCat = mealType === 'dinner' && state.dayPlan.lunch && state.dayPlan.lunch.main
      ? state.dayPlan.lunch.main.recipe.category : null;

    const preferCats = mealType === 'lunch'
      ? ['荤菜', '水产', '蛋豆', '主食']
      : ['荤菜', '水产', '蛋豆'];
    const avoidCats = sameDayMainCat ? new Set([sameDayMainCat]) : new Set();

    const mainExcluded = new Set(state.excluded || []);
    if (sameDayMainId) mainExcluded.add(sameDayMainId);

    const main = pickMain(recipes, invSet, opts, {
      excludeIds: mainExcluded,
      usedIds: mainUsed,
      preferCats: preferCats,
      avoidCats: avoidCats,
      quick: opts.quick,
      quickLimit: mealType === 'lunch' ? opts.quickLimit : Math.round(opts.quickLimit * 1.5)
    });
    if (!main) return null;

    const mainR = main.recipe;
    const proteinOk = hasProtein(mainR); // 主菜是否有蛋白质来源
    const meatOk = isMeat(mainR);        // 主菜是否荤（常识口径：豆腐算素）
    const vegOk = isVegetable(mainR);    // 主菜是否素菜/凉菜类
    const sideLimit = mealType === 'lunch' ? Math.min(15, opts.quickLimit) : 20;
    const soupLimit = mealType === 'lunch' ? 15 : 25;
    const sideUsed = new Set(usedIds);
    sideUsed.add(mainR.id);
    const sides = [];
    const soups = [];

    function addSide(cats, limit, filter) {
      const picked = pickSides(recipes, invSet, Object.assign({}, opts, { quickLimit: limit }), {
        mainId: mainR.id,
        usedIds: sideUsed,
        excludeIds: state.excluded ? Array.from(state.excluded) : [],
        quick: opts.quick
      }, 1, cats, filter);
      if (picked.length) {
        sides.push(picked[0]);
        sideUsed.add(picked[0].recipe.id);
        return true;
      }
      return false;
    }

    // 丰盛晚餐：排满两个配菜位，组合出两荤一素
    // 目标 = 主菜 + 两个配菜。主菜是荤 → 配菜补一素一荤；
    // 主菜是素（蛋豆/素菜按家常口径均不算荤）→ 两个配菜位都排荤，凑满两荤一素
    if (opts.richDinner && mealType === 'dinner') {
      const firstCats = meatOk ? VEG_CATS : PROTEIN_CATS;
      const secondCats = PROTEIN_CATS;
      const firstFilter = firstCats === VEG_CATS ? vegSideFilter : meatSideFilter;
      const secondFilter = meatSideFilter;
      if (!addSide(firstCats, sideLimit, firstFilter)) addSide(PROTEIN_CATS.concat(VEG_CATS, SOUP_CATS), 99, firstFilter);
      if (!addSide(secondCats, sideLimit, secondFilter)) addSide(PROTEIN_CATS.concat(VEG_CATS, SOUP_CATS), 99, secondFilter);
    } else {
      // 保证每餐一荤一素（常识口径）：主菜缺荤补荤（荤菜/水产/含蛋肉的蛋豆）、缺素补素
      if (!meatOk) {
        const got = addSide(PROTEIN_CATS, sideLimit, meatSideFilter);
        if (!got) addSide(PROTEIN_CATS.concat(VEG_CATS, SOUP_CATS), 99, meatSideFilter);
      } else if (!vegOk) {
        const got = addSide(VEG_CATS, sideLimit, vegSideFilter);
        if (!got) addSide(VEG_CATS.concat(PROTEIN_CATS, SOUP_CATS), 99, vegSideFilter);
      } else if (proteinOk && sides.length === 0) {
        addSide(VEG_CATS, sideLimit, vegSideFilter);
      }
    }

    // 晚餐加汤（主菜本身是汤则不加）
    if (mealType === 'dinner' && mainR.category !== '汤羹') {
      const soupUsed = new Set(sideUsed);
      const picked = pickSides(recipes, invSet, Object.assign({}, opts, { quickLimit: soupLimit }), {
        mainId: mainR.id,
        usedIds: soupUsed,
        excludeIds: state.excluded ? Array.from(state.excluded) : [],
        quick: opts.quick
      }, 1, SOUP_CATS);
      if (picked.length) {
        soups.push(picked[0]);
        sideUsed.add(picked[0].recipe.id);
      }
    }

    const dishes = [main].concat(sides, soups);
    const totalMinutes = dishes.reduce(function (s, d) { return s + d.recipe.minutes; }, 0);
    return {
      main: main,
      sides: sides.map(function (s) { return s; }),
      soups: soups.map(function (s) { return s; }),
      dishes: dishes,
      totalMinutes: totalMinutes,
      missing: mealMissing(main, sides.concat(soups), opts.servings)
    };
  }

  // 单次生成的随机排除集：从内置全库（≥40 道）里随机抽 4~10 道本计划不排，
  // 保证用户点名的菜（如虾仁炒蛋）也能在某些次重新生成中缺席（EEE-37 复核）。
  // 菜池过小（<40）时返回空集，避免小池子结构测试因排除而断菜。
  function randomExcluded(recipes) {
    if (recipes.length < 40) return new Set();
    const n = 4 + Math.floor(Math.random() * 7); // 4~10
    const copy = recipes.slice();
    shuffle(copy);
    return new Set(copy.slice(0, n).map(function (r) { return r.id; }));
  }

  // Fisher–Yates 洗牌：打乱输入顺序，配合下方稳定排序实现同分候选随机化，
  // 让「重新制定一周计划」每次生成不同（但同样满足荤素/忌口/缺料约束）的一周计划
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function planWeek(recipes, inventory, opts) {
    opts = Object.assign({
      days: 7, servings: 2, quick: true, maxMissing: 2, quickLimit: 25, start: new Date()
    }, opts || {});
    const invSet = buildInventorySet(inventory);
    const allRecipes = shuffle(recipes.slice());
    const state = { usedHistory: [], dayPlan: null, excluded: randomExcluded(allRecipes) };
    const days = [];

    function pushMeal(meal) {
      if (!meal) return;
      meal.dishes.forEach(function (d) { state.usedHistory.push(d.recipe.id); });
    }

    const mealTypes = opts.dinnerOnly ? ['dinner'] : ['lunch', 'dinner'];
    for (let i = 0; i < opts.days; i++) {
      const date = addDays(opts.start, i);
      state.dayPlan = { lunch: null, dinner: null };
      mealTypes.forEach(function (mealType) {
        state.dayPlan[mealType] = buildMeal(allRecipes, invSet, opts, i, mealType, state);
        pushMeal(state.dayPlan[mealType]);
      });

      days.push({
        date: date,
        label: dayLabel(date),
        lunch: state.dayPlan.lunch,
        dinner: state.dayPlan.dinner
      });
    }

    const stats = computeStats(days);
    return { generatedAt: Date.now(), opts: opts, days: days, stats: stats };
  }

  function computeStats(days) {
    let totalMinutes = 0, meals = 0;
    const used = new Set();
    const missingMap = new Map();
    days.forEach(function (d) {
      ['lunch', 'dinner'].forEach(function (mealType) {
        const meal = d[mealType];
        if (!meal) return;
        meals++;
        totalMinutes += meal.totalMinutes;
        meal.dishes.forEach(function (dish) { used.add(dish.recipe.id); });
        (meal.missing || []).forEach(function (mi) {
          const key = normName(mi.name);
          if (!missingMap.has(key)) missingMap.set(key, { name: mi.name, amount: mi.amount, count: 0 });
          missingMap.get(key).count++;
        });
      });
    });
    return {
      avgMinutes: meals ? Math.round(totalMinutes / meals) : 0,
      uniqueRecipes: used.size,
      missing: Array.from(missingMap.values())
    };
  }

  // 旧计划归一化（EEE-34）：plan 内嵌的 dish.recipe 是历史快照（缺 isMeat 等新字段），
  // 按 id 用当前菜谱重新解析；解析不到（菜谱已删除）保留原快照兜底。
  // dishes = [main, ...sides, ...soups]；main/sides/soups 与 dishes 可能被 JSON 往返切断引用，
  // 归一化后统一指向同一批 dish 对象，保证荤素显示与换菜读到新标注。
  // recipesById：id -> 当前菜谱对象的映射（含自建/导入）。
  function normalizePlan(plan, recipesById) {
    if (!plan || !Array.isArray(plan.days)) return plan;
    const byId = recipesById || {};
    plan.days.forEach(function (day) {
      ['lunch', 'dinner'].forEach(function (m) {
        const meal = day[m];
        if (!meal || !Array.isArray(meal.dishes) || !meal.dishes.length) return;
        const sidesCount = Array.isArray(meal.sides) ? meal.sides.length : 0;
        meal.dishes.forEach(function (dish) {
          if (dish && dish.recipe && dish.recipe.id) {
            const live = byId[dish.recipe.id];
            if (live) dish.recipe = live;
          }
        });
        meal.main = meal.dishes[0] || null;
        meal.sides = meal.dishes.slice(1, 1 + sidesCount);
        meal.soups = meal.dishes.slice(1 + sidesCount);
      });
    });
    return plan;
  }

  // 替换某一餐里的某一个菜槽：只换该槽位，其余槽位不变
  // 返回 null 表示换不出候选（槽位保持原样），供 UI 提示「暂无其他可选」
  // extraExcludeIds：近几轮换出的菜（可选），排除它们让候选真正轮转，避免两菜之间来回换
  function replaceDish(plan, recipes, inventory, opts, dayIndex, mealType, dishIndex, extraExcludeIds) {
    const day = plan.days[dayIndex];
    if (!day) return null;
    const meal = day[mealType];
    if (!meal || !Array.isArray(meal.dishes)) return null;
    dishIndex = Number(dishIndex);
    if (!isFinite(dishIndex) || dishIndex < 0 || dishIndex >= meal.dishes.length) return null;
    const oldDish = meal.dishes[dishIndex];
    if (!oldDish || !oldDish.recipe) return null;
    const oldR = oldDish.recipe;

    // 用过的菜历史（与 replaceMeal 一致）：之前所有天 + 当天另一餐
    const usedBefore = [];
    for (let i = 0; i < dayIndex; i++) {
      ['lunch', 'dinner'].forEach(function (m) {
        const other = plan.days[i][m];
        if (other) other.dishes.forEach(function (d) { usedBefore.push(d.recipe.id); });
      });
    }
    ['lunch', 'dinner'].forEach(function (m) {
      if (m === mealType) return;
      const other = day[m];
      if (other) other.dishes.forEach(function (d) { usedBefore.push(d.recipe.id); });
    });

    // 当前餐内除被换槽位外的所有菜都要避免重复
    const inMeal = meal.dishes
      .map(function (d) { return d.recipe.id; })
      .filter(function (id) { return id !== oldR.id; });

    const invSet = buildInventorySet(inventory);
    const sideUsed = new Set(usedBefore.slice(-9).concat(inMeal));
    const mainUsed = new Set(usedBefore.slice(-15).concat(inMeal));

    const sameDayMainId = mealType === 'dinner' && day.lunch && day.lunch.main
      ? day.lunch.main.recipe.id : null;
    const sameDayMainCat = mealType === 'dinner' && day.lunch && day.lunch.main
      ? day.lunch.main.recipe.category : null;
    const avoidCats = sameDayMainCat ? new Set([sameDayMainCat]) : new Set();

    // 定位槽位角色：主菜 / 配菜 / 汤
    let slotType = 'side', slotIdx = -1;
    if (meal.main && meal.main.recipe.id === oldR.id) {
      slotType = 'main';
    } else {
      for (let i = 0; i < meal.soups.length; i++) {
        if (meal.soups[i].recipe.id === oldR.id) { slotType = 'soup'; slotIdx = i; break; }
      }
      if (slotType === 'side') {
        for (let i = 0; i < meal.sides.length; i++) {
          if (meal.sides[i].recipe.id === oldR.id) { slotIdx = i; break; }
        }
      }
    }

    // 先排除「近几轮换出的菜」再选，让候选轮转而不是两菜来回；
    // 若候选被这些历史占满选不出，退回只排除当前菜，保证总能换出来
    const doPick = function (extra) {
      if (slotType === 'main') {
        const preferCats = mealType === 'lunch'
          ? ['荤菜', '水产', '蛋豆', '主食']
          : ['荤菜', '水产', '蛋豆'];
        // 荤主菜换荤、素主菜换素（不得换成主食或汤）；主食主菜只换主食
        const oldIsStaple = oldR.category === '主食';
        return pickMain(recipes, invSet, opts, {
          excludeIds: new Set([oldR.id].concat(sameDayMainId ? [sameDayMainId] : [], extra || [])),
          usedIds: mainUsed,
          preferCats: preferCats,
          avoidCats: avoidCats,
          quick: opts.quick,
          quickLimit: mealType === 'lunch' ? opts.quickLimit : Math.round(opts.quickLimit * 1.5),
          meatReq: isMeat(oldR),
          onlyCats: oldIsStaple ? ['主食'] : null,
          banCats: (!oldIsStaple && !isMeat(oldR)) ? ['主食', '汤羹'] : null
        });
      }
      const isSoup = slotType === 'soup';
      const limit = isSoup
        ? (mealType === 'lunch' ? 15 : 25)
        : (mealType === 'lunch' ? Math.min(15, opts.quickLimit) : 20);
      // 素配菜池不含汤羹：素菜换素菜，不会把配菜位换成一碗汤
      const cats = isSoup ? SOUP_CATS : PROTEIN_CATS.concat(VEG_CATS);
      const filter = isSoup ? null : (isMeat(oldR) ? meatSideFilter : vegSideFilter);
      const picked = pickSides(recipes, invSet, Object.assign({}, opts, { quickLimit: limit }), {
        mainId: meal.main.recipe.id,
        usedIds: sideUsed,
        excludeIds: [oldR.id].concat(extra || []),
        quick: opts.quick
      }, 1, cats, filter);
      return picked.length ? picked[0] : null;
    };
    let fresh = doPick(extraExcludeIds);
    if (!fresh && extraExcludeIds && extraExcludeIds.length) fresh = doPick(null);

    if (!fresh) return null; // 换不出合适的菜则保持原样，null 供 UI 提示「暂无其他可选」

    if (slotType === 'main') {
      meal.main = fresh;
    } else if (slotType === 'soup') {
      meal.soups[slotIdx] = fresh;
    } else {
      meal.sides[slotIdx] = fresh;
    }
    meal.dishes = [meal.main].concat(meal.sides, meal.soups);
    meal.totalMinutes = meal.dishes.reduce(function (s, d) { return s + d.recipe.minutes; }, 0);
    meal.missing = mealMissing(meal.main, meal.sides.concat(meal.soups), opts.servings);
    plan.stats = computeStats(plan.days);
    return plan;
  }

  // 一餐是否结构完整：主菜 + 足量配菜（+ 汤，主菜本身是汤则汤可缺）
  function mealComplete(meal, opts, mealType) {
    if (!meal || !meal.main || !Array.isArray(meal.sides)) return false;
    const needSides = opts.richDinner && mealType === 'dinner' ? 2 : 1;
    if (meal.sides.length < needSides) return false;
    if (mealType !== 'dinner') return true;
    const mainR = meal.main.recipe;
    if (mainR && mainR.category === '汤羹') return true; // 主菜即汤：不加汤也完整
    return Array.isArray(meal.soups) && meal.soups.length === 1;
  }

  // 替换某一餐：保留之前的历史，只重选该餐
  // extraExcludeIds：近几轮换出的菜（可选），避免换走后又立刻换回最初那餐
  function replaceMeal(plan, recipes, inventory, opts, dayIndex, mealType, extraExcludeIds) {
    const usedBefore = [];
    for (let i = 0; i < dayIndex; i++) {
      ['lunch', 'dinner'].forEach(function (m) {
        const meal = plan.days[i][m];
        if (meal) meal.dishes.forEach(function (d) { usedBefore.push(d.recipe.id); });
      });
    }
    const day = plan.days[dayIndex];
    ['lunch', 'dinner'].forEach(function (m) {
      if (m === mealType) return;
      const meal = day[m];
      if (meal) meal.dishes.forEach(function (d) { usedBefore.push(d.recipe.id); });
    });

    const invSet = buildInventorySet(inventory);
    const old = day[mealType];
    if (old) old.dishes.forEach(function (d) { usedBefore.push(d.recipe.id); });
    const build = function (history) {
      return buildMeal(recipes, invSet, opts, dayIndex, mealType, {
        usedHistory: history,
        dayPlan: { lunch: day.lunch, dinner: day.dinner }
      });
    };
    let fresh = build(usedBefore.concat(extraExcludeIds || []));
    // 近几轮换出的菜把候选占满时，退回纯历史重排，保证这一餐总能换出来
    if (!fresh && extraExcludeIds && extraExcludeIds.length) fresh = build(usedBefore);
    // 重排出的餐结构不完整（小池子凑不齐主菜+配菜+汤）时也保持原样，供 UI 提示「暂无其他可选」
    if (!fresh || !mealComplete(fresh, opts, mealType)) return null;
    day[mealType] = fresh;
    plan.stats = computeStats(plan.days);
    return plan;
  }

  // 库存变化后刷新整份计划的缺料信息：菜谱不变，只重算每道菜的缺失、每餐聚合与统计
  function refreshPlanMissing(plan, inventory, servings) {
    if (!plan || !Array.isArray(plan.days)) return plan;
    const invSet = buildInventorySet(inventory);
    plan.days.forEach(function (day) {
      ['lunch', 'dinner'].forEach(function (mealType) {
        const meal = day[mealType];
        if (!meal || !Array.isArray(meal.dishes)) return;
        meal.dishes.forEach(function (dish) {
          if (dish && dish.recipe) dish.missing = matchRecipe(dish.recipe, invSet).missing;
        });
        // dishes = [main, ...sides, ...soups]。经 localStorage/同步 JSON 往返后
        // main/sides/soups 与 dishes 元素不是同一引用，聚合必须基于 dishes 本身，
        // 否则 mealMissing 读到的是未刷新的旧 missing（原 bug：改库存后缺失不更新）
        meal.missing = mealMissing(meal.dishes[0], meal.dishes.slice(1), servings);
      });
    });
    plan.stats = computeStats(plan.days);
    return plan;
  }

  // ============ 购物清单聚合 ============
  const UNIT_ALIAS = {
    'g': 'g', '克': 'g', '公克': 'g', 'gram': 'g', 'grams': 'g',
    'kg': 'kg', '千克': 'kg', '公斤': 'kg',
    '斤': '斤',
    'ml': 'ml', '毫升': 'ml', 'cc': 'ml',
    'l': 'l', '升': 'l',
    '个': '个', '枚': '个',
    '根': '根', '条': '条', '棵': '棵', '把': '把', '小把': '小把', '段': '段', '块': '块',
    '片': '片', '瓣': '瓣', '头': '头', '碗': '碗', '罐': '罐', '张': '张', '勺': '勺'
  };

  function parseAmount(amount) {
    if (!amount) return null;
    const m = String(amount).match(/^([\d.]+)\s*(克|g|千克|kg|公斤|斤|毫升|ml|升|l|个|枚|根|条|棵|把|小把|段|块|片|瓣|头|碗|罐|张|勺)$/i);
    if (!m) return null;
    return { value: parseFloat(m[1]), unit: UNIT_ALIAS[m[2].toLowerCase()] || m[2] };
  }

  function scaleAmount(amount, factor) {
    const p = parseAmount(amount);
    if (!p) return amount;
    let v = p.value * factor;
    if (p.unit === 'g' || p.unit === 'ml' || p.unit === 'kg' || p.unit === 'l' || p.unit === '斤') {
      v = Math.round(v / 5) * 5;
    } else {
      v = Math.round(v * 2) / 2;
    }
    if (v <= 0) v = Math.max(p.value, 0.5);
    return String(v) + p.unit;
  }

  function sumAmounts(amounts) {
    if (!amounts.length) return '';
    if (amounts.length === 1) return amounts[0];
    const parsed = amounts.map(parseAmount);
    if (parsed.every(Boolean) && parsed.every(function (p) { return p.unit === parsed[0].unit; })) {
      const sum = parsed.reduce(function (s, p) { return s + p.value; }, 0);
      return String(Math.round(sum * 100) / 100) + parsed[0].unit;
    }
    return amounts.join(' + ');
  }

  // selectedRecipes: [{recipe, servings?}]，servings 默认按菜谱 servings 计算
  function aggregateShopping(selectedRecipes, inventory) {
    const invSet = buildInventorySet(inventory);
    const map = new Map();
    selectedRecipes.forEach(function (item) {
      const recipe = item.recipe;
      const factor = item.servings ? item.servings / recipe.servings : 1;
      recipe.ingredients.forEach(function (ing) {
        const key = normName(ing.name);
        if (!map.has(key)) {
          map.set(key, { name: ing.name, amountList: [], optional: !!ing.optional, recipes: [] });
        }
        const entry = map.get(key);
        const scaled = factor === 1 ? ing.amount : scaleAmount(ing.amount, factor);
        entry.amountList.push(scaled);
        if (entry.recipes.indexOf(recipe.name) === -1) entry.recipes.push(recipe.name);
      });
    });
    const items = Array.from(map.values()).map(function (e) {
      const have = ingredientCovered(e.name, invSet);
      return {
        name: e.name,
        amount: sumAmounts(e.amountList),
        optional: e.optional,
        recipes: e.recipes,
        have: have,
        checked: false
      };
    });
    items.sort(function (a, b) {
      if (a.have !== b.have) return a.have ? 1 : -1;
      if (a.optional !== b.optional) return a.optional ? 1 : -1;
      return a.name.localeCompare(b.name, 'zh');
    });
    return items;
  }

  function shoppingText(items) {
    const need = items.filter(function (i) { return !i.have && !i.optional; });
    const have = items.filter(function (i) { return i.have; });
    const opt = items.filter(function (i) { return i.optional && !i.have; });
    const lines = ['【需要购买】'];
    need.forEach(function (i, idx) { lines.push((idx + 1) + '. ' + i.name + (i.amount ? ' ' + i.amount : '')); });
    if (opt.length) {
      lines.push('');
      lines.push('【可选购买】');
      opt.forEach(function (i, idx) { lines.push((idx + 1) + '. ' + i.name + (i.amount ? ' ' + i.amount : '')); });
    }
    if (have.length) {
      lines.push('');
      lines.push('【家中已有】');
      have.forEach(function (i) { lines.push('· ' + i.name + (i.amount ? ' ' + i.amount : '')); });
    }
    return lines.join('\n');
  }

  function planText(plan, recipesById) {
    const lines = [];
    const servings = plan.opts && plan.opts.servings ? plan.opts.servings : 2;
    lines.push('食单 · 一周计划（约 ' + servings + ' 人份）');
    lines.push('');
    plan.days.forEach(function (d) {
      lines.push('『' + d.label + '』');
      ['lunch', 'dinner'].forEach(function (m) {
        const meal = d[m];
        if (!meal) return;
        const title = m === 'lunch' ? '午餐' : '晚餐';
        lines.push('—— ' + title + '（约' + meal.totalMinutes + '分钟）——');
        meal.dishes.forEach(function (dish) {
          const role = meal.soups.indexOf(dish) !== -1 ? '汤'
            : (dish.recipe.category === '主食' ? '主' : (isMeat(dish.recipe) ? '荤' : '素'));
          lines.push('• [' + role + '] ' + dish.recipe.emoji + ' ' + dish.recipe.name + '（' + dish.recipe.minutes + '分钟）');
          if (dish.missing && dish.missing.length) {
            lines.push('  需补：' + dish.missing.map(function (x) { return x.name + ' ' + x.amount; }).join('、'));
          }
        });
        lines.push('  做法：');
        meal.dishes.forEach(function (dish) {
          lines.push('  【' + dish.recipe.name + '】');
          dish.recipe.steps.forEach(function (s, i) { lines.push('   ' + (i + 1) + '. ' + s); });
        });
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  return {
    SYNONYMS: SYNONYMS,
    DAY_NAMES: DAY_NAMES,
    WEEKDAY_KEYS: WEEKDAY_KEYS,
    SIDE_CATS: SIDE_CATS,
    SOUP_CATS: SOUP_CATS,
    MAIN_CATS: MAIN_CATS,
    PROTEIN_CATS: PROTEIN_CATS,
    MEAT_CATS: MEAT_CATS,
    VEG_CATS: VEG_CATS,
    isMeat: isMeat,
    hasProtein: hasProtein,
    isVegetable: isVegetable,
    spiceLevel: spiceLevel,
    findSubstitutes: findSubstitutes,
    normName: normName,
    addDays: addDays,
    formatDate: formatDate,
    dayLabel: dayLabel,
    buildInventorySet: buildInventorySet,
    ingredientCovered: ingredientCovered,
    matchRecipe: matchRecipe,
    rankRecipes: rankRecipes,
    planWeek: planWeek,
    replaceMeal: replaceMeal,
    replaceDish: replaceDish,
    refreshPlanMissing: refreshPlanMissing,
    normalizePlan: normalizePlan,
    aggregateShopping: aggregateShopping,
    shoppingText: shoppingText,
    planText: planText,
    parseAmount: parseAmount,
    scaleAmount: scaleAmount,
    sumAmounts: sumAmounts
  };
});
