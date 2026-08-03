/* 菜谱文本解析器：从自由文本中提取 菜名 / 食材 / 步骤
 * 浏览器和 Node 均可运行。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RecipeParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const UNITS = ['克', '公斤', '千克', '斤', '毫升', '升', '个', '根', '片', '块', '勺', '汤勺', '茶匙', '小勺', '大勺', '碗', '瓣', '头', '把', '小把', '条', '只', '枚', '袋', '盒', '份', '粒', '颗', '段', '张', 'g', 'kg', 'ml', 'l'];
  const UNIT_ALT = UNITS.join('|');
  const UNIT_RE = new RegExp('(\\d+(?:\\.\\d+)?)\\s*(' + UNIT_ALT + ')', 'i');
  const UNIT_NO_NUM_RE = /(适量|少许|少量|若干)/;
  const SECTION_RE = /^(食材|用料|材料|原料|调料|辅料|配菜|做法|步骤|制作方法|烹饪方法|烹饪步骤|开始制作|操作步骤|教程)[:：]?$/;
  const STEP_HEAD_RE = /^(步骤|做法|制作方法|烹饪方法|烹饪步骤|开始制作|操作步骤|教程)/;
  const NUM_STEP_RE = /^(\d{1,2})[.、．\)）]\s*/;
  const VERB_RE = /(切|洗|焯|炒|煎|炸|蒸|煮|炖|焖|烧|烤|拌|腌|加|放|下|倒|淋|撒|调|搅|打|揉|擀|盛|捞|热锅|起锅|大火|小火|中火|冷水|开水|沸水|入锅|装盘|出锅|翻炒|沥干)/;
  const HEADING_RE = /^[【\[]/;

  function normalizeText(text) {
    return String(text || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[ａ-ｚＡ-Ｚ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/\u00a0|\u200b|\uFEFF/g, ' ')
      .replace(/[ \t]+/g, ' ');
  }

  function htmlToText(html) {
    let s = String(html || '');
    s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
    s = s.replace(/<style[\s\S]*?<\/style>/gi, ' ');
    s = s.replace(/<br\s*\/?>/gi, '\n');
    s = s.replace(/<\/(p|div|li|h[1-6]|tr|section|article|blockquote)>/gi, '\n');
    s = s.replace(/<li[^>]*>/gi, '\n');
    s = s.replace(/<[^>]+>/g, ' ');
    s = s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
    s = s.replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&ldquo;|&rdquo;/g, '"').replace(/&mdash;|&ndash;/g, '-');
    s = s.replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n');
    return s.trim();
  }

  function isIngredientLine(line) {
    return UNIT_NO_NUM_RE.test(line) || UNIT_RE.test(line);
  }

  function isStepLine(line) {
    if (STEP_HEAD_RE.test(line)) return true;
    if (NUM_STEP_RE.test(line)) return true;
    if (line.length < 8) return false;
    if (isIngredientLine(line)) return false;
    return VERB_RE.test(line);
  }

  function isHeadingLine(line, lines, i) {
    if (HEADING_RE.test(line)) return true;
    if (SECTION_RE.test(line)) return false;
    if (STEP_HEAD_RE.test(line)) return false;
    if (line.length > 24) return false;
    if (isIngredientLine(line) || isStepLine(line)) return false;
    if (/[。！？!?]/.test(line)) return false;
    let j = i + 1;
    while (j < lines.length && !lines[j]) j++;
    const next = lines[j] || '';
    return !!(next && (isIngredientLine(next) || /^(食材|用料|材料|原料)/.test(next)));
  }

  function splitBlocks(text) {
    const lines = normalizeText(text).split('\n').map(function (l) { return l.trim(); });
    const blocks = [];
    let cur = [];
    function flush() {
      if (cur.length) { blocks.push(cur); cur = []; }
    }
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) { flush(); continue; }
      if (cur.length && isHeadingLine(line, lines, i)) flush();
      cur.push(line);
    }
    flush();
    return blocks;
  }

  function parseIngredientPart(part) {
    let p = String(part || '').trim();
    if (!p) return null;
    let optional = false;
    if (/[（(]可选[)）]$/.test(p)) { optional = true; p = p.replace(/[（(]可选[)）]$/, '').trim(); }
    let amount = '';
    const mNoNum = p.match(/(适量|少许|少量|若干)$/);
    if (mNoNum) {
      amount = mNoNum[1];
      p = p.slice(0, mNoNum.index);
    } else {
      const mUnit = p.match(new RegExp('(\\d+(?:\\.\\d+)?)\\s*(?:' + UNIT_ALT + ')(?:半|左右|多一点)?$|(半)\\s*(?:' + UNIT_ALT + ')$', 'i'));
      if (mUnit) {
        amount = mUnit[0].replace(/\s+/g, '');
        p = p.slice(0, mUnit.index);
      }
    }
    p = p.replace(/^[\s:：、，,;；]+|[\s:：、，,;；]+$/g, '');
    p = p.replace(/^[（(]|[）)]$/g, '').trim();
    if (!p) return null;
    return { name: p, amount: amount, optional: optional };
  }

  function splitIngredientLine(line) {
    return line.split(/[，,、;；]/).map(parseIngredientPart).filter(Boolean);
  }

  function dedupeIngredients(list) {
    const seen = new Set();
    return list.filter(function (i) {
      const key = i.name.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function cleanName(s) {
    let n = String(s || '').trim();
    n = n.replace(/^[【\[]|[】\]]$/g, '').trim();
    n = n.replace(/(的做法|家常做法|最正宗的做法|的做法步骤|菜谱|怎么做|的做法大全|做法大全)$/g, '').trim();
    n = n.replace(/^菜名[:：]?\s*/, '').trim();
    n = n.replace(/^材料[:：]?\s*/, '').trim();
    if (n.length > 30) n = n.slice(0, 30);
    return n;
  }

  function guessCategory(name, ingredients) {
    const names = name + ' ' + ingredients.map(function (i) { return i.name; }).join(' ');
    if (/汤|羹/.test(name)) return '汤羹';
    if (/面|饭|粥|粉|饺子|馒头|饼/.test(name)) return '主食';
    if (/凉拌|拍黄瓜|腌/.test(name)) return '凉菜';
    if (/鱼|虾|蟹|鱿鱼|贝|蛤|扇贝|海鲜/.test(names)) return '水产';
    if (/牛|羊|猪|肉|鸡|鸭|排骨|培根|腊肠|香肠|火腿/.test(names)) return '荤菜';
    if (/蛋|豆腐|腐竹|豆干|香干/.test(names)) return '蛋豆';
    return '素菜';
  }

  function guessMinutes(name, ingredients, steps) {
    const s = name + ' ' + ingredients.map(function (i) { return i.name; }).join(' ') + ' ' + steps.join(' ');
    if (/炖|焖|煲|卤|红烧|高压锅|慢/.test(s)) return 60;
    if (/蒸|烤/.test(s)) return 30;
    if (/煮|汤/.test(s)) return 30;
    if (/炒|煎|拌|凉拌/.test(s)) return 20;
    return 25;
  }

  function parseBlock(lines, idx) {
    const nameParts = [];
    const ingredients = [];
    const steps = [];
    let mode = 'name';

    lines.forEach(function (line) {
      if (SECTION_RE.test(line)) {
        if (/做法|步骤|制作/.test(line)) mode = 'steps';
        else mode = 'ingredients';
        return;
      }
      if (STEP_HEAD_RE.test(line)) { mode = 'steps'; return; }
      const numMatch = line.match(NUM_STEP_RE);
      const cleaned = numMatch ? line.replace(NUM_STEP_RE, '') : line;

      if (mode === 'steps' || numMatch || isStepLine(line)) {
        if (cleaned && cleaned.trim()) steps.push(cleaned.trim());
        if (!mode.startsWith('step')) mode = 'steps';
        return;
      }
      if (isIngredientLine(line)) {
        mode = 'ingredients';
        splitIngredientLine(line).forEach(function (p) { if (p) ingredients.push(p); });
        return;
      }
      if (mode === 'name') {
        nameParts.push(line);
      }
      // 其他行（如“小贴士”）忽略
    });

    let name = cleanName(nameParts.join(' '));
    if (!name) name = '导入菜谱 ' + idx;
    return {
      name: name,
      emoji: '📄',
      category: guessCategory(name, ingredients),
      minutes: guessMinutes(name, ingredients, steps),
      difficulty: 2,
      servings: 2,
      ingredients: dedupeIngredients(ingredients),
      steps: steps
    };
  }

  function parse(text) {
    const blocks = splitBlocks(text);
    const recipes = [];
    blocks.forEach(function (lines, i) {
      const r = parseBlock(lines, i + 1);
      if (r && (r.ingredients.length || r.steps.length)) recipes.push(r);
    });
    return recipes;
  }

  return {
    normalizeText: normalizeText,
    htmlToText: htmlToText,
    parse: parse,
    parseIngredientPart: parseIngredientPart,
    cleanName: cleanName,
    guessCategory: guessCategory,
    guessMinutes: guessMinutes
  };
});
