/* 核心逻辑：食材匹配、一周计划、购物清单聚合
 * 纯函数模块，浏览器和 Node 均可运行。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./classifier.js'));
  else root.MealCore = factory(root.MealClassify);
})(typeof self !== 'undefined' ? self : this, function (MealClassify) {
  'use strict';

  const SIDE_CATS = ['素菜', '凉菜'];
  const SOUP_CATS = ['汤羹'];
  const MAIN_CATS = ['荤菜', '水产', '蛋豆', '主食', '素菜', '汤羹'];
  // 荤素/蛋白判断统一委托 classifier.js（食材语义词典，含川菜味型与“假荤”处理）
  const PROTEIN_CATS = MealClassify.CATEGORY_PROTEIN; // 有蛋白质来源的分类
  const MEAT_CATS = MealClassify.CATEGORY_MEAT;       // 荤菜分类（兜底）
  const VEG_CATS = ['素菜', '凉菜'];
  const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const WEEKDAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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

  // 是否荤菜（家常口径，委托 classifier.js：必备配料含肉/禽/水产/加工肉为荤；
  // 蛋、豆腐、菌菇等算素；高汤、猪油等灰区默认不计）
  function isMeat(recipe) {
    return MealClassify.classifyDish(recipe).isMeat;
  }

  // 是否有蛋白质来源（荤 + 蛋 + 豆腐豆制品 + 干豆；肉末可选的家常菜按素计）
  function hasProtein(recipe) {
    return MealClassify.classifyDish(recipe).hasProtein;
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
    return ordered[0];
  }

  // 为某一餐挑选主菜
  function pickMain(recipes, invSet, opts, constraints) {
    let ranked = rankRecipes(recipes, invSet, { maxMissing: opts.maxMissing, maxSpice: opts.maxSpice });
    // 同分时优先自带蛋白的菜（避免净挑无荤主食再临时补荤）
    ranked = ranked.slice().sort(function (a, b) {
      return (hasProtein(b.recipe) ? 1 : 0) - (hasProtein(a.recipe) ? 1 : 0);
    });
    let chosen = pickBest(ranked, constraints);
    if (!chosen && opts.maxMissing < 99) {
      // 放松缺料限制，保证每餐都有菜
      let relaxed = rankRecipes(recipes, invSet, { maxMissing: 99, maxSpice: opts.maxSpice }).slice().sort(function (a, b) {
        return (hasProtein(b.recipe) ? 1 : 0) - (hasProtein(a.recipe) ? 1 : 0);
      });
      chosen = pickBest(relaxed, constraints);
      if (!chosen) {
        // 实在没有符合忌口的菜时，保证有菜可吃（如全部库存都是辣菜）
        const anySpice = rankRecipes(recipes, invSet, { maxMissing: 99, maxSpice: 2 }).slice().sort(function (a, b) {
          return (hasProtein(b.recipe) ? 1 : 0) - (hasProtein(a.recipe) ? 1 : 0);
        });
        chosen = pickBest(anySpice, constraints);
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

    const main = pickMain(recipes, invSet, opts, {
      excludeIds: new Set(sameDayMainId ? [sameDayMainId] : []),
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
        excludeIds: [],
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
        excludeIds: [],
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

  function planWeek(recipes, inventory, opts) {
    opts = Object.assign({
      days: 7, servings: 2, quick: true, maxMissing: 2, quickLimit: 25, start: new Date()
    }, opts || {});
    const invSet = buildInventorySet(inventory);
    const allRecipes = recipes.slice();
    const state = { usedHistory: [], dayPlan: null };
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

  // 替换某一餐里的某一个菜槽：只换该槽位，其余槽位不变
  // 返回 null 表示换不出候选（槽位保持原样），供 UI 提示「暂无其他可选」
  function replaceDish(plan, recipes, inventory, opts, dayIndex, mealType, dishIndex) {
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

    let fresh = null;
    if (slotType === 'main') {
      const preferCats = mealType === 'lunch'
        ? ['荤菜', '水产', '蛋豆', '主食']
        : ['荤菜', '水产', '蛋豆'];
      fresh = pickMain(recipes, invSet, opts, {
        excludeIds: new Set([oldR.id].concat(sameDayMainId ? [sameDayMainId] : [])),
        usedIds: mainUsed,
        preferCats: preferCats,
        avoidCats: avoidCats,
        quick: opts.quick,
        quickLimit: mealType === 'lunch' ? opts.quickLimit : Math.round(opts.quickLimit * 1.5)
      });
    } else {
      const isSoup = slotType === 'soup';
      const limit = isSoup
        ? (mealType === 'lunch' ? 15 : 25)
        : (mealType === 'lunch' ? Math.min(15, opts.quickLimit) : 20);
      const cats = isSoup ? SOUP_CATS : PROTEIN_CATS.concat(VEG_CATS, SOUP_CATS);
      const filter = isSoup ? null : (isMeat(oldR) ? meatSideFilter : vegSideFilter);
      const picked = pickSides(recipes, invSet, Object.assign({}, opts, { quickLimit: limit }), {
        mainId: meal.main.recipe.id,
        usedIds: sideUsed,
        excludeIds: [oldR.id],
        quick: opts.quick
      }, 1, cats, filter);
      fresh = picked.length ? picked[0] : null;
    }

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
  function replaceMeal(plan, recipes, inventory, opts, dayIndex, mealType) {
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
    const fresh = buildMeal(recipes, invSet, opts, dayIndex, mealType, {
      usedHistory: usedBefore,
      dayPlan: { lunch: day.lunch, dinner: day.dinner }
    });
    if (!fresh || !mealComplete(fresh, opts, mealType)) return null; // 重排不出完整一餐则保持原样，null 供 UI 提示「暂无其他可选」
    day[mealType] = fresh;
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
    aggregateShopping: aggregateShopping,
    shoppingText: shoppingText,
    planText: planText,
    parseAmount: parseAmount,
    scaleAmount: scaleAmount,
    sumAmounts: sumAmounts
  };
});
