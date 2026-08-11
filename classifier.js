/* 荤素分类器
 * 独立纯函数模块：食材语义词典 + 规则映射，不依赖 core.js。
 *
 * 口径（家常荤素，即“蛋奶素/半素”分层——参考《素食 术语和分类》团体标准 T/XMLZH 0001S—2023）：
 *   - 荤 = 必备配料含肉类/禽类/水产/加工肉制品（含内脏、血、腊味）
 *   - 素 = 蛋、豆腐豆制品、干豆、菌菇、蔬菜、淀粉主食等一切无肉配料
 *   - 灰区 = 动物性调味料/汤底/油脂（蚝油、鱼露、鸡精、高汤、猪油、火锅底料…）
 *     默认不计荤（家常口径）；opts.grayMeat 置 true 时计入（更接近净素口径）
 *   - 菜名不参与判断：鱼香肉丝没有鱼、蚂蚁上树没有蚂蚁、夫妻肺片没有肺——
 *     一切按配料说话（川菜味型词如鱼香/宫保/家常是调味方式，不是食材）
 *   - 可选（optional）配料不参与判断：干煸四季豆的肉末可选，则按素计
 *
 * 算法：语义词典 + 最长匹配优先。中文词语嵌套严重（鸡蛋里的“鸡”、素鸡里的
 * “鸡”、蒸鱼豉油里的“鱼”、黄豆芽里的“黄豆”、土豆里的“豆”），
 * 按词长降序匹配即“正向最大匹配”，同长冲突靠组优先级消歧。
 * 社区实践参照：recipe-tagger 的食材类别数据 + 规则映射打标、
 * 中文食材词库（thesaurus）归一化、美团美食知识图谱的“同义词表 + 规则”模式。
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MealClassify = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ========== 食材语义分组 ==========
  // 荤：meat 肉（含内脏/血） / poultry 禽 / aquatic 水产 / processed 加工肉制品
  // 素·蛋白：egg 蛋 / soy 豆制品（含素鸡素鸭等“假荤”） / legume 干豆
  // 素：fungi 菌菇 / veg 蔬菜 / starch 淀粉主食
  // 灰区：gray 动物性调味料/汤底/油脂（默认不计荤，grayMeat 时计入）
  const GROUP = {
    MEAT: 'meat', POULTRY: 'poultry', AQUATIC: 'aquatic', PROCESSED: 'processed',
    EGG: 'egg', SOY: 'soy', LEGUME: 'legume',
    FUNGI: 'fungi', VEG: 'veg', STARCH: 'starch', SEASONING: 'seasoning',
    GRAY: 'gray'
  };

  // 荤素分组（缺一不可的 4 组）
  const MEAT_GROUPS = new Set([GROUP.MEAT, GROUP.POULTRY, GROUP.AQUATIC, GROUP.PROCESSED]);
  // 蛋白质来源分组：荤 4 组 + 蛋 + 豆制品 + 干豆（豆腐是素，但算蛋白质）
  const PROTEIN_GROUPS = new Set([GROUP.MEAT, GROUP.POULTRY, GROUP.AQUATIC, GROUP.PROCESSED,
    GROUP.EGG, GROUP.SOY, GROUP.LEGUME]);

  // 分类所属的分类快路径（菜谱没有配料信息时的兜底）
  const CATEGORY_MEAT = ['荤菜', '水产'];
  const CATEGORY_PROTEIN = ['荤菜', '水产', '蛋豆'];

  // [分组, 词] 词典。词要尽量具体，避免与嵌套词冲突（具体词靠更长命中覆盖）
  const RAW_DICT = [
    // ---- 荤：肉（含内脏、血） ----
    [GROUP.MEAT, '里脊'], [GROUP.MEAT, '五花'], [GROUP.MEAT, '排骨'], [GROUP.MEAT, '肋排'],
    [GROUP.MEAT, '血豆腐'], [GROUP.MEAT, '腰花'], [GROUP.MEAT, '血旺'], [GROUP.MEAT, '黄喉'],
    [GROUP.MEAT, '肥肠'],
    [GROUP.MEAT, '大肠'], [GROUP.MEAT, '小肠'], [GROUP.MEAT, '蹄筋'], [GROUP.MEAT, '骨髓'],
    [GROUP.MEAT, '猪'], [GROUP.MEAT, '牛'], [GROUP.MEAT, '羊'], [GROUP.MEAT, '兔'],
    [GROUP.MEAT, '狗'], [GROUP.MEAT, '驴'], [GROUP.MEAT, '鹿'], [GROUP.MEAT, '肉'],
    [GROUP.MEAT, '肘'], [GROUP.MEAT, '蹄'], [GROUP.MEAT, '爪'], [GROUP.MEAT, '尾'],
    [GROUP.MEAT, '筋'], [GROUP.MEAT, '肝'], [GROUP.MEAT, '肚'], [GROUP.MEAT, '肠'],
    [GROUP.MEAT, '舌'], [GROUP.MEAT, '心'], [GROUP.MEAT, '肺'], [GROUP.MEAT, '脑'],
    [GROUP.MEAT, '血'], [GROUP.MEAT, '骨'], [GROUP.MEAT, '杂'],
    // ---- 荤：禽 ----
    [GROUP.POULTRY, '鸡'], [GROUP.POULTRY, '鸭'], [GROUP.POULTRY, '鹅'],
    [GROUP.POULTRY, '鸽'], [GROUP.POULTRY, '鹌鹑'], [GROUP.POULTRY, '火鸡'],
    // ---- 荤：水产 ----
    [GROUP.AQUATIC, '鱿鱼'], [GROUP.AQUATIC, '墨鱼'], [GROUP.AQUATIC, '章鱼'],
    [GROUP.AQUATIC, '蛤蜊'], [GROUP.AQUATIC, '花甲'], [GROUP.AQUATIC, '扇贝'],
    [GROUP.AQUATIC, '生蚝'], [GROUP.AQUATIC, '海蛎'], [GROUP.AQUATIC, '青口'],
    [GROUP.AQUATIC, '淡菜'], [GROUP.AQUATIC, '蛏子'], [GROUP.AQUATIC, '鲍鱼'],
    [GROUP.AQUATIC, '海参'], [GROUP.AQUATIC, '海胆'], [GROUP.AQUATIC, '鱼籽'],
    [GROUP.AQUATIC, '鱼丸'], [GROUP.AQUATIC, '虾仁'], [GROUP.AQUATIC, '虾皮'],
    [GROUP.AQUATIC, '虾米'], [GROUP.AQUATIC, '虾滑'], [GROUP.AQUATIC, '蟹肉'],
    [GROUP.AQUATIC, '蟹黄'], [GROUP.AQUATIC, '蟹棒'], [GROUP.AQUATIC, '泥鳅'],
    [GROUP.AQUATIC, '黄鳝'], [GROUP.AQUATIC, '鳝'], [GROUP.AQUATIC, '田鸡'],
    [GROUP.AQUATIC, '牛蛙'], [GROUP.AQUATIC, '甲鱼'], [GROUP.AQUATIC, '田螺'],
    [GROUP.AQUATIC, '螺蛳'], [GROUP.AQUATIC, '螺'], [GROUP.AQUATIC, '蛇'],
    [GROUP.AQUATIC, '鱼'], [GROUP.AQUATIC, '虾'], [GROUP.AQUATIC, '蟹'], [GROUP.AQUATIC, '贝'],
    // ---- 荤：加工肉制品 ----
    [GROUP.PROCESSED, '腊肉'], [GROUP.PROCESSED, '腊肠'], [GROUP.PROCESSED, '香肠'],
    [GROUP.PROCESSED, '火腿'], [GROUP.PROCESSED, '火腿肠'], [GROUP.PROCESSED, '培根'],
    [GROUP.PROCESSED, '午餐肉'], [GROUP.PROCESSED, '肉松'], [GROUP.PROCESSED, '肉干'],
    [GROUP.PROCESSED, '肉脯'], [GROUP.PROCESSED, '叉烧'], [GROUP.PROCESSED, '烧腊'],
    [GROUP.PROCESSED, '酱肉'], [GROUP.PROCESSED, '卤肉'], [GROUP.PROCESSED, '卤味'],
    [GROUP.PROCESSED, '咸肉'], [GROUP.PROCESSED, '丸子'], [GROUP.PROCESSED, '肉丸'],
    // ---- 素·蛋白：蛋 / 奶（牛奶含"牛"字，词长覆盖防误判荤） ----
    [GROUP.EGG, '蛋'], [GROUP.EGG, '牛奶'],
    // ---- 素·蛋白：豆制品（含素鸡/素鸭/素火腿等“假荤”，词长覆盖荤字） ----
    [GROUP.SOY, '豆腐乳'], [GROUP.SOY, '臭豆腐'], [GROUP.SOY, '冻豆腐'],
    [GROUP.SOY, '油豆腐'], [GROUP.SOY, '素火腿'], [GROUP.SOY, '米豆腐'],
    [GROUP.SOY, '豆腐'], [GROUP.SOY, '豆干'], [GROUP.SOY, '香干'], [GROUP.SOY, '豆皮'],
    [GROUP.SOY, '千张'], [GROUP.SOY, '腐竹'], [GROUP.SOY, '豆花'], [GROUP.SOY, '豆浆'],
    [GROUP.SOY, '豆豉'], [GROUP.SOY, '腐乳'], [GROUP.SOY, '素鸡'], [GROUP.SOY, '素鸭'],
    [GROUP.SOY, '素鹅'], [GROUP.SOY, '素肉'], [GROUP.SOY, '素肠'], [GROUP.SOY, '面筋'],
    [GROUP.SOY, '烤麸'],
    // ---- 素·蛋白：干豆 ----
    [GROUP.LEGUME, '鹰嘴豆'], [GROUP.LEGUME, '黄豆'], [GROUP.LEGUME, '黑豆'],
    [GROUP.LEGUME, '红豆'], [GROUP.LEGUME, '绿豆'], [GROUP.LEGUME, '豌豆'],
    [GROUP.LEGUME, '毛豆'], [GROUP.LEGUME, '蚕豆'], [GROUP.LEGUME, '青豆'],
    // ---- 素：菌菇（蟹味菇/鸡枞菌词长覆盖“蟹”“鸡”） ----
    [GROUP.FUNGI, '鸡枞菌'], [GROUP.FUNGI, '蟹味菇'], [GROUP.FUNGI, '海鲜菇'],
    [GROUP.FUNGI, '白玉菇'], [GROUP.FUNGI, '茶树菇'], [GROUP.FUNGI, '金针菇'],
    [GROUP.FUNGI, '杏鲍菇'], [GROUP.FUNGI, '猴头菇'], [GROUP.FUNGI, '虫草花'],
    [GROUP.FUNGI, '香菇'], [GROUP.FUNGI, '蘑菇'], [GROUP.FUNGI, '平菇'],
    [GROUP.FUNGI, '口蘑'], [GROUP.FUNGI, '木耳'], [GROUP.FUNGI, '银耳'],
    [GROUP.FUNGI, '竹荪'], [GROUP.FUNGI, '松茸'], [GROUP.FUNGI, '鸡枞'],
    // ---- 素：蔬菜（覆盖与荤/豆字同长的词：菜心、鱼腥草、黄豆芽、空心菜里的"心"…） ----
    [GROUP.VEG, '鱼腥草'], [GROUP.VEG, '黄豆芽'], [GROUP.VEG, '四季豆'],
    [GROUP.VEG, '荷兰豆'], [GROUP.VEG, '酸豆角'], [GROUP.VEG, '豆角'],
    [GROUP.VEG, '空心菜'], [GROUP.VEG, '菜心'], [GROUP.VEG, '扁豆'], [GROUP.VEG, '豇豆'], [GROUP.VEG, '豆芽'],
    // ---- 素：淀粉主食 ----
    [GROUP.STARCH, '红薯粉'], [GROUP.STARCH, '米饭'], [GROUP.STARCH, '大米'],
    [GROUP.STARCH, '面条'], [GROUP.STARCH, '挂面'], [GROUP.STARCH, '米粉'],
    [GROUP.STARCH, '粉丝'], [GROUP.STARCH, '粉条'], [GROUP.STARCH, '面粉'],
    [GROUP.STARCH, '馒头'], [GROUP.STARCH, '包子'], [GROUP.STARCH, '饺子'],
    [GROUP.STARCH, '馄饨'], [GROUP.STARCH, '抄手'], [GROUP.STARCH, '汤圆'],
    [GROUP.STARCH, '元宵'], [GROUP.STARCH, '年糕'], [GROUP.STARCH, '糍粑'],
    [GROUP.STARCH, '锅盔'], [GROUP.STARCH, '油条'], [GROUP.STARCH, '面包'],
    [GROUP.STARCH, '凉皮'], [GROUP.STARCH, '河粉'], [GROUP.STARCH, '土豆'],
    [GROUP.STARCH, '红薯'], [GROUP.STARCH, '山药'], [GROUP.STARCH, '芋头'],
    [GROUP.STARCH, '南瓜'], [GROUP.STARCH, '玉米'], [GROUP.STARCH, '魔芋'],
    [GROUP.STARCH, '蒸肉粉'], [GROUP.STARCH, '淀粉'],
    // ---- 素：调味料（植物性，永远不算荤） ----
    [GROUP.SEASONING, '郫县豆瓣酱'],
    [GROUP.SEASONING, '肉豆蔻'], [GROUP.SEASONING, '生抽'], [GROUP.SEASONING, '老抽'],
    [GROUP.SEASONING, '酱油'], [GROUP.SEASONING, '料酒'], [GROUP.SEASONING, '豆瓣酱'],
    [GROUP.SEASONING, '甜面酱'], [GROUP.SEASONING, '黄豆酱'], [GROUP.SEASONING, '番茄酱'],
    [GROUP.SEASONING, '芝麻酱'], [GROUP.SEASONING, '花生酱'], [GROUP.SEASONING, '沙拉酱'],
    [GROUP.SEASONING, '花椒粉'], [GROUP.SEASONING, '辣椒粉'], [GROUP.SEASONING, '辣椒面'],
    [GROUP.SEASONING, '胡椒粉'], [GROUP.SEASONING, '白胡椒粉'], [GROUP.SEASONING, '黑胡椒'],
    [GROUP.SEASONING, '孜然粉'], [GROUP.SEASONING, '五香粉'], [GROUP.SEASONING, '十三香'],
    [GROUP.SEASONING, '食用油'], [GROUP.SEASONING, '菜籽油'], [GROUP.SEASONING, '花生油'],
    [GROUP.SEASONING, '芝麻油'], [GROUP.SEASONING, '橄榄油'], [GROUP.SEASONING, '香油'],
    [GROUP.SEASONING, '醋'], [GROUP.SEASONING, '盐'], [GROUP.SEASONING, '味精'],
    [GROUP.SEASONING, '白糖'], [GROUP.SEASONING, '冰糖'], [GROUP.SEASONING, '红糖'],
    [GROUP.SEASONING, '蜂蜜'], [GROUP.SEASONING, '花椒'], [GROUP.SEASONING, '八角'],
    [GROUP.SEASONING, '桂皮'], [GROUP.SEASONING, '香叶'], [GROUP.SEASONING, '肉桂'],
    [GROUP.SEASONING, '咖喱'], [GROUP.SEASONING, '芥末'], [GROUP.SEASONING, '老干妈'],
    // ---- 灰区：动物性调味料/汤底/油脂（默认不计荤，grayMeat 时计入） ----
    [GROUP.GRAY, '火锅底料'], [GROUP.GRAY, '蒸鱼豉油'], [GROUP.GRAY, '浓汤宝'],
    [GROUP.GRAY, '骨汤'], [GROUP.GRAY, '高汤'], [GROUP.GRAY, '上汤'],
    [GROUP.GRAY, '猪油'], [GROUP.GRAY, '牛油'], [GROUP.GRAY, '羊油'], [GROUP.GRAY, '鸡油'],
    [GROUP.GRAY, '鱼露'], [GROUP.GRAY, '鸡精'], [GROUP.GRAY, '蚝油'],
    [GROUP.GRAY, '虾酱'], [GROUP.GRAY, '蟹酱'], [GROUP.GRAY, '鱼子酱'],
    [GROUP.GRAY, '卤水'], [GROUP.GRAY, '老卤'], [GROUP.GRAY, '骨膏'], [GROUP.GRAY, '鸡汁']
  ];

  // 组优先级（同长词冲突时，素/灰区词优先于荤词：鸡蛋的“蛋”要压过“鸡”）
  const GROUP_PRIORITY = {};
  Object.keys(GROUP).forEach(function (k) {
    GROUP_PRIORITY[GROUP[k]] = (GROUP[k] === GROUP.MEAT || GROUP[k] === GROUP.POULTRY ||
      GROUP[k] === GROUP.AQUATIC || GROUP[k] === GROUP.PROCESSED) ? 2 : 1;
  });

  // 按词长降序、组优先级升序排序（稳定排序，等长同组保持书写顺序）
  const DICT = RAW_DICT.slice().sort(function (a, b) {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    if (GROUP_PRIORITY[a[0]] !== GROUP_PRIORITY[b[0]]) return GROUP_PRIORITY[a[0]] - GROUP_PRIORITY[b[0]];
    return 0;
  });

  // 单个食材归组；未收录食材默认蔬菜（素）。返回分组名（GROUP.*）
  function classifyIngredient(name) {
    const n = String(name || '').trim();
    if (!n) return GROUP.VEG;
    for (let i = 0; i < DICT.length; i++) {
      if (n.indexOf(DICT[i][1]) !== -1) return DICT[i][0];
    }
    return GROUP.VEG;
  }

  // 判定一道菜：{ name, category, ingredients: [{name, optional}] }
  // 返回 { isMeat, hasProtein }。荤素只看必备配料；菜名/味型词不参与。
  function classifyDish(recipe, opts) {
    opts = opts || {};
    const essential = (recipe.ingredients || []).filter(function (i) { return !i.optional; });
    const meatHit = essential.some(function (i) { return MEAT_GROUPS.has(classifyIngredient(i.name)); });
    const grayHit = essential.some(function (i) { return classifyIngredient(i.name) === GROUP.GRAY; });
    const proteinHit = essential.some(function (i) { return PROTEIN_GROUPS.has(classifyIngredient(i.name)); });

    // 完全没有配料信息时，退回到菜谱分类兜底
    const fallback = essential.length === 0;
    const isMeat = meatHit || (opts.grayMeat && grayHit) ||
      (fallback && CATEGORY_MEAT.indexOf(recipe.category) !== -1);
    const hasProtein = proteinHit || (fallback && CATEGORY_PROTEIN.indexOf(recipe.category) !== -1);
    return { isMeat: !!isMeat, hasProtein: !!hasProtein };
  }

  return {
    GROUP: GROUP,
    DICT: DICT,
    MEAT_GROUPS: MEAT_GROUPS,
    PROTEIN_GROUPS: PROTEIN_GROUPS,
    CATEGORY_MEAT: CATEGORY_MEAT,
    CATEGORY_PROTEIN: CATEGORY_PROTEIN,
    classifyIngredient: classifyIngredient,
    classifyDish: classifyDish
  };
});
