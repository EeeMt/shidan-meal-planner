/* EEE-34 迁移脚本：为内置菜谱生成 isMeat 标注评审表
 * 运行：node scripts/annotate.js
 *
 * 流程：
 *   1. 对每道内置菜谱用 classifier.classifyDish 计算 { isMeat, hasProtein }
 *   2. 与 tests/classifier.test.js 的 EXPECT 全表逐道比对（荤菜/水产断言 isMeat && hasProtein）
 *   3. 产出 annotate-report.md 评审表（id | name | category | isMeat | hasProtein | 关键食材）
 *      不一致项列红，人工复核灰区菜后，把 isMeat 写入 recipes.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('../classifier.js');
const R = require('../recipes.js');

const MEAT_GROUPS = C.MEAT_GROUPS;
const PROTEIN_GROUPS = C.PROTEIN_GROUPS;

// 从 tests/classifier.test.js 提取 EXPECT 全表（荤菜/水产在测试里不列 EXPECT，直接断言荤+蛋白）
const testSrc = fs.readFileSync(path.join(__dirname, '..', 'tests', 'classifier.test.js'), 'utf8');
const m = testSrc.match(/const EXPECT\s*=\s*(\{[\s\S]*?\n\});/);
const EXPECT = m ? eval('(' + m[1] + ')') : {};

function expected(recipe) {
  if (recipe.category === '荤菜' || recipe.category === '水产') return { isMeat: true, hasProtein: true };
  const e = EXPECT[recipe.name];
  if (e) return { isMeat: !!e[0], hasProtein: !!e[1] };
  return null;
}

// 关键荤/素食材：荤菜列肉/禽/水产/加工肉，素菜列蛋/豆/干豆等蛋白来源，否则标素
function keyIngredients(recipe) {
  const essential = (recipe.ingredients || []).filter(function (i) { return !i.optional; });
  const meat = essential.filter(function (i) { return MEAT_GROUPS.has(C.classifyIngredient(i.name)); })
    .map(function (i) { return i.name; });
  if (meat.length) return '荤:' + meat.join('/');
  const protein = essential.filter(function (i) { return PROTEIN_GROUPS.has(C.classifyIngredient(i.name)); })
    .map(function (i) { return i.name; });
  if (protein.length) return '蛋白:' + protein.join('/');
  return '素';
}

const rows = [];
let mismatches = 0, missingExp = 0, fileMismatch = 0;
R.forEach(function (r) {
  const got = C.classifyDish(r);
  const exp = expected(r);
  const key = keyIngredients(r);
  const isMeat = got.isMeat ? '荤' : '素';
  const hasProtein = got.hasProtein ? '是' : '否';
  // recipes.js 中落库的 isMeat 标注（EE-34 迁移产物）
  const fileIsMeat = typeof r.isMeat === 'boolean' ? (r.isMeat ? '荤' : '素') : '缺失';
  let flag = '';
  if (!exp) {
    flag = '⚠️ 缺 EXPECT';
    missingExp++;
  } else if (got.isMeat !== exp.isMeat || got.hasProtein !== exp.hasProtein) {
    flag = '🔴 与 EXPECT 不一致（期望 ' + (exp.isMeat ? '荤' : '素') + '/' + (exp.hasProtein ? '是' : '否') + '）';
    mismatches++;
  }
  if (typeof r.isMeat !== 'boolean' || r.isMeat !== got.isMeat) {
    flag = (flag ? flag + '；' : '') + '🔴 落库 isMeat(' + fileIsMeat + ')≠分类器(' + isMeat + ')';
    fileMismatch++;
  }
  rows.push({ id: r.id, name: r.name, category: r.category, isMeat, hasProtein, fileIsMeat, key, flag });
});

rows.sort(function (a, b) { return a.category.localeCompare(b.category, 'zh') || a.name.localeCompare(b.name, 'zh'); });

const lines = [];
lines.push('# 内置菜谱荤素标注评审表（EEE-34）');
lines.push('');
lines.push('共 ' + R.length + ' 道内置菜谱，由 `classifier.classifyDish` 计算，与 `tests/classifier.test.js` EXPECT 全表逐道比对；');
lines.push('同时审计 recipes.js 已落库的 `isMeat` 字段是否与分类器一致。一致项无标记；不一致/缺期望值/落库不符列红。');
lines.push('');
lines.push('分类器与 EXPECT 不一致：' + mismatches + ' 项，缺 EXPECT：' + missingExp + ' 项，落库 isMeat 与分类器不符：' + fileMismatch + ' 项。');
lines.push('');
lines.push('| id | name | category | 落库 isMeat | isMeat | hasProtein | 关键食材 | 比对 |');
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');
rows.forEach(function (r) {
  lines.push('| `' + r.id + '` | ' + r.name + ' | ' + r.category + ' | ' + r.fileIsMeat + ' | ' + r.isMeat + ' | ' + r.hasProtein + ' | ' + r.key + ' | ' + r.flag + ' |');
});
lines.push('');
lines.push('> 灰区复核提示：蚝油/猪油/高汤/上汤等动物性调味默认不计荤（grayMeat=false）；素鸡素鸭/鱼香味型按配料说话。');
lines.push('> 全部比对一致即迁移完成：`isMeat`（荤=true/素=false）已机械写入 recipes.js 每道菜，hasProtein 走派生不落库。');

const out = path.join(__dirname, 'annotate-report.md');
fs.writeFileSync(out, lines.join('\n') + '\n', 'utf8');
console.log('评审表已生成：' + out);
console.log('总菜数 ' + R.length + '，与 EXPECT 不一致 ' + mismatches + '，缺 EXPECT ' + missingExp + '，落库 isMeat 不符 ' + fileMismatch);
process.exit(mismatches || missingExp || fileMismatch ? 1 : 0);
