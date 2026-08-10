/* 核心逻辑测试：丰盛晚餐荤素组合
 * 运行：node tests/core.test.js
 * 覆盖：
 *   1. 内置菜谱库整周计划：每顿晚餐都排满两荤一素一汤
 *   2. 主菜为荤 → 配菜一素一荤（菜池无蛋豆主菜）
 *   3. 主菜为素（蛋豆/素菜）→ 配菜两个都排荤，凑满两荤一素（菜池全是快手蛋豆主菜）
 *   4. 换菜轮询回归：连续换菜不得在两菜之间来回
 *   5. 库存变化后刷新缺料：菜不变，缺失与统计重算
 */
'use strict';
const core = require('../core.js');
const R = require('../recipes.js');

let passed = 0, failed = 0;
function ok(name, cond) {
  if (cond) passed++;
  else { failed++; console.log('✗ ' + name); }
}

const NAMES = R.map(function (r) { return r.name; });
function pick(names) {
  return R.filter(function (r) { return names.indexOf(r.name) !== -1; });
}

// 主菜 + 两个配菜（汤另计）的荤素计数
function composition(meal) {
  const dishes = meal.dishes.filter(function (d) { return meal.soups.indexOf(d) === -1; });
  let meat = 0, veg = 0;
  dishes.forEach(function (d) { if (core.isMeat(d.recipe)) meat++; else veg++; });
  return { meat: meat, veg: veg };
}

// ============ 1. 内置菜谱库整周：每顿晚餐两荤一素一汤 ============
const plan = core.planWeek(R, [], { richDinner: true, dinnerOnly: true, days: 7, servings: 3, maxMissing: 2 });
plan.days.forEach(function (d) {
  const meal = d.dinner;
  const c = composition(meal);
  ok('整周·' + d.label + ' 两荤一素（荤' + c.meat + ' 素' + c.veg + '）', c.meat === 2 && c.veg === 1);
  ok('整周·' + d.label + ' 排满两个配菜位', meal.sides.length === 2);
  ok('整周·' + d.label + ' 有一汤', meal.soups.length === 1);
});

// ============ 2. 主菜为荤：配菜应一素一荤 ============
// 菜池无蛋豆/水产主菜，荤菜必胜出为主菜；配菜位顺序：先素位后荤位
const poolMeatMain = pick(['洋葱炒肉丝', '青椒肉丝', '蒜苔炒肉', '酸豆角炒肉末', '芹菜炒牛肉', '土豆肉丝',
  '清炒时蔬', '蒜蓉油麦菜', '白灼菜心', '紫菜蛋花汤', '番茄蛋花汤', '菠菜豆腐汤']);
const planMeatMain = core.planWeek(poolMeatMain, [], { richDinner: true, dinnerOnly: true, days: 3, servings: 3, maxMissing: 2 });
let meatMainDays = 0;
planMeatMain.days.forEach(function (d) {
  const meal = d.dinner;
  if (!meal) return;
  meatMainDays++;
  ok('荤主菜·' + d.label + ' 主菜是荤', core.isMeat(meal.main.recipe));
  const sides = meal.sides.map(function (s) { return core.isMeat(s.recipe); });
  ok('荤主菜·' + d.label + ' 配菜一素一荤（' + sides.join('/') + '）',
    sides.length === 2 && sides[0] === false && sides[1] === true);
});
ok('荤主菜·3 天都排出了晚餐', meatMainDays === 3);

// ============ 3. 主菜为素（蛋豆）：配菜两个都应排荤 ============
// 菜池全是快手蛋豆主菜（15 分钟档），比所有荤菜更快更省料 → 主菜必为素；
// 荤配菜池放大到 7 道，保证每天两个荤位都有得选
const poolVegMain = pick(['西红柿炒鸡蛋', '韭菜炒蛋', '黄瓜炒鸡蛋', '香煎豆腐',
  '洋葱炒肉丝', '青椒肉丝', '蒜苔炒肉', '酸豆角炒肉末', '芹菜炒牛肉', '土豆肉丝', '可乐鸡翅',
  '清炒时蔬', '蒜蓉油麦菜', '白灼菜心', '紫菜蛋花汤', '番茄蛋花汤', '菠菜豆腐汤']);
