/* 核心逻辑测试：丰盛晚餐荤素组合
 * 运行：node tests/core.test.js
 * 覆盖：
 *   1. 内置菜谱库整周计划：每顿晚餐都排满两荤一素一汤
 *   2. 主菜为荤 → 配菜一素一荤（菜池无蛋豆主菜）
 *   3. 主菜为素（蛋豆/素菜）→ 配菜两个都排荤，凑满两荤一素（菜池全是快手蛋豆主菜）
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

console.log('\n通过 ' + passed + ' 项，失败 ' + failed + ' 项');
process.exit(failed ? 1 : 0);
