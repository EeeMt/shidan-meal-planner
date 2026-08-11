/* 内置菜谱库
 * 字段说明：
 *   id         唯一标识
 *   name       菜名
 *   emoji      图标
 *   category   分类：荤菜 / 素菜 / 蛋豆 / 水产 / 汤羹 / 主食 / 凉菜
 *   difficulty 难度 1~3（1 最简单）
 *   minutes    总用时（分钟）
 *   servings   份量（人份）
 *   tags       标签：快手 / 下饭 / 宴客 / 汤 / 凉菜 / 主食 ...
 *   ingredients 食材：[{name, amount, optional}]
 *   steps      制作步骤
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RECIPES = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  return [
    // ============ 蛋豆 ============
    {
      id: 'xihongshi-chaojidan', name: '西红柿炒鸡蛋', emoji: '🍅', category: '蛋豆', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '西红柿', amount: '2个' }, { name: '鸡蛋', amount: '3个' },
        { name: '小葱', amount: '1根' }, { name: '白糖', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['西红柿去蒂切块，鸡蛋加少许盐打散。', '热锅倒油，倒入蛋液炒至凝固盛出。', '下西红柿块中火炒出汁水，加白糖和盐。', '倒回鸡蛋翻匀，撒葱花出锅。']
    },
    {
      id: 'jiucai-chaojidan', name: '韭菜炒蛋', emoji: '🥬', category: '蛋豆', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '韭菜', amount: '200g' }, { name: '鸡蛋', amount: '3个' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['韭菜洗净切段，鸡蛋打散加少许盐。', '热油炒蛋至半凝固盛出。', '下韭菜大火快炒约1分钟。', '倒回鸡蛋，加盐炒匀即可。']
    },
    {
      id: 'xiaren-chaojidan', name: '虾仁炒蛋', emoji: '🍤', category: '蛋豆', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '高蛋白'],
      ingredients: [
        { name: '虾仁', amount: '200g' }, { name: '鸡蛋', amount: '3个' },
        { name: '小葱', amount: '1根' }, { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['虾仁用料酒和少许盐腌5分钟。', '鸡蛋加盐打散。', '热油炒虾仁至变色盛出。', '倒入蛋液炒至半凝固，倒回虾仁翻匀，撒葱花。']
    },
    {
      id: 'mapo-doufu', name: '麻婆豆腐', emoji: '🌶️', category: '蛋豆', difficulty: 2, minutes: 20, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '嫩豆腐', amount: '400g' }, { name: '猪肉末', amount: '100g' },
        { name: '豆瓣酱', amount: '1勺' }, { name: '花椒粉', amount: '半勺' },
        { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['豆腐切小块，入沸水焯1分钟捞出。', '热油炒散猪肉末，加豆瓣酱和蒜末炒出红油。', '加一碗水煮开，轻轻推入豆腐煮3分钟。', '淀粉加水调匀勾芡，撒花椒粉和葱花。']
    },
    {
      id: 'jiachang-doufu', name: '家常豆腐', emoji: '🍢', category: '蛋豆', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '老豆腐', amount: '400g' }, { name: '青椒', amount: '1个' },
        { name: '木耳', amount: '50g' }, { name: '胡萝卜', amount: '半根' },
        { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '淀粉', amount: '1勺' }
      ],
      steps: ['豆腐切厚片，煎至两面金黄。', '青椒、木耳、胡萝卜切好，蒜切末。', '爆香蒜末，下配菜翻炒断生。', '倒入豆腐，加生抽、蚝油和半碗水焖3分钟，勾芡出锅。']
    },
    {
      id: 'xiangjian-doufu', name: '香煎豆腐', emoji: '🟨', category: '蛋豆', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '老豆腐', amount: '400g' }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '白糖', amount: '半勺' }, { name: '淀粉', amount: '1勺' }
      ],
      steps: ['豆腐切1厘米厚片，厨房纸吸干水分。', '平底锅少油，中火煎至两面金黄。', '生抽、蚝油、糖、淀粉加半碗水调成汁。', '倒入锅中焖2分钟，撒葱花。']
    },
    {
      id: 'roumo-zhengdan', name: '肉末蒸蛋', emoji: '🥚', category: '蛋豆', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '高蛋白'],
      ingredients: [
        { name: '鸡蛋', amount: '3个' }, { name: '猪肉末', amount: '100g' },
        { name: '生抽', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' }
      ],
      steps: ['鸡蛋加1.5倍温水打散，过筛后盖保鲜膜。', '水开后大火蒸10分钟，关火焖2分钟。', '热油炒散肉末，加料酒、生抽炒香。', '肉末铺在蛋羹上，淋少许生抽撒葱花。']
    },
    {
      id: 'pidan-doufu', name: '皮蛋豆腐', emoji: '🥢', category: '凉菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '凉菜'],
      ingredients: [
        { name: '嫩豆腐', amount: '400g' }, { name: '皮蛋', amount: '2个' },
        { name: '生抽', amount: '1勺' }, { name: '醋', amount: '1勺' },
        { name: '芝麻油', amount: '半勺' }, { name: '大蒜', amount: '2瓣' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['豆腐切块摆盘，皮蛋切瓣放旁边。', '蒜末、生抽、醋、芝麻油调成汁。', '淋在豆腐上，撒葱花即可。']
    },
    {
      id: 'huanggua-chaojidan', name: '黄瓜炒鸡蛋', emoji: '🥒', category: '蛋豆', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '黄瓜', amount: '2根' }, { name: '鸡蛋', amount: '3个' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['黄瓜斜切薄片，鸡蛋加少许盐和1勺水打散。', '热油倒入蛋液，凝固后划散盛出。', '留底油下黄瓜片大火快炒约1分钟。', '倒回鸡蛋，加盐炒匀，撒葱花。']
    },
    {
      id: 'hongshao-doufu', name: '红烧豆腐', emoji: '🍲', category: '蛋豆', difficulty: 1, minutes: 20, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '老豆腐', amount: '400g' }, { name: '豆瓣酱', amount: '1勺' },
        { name: '大蒜', amount: '2瓣' }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '老抽', amount: '半勺' },
        { name: '蚝油', amount: '1勺' }, { name: '白糖', amount: '半勺' },
        { name: '淀粉', amount: '1勺' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['豆腐切块，开水加盐焯1分钟捞出。', '热油下豆腐块煎至两面金黄。', '下蒜末、豆瓣酱炒出红油，加生抽、老抽、蚝油、白糖和半碗水。', '盖盖小火焖3分钟，淀粉勾芡，大火收汁，撒葱花。']
    },

    // ============ 荤菜 ============
    {
      id: 'qingjiao-rousi', name: '青椒肉丝', emoji: '🥩', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '猪里脊', amount: '250g' }, { name: '青椒', amount: '2个' },
        { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['肉切丝，加料酒、生抽、淀粉抓匀腌10分钟。', '青椒切丝，蒜切片。', '热油滑炒肉丝至变色盛出。', '下蒜片、青椒炒至断生，倒回肉丝，加生抽和盐炒匀。']
    },
    {
      id: 'yuxiang-rousi', name: '鱼香肉丝', emoji: '🌶️', category: '荤菜', difficulty: 2, minutes: 30, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '猪里脊', amount: '250g' }, { name: '青椒', amount: '1个' },
        { name: '胡萝卜', amount: '半根' }, { name: '木耳', amount: '50g' },
        { name: '大蒜', amount: '3瓣' }, { name: '生姜', amount: '1块' },
        { name: '豆瓣酱', amount: '1勺' }, { name: '生抽', amount: '1勺' },
        { name: '醋', amount: '1勺' }, { name: '白糖', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }
      ],
      steps: ['肉丝加料酒、淀粉抓匀腌10分钟。', '青椒、胡萝卜、木耳切丝；生抽、醋、糖、淀粉加3勺水调成鱼香汁。', '滑炒肉丝至变色盛出。', '下豆瓣酱、蒜末、姜末炒出红油，下配菜炒断生。', '倒回肉丝和鱼香汁，大火炒匀收汁。']
    },
    {
      id: 'huiguo-rou', name: '回锅肉', emoji: '🥓', category: '荤菜', difficulty: 2, minutes: 35, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '五花肉', amount: '400g' }, { name: '青椒', amount: '2个' },
        { name: '蒜苗', amount: '2根' }, { name: '豆瓣酱', amount: '1勺' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '1勺' }, { name: '白糖', amount: '半勺' }
      ],
      steps: ['五花肉冷水下锅加姜片，煮约20分钟至熟。', '捞出晾凉切薄片，青椒切块，蒜苗切段。', '锅中少油，下肉片煸至微卷出油。', '加豆瓣酱炒出红油，下青椒、蒜苗炒断生，加生抽、糖炒匀。']
    },
    {
      id: 'hongshao-rou', name: '红烧肉', emoji: '🍖', category: '荤菜', difficulty: 2, minutes: 90, servings: 3,
      tags: ['宴客', '硬菜'],
      ingredients: [
        { name: '五花肉', amount: '500g' }, { name: '冰糖', amount: '20g' },
        { name: '生姜', amount: '3片' }, { name: '八角', amount: '1个' },
        { name: '桂皮', amount: '1小段' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' }, { name: '料酒', amount: '2勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['五花肉切麻将块，冷水下锅焯水捞出。', '小火炒冰糖至琥珀色，下肉块翻炒上色。', '加姜、八角、桂皮、料酒、生抽、老抽炒香。', '加热水没过肉，小火炖60分钟。', '开盖大火收汁，加盐调味。']
    },
    {
      id: 'tudou-dunniurou', name: '土豆炖牛肉', emoji: '🥘', category: '荤菜', difficulty: 2, minutes: 80, servings: 3,
      tags: ['硬菜', '下饭'],
      ingredients: [
        { name: '牛腩', amount: '500g' }, { name: '土豆', amount: '2个' },
        { name: '胡萝卜', amount: '1根' }, { name: '洋葱', amount: '半个' },
        { name: '生姜', amount: '3片' }, { name: '八角', amount: '1个' },
        { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '1勺' }, { name: '料酒', amount: '2勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['牛腩切块焯水，土豆、胡萝卜切滚刀块。', '炒香姜片和洋葱，下牛腩加生抽、老抽、料酒炒匀。', '加热水没过牛肉，加八角小火炖50分钟。', '下土豆、胡萝卜再炖20分钟，加盐收汁。']
    },
    {
      id: 'kele-jichi', name: '可乐鸡翅', emoji: '🍗', category: '荤菜', difficulty: 1, minutes: 30, servings: 2,
      tags: ['快手', '甜口'],
      ingredients: [
        { name: '鸡翅', amount: '500g' }, { name: '可乐', amount: '1罐' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '半勺' }, { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['鸡翅两面划刀，冷水下锅加料酒焯水。', '平底锅煎至两面金黄。', '加姜片、生抽、老抽，倒入可乐没过鸡翅。', '中火煮15分钟，大火收汁即可。']
    },
    {
      id: 'gongbao-jiding', name: '宫保鸡丁', emoji: '🥜', category: '荤菜', difficulty: 2, minutes: 30, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '鸡胸肉', amount: '300g' }, { name: '花生米', amount: '50g' },
        { name: '大葱', amount: '1根' }, { name: '干辣椒', amount: '5个' },
        { name: '花椒', amount: '1小把' }, { name: '生抽', amount: '1勺' },
        { name: '醋', amount: '1勺' }, { name: '白糖', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }
      ],
      steps: ['鸡丁加料酒、淀粉腌10分钟；生抽、醋、糖、淀粉加2勺水调汁。', '花生米小火炸熟盛出。', '滑炒鸡丁至变色盛出。', '爆香干辣椒、花椒、葱段，倒回鸡丁。', '淋入料汁炒匀，加花生米翻匀。']
    },
    {
      id: 'lazi-ji', name: '辣子鸡', emoji: '🌶️', category: '荤菜', difficulty: 2, minutes: 35, servings: 2,
      tags: ['辣', '下饭'],
      ingredients: [
        { name: '鸡腿肉', amount: '500g' }, { name: '干辣椒', amount: '30g' },
        { name: '花椒', amount: '1勺' }, { name: '大蒜', amount: '3瓣' },
        { name: '生姜', amount: '3片' }, { name: '生抽', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '白芝麻', amount: '适量' }
      ],
      steps: ['鸡腿切小块，加料酒、生抽、盐、淀粉腌20分钟。', '油温六成热，炸鸡块至金黄捞出。', '留底油爆香干辣椒、花椒、蒜、姜。', '倒回鸡块，加盐大火炒匀，撒白芝麻。']
    },
    {
      id: 'tangcu-paigu', name: '糖醋排骨', emoji: '🍖', category: '荤菜', difficulty: 2, minutes: 60, servings: 3,
      tags: ['宴客', '甜口'],
      ingredients: [
        { name: '排骨', amount: '500g' }, { name: '冰糖', amount: '20g' },
        { name: '生姜', amount: '3片' }, { name: '生抽', amount: '2勺' },
        { name: '醋', amount: '3勺' }, { name: '料酒', amount: '1勺' }, { name: '白芝麻', amount: '适量' }
      ],
      steps: ['排骨焯水洗净。', '小火炒冰糖至琥珀色，下排骨翻炒上色。', '加姜片、料酒、生抽，加热水没过排骨。', '小火炖40分钟，加醋大火收汁，撒芝麻。']
    },
    {
      id: 'suantai-chaorou', name: '蒜苔炒肉', emoji: '🥢', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '蒜苔', amount: '300g' }, { name: '猪瘦肉', amount: '200g' },
        { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['蒜苔切段，肉切丝加料酒、生抽、淀粉腌10分钟。', '滑炒肉丝至变色盛出。', '下蒜苔炒至断生（可加少许水焖1分钟）。', '倒回肉丝，加生抽、盐炒匀。']
    },
    {
      id: 'qincai-chaoniurou', name: '芹菜炒牛肉', emoji: '🥬', category: '荤菜', difficulty: 2, minutes: 20, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '牛肉', amount: '250g' }, { name: '芹菜', amount: '200g' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['牛肉逆纹切薄片，加料酒、生抽、淀粉腌10分钟。', '芹菜切段，姜切丝。', '大火热油快炒牛肉至变色盛出。', '下姜丝、芹菜炒断生，倒回牛肉加盐炒匀。']
    },
    {
      id: 'yangcong-chaorousi', name: '洋葱炒肉丝', emoji: '🧅', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '洋葱', amount: '1个' }, { name: '猪瘦肉', amount: '200g' },
        { name: '生抽', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['洋葱切丝，肉丝加料酒、生抽、淀粉腌10分钟。', '滑炒肉丝至变色盛出。', '下洋葱丝中火炒软。', '倒回肉丝，加生抽、盐炒匀。']
    },
    {
      id: 'muxu-rou', name: '木须肉', emoji: '🥒', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '猪里脊', amount: '200g' }, { name: '鸡蛋', amount: '2个' },
        { name: '黄瓜', amount: '1根' }, { name: '木耳', amount: '50g' },
        { name: '生抽', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['木耳提前泡发撕小朵，黄瓜切片，肉片腌10分钟。', '鸡蛋炒熟盛出。', '滑炒肉片至变色盛出。', '下黄瓜、木耳翻炒，倒回肉片和鸡蛋，加生抽、盐炒匀。']
    },
    {
      id: 'xiaochao-huangniurou', name: '小炒黄牛肉', emoji: '🐂', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['快手', '微辣'],
      ingredients: [
        { name: '牛肉', amount: '300g' }, { name: '小米辣', amount: '3个' },
        { name: '香菜', amount: '1把' }, { name: '生姜', amount: '2片' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '淀粉', amount: '1勺' }
      ],
      steps: ['牛肉切薄片加淀粉、生抽腌10分钟。', '小米辣切圈，香菜切段。', '大火热油快炒牛肉至变色。', '下蒜、姜、小米辣炒香，加蚝油、生抽，撒香菜炒匀。']
    },
    {
      id: 'xianggu-huaji', name: '香菇滑鸡', emoji: '🍄', category: '荤菜', difficulty: 1, minutes: 30, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '鸡腿肉', amount: '400g' }, { name: '香菇', amount: '150g' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['鸡块加料酒、生抽、淀粉腌15分钟。', '香菇切片。', '鸡块煎至表面变色，下香菇翻炒。', '加蚝油、生抽和半碗水，焖8分钟，收汁撒葱花。']
    },
    {
      id: 'hongshao-jitui', name: '红烧鸡腿', emoji: '🍗', category: '荤菜', difficulty: 1, minutes: 40, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '鸡腿', amount: '3个' }, { name: '生姜', amount: '3片' },
        { name: '八角', amount: '1个' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' }, { name: '料酒', amount: '2勺' },
        { name: '冰糖', amount: '10g' }, { name: '盐', amount: '适量' }
      ],
      steps: ['鸡腿两面划刀，冷水下锅焯水。', '煎至表面金黄。', '加姜、八角、冰糖、生抽、老抽、料酒。', '加水没过鸡腿，中小火炖25分钟，大火收汁。']
    },
    {
      id: 'jingjiang-rousi', name: '京酱肉丝', emoji: '🥓', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '猪里脊', amount: '300g' }, { name: '甜面酱', amount: '2勺' },
        { name: '大葱', amount: '1根' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '白糖', amount: '1勺' }, { name: '豆腐皮', amount: '1张', optional: true }
      ],
      steps: ['肉丝加料酒、淀粉腌10分钟，大葱切细丝铺盘底。', '滑炒肉丝至变色盛出。', '下甜面酱、白糖小火炒香，加生抽和少许水。', '倒回肉丝裹匀酱汁，盛在葱丝上，可配豆腐皮卷食。']
    },
    {
      id: 'ziran-yangrou', name: '孜然羊肉', emoji: '🐑', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['孜然', '快手'],
      ingredients: [
        { name: '羊肉', amount: '300g' }, { name: '洋葱', amount: '半个' },
        { name: '孜然粉', amount: '1勺' }, { name: '辣椒粉', amount: '半勺' },
        { name: '白芝麻', amount: '1勺' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['羊肉切薄片，加料酒、生抽、淀粉腌10分钟。', '洋葱切丝。', '大火爆炒羊肉至变色。', '下洋葱炒软，加孜然粉、辣椒粉、盐炒匀，撒芝麻。']
    },
    {
      id: 'heijiao-niuliu', name: '黑椒牛柳', emoji: '🐂', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '牛里脊', amount: '300g' }, { name: '洋葱', amount: '半个' },
        { name: '青椒', amount: '1个' }, { name: '黑胡椒', amount: '1勺' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' }
      ],
      steps: ['牛里脊切条，加料酒、生抽、淀粉腌10分钟。', '洋葱、青椒切条。', '大火滑炒牛柳至变色盛出。', '炒洋葱、青椒，倒回牛柳，加黑胡椒碎、蚝油、生抽炒匀。']
    },
    {
      id: 'zhurou-dun-fentiao', name: '猪肉炖粉条', emoji: '🍲', category: '荤菜', difficulty: 2, minutes: 50, servings: 3,
      tags: ['硬菜', '下饭'],
      ingredients: [
        { name: '五花肉', amount: '300g' }, { name: '干粉条', amount: '100g' },
        { name: '大白菜', amount: '300g' }, { name: '生姜', amount: '2片' },
        { name: '八角', amount: '1个' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['粉条提前泡软，白菜切块。', '煸炒五花肉片出油。', '加姜、八角、生抽、老抽炒香，加水炖20分钟。', '下白菜和粉条再炖15分钟，加盐调味。']
    },
    {
      id: 'suandoujiao-chaoroumo', name: '酸豆角炒肉末', emoji: '🌶️', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '酸豆角', amount: '200g' }, { name: '猪肉末', amount: '200g' },
        { name: '小米辣', amount: '2个' }, { name: '大蒜', amount: '2瓣' },
        { name: '生抽', amount: '1勺' }, { name: '料酒', amount: '1勺' }
      ],
      steps: ['酸豆角切小粒，小米辣切圈。', '热油炒散肉末，加料酒去腥。', '下蒜末、小米辣炒香。', '下酸豆角翻炒2分钟，加生抽炒匀。']
    },
    {
      id: 'roumo-qiezi', name: '肉末茄子', emoji: '🍆', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '茄子', amount: '2个' }, { name: '猪肉末', amount: '150g' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '淀粉', amount: '1勺' }, { name: '豆瓣酱', amount: '1勺' }
      ],
      steps: ['茄子切条，用盐腌10分钟挤去水分。', '煎茄条至软身盛出。', '炒散肉末，加豆瓣酱、蒜末炒香。', '倒回茄子，加生抽、蚝油和少许水焖3分钟，勾芡。']
    },
    {
      id: 'shuizhu-roupian', name: '水煮肉片', emoji: '🥩', category: '荤菜', difficulty: 2, minutes: 30, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '猪里脊', amount: '300g' }, { name: '豆芽', amount: '200g' },
        { name: '郫县豆瓣酱', amount: '1勺' }, { name: '火锅底料', amount: '1/4包', optional: true },
        { name: '大蒜', amount: '5瓣' }, { name: '干辣椒', amount: '5个', optional: true },
        { name: '花椒', amount: '半勺' }, { name: '蛋清', amount: '1个' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' }
      ],
      steps: ['里脊切薄片，加料酒、盐、蛋清和淀粉抓匀，淋少许油腌15分钟。', '豆芽洗净焯水1分钟，铺在大碗底部。', '热油爆香蒜末，下豆瓣酱和火锅底料小火炒出红油。', '加一碗水煮开，转小火将肉片一片片下锅，煮至变色再煮1分钟。', '连汤带肉倒入碗中，撒干辣椒段、花椒和葱花。', '另起锅烧热油，淋在表面激香。']
    },
    {
      id: 'tudou-rousi', name: '土豆肉丝', emoji: '🥔', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '猪瘦肉', amount: '200g' }, { name: '土豆', amount: '2个' },
        { name: '干辣椒', amount: '3个' }, { name: '大蒜', amount: '2瓣' },
        { name: '小葱', amount: '1根' }, { name: '生抽', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '淀粉', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['肉切丝，加料酒、生抽、淀粉抓匀腌10分钟。', '土豆切细丝，清水冲洗去淀粉后沥干。', '热油滑炒肉丝至变色盛出。', '爆香干辣椒、蒜片，下土豆丝大火炒约2分钟。', '倒回肉丝，加生抽和盐炒匀，撒葱花。']
    },
    {
      id: 'huanggua-roupian', name: '黄瓜肉片', emoji: '🥒', category: '荤菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '清淡', '微辣'],
      ingredients: [
        { name: '猪瘦肉', amount: '200g' }, { name: '黄瓜', amount: '2根' },
        { name: '干辣椒', amount: '2个' }, { name: '大蒜', amount: '3瓣' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '1勺' },
        { name: '料酒', amount: '半勺' }, { name: '蚝油', amount: '半勺' },
        { name: '淀粉', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['肉切薄片，加料酒、生抽、淀粉和少许盐抓匀，淋少许油腌10分钟。', '黄瓜斜切菱形片，姜切丝，蒜切片。', '热油爆香姜蒜和干辣椒，下肉片中火滑炒至变色盛出。', '大火下黄瓜片快炒约1分钟，倒回肉片，加生抽、蚝油和盐炒匀。']
    },
    {
      id: 'xingbaogu-wuhuarou', name: '杏鲍菇五花肉', emoji: '🍄', category: '荤菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '五花肉', amount: '200g' }, { name: '杏鲍菇', amount: '400g' },
        { name: '小米辣', amount: '3个' }, { name: '大蒜', amount: '3瓣' },
        { name: '生姜', amount: '2片' }, { name: '蒜苗', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '老抽', amount: '半勺' },
        { name: '白糖', amount: '半勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['五花肉切薄片，杏鲍菇切片，小米辣切圈，姜蒜切末。', '锅少油下五花肉，中火煸炒至出油微焦。', '下姜蒜末和小米辣炒香，加老抽上色。', '下杏鲍菇大火翻炒至水分收干变软。', '加生抽、白糖和盐炒匀，下蒜苗炒断生出锅。']
    },
    {
      id: 'huluobo-wuhuarou', name: '胡萝卜五花肉', emoji: '🥕', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '五花肉', amount: '200g' }, { name: '胡萝卜', amount: '2根' },
        { name: '大蒜', amount: '3瓣' }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '白糖', amount: '半勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['五花肉切薄片，胡萝卜去皮切片，蒜切片。', '锅少油下五花肉，中火煸炒至出油微黄。', '下蒜片炒香，下胡萝卜片翻炒，加小半碗水盖盖焖3分钟。', '开盖加生抽、白糖和盐炒匀，撒葱花出锅。']
    },
    {
      id: 'yuxiang-qiezi', name: '鱼香茄子', emoji: '🍆', category: '荤菜', difficulty: 2, minutes: 30, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '茄子', amount: '2个' }, { name: '猪肉末', amount: '100g' },
        { name: '泡椒', amount: '2勺' }, { name: '大蒜', amount: '3瓣' },
        { name: '生姜', amount: '1块' }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '2勺' }, { name: '醋', amount: '2勺' },
        { name: '白糖', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '食用油', amount: '3勺' }
      ],
      steps: ['茄子切滚刀块，下油锅炸至表面金黄、变软，捞出沥油。', '生抽、醋、白糖、淀粉加3勺清水调成鱼香汁。', '锅中留底油，下猪肉末炒散，下泡椒末、姜蒜末炒出红油。', '倒回茄块翻炒，淋入鱼香汁，加少许水焖2分钟。', '大火收浓汤汁，撒葱花出锅。']
    },
    {
      id: 'hongshao-paigu', name: '红烧排骨', emoji: '🍖', category: '荤菜', difficulty: 2, minutes: 55, servings: 3,
      tags: ['下饭', '硬菜'],
      ingredients: [
        { name: '排骨', amount: '500g' }, { name: '冰糖', amount: '20g' },
        { name: '生姜', amount: '3片' }, { name: '大葱', amount: '1根' },
        { name: '八角', amount: '1个' }, { name: '桂皮', amount: '1小段' },
        { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '1勺' },
        { name: '料酒', amount: '2勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['排骨冷水下锅加姜片、料酒焯水，撇沫捞出洗净。', '锅少油下冰糖小火炒至琥珀色，下排骨翻炒裹上糖色。', '下姜片、葱段、八角、桂皮炒香，加生抽、老抽和热水没过排骨。', '大火烧开转小火炖40分钟，开盖大火收汁，加盐炒匀。']
    },
    {
      id: 'lajiao-chaorou', name: '辣椒炒肉', emoji: '🌶️', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['下饭', '辣'],
      ingredients: [
        { name: '五花肉', amount: '300g' }, { name: '青椒', amount: '4个' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '半勺' }, { name: '蚝油', amount: '1勺' },
        { name: '白糖', amount: '半勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['青椒斜切段，干锅小火煸至表皮起皱变软，加少许盐盛出。', '五花肉切薄片，锅不放油煸炒出油脂，炒至边缘微焦。', '下蒜片炒香，倒回青椒大火合炒。', '加生抽、老抽、蚝油和白糖，大火翻炒均匀出锅。']
    },
    {
      id: 'mayi-shangshu', name: '蚂蚁上树', emoji: '🐜', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '粉丝', amount: '1把' }, { name: '猪肉末', amount: '150g' },
        { name: '豆瓣酱', amount: '1勺' }, { name: '大蒜', amount: '2瓣' },
        { name: '生姜', amount: '2片' }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '半勺' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['粉丝温水泡软，剪成段。', '热油下肉末炒散，下豆瓣酱小火炒出红油，加姜蒜末炒香。', '加生抽、蚝油和一碗水煮开。', '下粉丝用筷子拨散，煮至汤汁收浓，撒葱花出锅。']
    },
    {
      id: 'xianggan-chaorou', name: '香干炒肉', emoji: '🍢', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '香干', amount: '200g' }, { name: '五花肉', amount: '150g' },
        { name: '青椒', amount: '1个' }, { name: '大蒜', amount: '2瓣' },
        { name: '生抽', amount: '1勺' }, { name: '老抽', amount: '半勺' },
        { name: '蚝油', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['香干切薄片，开水加半勺老抽焯1分钟去豆腥，捞出沥干。', '五花肉切薄片，热锅下肉煸炒至出油微黄。', '下蒜片、青椒片炒香，下香干翻炒。', '加生抽、蚝油和少许盐炒匀出锅。']
    },
    {
      id: 'huacai-chaorou', name: '花菜炒肉片', emoji: '🥦', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '菜花', amount: '300g' }, { name: '五花肉', amount: '150g' },
        { name: '干辣椒', amount: '2个' }, { name: '大蒜', amount: '2瓣' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['菜花掰小朵，淡盐水泡10分钟后焯水1分钟，捞出沥干。', '五花肉切薄片，加料酒、生抽和淀粉抓匀腌10分钟。', '热锅下肉片炒至变色微黄，下蒜片、干辣椒段炒香。', '下菜花大火翻炒，加蚝油和盐炒匀出锅。']
    },
    {
      id: 'fenzheng-rou', name: '粉蒸肉', emoji: '🥩', category: '荤菜', difficulty: 2, minutes: 50, servings: 3,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '五花肉', amount: '400g' }, { name: '蒸肉粉', amount: '1包' },
        { name: '豆瓣酱', amount: '1勺' }, { name: '生抽', amount: '1勺' },
        { name: '老抽', amount: '半勺' }, { name: '料酒', amount: '1勺' },
        { name: '生姜', amount: '2片' }, { name: '白糖', amount: '半勺' },
        { name: '小葱', amount: '1根' }
      ],
      steps: ['五花肉切厚片，加豆瓣酱、生抽、老抽、料酒、姜片和白糖抓匀，腌20分钟。', '腌好的肉片逐片裹上蒸肉粉，码入盘中。', '高压锅加水烧开，放上蒸盘，上汽后压30分钟。', '开盖撒葱花出锅。']
    },
    {
      id: 'larou-chaosuanmiao', name: '腊肉炒蒜苗', emoji: '🥓', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '腊肉', amount: '200g' }, { name: '蒜苗', amount: '3根' },
        { name: '干辣椒', amount: '2个' }, { name: '大蒜', amount: '2瓣' },
        { name: '白糖', amount: '半勺' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['腊肉冷水下锅煮15分钟，捞出切薄片；蒜白蒜叶分开切段。', '锅少油下腊肉片，中火煸炒至出油、边缘卷曲。', '下蒜片、干辣椒段和蒜白炒香。', '下蒜叶大火快炒至变软，加白糖炒匀出锅（腊肉咸，不用加盐）。']
    },
    {
      id: 'huluobo-tudou-shaopaigu', name: '胡萝卜土豆烧排骨', emoji: '🥘', category: '荤菜', difficulty: 2, minutes: 70, servings: 3,
      tags: ['下饭', '硬菜'],
      ingredients: [
        { name: '排骨', amount: '500g' }, { name: '土豆', amount: '2个' },
        { name: '胡萝卜', amount: '1根' }, { name: '冰糖', amount: '20g' },
        { name: '生姜', amount: '3片' }, { name: '大葱', amount: '半根' },
        { name: '八角', amount: '1个' }, { name: '桂皮', amount: '1小段' },
        { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '1勺' },
        { name: '料酒', amount: '2勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['排骨冷水下锅加姜片、料酒焯水，撇沫捞出洗净。', '锅少油下冰糖小火炒至琥珀色，下排骨翻炒裹上糖色。', '下姜片、葱段、八角、桂皮炒香，加生抽、老抽和热水没过排骨，小火炖40分钟。', '下土豆块、胡萝卜块再炖15分钟。', '大火收汁，加盐炒匀。']
    },
    {
      id: 'sijidou-shaopaigu', name: '四季豆烧排骨', emoji: '🫛', category: '荤菜', difficulty: 2, minutes: 70, servings: 3,
      tags: ['下饭', '硬菜', '微辣'],
      ingredients: [
        { name: '排骨', amount: '500g' }, { name: '四季豆', amount: '400g' },
        { name: '冰糖', amount: '15g' }, { name: '生姜', amount: '3片' },
        { name: '大葱', amount: '半根' }, { name: '八角', amount: '1个' },
        { name: '干辣椒', amount: '2个' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '1勺' }, { name: '料酒', amount: '2勺' },
        { name: '盐', amount: '适量' }
      ],
      steps: ['排骨冷水下锅加姜片、料酒焯水，撇沫捞出洗净。', '四季豆去筋折段，焯水2分钟捞出（四季豆必须煮熟）。', '锅少油下冰糖炒至琥珀色，下排骨裹上糖色，下姜片、葱段、八角、干辣椒炒香。', '加生抽、老抽和热水没过排骨，小火炖40分钟。', '下四季豆再炖15分钟至软烂，大火收汁，加盐。']
    },
    {
      id: 'ganguo-paigu', name: '干锅排骨', emoji: '🌶️', category: '荤菜', difficulty: 2, minutes: 45, servings: 3,
      tags: ['下饭', '辣'],
      ingredients: [
        { name: '排骨', amount: '500g' }, { name: '土豆', amount: '1个' },
        { name: '干辣椒', amount: '8个' }, { name: '花椒', amount: '1勺' },
        { name: '豆瓣酱', amount: '1勺' }, { name: '大蒜', amount: '4瓣' },
        { name: '生姜', amount: '3片' }, { name: '洋葱', amount: '半个' },
        { name: '生抽', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '白芝麻', amount: '适量' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '3勺' }
      ],
      steps: ['排骨剁小块，冷水下锅加姜片、料酒焯水，捞出沥干，加盐、生抽和淀粉抓匀腌15分钟。', '土豆切条，排骨和土豆分别下六成热油锅炸至金黄捞出。', '留底油下姜蒜片、洋葱丝炒香，下干辣椒段、花椒和豆瓣酱小火炒出红油。', '倒回排骨和土豆，大火翻炒均匀，撒白芝麻出锅。']
    },
    {
      id: 'hongjiao-rousi', name: '红椒肉丝', emoji: '🫑', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '猪里脊', amount: '250g' }, { name: '红椒', amount: '2个' },
        { name: '大蒜', amount: '2瓣' }, { name: '生姜', amount: '2片' },
        { name: '生抽', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['里脊切丝，加生抽、料酒和淀粉抓匀腌10分钟。', '红椒去籽切丝，姜蒜切末。', '热油滑炒肉丝至变色盛出。', '留底油爆香姜蒜，下红椒丝炒至变色，倒回肉丝，加盐炒匀。']
    },
    {
      id: 'shuangjiao-jiding', name: '双椒鸡丁', emoji: '🌶️', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '鸡腿肉', amount: '300g' }, { name: '青椒', amount: '2个' },
        { name: '红椒', amount: '1个' }, { name: '大蒜', amount: '3瓣' },
        { name: '生姜', amount: '2片' }, { name: '花椒', amount: '1小把' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '淀粉', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['鸡腿肉切丁，加料酒、生抽和淀粉抓匀腌10分钟。', '青红椒去籽切丁，姜蒜切末。', '热油下花椒、姜蒜末爆香，下鸡丁大火炒至变色。', '下青红椒丁炒至断生，加蚝油和盐炒匀出锅。']
    },
    {
      id: 'kugua-wuhuarou', name: '苦瓜五花肉', emoji: '🥒', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '苦瓜', amount: '2根' }, { name: '五花肉', amount: '200g' },
        { name: '大蒜', amount: '3瓣' }, { name: '白糖', amount: '1勺' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '淀粉', amount: '半勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['苦瓜对半切开，刮净白瓤切片，撒盐腌10分钟挤干水分（去苦关键）。', '五花肉切薄片，加料酒、淀粉抓匀腌10分钟。', '热锅下五花肉煸炒出油微焦，下蒜片炒香。', '下苦瓜大火快炒，加白糖、生抽和蚝油炒匀出锅。']
    },
    {
      id: 'tudou-huiguorou', name: '土豆回锅肉', emoji: '🥔', category: '荤菜', difficulty: 2, minutes: 35, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '五花肉', amount: '300g' }, { name: '土豆', amount: '2个' },
        { name: '蒜苗', amount: '2根' }, { name: '豆瓣酱', amount: '1勺' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '1勺' },
        { name: '白糖', amount: '半勺' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['五花肉冷水下锅加姜片煮15分钟，捞出切薄片。', '土豆切薄片，煎至两面金黄盛出。', '下五花肉片煸炒出油微焦，下豆瓣酱炒出红油。', '倒回土豆片，加生抽、白糖炒匀，下蒜苗段炒断生出锅。']
    },
    {
      id: 'qincai-douganrousi', name: '芹菜豆干肉丝', emoji: '🥬', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '猪里脊', amount: '200g' }, { name: '芹菜', amount: '200g' },
        { name: '香干', amount: '100g' }, { name: '大蒜', amount: '2瓣' },
        { name: '生姜', amount: '2片' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['里脊切丝，加生抽、料酒和淀粉抓匀腌10分钟。', '芹菜切段，香干切丝，姜蒜切末。', '热油滑炒肉丝至变色盛出。', '下姜蒜爆香，下香干炒香，下芹菜段大火快炒至断生，倒回肉丝，加盐炒匀。']
    },
    {
      id: 'wosun-wuhuarou', name: '莴笋五花肉', emoji: '🥬', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '莴笋', amount: '2根' }, { name: '五花肉', amount: '200g' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['莴笋去皮切片，撒盐腌10分钟，冲洗挤干。', '五花肉切薄片，热锅煸炒出油微焦。', '下蒜片炒香，下莴笋片大火快炒。', '加生抽、蚝油和少许盐炒匀出锅。']
    },
    {
      id: 'moyu-shaoya', name: '魔芋烧鸭', emoji: '🦆', category: '荤菜', difficulty: 2, minutes: 55, servings: 3,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '鸭', amount: '半只' }, { name: '魔芋', amount: '300g' },
        { name: '豆瓣酱', amount: '1勺' }, { name: '干辣椒', amount: '4个' },
        { name: '花椒', amount: '1小把' }, { name: '大蒜', amount: '4瓣' },
        { name: '生姜', amount: '3片' }, { name: '生抽', amount: '1勺' },
        { name: '老抽', amount: '半勺' }, { name: '料酒', amount: '2勺' },
        { name: '白糖', amount: '半勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['魔芋切块，开水焯2分钟去碱味。', '鸭肉剁块，冷水下锅加姜片、料酒焯水，捞出洗净。', '热油下花椒、干辣椒、姜蒜爆香，下豆瓣酱炒出红油。', '下鸭块翻炒干水分，加生抽、老抽、料酒和热水没过，小火炖35分钟。', '下魔芋再焖10分钟，加白糖和盐，大火收汁。']
    },
    {
      id: 'jiangdou-roumo', name: '豇豆肉末', emoji: '🫛', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '豇豆', amount: '300g' }, { name: '猪肉末', amount: '150g' },
        { name: '大蒜', amount: '3瓣' }, { name: '小米辣', amount: '2个' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '白糖', amount: '半勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['豇豆去筋切丁，蒜切末。', '热油下肉末炒散，加料酒炒至变色，下蒜末、小米辣炒香。', '下豇豆丁大火翻炒，加少许水焖3分钟至熟透（豇豆必须煮熟）。', '加生抽、蚝油、白糖和盐炒匀出锅。']
    },
    {
      id: 'huluobo-niurousi', name: '胡萝卜牛肉丝', emoji: '🥕', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '牛里脊', amount: '200g' }, { name: '胡萝卜', amount: '2根' },
        { name: '大蒜', amount: '2瓣' }, { name: '生姜', amount: '2片' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '半勺' },
        { name: '淀粉', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['牛肉逆纹切丝，加生抽、料酒和淀粉抓匀，淋少许油腌10分钟。', '胡萝卜去皮切丝。', '热油下胡萝卜丝炒软盛出。', '下姜蒜爆香，下牛肉丝大火滑炒至变色，倒回胡萝卜丝，加蚝油和盐炒匀。']
    },
    {
      id: 'qingdou-roumo', name: '青豆肉沫', emoji: '🫛', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '青豆', amount: '250g' }, { name: '猪肉末', amount: '150g' },
        { name: '大蒜', amount: '2瓣' }, { name: '小米辣', amount: '1个', optional: true },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['青豆开水加盐焯3分钟捞出。', '热油下肉末炒散，加料酒炒至变色，下蒜末、小米辣炒香。', '下青豆翻炒，加生抽、蚝油和少许水焖2分钟至入味。', '加盐炒匀出锅。']
    },
    {
      id: 'suantai-larou', name: '蒜苔炒腊肉', emoji: '🥢', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '腊肉', amount: '200g' }, { name: '蒜苔', amount: '300g' },
        { name: '大蒜', amount: '2瓣' }, { name: '干辣椒', amount: '2个' },
        { name: '生抽', amount: '1勺' }, { name: '蚝油', amount: '半勺' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['腊肉冷水下锅煮15分钟，捞出切薄片。', '蒜苔掐去头尾切段。', '锅少油下腊肉片煸炒出油，下蒜片、干辣椒段炒香。', '下蒜苔大火快炒2分钟至断生，加生抽和蚝油炒匀出锅（腊肉咸，不用加盐）。']
    },
    {
      id: 'baocai-larou', name: '包菜炒腊肉', emoji: '🥬', category: '荤菜', difficulty: 1, minutes: 25, servings: 2,
      tags: ['快手', '下饭'],
      ingredients: [
        { name: '腊肉', amount: '200g' }, { name: '包菜', amount: '400g' },
        { name: '大蒜', amount: '3瓣' }, { name: '干辣椒', amount: '2个' },
        { name: '生抽', amount: '1勺' }, { name: '白糖', amount: '半勺' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['腊肉冷水下锅煮15分钟，捞出切薄片。', '包菜手撕大片，洗净沥干。', '锅少油下腊肉片煸炒出油，下蒜片、干辣椒段炒香。', '下包菜大火快炒至断生，加生抽和白糖炒匀出锅（腊肉咸，不用加盐）。']
    },
    {
      id: 'hongsanduo', name: '红三剁', emoji: '🍅', category: '荤菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '猪肉末', amount: '200g' }, { name: '西红柿', amount: '2个' },
        { name: '青椒', amount: '2个' }, { name: '大蒜', amount: '2瓣' },
        { name: '生姜', amount: '2片' }, { name: '小米辣', amount: '1个', optional: true },
        { name: '生抽', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['西红柿烫去皮切小丁，青椒切丁，姜蒜切末。', '热油下姜蒜末爆香，下肉末炒散至变色。', '下青椒丁炒至断生，下西红柿丁翻炒至出汁。', '加生抽和盐炒匀，略收汁出锅，舀在米饭上拌着吃。']
    },

    // ============ 水产 ============
    {
      id: 'qingzheng-luyu', name: '清蒸鲈鱼', emoji: '🐟', category: '水产', difficulty: 2, minutes: 25, servings: 2,
      tags: ['宴客', '清淡'],
      ingredients: [
        { name: '鲈鱼', amount: '1条' }, { name: '生姜', amount: '3片' },
        { name: '大葱', amount: '1段' }, { name: '蒸鱼豉油', amount: '2勺' },
        { name: '料酒', amount: '1勺' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['鲈鱼两面划刀，用料酒和姜片腌10分钟。', '盘底铺姜片葱段，放鱼，水开大火蒸8分钟。', '倒掉盘中汁水，铺葱丝，淋蒸鱼豉油。', '烧热油浇在葱丝上激香。']
    },
    {
      id: 'hongshao-yukuai', name: '红烧鱼块', emoji: '🐠', category: '水产', difficulty: 2, minutes: 30, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '草鱼', amount: '500g' }, { name: '生姜', amount: '3片' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '2勺' },
        { name: '老抽', amount: '半勺' }, { name: '料酒', amount: '2勺' },
        { name: '白糖', amount: '1勺' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['鱼块用料酒、姜片腌10分钟，厨房纸吸干。', '煎至两面金黄。', '下姜、蒜爆香，加料酒、生抽、老抽、糖。', '加半碗水焖8分钟，收汁撒葱花。']
    },
    {
      id: 'xiangjian-daoyu', name: '香煎带鱼', emoji: '🐟', category: '水产', difficulty: 1, minutes: 25, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '带鱼', amount: '500g' }, { name: '生姜', amount: '3片' },
        { name: '料酒', amount: '2勺' }, { name: '淀粉', amount: '2勺' },
        { name: '盐', amount: '适量' }, { name: '胡椒粉', amount: '适量' }
      ],
      steps: ['带鱼段加料酒、姜片、盐、胡椒粉腌15分钟。', '擦干水分，两面薄薄拍一层淀粉。', '平底锅热油，中火煎至两面金黄酥脆。']
    },
    {
      id: 'youmen-daxia', name: '油焖大虾', emoji: '🦐', category: '水产', difficulty: 2, minutes: 25, servings: 2,
      tags: ['宴客'],
      ingredients: [
        { name: '大虾', amount: '400g' }, { name: '生姜', amount: '2片' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '番茄酱', amount: '1勺' },
        { name: '白糖', amount: '1勺' }, { name: '料酒', amount: '1勺' }
      ],
      steps: ['大虾剪须开背去虾线。', '煎虾至变色出虾油。', '下姜蒜爆香，加料酒、生抽、蚝油、番茄酱、糖。', '加2勺水焖3分钟，大火收汁。']
    },
    {
      id: 'suanrong-fensixia', name: '蒜蓉粉丝虾', emoji: '🦐', category: '水产', difficulty: 2, minutes: 30, servings: 2,
      tags: ['宴客'],
      ingredients: [
        { name: '大虾', amount: '300g' }, { name: '粉丝', amount: '1把' },
        { name: '大蒜', amount: '1头' }, { name: '生抽', amount: '2勺' },
        { name: '蚝油', amount: '1勺' }, { name: '白糖', amount: '半勺' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['粉丝泡软铺盘底，虾开背去虾线摆盘。', '蒜末用油炒香，加生抽、蚝油、糖调成蒜蓉酱。', '蒜蓉酱铺在虾上，水开大火蒸6分钟。', '淋热油，撒葱花。']
    },
    {
      id: 'duojiao-yutou', name: '剁椒鱼头', emoji: '🌶️', category: '水产', difficulty: 2, minutes: 35, servings: 2,
      tags: ['宴客', '辣'],
      ingredients: [
        { name: '鱼头', amount: '1个' }, { name: '剁椒', amount: '3勺' },
        { name: '生姜', amount: '3片' }, { name: '大蒜', amount: '3瓣' },
        { name: '蒸鱼豉油', amount: '2勺' }, { name: '料酒', amount: '1勺' },
        { name: '小葱', amount: '1根' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['鱼头劈开洗净，用料酒、姜片腌10分钟。', '铺蒜末和剁椒，水开大火蒸12分钟。', '倒掉盘中汁水，淋蒸鱼豉油。', '撒葱花，浇热油激香。']
    },
    {
      id: 'suancai-yu', name: '酸菜鱼', emoji: '🐟', category: '水产', difficulty: 3, minutes: 45, servings: 3,
      tags: ['辣', '硬菜'],
      ingredients: [
        { name: '草鱼', amount: '500g' }, { name: '酸菜', amount: '300g' },
        { name: '干辣椒', amount: '5个' }, { name: '花椒', amount: '1勺' },
        { name: '生姜', amount: '3片' }, { name: '大蒜', amount: '3瓣' },
        { name: '淀粉', amount: '1勺' }, { name: '蛋清', amount: '1个' },
        { name: '料酒', amount: '2勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['鱼片加蛋清、淀粉、盐、料酒抓匀腌15分钟。', '炒香酸菜、姜片、蒜瓣。', '加水煮开，小火熬10分钟出味。', '下鱼片煮2分钟至变色。', '撒干辣椒、花椒，浇热油激香。']
    },
    {
      id: 'baizhuo-xia', name: '白灼虾', emoji: '🦐', category: '水产', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '高蛋白'],
      ingredients: [
        { name: '大虾', amount: '300g' }, { name: '生姜', amount: '3片' },
        { name: '小葱', amount: '1根' }, { name: '料酒', amount: '1勺' },
        { name: '生抽', amount: '2勺' }, { name: '芝麻油', amount: '半勺' },
        { name: '大蒜', amount: '2瓣' }
      ],
      steps: ['大虾剪须开背去虾线。', '水开下姜片、葱结、料酒，下大虾煮2分钟至变红捞出。', '蒜末、生抽、香油调成蘸汁。', '虾蘸汁食用。']
    },

    // ============ 素菜 ============
    {
      id: 'qinchao-shishu', name: '清炒时蔬', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '时令蔬菜', amount: '400g' }, { name: '大蒜', amount: '2瓣' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['蔬菜（生菜、油麦菜、菠菜、菜心等）洗净切段。', '热油爆香蒜片。', '大火快炒1~2分钟。', '加盐炒匀即可。']
    },
    {
      id: 'suanrong-xilanhua', name: '蒜蓉西兰花', emoji: '🥦', category: '素菜', difficulty: 1, minutes: 12, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '西兰花', amount: '400g' }, { name: '大蒜', amount: '4瓣' },
        { name: '盐', amount: '适量' }, { name: '蚝油', amount: '1勺' }
      ],
      steps: ['西兰花掰小朵，沸水加少许盐焯1分钟。', '热油爆香蒜末。', '下西兰花大火翻炒。', '加蚝油和盐炒匀。']
    },
    {
      id: 'shousi-baocai', name: '手撕包菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '包菜', amount: '400g' }, { name: '干辣椒', amount: '3个' },
        { name: '大蒜', amount: '2瓣' }, { name: '生抽', amount: '1勺' },
        { name: '醋', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['包菜手撕成大片，洗净沥干。', '爆香干辣椒和蒜片。', '下包菜大火快炒至断生。', '沿锅边淋醋，加生抽、盐炒匀。']
    },
    {
      id: 'culiu-tudousi', name: '醋溜土豆丝', emoji: '🥔', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '土豆', amount: '2个' }, { name: '干辣椒', amount: '2个' },
        { name: '大蒜', amount: '2瓣' }, { name: '醋', amount: '2勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['土豆切细丝，清水冲洗去淀粉后沥干。', '爆香干辣椒、蒜片。', '大火炒土豆丝约2分钟。', '沿锅边淋醋，加盐炒匀。']
    },
    {
      id: 'disanxian', name: '地三鲜', emoji: '🍆', category: '素菜', difficulty: 2, minutes: 30, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '茄子', amount: '1个' }, { name: '土豆', amount: '1个' },
        { name: '青椒', amount: '1个' }, { name: '大蒜', amount: '3瓣' },
        { name: '生抽', amount: '2勺' }, { name: '白糖', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['茄子、土豆切滚刀块，青椒切块。', '土豆煎/炸至金黄盛出，茄子煎软盛出。', '爆香蒜末，倒回所有食材。', '生抽、糖、淀粉加3勺水调汁，倒入翻炒收汁。']
    },
    {
      id: 'ganbian-sijidou', name: '干煸四季豆', emoji: '🫛', category: '素菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭'],
      ingredients: [
        { name: '四季豆', amount: '400g' }, { name: '猪肉末', amount: '100g', optional: true },
        { name: '干辣椒', amount: '5个' }, { name: '花椒', amount: '1小把' },
        { name: '大蒜', amount: '3瓣' }, { name: '生抽', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['四季豆去筋掰段，洗净沥干。', '锅中多油，煎至表皮起皱盛出。', '（可选）炒散肉末盛出。', '爆香干辣椒、花椒、蒜，倒回四季豆和肉末，加生抽、盐炒匀。']
    },
    {
      id: 'haoyou-shengcai', name: '蚝油生菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '生菜', amount: '400g' }, { name: '大蒜', amount: '3瓣' },
        { name: '蚝油', amount: '2勺' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '白糖', amount: '半勺' }
      ],
      steps: ['生菜沸水中焯10秒捞出摆盘。', '热油炒香蒜末。', '加蚝油、生抽、糖、淀粉和半碗水煮开。', '料汁淋在生菜上。']
    },
    {
      id: 'suanrong-youmaicai', name: '蒜蓉油麦菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '油麦菜', amount: '400g' }, { name: '大蒜', amount: '4瓣' },
        { name: '盐', amount: '适量' }, { name: '蚝油', amount: '1勺' }
      ],
      steps: ['油麦菜洗净切段。', '热油爆香蒜末。', '大火快炒至变软。', '加蚝油和盐炒匀。']
    },
    {
      id: 'baizhuo-caixin', name: '白灼菜心', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '菜心', amount: '400g' }, { name: '大蒜', amount: '2瓣' },
        { name: '蒸鱼豉油', amount: '2勺' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['菜心洗净，沸水加少许油和盐，焯1分钟捞出摆盘。', '淋蒸鱼豉油，铺蒜末。', '烧热油浇在蒜末上。']
    },
    {
      id: 'liangban-huanggua', name: '凉拌黄瓜', emoji: '🥒', category: '凉菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '凉菜'],
      ingredients: [
        { name: '黄瓜', amount: '2根' }, { name: '大蒜', amount: '3瓣' },
        { name: '生抽', amount: '1勺' }, { name: '醋', amount: '2勺' },
        { name: '白糖', amount: '1勺' }, { name: '芝麻油', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['黄瓜拍裂切段。', '加蒜末、生抽、醋、糖、盐、芝麻油。', '拌匀腌5分钟更入味。']
    },
    {
      id: 'liangban-muer', name: '凉拌木耳', emoji: '🍄', category: '凉菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '凉菜'],
      ingredients: [
        { name: '木耳', amount: '150g' }, { name: '大蒜', amount: '3瓣' },
        { name: '小米辣', amount: '2个' }, { name: '生抽', amount: '2勺' },
        { name: '醋', amount: '2勺' }, { name: '白糖', amount: '1勺' },
        { name: '芝麻油', amount: '1勺' }, { name: '香菜', amount: '1根' }
      ],
      steps: ['木耳泡发洗净，沸水焯2分钟捞出过凉。', '蒜末、小米辣、生抽、醋、糖、芝麻油调汁。', '与木耳拌匀，撒香菜。']
    },
    {
      id: 'liangban-haidaisi', name: '凉拌海带丝', emoji: '🌊', category: '凉菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '凉菜'],
      ingredients: [
        { name: '海带丝', amount: '300g' }, { name: '大蒜', amount: '3瓣' },
        { name: '小米辣', amount: '2个' }, { name: '生抽', amount: '2勺' },
        { name: '醋', amount: '2勺' }, { name: '白糖', amount: '1勺' }, { name: '芝麻油', amount: '1勺' }
      ],
      steps: ['海带丝洗净，沸水焯2分钟捞出过凉。', '蒜末、小米辣、生抽、醋、糖、芝麻油调汁。', '与海带丝拌匀即可。']
    },
    {
      id: 'shangtang-wawacai', name: '上汤娃娃菜', emoji: '🥬', category: '素菜', difficulty: 2, minutes: 20, servings: 2,
      tags: ['清淡'],
      ingredients: [
        { name: '娃娃菜', amount: '2棵' }, { name: '皮蛋', amount: '1个' },
        { name: '火腿', amount: '30g', optional: true }, { name: '大蒜', amount: '3瓣' },
        { name: '盐', amount: '适量' }
      ],
      steps: ['娃娃菜切瓣，沸水焯软摆盘。', '炒香蒜末，下皮蛋丁、火腿丁炒香。', '加一碗水煮开成高汤。', '汤汁淋在娃娃菜上。']
    },
    {
      id: 'suanla-baicai', name: '酸辣白菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '微辣'],
      ingredients: [
        { name: '大白菜', amount: '400g' }, { name: '干辣椒', amount: '4个' },
        { name: '大蒜', amount: '2瓣' }, { name: '醋', amount: '2勺' },
        { name: '生抽', amount: '1勺' }, { name: '白糖', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['白菜帮斜刀片薄，菜叶切段。', '爆香干辣椒、蒜片。', '大火快炒白菜。', '加醋、生抽、糖、盐炒匀。']
    },
    {
      id: 'xianggu-youcai', name: '香菇油菜', emoji: '🍄', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手'],
      ingredients: [
        { name: '油菜', amount: '300g' }, { name: '香菇', amount: '150g' },
        { name: '大蒜', amount: '2瓣' }, { name: '蚝油', amount: '1勺' },
        { name: '生抽', amount: '1勺' }, { name: '淀粉', amount: '1勺' }
      ],
      steps: ['油菜、香菇分别焯水。', '爆香蒜末，下香菇炒香。', '下油菜，加蚝油、生抽炒匀。', '淀粉加水勾薄芡。']
    },
    {
      id: 'su-dongguapian', name: '素冬瓜片', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '冬瓜', amount: '400g' }, { name: '大蒜', amount: '3瓣' },
        { name: '小葱', amount: '1根' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '1勺' }
      ],
      steps: ['冬瓜去皮去瓤，切约4毫米厚的片，蒜切片。', '热油爆香蒜片，下冬瓜片翻炒至微微变软。', '加生抽、蚝油和少许盐炒匀，加半碗水盖盖焖3分钟。', '大火收汁，撒葱花出锅。']
    },
    {
      id: 'shaojiao-qiezi', name: '烧椒茄子', emoji: '🍆', category: '凉菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '凉菜', '微辣', '下饭'],
      ingredients: [
        { name: '茄子', amount: '2个' }, { name: '青椒', amount: '3个' },
        { name: '大蒜', amount: '4瓣' }, { name: '小米辣', amount: '1个', optional: true },
        { name: '生抽', amount: '2勺' }, { name: '醋', amount: '1勺' },
        { name: '白糖', amount: '半勺' }, { name: '花椒粉', amount: '半勺' },
        { name: '芝麻油', amount: '半勺' }, { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' }
      ],
      steps: ['茄子切段，大火蒸10分钟至筷子能戳穿，晾凉后手撕成条装盘。', '青椒去蒂，干锅小火煸至表皮起虎皮、变软，取出和蒜末一起剁碎。', '烧椒碎加生抽、醋、白糖、花椒粉、芝麻油和盐调成料汁。', '料汁淋在茄子上，撒葱花拌匀即可。']
    },
    {
      id: 'hupi-qingjiao', name: '虎皮青椒', emoji: '🫑', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '青椒', amount: '6个' }, { name: '大蒜', amount: '3瓣' },
        { name: '生抽', amount: '2勺' }, { name: '醋', amount: '1勺' },
        { name: '白糖', amount: '半勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['青椒去蒂去籽，擦干水分，用刀背拍扁。', '生抽、醋、白糖、盐加少许清水调成碗汁。', '热锅下油，下青椒中小火慢煎，边煎边按压至两面起虎皮、变软。', '扒开青椒，下蒜末爆香。', '淋入碗汁，大火翻炒收汁，让青椒裹满料汁即可。']
    },
    {
      id: 'qiangchao-lianbai', name: '炝炒莲白', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '微辣'],
      ingredients: [
        { name: '包菜', amount: '400g' }, { name: '干辣椒', amount: '3个' },
        { name: '花椒', amount: '1小把' }, { name: '大蒜', amount: '2瓣' },
        { name: '生姜', amount: '2片' }, { name: '醋', amount: '1勺' },
        { name: '生抽', amount: '1勺' }, { name: '白糖', amount: '半勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['包菜手撕成大片，去粗梗，洗净沥干。', '热锅下油，小火下花椒、干辣椒段、姜片蒜片爆香。', '转大火下包菜快炒至断生。', '沿锅边淋醋，加生抽、白糖和盐炒匀出锅。']
    },
    {
      id: 'suanla-ouding', name: '酸辣藕丁', emoji: '🪷', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '莲藕', amount: '1节' }, { name: '干辣椒', amount: '3个' },
        { name: '大蒜', amount: '2瓣' }, { name: '生姜', amount: '2片' },
        { name: '小葱', amount: '1根' }, { name: '生抽', amount: '2勺' },
        { name: '醋', amount: '2勺' }, { name: '白糖', amount: '半勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['藕去皮切丁，清水浸泡5分钟去淀粉，沥干。', '生抽、醋、白糖加少许水调成碗汁。', '热油爆香姜蒜末、干辣椒段。', '下藕丁大火快炒2分钟。', '淋入碗汁翻炒1分钟，出锅前沿锅边再淋少许醋，撒葱花。']
    },
    {
      id: 'ganguo-huacai', name: '干锅花菜', emoji: '🥘', category: '素菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '菜花', amount: '400g' }, { name: '五花肉', amount: '100g', optional: true },
        { name: '干辣椒', amount: '4个' }, { name: '大蒜', amount: '3瓣' },
        { name: '蒜苗', amount: '1根' }, { name: '生抽', amount: '1勺' },
        { name: '蚝油', amount: '1勺' }, { name: '白糖', amount: '半勺' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['菜花掰小朵，淡盐水泡10分钟洗净沥干。', '五花肉切薄片，热锅下肉煸炒出油微焦，盛出备用。', '留底油下蒜片、干辣椒段小火爆香。', '下菜花大火干煸至表面微焦，倒回肉片，加生抽、蚝油、白糖和盐翻炒。', '下蒜苗段炒断生，大火收汁出锅。']
    },
    {
      id: 'hetang-xiaochao', name: '荷塘小炒', emoji: '🪷', category: '素菜', difficulty: 1, minutes: 20, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '莲藕', amount: '半节' }, { name: '荷兰豆', amount: '100g' },
        { name: '木耳', amount: '30g' }, { name: '胡萝卜', amount: '半根' },
        { name: '大蒜', amount: '2瓣' }, { name: '盐', amount: '适量' },
        { name: '白糖', amount: '半勺' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['藕去皮切薄片泡水，胡萝卜切片，荷兰豆去筋，木耳泡发撕小朵。', '水开依次下藕片、胡萝卜焯1分钟，荷兰豆焯半分钟，捞出沥干。', '热油爆香蒜片，下所有食材大火快炒。', '加盐、白糖炒匀出锅。']
    },
    {
      id: 'suanrong-bocai', name: '蒜蓉菠菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '菠菜', amount: '300g' }, { name: '大蒜', amount: '3瓣' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['菠菜洗净切段，开水加盐焯1分钟去草酸，捞出挤干。', '热油下蒜末小火炒香。', '下菠菜大火快炒30秒，加盐炒匀出锅。']
    },
    {
      id: 'suchao-sigua', name: '素炒丝瓜', emoji: '🥒', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '丝瓜', amount: '2根' }, { name: '大蒜', amount: '3瓣' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['丝瓜去皮切滚刀块，蒜切片。', '热油爆香蒜片，下丝瓜大火翻炒至变软出水。', '加盐炒匀，焖1分钟出锅。']
    },
    {
      id: 'jiangdou-qiezi', name: '豇豆茄子', emoji: '🍆', category: '素菜', difficulty: 2, minutes: 25, servings: 2,
      tags: ['下饭', '微辣'],
      ingredients: [
        { name: '豇豆', amount: '200g' }, { name: '茄子', amount: '2个' },
        { name: '大蒜', amount: '3瓣' }, { name: '小米辣', amount: '2个' },
        { name: '生抽', amount: '2勺' }, { name: '蚝油', amount: '1勺' },
        { name: '白糖', amount: '半勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['茄子切条，撒盐腌10分钟挤干水分。', '豇豆去筋切段，锅不放油小火煸至表面起皱变软盛出（豇豆必须煸熟）。', '下油煸茄子至变软，下蒜末、小米辣爆香。', '倒回豇豆，加生抽、蚝油、白糖和盐，大火翻炒均匀出锅。']
    },
    {
      id: 'chao-xiaobaicai', name: '炒小白菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '小白菜', amount: '300g' }, { name: '大蒜', amount: '3瓣' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['小白菜洗净切段，蒜切片。', '热油爆香蒜片，下小白菜大火快炒至变软。', '加盐炒匀出锅。']
    },
    {
      id: 'tangcu-lianbai', name: '糖醋莲白', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '下饭', '微辣'],
      ingredients: [
        { name: '包菜', amount: '400g' }, { name: '干辣椒', amount: '2个' },
        { name: '大蒜', amount: '3瓣' }, { name: '白糖', amount: '1勺' },
        { name: '醋', amount: '2勺' }, { name: '生抽', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['包菜手撕大片，洗净沥干。', '白糖、醋、生抽、淀粉加少许水调成糖醋汁。', '热油爆香蒜片、干辣椒段，下包菜大火快炒至断生。', '淋入糖醋汁，翻炒至汤汁裹匀出锅。']
    },
    {
      id: 'chao-nanguasi', name: '炒南瓜丝', emoji: '🎃', category: '素菜', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '南瓜', amount: '400g' }, { name: '大蒜', amount: '3瓣' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' },
        { name: '食用油', amount: '2勺' }
      ],
      steps: ['南瓜去皮去瓤切细丝，蒜切片。', '热油爆香蒜片，下南瓜丝大火快炒至变软。', '加盐炒匀，撒葱花出锅。']
    },
    {
      id: 'suchao-kongxincai', name: '素炒空心菜', emoji: '🥬', category: '素菜', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '清淡'],
      ingredients: [
        { name: '空心菜', amount: '300g' }, { name: '大蒜', amount: '4瓣' },
        { name: '盐', amount: '适量' }, { name: '食用油', amount: '2勺' }
      ],
      steps: ['空心菜掐段洗净沥干，蒜切末。', '热油下蒜末爆香，下空心菜大火快炒（不盖锅盖保持翠绿）。', '加盐炒匀，菜叶变软立即出锅。']
    },

    // ============ 汤羹 ============
    {
      id: 'fqie-danhuatang', name: '番茄蛋花汤', emoji: '🍲', category: '汤羹', difficulty: 1, minutes: 10, servings: 2,
      tags: ['快手', '汤'],
      ingredients: [
        { name: '西红柿', amount: '2个' }, { name: '鸡蛋', amount: '2个' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' }, { name: '芝麻油', amount: '半勺' }
      ],
      steps: ['西红柿切块，炒出汁水。', '加两碗水煮开。', '淋入蛋液成蛋花。', '加盐、香油，撒葱花。']
    },
    {
      id: 'zicai-danhuatang', name: '紫菜蛋花汤', emoji: '🌊', category: '汤羹', difficulty: 1, minutes: 8, servings: 2,
      tags: ['快手', '汤'],
      ingredients: [
        { name: '紫菜', amount: '5g' }, { name: '鸡蛋', amount: '2个' },
        { name: '虾皮', amount: '1小把', optional: true }, { name: '小葱', amount: '1根' },
        { name: '盐', amount: '适量' }, { name: '芝麻油', amount: '半勺' }
      ],
      steps: ['锅中水烧开，放入紫菜和虾皮。', '淋入蛋液搅成蛋花。', '加盐、香油，撒葱花。']
    },
    {
      id: 'donggua-wanzitang', name: '冬瓜丸子汤', emoji: '🍲', category: '汤羹', difficulty: 2, minutes: 25, servings: 2,
      tags: ['汤', '清淡'],
      ingredients: [
        { name: '冬瓜', amount: '300g' }, { name: '猪肉末', amount: '200g' },
        { name: '生姜', amount: '2片' }, { name: '淀粉', amount: '1勺' },
        { name: '料酒', amount: '1勺' }, { name: '生抽', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['肉末加料酒、生抽、淀粉搅打上劲。', '冬瓜切块，水开下锅煮5分钟。', '肉末挤成丸子下锅，煮至浮起再煮5分钟。', '加盐，撒葱花。']
    },
    {
      id: 'yumi-paigutang', name: '玉米排骨汤', emoji: '🌽', category: '汤羹', difficulty: 2, minutes: 60, servings: 3,
      tags: ['汤', '硬菜'],
      ingredients: [
        { name: '排骨', amount: '400g' }, { name: '玉米', amount: '2根' },
        { name: '胡萝卜', amount: '1根' }, { name: '生姜', amount: '3片' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['排骨焯水洗净。', '加姜片、料酒和足量水，大火烧开转小火炖40分钟。', '下玉米段、胡萝卜块再炖15分钟。', '加盐调味。']
    },
    {
      id: 'suanla-tang', name: '酸辣汤', emoji: '🥣', category: '汤羹', difficulty: 2, minutes: 20, servings: 2,
      tags: ['汤', '微辣'],
      ingredients: [
        { name: '嫩豆腐', amount: '200g' }, { name: '木耳', amount: '50g' },
        { name: '鸡蛋', amount: '1个' }, { name: '火腿', amount: '50g', optional: true },
        { name: '生抽', amount: '1勺' }, { name: '醋', amount: '2勺' },
        { name: '白胡椒粉', amount: '半勺' }, { name: '淀粉', amount: '1勺' }
      ],
      steps: ['豆腐、木耳、火腿切细丝。', '锅中水开下配料，加生抽煮2分钟。', '淋蛋液，淀粉勾芡。', '关火加醋和白胡椒粉。']
    },
    {
      id: 'bocai-doufutang', name: '菠菜豆腐汤', emoji: '🥬', category: '汤羹', difficulty: 1, minutes: 15, servings: 2,
      tags: ['汤', '清淡'],
      ingredients: [
        { name: '菠菜', amount: '200g' }, { name: '嫩豆腐', amount: '300g' },
        { name: '大蒜', amount: '2瓣' }, { name: '盐', amount: '适量' }, { name: '芝麻油', amount: '半勺' }
      ],
      steps: ['菠菜焯水去草酸，豆腐切块。', '水开下豆腐煮3分钟。', '下菠菜再煮1分钟。', '加盐、香油。']
    },
    {
      id: 'jungu-jitang', name: '菌菇鸡汤', emoji: '🍄', category: '汤羹', difficulty: 2, minutes: 50, servings: 3,
      tags: ['汤'],
      ingredients: [
        { name: '鸡', amount: '半只' }, { name: '香菇', amount: '100g' },
        { name: '金针菇', amount: '100g' }, { name: '生姜', amount: '3片' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['鸡块焯水洗净。', '加姜片、料酒和足量水，大火烧开转小火炖30分钟。', '下香菇、金针菇再炖10分钟。', '加盐，撒葱花。']
    },
    {
      id: 'suanluobo-laoyatang', name: '酸萝卜老鸭汤', emoji: '🦆', category: '汤羹', difficulty: 2, minutes: 40, servings: 3,
      tags: ['汤', '微辣'],
      ingredients: [
        { name: '老鸭', amount: '半只' }, { name: '酸萝卜', amount: '200g' },
        { name: '生姜', amount: '3片' }, { name: '大葱', amount: '1根' },
        { name: '料酒', amount: '2勺' }, { name: '花椒', amount: '1小把' },
        { name: '白胡椒粉', amount: '半勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['鸭肉切块，冷水下锅加姜片、料酒焯水，撇去浮沫，捞出洗净。', '鸭块、姜片、葱结、花椒放入高压锅，加热水没过，上汽后压20分钟。', '开盖下酸萝卜，再煮10分钟。', '酸萝卜自带咸味，酌情加盐，撒白胡椒粉即可。']
    },
    {
      id: 'luobo-paigutang', name: '萝卜排骨汤', emoji: '🥕', category: '汤羹', difficulty: 2, minutes: 60, servings: 3,
      tags: ['汤'],
      ingredients: [
        { name: '排骨', amount: '400g' }, { name: '白萝卜', amount: '1根' },
        { name: '生姜', amount: '3片' }, { name: '料酒', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['排骨焯水洗净。白萝卜去皮切滚刀块。', '加姜片、料酒和足量水，大火烧开转小火炖40分钟。', '下萝卜块再炖15分钟。', '加盐，撒葱花。']
    },
    {
      id: 'donggua-paigutang', name: '冬瓜排骨汤', emoji: '🍲', category: '汤羹', difficulty: 2, minutes: 60, servings: 3,
      tags: ['汤'],
      ingredients: [
        { name: '排骨', amount: '400g' }, { name: '冬瓜', amount: '400g' },
        { name: '生姜', amount: '3片' }, { name: '料酒', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['排骨焯水洗净。冬瓜去皮去瓤切块。', '加姜片、料酒和足量水，大火烧开转小火炖40分钟。', '下冬瓜再炖15分钟至透明。', '加盐，撒葱花。']
    },
    {
      id: 'lianou-paigutang', name: '莲藕排骨汤', emoji: '🥣', category: '汤羹', difficulty: 2, minutes: 70, servings: 3,
      tags: ['汤'],
      ingredients: [
        { name: '排骨', amount: '400g' }, { name: '莲藕', amount: '2节' },
        { name: '生姜', amount: '3片' }, { name: '料酒', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['排骨焯水洗净。莲藕去皮切滚刀块，泡水防黑。', '排骨、莲藕、姜片、料酒加足量水，大火烧开转小火炖60分钟。', '加盐，撒葱花。']
    },
    {
      id: 'fanqie-dunniunan', name: '番茄炖牛腩', emoji: '🍅', category: '汤羹', difficulty: 2, minutes: 90, servings: 3,
      tags: ['汤', '硬菜'],
      ingredients: [
        { name: '牛腩', amount: '500g' }, { name: '西红柿', amount: '3个' },
        { name: '生姜', amount: '3片' }, { name: '大葱', amount: '半根' },
        { name: '料酒', amount: '2勺' }, { name: '生抽', amount: '1勺' },
        { name: '老抽', amount: '半勺' }, { name: '冰糖', amount: '10g' },
        { name: '盐', amount: '适量' }
      ],
      steps: ['牛腩切块冷水下锅，加姜片、料酒焯水，撇沫捞出洗净。', '西红柿烫去皮切块。', '热油下葱姜爆香，下牛腩翻炒，下2个番茄块压烂炒出汁。', '加生抽、老抽、冰糖和足量热水，大火烧开转小火炖60分钟。', '下剩余番茄块再炖15分钟，加盐，大火收浓汤汁。']
    },
    {
      id: 'shanyao-dunjitang', name: '山药炖鸡汤', emoji: '🍗', category: '汤羹', difficulty: 2, minutes: 80, servings: 3,
      tags: ['汤'],
      ingredients: [
        { name: '鸡', amount: '半只' }, { name: '山药', amount: '1根' },
        { name: '生姜', amount: '3片' }, { name: '料酒', amount: '1勺' },
        { name: '盐', amount: '适量' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['鸡块焯水洗净。山药去皮切段泡水防黑。', '加姜片、料酒和足量水，大火烧开转小火炖60分钟。', '下山药段再炖15分钟。', '加盐，撒葱花。']
    },
    {
      id: 'baicai-doufutang', name: '白菜豆腐汤', emoji: '🥬', category: '汤羹', difficulty: 1, minutes: 15, servings: 2,
      tags: ['汤', '清淡'],
      ingredients: [
        { name: '白菜', amount: '300g' }, { name: '嫩豆腐', amount: '300g' },
        { name: '生姜', amount: '2片' }, { name: '盐', amount: '适量' },
        { name: '芝麻油', amount: '半勺' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['白菜切段，豆腐切块。', '锅中少油下姜片、白菜帮炒软，加两碗水煮开。', '下豆腐块煮5分钟。', '加盐、香油，撒葱花。']
    },
    {
      id: 'sigua-dantang', name: '丝瓜蛋汤', emoji: '🥒', category: '汤羹', difficulty: 1, minutes: 10, servings: 2,
      tags: ['汤', '快手', '清淡'],
      ingredients: [
        { name: '丝瓜', amount: '1根' }, { name: '鸡蛋', amount: '2个' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' },
        { name: '芝麻油', amount: '半勺' }
      ],
      steps: ['丝瓜去皮切滚刀块。', '热油下丝瓜翻炒至出水变软，加两碗水煮开。', '淋入蛋液，凝固后搅散成蛋花。', '加盐、香油，撒葱花。']
    },
    {
      id: 'yumi-shanyao-paigutang', name: '玉米山药排骨汤', emoji: '🌽', category: '汤羹', difficulty: 2, minutes: 65, servings: 3,
      tags: ['汤'],
      ingredients: [
        { name: '排骨', amount: '400g' }, { name: '玉米', amount: '1根' },
        { name: '山药', amount: '1根' }, { name: '生姜', amount: '3片' },
        { name: '料酒', amount: '1勺' }, { name: '盐', amount: '适量' },
        { name: '小葱', amount: '1根' }
      ],
      steps: ['排骨焯水洗净。玉米切段，山药去皮切段泡水防黑。', '加姜片、料酒和足量水，大火烧开转小火炖40分钟。', '下玉米段再炖10分钟，下山药块再炖10分钟。', '加盐，撒葱花。']
    },
    {
      id: 'huanggua-dantang', name: '黄瓜蛋汤', emoji: '🥒', category: '汤羹', difficulty: 1, minutes: 10, servings: 2,
      tags: ['汤', '快手', '清淡'],
      ingredients: [
        { name: '黄瓜', amount: '1根' }, { name: '鸡蛋', amount: '2个' },
        { name: '小葱', amount: '1根' }, { name: '盐', amount: '适量' },
        { name: '芝麻油', amount: '半勺' }
      ],
      steps: ['黄瓜切片，鸡蛋打散。', '热油下黄瓜片略炒，加两碗水煮开。', '转小火淋入蛋液，凝固后搅散成蛋花。', '加盐、香油，撒葱花。']
    },

    // ============ 主食 ============
    {
      id: 'danchaofan', name: '蛋炒饭', emoji: '🍚', category: '主食', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '主食'],
      ingredients: [
        { name: '米饭', amount: '2碗' }, { name: '鸡蛋', amount: '2个' },
        { name: '火腿', amount: '50g', optional: true }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['鸡蛋炒散盛出。', '下米饭中火炒散（隔夜饭更佳）。', '倒回鸡蛋，加生抽、盐炒匀。', '撒葱花出锅。']
    },
    {
      id: 'fanqie-jidanmian', name: '番茄鸡蛋面', emoji: '🍜', category: '主食', difficulty: 1, minutes: 15, servings: 2,
      tags: ['快手', '主食'],
      ingredients: [
        { name: '面条', amount: '200g' }, { name: '西红柿', amount: '2个' },
        { name: '鸡蛋', amount: '2个' }, { name: '小葱', amount: '1根' },
        { name: '生抽', amount: '1勺' }, { name: '盐', amount: '适量' }
      ],
      steps: ['西红柿切块炒出汁，加两碗水煮开。', '淋蛋液，加生抽、盐调味成汤。', '另锅煮面至熟，捞出。', '汤浇在面上，撒葱花。']
    },
    {
      id: 'congyou-banmian', name: '葱油拌面', emoji: '🍜', category: '主食', difficulty: 1, minutes: 12, servings: 2,
      tags: ['快手', '主食'],
      ingredients: [
        { name: '面条', amount: '200g' }, { name: '小葱', amount: '6根' },
        { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '1勺' },
        { name: '白糖', amount: '1勺' }, { name: '食用油', amount: '3勺' }
      ],
      steps: ['小葱切段，冷油下锅小火熬至焦黄。', '加生抽、老抽、糖煮开关火。', '面条煮熟捞出。', '淋葱油拌匀。']
    },
    {
      id: 'zhajiang-mian', name: '炸酱面', emoji: '🍜', category: '主食', difficulty: 2, minutes: 30, servings: 2,
      tags: ['主食'],
      ingredients: [
        { name: '面条', amount: '200g' }, { name: '猪肉末', amount: '200g' },
        { name: '甜面酱', amount: '2勺' }, { name: '黄豆酱', amount: '1勺' },
        { name: '大葱', amount: '1段' }, { name: '黄瓜', amount: '1根' }, { name: '生姜', amount: '2片' }
      ],
      steps: ['热油炒散肉末，下葱姜末炒香。', '加甜面酱、黄豆酱炒香。', '加半碗水小火熬5分钟成酱。', '面条煮熟，码黄瓜丝，浇炸酱。']
    },
    {
      id: 'jiangyou-chaofan', name: '酱油炒饭', emoji: '🍚', category: '主食', difficulty: 1, minutes: 12, servings: 2,
      tags: ['快手', '主食'],
      ingredients: [
        { name: '米饭', amount: '2碗' }, { name: '鸡蛋', amount: '2个' },
        { name: '生抽', amount: '2勺' }, { name: '老抽', amount: '半勺' },
        { name: '白糖', amount: '半勺' }, { name: '小葱', amount: '1根' }
      ],
      steps: ['生抽、老抽、糖调成酱汁。', '鸡蛋炒散盛出。', '下米饭炒散，淋酱汁炒匀上色。', '倒回鸡蛋，撒葱花。']
    },
    {
      id: 'gali-jiroufan', name: '咖喱鸡肉盖浇饭', emoji: '🍛', category: '主食', difficulty: 1, minutes: 35, servings: 2,
      tags: ['快手', '主食'],
      ingredients: [
        { name: '鸡腿肉', amount: '300g' }, { name: '米饭', amount: '2碗' },
        { name: '土豆', amount: '1个' },
        { name: '胡萝卜', amount: '1根' }, { name: '洋葱', amount: '半个' },
        { name: '咖喱块', amount: '3块' }, { name: '牛奶', amount: '100ml', optional: true },
        { name: '大蒜', amount: '2瓣' }, { name: '生姜', amount: '2片' },
        { name: '生抽', amount: '1勺' }, { name: '料酒', amount: '1勺' },
        { name: '淀粉', amount: '1勺' }, { name: '食用油', amount: '1勺' }
      ],
      steps: ['鸡腿肉切小块，加生抽、料酒和淀粉抓匀腌10分钟。', '土豆、胡萝卜切滚刀块，洋葱切块，咖喱块掰小块。', '热油下姜蒜爆香，下洋葱炒香，下土豆、胡萝卜翻炒，下鸡肉炒至变色。', '加水没过食材煮开，下咖喱块搅化，转小火煮15分钟。', '加牛奶搅匀，煮至土豆软烂，大火稍收汁，浇在热米饭上（咖喱块味道足，不用加盐）。']
    }
  ];
});