const planVegMain = core.planWeek(poolVegMain, [], { richDinner: true, dinnerOnly: true, days: 3, servings: 3, maxMissing: 2 });
let vegMainDays = 0;
planVegMain.days.forEach(function (d) {
  const meal = d.dinner;
  if (!meal) return;
  vegMainDays++;
  ok('素主菜·' + d.label + ' 主菜是素', !core.isMeat(meal.main.recipe));
  const sides = meal.sides.map(function (s) { return core.isMeat(s.recipe); });
  ok('素主菜·' + d.label + ' 配菜两个都排荤（' + sides.join('/') + '）',
    sides.length === 2 && sides[0] === true && sides[1] === true);
});
ok('素主菜·3 天都排出了晚餐', vegMainDays === 3);

// ============ 4. 单槽换菜：只换该槽位，其余槽位不变 ============
const dishIds = function (meal) { return meal.dishes.map(function (d) { return d.recipe.id; }); };
const changedSlots = function (a, b) {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
};
const swapOpts = { richDinner: true, dinnerOnly: true, days: 3, servings: 3, maxMissing: 2 };
const swapPlan = core.planWeek(R, [], swapOpts);

// 主菜槽（index 0）：只换主菜，配菜和汤不变
const d0 = swapPlan.days[0].dinner;
const d0before = dishIds(d0);
core.replaceDish(swapPlan, R, [], swapOpts, 0, 'dinner', 0);
ok('单槽换菜·主菜槽只换该槽（其余不变）', changedSlots(d0before, dishIds(d0)) === 1 && dishIds(d0)[0] !== d0before[0]);

// 配菜槽（index 1）：只换该配菜
const d1 = swapPlan.days[0].dinner;
const d1before = dishIds(d1);
core.replaceDish(swapPlan, R, [], swapOpts, 0, 'dinner', 1);
ok('单槽换菜·配菜槽只换该槽（其余不变）', changedSlots(d1before, dishIds(d1)) === 1 && dishIds(d1)[1] !== d1before[1]);

// 汤槽（最后一槽）：只换汤
const d2 = swapPlan.days[0].dinner;
const d2before = dishIds(d2);
const soupIdx = d2.dishes.length - 1;
core.replaceDish(swapPlan, R, [], swapOpts, 0, 'dinner', soupIdx);
ok('单槽换菜·汤槽只换该槽（其余不变）', changedSlots(d2before, dishIds(d2)) === 1 && dishIds(d2)[soupIdx] !== d2before[soupIdx]);

// 换菜后槽位结构保持一致（main/sides/soups 与 dishes 对应，时长重算）
const d3 = swapPlan.days[0].dinner;
const minSum = d3.dishes.reduce(function (s, d) { return s + d.recipe.minutes; }, 0);
ok('单槽换菜·结构一致且时长重算', d3.dishes.length === 1 + d3.sides.length + d3.soups.length && d3.totalMinutes === minSum);

// ============ 5. 整餐重排：整餐换菜应把所有菜槽都换掉（原 bug：只换第一个菜） ============
const swapPlan2 = core.planWeek(R, [], swapOpts);
const rmBefore = dishIds(swapPlan2.days[0].dinner);
core.replaceMeal(swapPlan2, R, [], swapOpts, 0, 'dinner');
const rmAfter = dishIds(swapPlan2.days[0].dinner);
ok('整餐重排·所有菜槽都换掉（不再只换第一个菜）',
  rmAfter.length === rmBefore.length && rmAfter.every(function (id, i) { return id !== rmBefore[i]; }));

// ============ 6. 无候选换菜：replaceDish 返回 null（槽位原样），供 UI 提示「暂无其他可选」 ============
const sameIds = function (a, b) { return a.join() === b.join(); };

// 6a. 菜池本身极小（≤8 菜）：池中只有一道汤 → 换汤槽无候选返回 null，槽位不变
const tinyPool = pick(['洋葱炒肉丝', '青椒肉丝', '土豆肉丝', '黄瓜肉片',
  '清炒时蔬', '蒜蓉油麦菜', '西红柿炒鸡蛋', '紫菜蛋花汤']);
const tinyPlan = core.planWeek(tinyPool, [], swapOpts);
const tinyMeal = tinyPlan.days[0].dinner;
const tinyBefore = dishIds(tinyMeal);
const tinyRes = core.replaceDish(tinyPlan, tinyPool, [], swapOpts, 0, 'dinner', tinyMeal.dishes.length - 1);
ok('无候选·极小菜池(≤8)换汤返回 null 且槽位不变', tinyRes === null && sameIds(dishIds(tinyMeal), tinyBefore));
const tinyResMain = core.replaceDish(tinyPlan, tinyPool, [], swapOpts, 0, 'dinner', 0);
ok('无候选·极小菜池主菜有候选时返回 plan 并换掉', tinyResMain !== null && !sameIds(dishIds(tinyMeal), tinyBefore));

// 6b. 过滤后无剩余候选：池中仅一道素菜+一道汤（其余全是荤）→ 换素配菜槽无候选返回 null
const filtPool = pick(['洋葱炒肉丝', '青椒肉丝', '土豆肉丝', '黄瓜肉片', '酸豆角炒肉末',
  '蒜苔炒肉', '芹菜炒牛肉', '可乐鸡翅', '红烧肉', '清炒时蔬', '紫菜蛋花汤']);
const filtPlan = core.planWeek(filtPool, [], swapOpts);
const filtMeal = filtPlan.days[0].dinner;
const vegIdx = filtMeal.dishes.findIndex(function (d) { return d.recipe.name === '清炒时蔬'; });
ok('无候选·过滤后无剩余候选（素配菜槽）前置成立', vegIdx > 0);
const filtBefore = dishIds(filtMeal);
const filtRes = core.replaceDish(filtPlan, filtPool, [], swapOpts, 0, 'dinner', vegIdx);
ok('无候选·换素配菜槽返回 null 且槽位不变', filtRes === null && sameIds(dishIds(filtMeal), filtBefore));

// ============ 7. 换菜轮询回归：连续换菜不得在两菜之间来回 ============
// 原 bug：候选池很大，但只排除当前菜，换出的菜立刻以第一名身份被换回，两菜死循环。
// 修复：调用方把「近几轮换出的菜」经 extraExcludeIds 传入，候选真正轮转
const rotOpts = { dinnerOnly: true, days: 1, servings: 3, maxMissing: 2, quick: true, quickLimit: 25 };
const rotPlan = core.planWeek(R, [], rotOpts);
const rotMeal = rotPlan.days[0].dinner;
const rotIdx = rotMeal.dishes.indexOf(rotMeal.sides[0]); // 配菜在 dishes 中的下标（晚餐必有配菜）
const seenDishes = [];
const recent = []; // 模拟 app.js 的换菜记忆：换出的菜进队列
for (let i = 0; i < 6; i++) {
  const before = rotMeal.dishes[rotIdx].recipe.id;
  core.replaceDish(rotPlan, R, [], rotOpts, 0, 'dinner', rotIdx, recent);
  recent.unshift(before);
  if (recent.length > 3) recent.length = 3;
  seenDishes.push(rotMeal.dishes[rotIdx].recipe.id);
}
ok('换菜轮询·连续 6 次换菜出现至少 3 道不同菜（实际 ' + new Set(seenDishes).size + ' 道）',
  new Set(seenDishes).size >= 3);

// 整餐重排同样不得换回最初那餐
const rotMealPlan = core.planWeek(R, [], rotOpts);
const mealFirstIds = dishIds(rotMealPlan.days[0].dinner);
let mealRecent = [];
const r1 = core.replaceMeal(rotMealPlan, R, [], rotOpts, 0, 'dinner', mealRecent);
if (r1) mealRecent = mealFirstIds.concat(mealRecent).slice(0, 6);
const mealSecondIds = dishIds(rotMealPlan.days[0].dinner);
const r2 = core.replaceMeal(rotMealPlan, R, [], rotOpts, 0, 'dinner', mealRecent);
if (r2) mealRecent = mealSecondIds.concat(mealRecent.filter(function (id) { return mealSecondIds.indexOf(id) === -1; })).slice(0, 6);
const mealThirdIds = dishIds(rotMealPlan.days[0].dinner);
ok('整餐轮询·连续两次换餐后不回到最初那餐',
  r1 !== null && r2 !== null && !sameIds(mealThirdIds, mealFirstIds));

// ============ 8. 换菜类型保持：荤换荤、素换素、汤换汤 ============
// 原 bug：主菜槽换菜不限制荤素，库存齐全时素主菜换菜 28% 概率翻成荤主菜
const typeInv = ['猪肉', '猪瘦肉', '五花肉', '牛肉', '鸡胸肉', '大虾', '鸡蛋', '西红柿', '土豆', '青椒', '洋葱',
  '胡萝卜', '西兰花', '大白菜', '娃娃菜', '生菜', '油麦菜', '菠菜', '菜心', '茄子', '黄瓜', '冬瓜', '香菇', '木耳',
  '豆腐', '嫩豆腐', '盐', '生抽', '老抽', '蚝油', '料酒', '醋', '白糖', '淀粉', '干辣椒', '花椒', '胡椒粉',
  '食用油', '小葱', '生姜', '大蒜', '米饭'];
const typeOpts = { days: 7, servings: 2.5, quick: true, maxMissing: 2, quickLimit: 25, maxSpice: 2 };
let typeFlip = 0, typeSoup = 0;
for (let d = 0; d < 7; d++) {
  const p = core.planWeek(R, typeInv, typeOpts);
  const m = p.days[d].dinner;
  // 主菜槽：换后荤素必须不变
  const mainWasMeat = core.isMeat(m.main.recipe);
  if (core.replaceDish(p, R, typeInv, typeOpts, d, 'dinner', 0) && core.isMeat(m.main.recipe) !== mainWasMeat) typeFlip++;
  // 素配菜槽：换后不能变荤、不能变汤
  const vIdx = m.dishes.findIndex(function (x) { return x !== m.main && m.soups.indexOf(x) === -1 && !core.isMeat(x.recipe); });
  if (vIdx > 0 && core.replaceDish(p, R, typeInv, typeOpts, d, 'dinner', vIdx)) {
    if (core.isMeat(m.dishes[vIdx].recipe)) typeFlip++;
    if (m.dishes[vIdx].recipe.category === '汤羹') typeSoup++;
  }
  // 荤配菜槽：换后必须仍是荤
  const hIdx = m.dishes.findIndex(function (x) { return x !== m.main && m.soups.indexOf(x) === -1 && core.isMeat(x.recipe); });
  if (hIdx > 0 && core.replaceDish(p, R, typeInv, typeOpts, d, 'dinner', hIdx) && !core.isMeat(m.dishes[hIdx].recipe)) typeFlip++;
  // 汤槽：换后必须仍是汤
  if (m.soups.length && core.replaceDish(p, R, typeInv, typeOpts, d, 'dinner', m.dishes.length - 1) && m.soups[0].recipe.category !== '汤羹') typeSoup++;
}
ok('换菜类型·荤换荤素换素汤换汤（全周主菜/配菜/汤槽）', typeFlip === 0 && typeSoup === 0);

// 午餐/晚餐主菜槽：同一槽位连续换 6 次，荤主菜保持荤，素主菜不得换成主食/汤/荤，主食只换主食
// （原 bug：单次换菜正常，连续换多次后候选耗尽，素主菜被换成汤羹/主食）
let stapleFlip = 0;
for (let d = 0; d < 7; d++) {
  const p = core.planWeek(R, typeInv, typeOpts);
  ['lunch', 'dinner'].forEach(function (m) {
    const meal = p.days[d][m];
    if (!meal) return;
    const old = meal.main.recipe;
    const oldMeat = core.isMeat(old);
    const oldStaple = old.category === '主食';
    const recent = [];
    for (let i = 0; i < 6; i++) {
      const beforeId = meal.main.recipe.id;
      core.replaceDish(p, R, typeInv, typeOpts, d, m, 0, recent);
      recent.unshift(beforeId);
      if (recent.length > 3) recent.length = 3;
      const now = meal.main.recipe;
      if (oldMeat && !core.isMeat(now)) stapleFlip++;
      if (oldStaple && now.category !== '主食') stapleFlip++;
      if (!oldMeat && !oldStaple && (core.isMeat(now) || now.category === '主食' || now.category === '汤羹')) stapleFlip++;
    }
  });
}
ok('换菜类型·主菜槽连续换 6 次：荤保持荤、素不换主食/汤、主食只换主食', stapleFlip === 0);

// ============ 9. 库存变化后刷新缺料：菜不变，缺失与统计重算 ============
// 原 bug：计划里的 meal.missing / stats.missing 是生成时算好的，改库存后不重算，卡片显示旧缺失
const refPlan = core.planWeek(R, [], { days: 2, servings: 2.5, quick: true, maxMissing: 2, quickLimit: 25, maxSpice: 2 });
const refIds0 = refPlan.days.map(function (d) { return dishIds(d.dinner); });
const missingBefore = refPlan.stats.missing.length;
ok('缺料刷新·空库存计划有缺失', missingBefore > 0);

// 用计划里所有菜的必备配料构造库存 → 刷新后应全部可做
const need = [];
refPlan.days.forEach(function (d) {
  ['lunch', 'dinner'].forEach(function (m) {
    const meal = d[m];
    if (!meal) return;
    meal.dishes.forEach(function (x) {
      x.recipe.ingredients.forEach(function (i) { if (!i.optional) need.push(i.name); });
    });
  });
});
core.refreshPlanMissing(refPlan, Array.from(new Set(need)), 2.5);
const allCovered = refPlan.days.every(function (d) {
  return ['lunch', 'dinner'].every(function (m) {
    const meal = d[m];
    return !meal || (meal.missing.length === 0 && meal.dishes.every(function (x) { return (x.missing || []).length === 0; }));
  });
});
const refIds1 = refPlan.days.map(function (d) { return dishIds(d.dinner); });
ok('缺料刷新·库存补全后缺失归零', refPlan.stats.missing.length === 0 && allCovered);
ok('缺料刷新·菜谱结构不变（只重算缺失）', JSON.stringify(refIds0) === JSON.stringify(refIds1));

// 清空库存再刷新 → 缺失恢复
core.refreshPlanMissing(refPlan, [], 2.5);
ok('缺料刷新·清空库存后缺失恢复', refPlan.stats.missing.length === missingBefore);

// JSON 往返后的 plan（浏览器真实形态：localStorage/同步序列化会切断 main/sides 与 dishes 的引用）
// 原 bug：只更新了 dishes 元素的 missing，聚合 meal.missing 时却读到 main/sides 的旧引用
const roundTrip = JSON.parse(JSON.stringify(refPlan));
core.refreshPlanMissing(roundTrip, Array.from(new Set(need)), 2.5);
const rtCovered = roundTrip.days.every(function (d) {
  return ['lunch', 'dinner'].every(function (m) {
    const meal = d[m];
    return !meal || meal.missing.length === 0;
  });
});
ok('缺料刷新·JSON 往返后刷新仍有效（引用断裂场景）', rtCovered && roundTrip.stats.missing.length === 0);

console.log('\n通过 ' + passed + ' 项，失败 ' + failed + ' 项');
process.exit(failed ? 1 : 0);
