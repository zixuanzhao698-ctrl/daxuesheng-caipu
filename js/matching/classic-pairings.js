// ╔══════════════════════════════════════╗
// ║  Classic Ingredient Pairings        ║
// ║  "经典搭配" — gets a score boost    ║
// ╚══════════════════════════════════════╝

/**
 * CLASSIC_PAIRS
 * Each entry defines a classic ingredient combination that,
 * when all `required` ingredients are present in the user's input,
 * gives the target recipe a significant score boost.
 *
 * `required` — ingredient names (normalized) that must ALL be present
 * `recipeId` — the recipe this pairing maps to
 * `boost`   — extra score added on top of the base score (0-1 scale)
 * `description` — human-readable label
 */
const CLASSIC_PAIRS = [
  // ── 经典中餐搭配 ──
  {
    required: ['西红柿', '鸡蛋'],
    recipeId: 'xi-hong-shi-chao-ji-dan',
    boost: 0.35,
    description: '经典搭配: 西红柿炒鸡蛋',
  },
  {
    required: ['鸡蛋', '米饭'],
    recipeId: 'dan-chao-fan',
    boost: 0.30,
    description: '经典搭配: 蛋炒饭',
  },
  {
    required: ['猪肉', '青椒'],
    recipeId: 'qing-jiao-rou-si',
    boost: 0.30,
    description: '经典搭配: 青椒肉丝',
  },
  {
    required: ['鸡肉', '花生'],
    recipeId: 'gong-bao-ji-ding',
    boost: 0.32,
    description: '经典搭配: 宫保鸡丁',
  },
  {
    required: ['鸡肉', '干辣椒'],
    recipeId: 'gong-bao-ji-ding',
    boost: 0.28,
    description: '经典搭配: 宫保鸡丁（辣版）',
  },
  {
    required: ['豆腐', '猪肉'],
    recipeId: 'ma-po-dou-fu',
    boost: 0.30,
    description: '经典搭配: 麻婆豆腐',
  },
  {
    required: ['鸡翅', '可乐'],
    recipeId: 'ke-le-ji-chi',
    boost: 0.35,
    description: '经典搭配: 可乐鸡翅',
  },
  {
    required: ['土豆', '青椒', '茄子'],
    recipeId: 'di-san-xian',
    boost: 0.38,
    description: '经典搭配: 地三鲜（三件套）',
  },
  {
    required: ['猪肉', '蒜苗'],
    recipeId: 'hui-guo-rou',
    boost: 0.30,
    description: '经典搭配: 回锅肉',
  },
  {
    required: ['排骨', '糖', '醋'],
    recipeId: 'tang-cu-pai-gu',
    boost: 0.35,
    description: '经典搭配: 糖醋排骨',
  },
  {
    required: ['牛肉', '孜然'],
    recipeId: 'zi-ran-niu-rou',
    boost: 0.32,
    description: '经典搭配: 孜然牛肉',
  },
  {
    required: ['茄子', '蒜'],
    recipeId: 'hong-shao-qie-zi',
    boost: 0.28,
    description: '经典搭配: 红烧茄子',
  },
  {
    required: ['鸡蛋', '面粉', '葱'],
    recipeId: 'ji-dan-bing',
    boost: 0.32,
    description: '经典搭配: 鸡蛋饼',
  },
  {
    required: ['面', '西红柿', '鸡蛋'],
    recipeId: 'fan-qie-ji-dan-mian',
    boost: 0.35,
    description: '经典搭配: 番茄鸡蛋面（三件套）',
  },
  {
    required: ['猪肉', '木耳', '胡萝卜'],
    recipeId: 'yu-xiang-rou-si',
    boost: 0.35,
    description: '经典搭配: 鱼香肉丝（三件套）',
  },
  {
    required: ['鸡蛋', '豆腐'],
    recipeId: 'ji-dan-dou-fu',
    boost: 0.28,
    description: '经典搭配: 鸡蛋豆腐',
  },
  {
    required: ['方便面', '鸡蛋'],
    recipeId: 'dan-chao-fang-bian-mian',
    boost: 0.30,
    description: '经典搭配: 蛋炒方便面',
  },
  {
    required: ['鸡蛋', '韭菜'],
    recipeId: 'jiu-cai-chao-ji-dan',
    boost: 0.30,
    description: '经典搭配: 韭菜炒鸡蛋',
  },
  {
    required: ['土豆', '牛肉'],
    recipeId: 'tu-dou-shao-niu-rou',
    boost: 0.30,
    description: '经典搭配: 土豆烧牛肉',
  },
  {
    required: ['猪肉', '白菜'],
    recipeId: 'zhu-rou-dun-fen-tiao',
    boost: 0.25,
    description: '经典搭配: 猪肉炖粉条',
  },
  {
    required: ['猪肉', '粉条'],
    recipeId: 'zhu-rou-dun-fen-tiao',
    boost: 0.28,
    description: '经典搭配: 猪肉炖粉条',
  },
  {
    required: ['西红柿', '鸡蛋', '面'],
    recipeId: 'fan-qie-ji-dan-mian',
    boost: 0.35,
    description: '经典搭配: 番茄鸡蛋面',
  },
  {
    required: ['猪肉', '豆瓣酱'],
    recipeId: 'hui-guo-rou',
    boost: 0.25,
    description: '经典搭配: 回锅肉（豆瓣酱版）',
  },
  {
    required: ['鸡蛋', '西红柿', '米饭'],
    recipeId: 'xi-hong-shi-chao-ji-dan',
    boost: 0.28,
    description: '经典搭配: 西红柿炒鸡蛋配饭',
  },

  // ── 西餐 / 简餐经典搭配 ──
  {
    required: ['面包', '芝士'],
    recipeId: 'zhi-shi-san-ming-zhi',
    boost: 0.35,
    description: '经典搭配: 芝士三明治',
  },
  {
    required: ['意面', '西红柿'],
    recipeId: 'fan-qie-yi-mian',
    boost: 0.32,
    description: '经典搭配: 番茄意面',
  },
  {
    required: ['牛排', '黑胡椒'],
    recipeId: 'jian-niu-pai',
    boost: 0.32,
    description: '经典搭配: 煎牛排',
  },
  {
    required: ['培根', '意面'],
    recipeId: 'nai-you-pei-gen-yi-mian',
    boost: 0.30,
    description: '经典搭配: 奶油培根意面',
  },
  {
    required: ['鸡胸肉', '生菜'],
    recipeId: 'kai-sa-sha-la',
    boost: 0.25,
    description: '经典搭配: 凯撒沙拉',
  },
  {
    required: ['鸡肉', '咖喱块'],
    recipeId: 'ri-shi-ka-li-fan',
    boost: 0.30,
    description: '经典搭配: 日式咖喱饭',
  },
  {
    required: ['泡菜', '米饭'],
    recipeId: 'han-shi-pao-cai-chao-fan',
    boost: 0.32,
    description: '经典搭配: 韩式泡菜炒饭',
  },
  {
    required: ['鸡蛋', '米饭', '鸡肉'],
    recipeId: 'dan-chao-fan-juan',
    boost: 0.28,
    description: '经典搭配: 蛋包饭',
  },
  {
    required: ['牛油果', '面包'],
    recipeId: 'niu-you-guo-tu-si',
    boost: 0.32,
    description: '经典搭配: 牛油果吐司',
  },
  {
    required: ['虾仁', '蒜'],
    recipeId: 'suan-xiang-xia-ren',
    boost: 0.30,
    description: '经典搭配: 蒜香虾仁',
  },
  {
    required: ['鸡翅', '生抽'],
    recipeId: 'kao-ji-chi',
    boost: 0.25,
    description: '经典搭配: 烤鸡翅',
  },
  {
    required: ['土豆', '黄油'],
    recipeId: 'tu-dou-ni',
    boost: 0.28,
    description: '经典搭配: 土豆泥',
  },
  {
    required: ['白蘑菇', '牛奶'],
    recipeId: 'nai-you-mo-gu-tang',
    boost: 0.28,
    description: '经典搭配: 奶油蘑菇汤',
  },
  {
    required: ['牛肉', '西红柿', '土豆'],
    recipeId: 'luo-song-tang',
    boost: 0.32,
    description: '经典搭配: 罗宋汤（三件套）',
  },
  {
    required: ['排骨', '冬瓜'],
    recipeId: 'dong-gua-pai-gu-tang',
    boost: 0.30,
    description: '经典搭配: 冬瓜排骨汤',
  },
  {
    required: ['黄瓜', '蒜'],
    recipeId: 'liang-ban-huang-gua',
    boost: 0.28,
    description: '经典搭配: 凉拌黄瓜',
  },
  {
    required: ['鸡蛋', '牛奶', '糖'],
    recipeId: 'ji-dan-bu-ding',
    boost: 0.30,
    description: '经典搭配: 鸡蛋布丁',
  },
  {
    required: ['银耳', '红枣'],
    recipeId: 'yin-er-hong-zao-tang',
    boost: 0.32,
    description: '经典搭配: 银耳红枣汤',
  },
  {
    required: ['绿豆', '冰糖'],
    recipeId: 'lv-dou-tang',
    boost: 0.30,
    description: '经典搭配: 绿豆汤',
  },
  {
    required: ['面包', '番茄酱', '芝士'],
    recipeId: 'tu-si-pi-sa',
    boost: 0.32,
    description: '经典搭配: 吐司披萨（三件套）',
  },
  {
    required: ['酸奶', '香蕉'],
    recipeId: 'suan-nai-shui-guo-lao',
    boost: 0.25,
    description: '经典搭配: 酸奶水果捞',
  },
  {
    required: ['面粉', '鸡蛋', '牛奶'],
    recipeId: 'wei-bo-lu-dan-gao',
    boost: 0.30,
    description: '经典搭配: 微波炉蛋糕',
  },
  {
    required: ['米饭', '芝士'],
    recipeId: 'nai-xiang-ju-fan',
    boost: 0.25,
    description: '经典搭配: 奶香焗饭',
  },
];

/**
 * REVERSE_PAIRS
 * For each recipe, a list of indexes into CLASSIC_PAIRS that include it.
 * Pre-computed to avoid O(N*R) scanning at query time.
 */
const REVERSE_PAIRS = (function () {
  const map = {};

  CLASSIC_PAIRS.forEach((pair, idx) => {
    const rid = pair.recipeId;
    if (!map[rid]) map[rid] = [];
    map[rid].push(idx);
  });

  return map;
})();

// Freeze to prevent accidental mutations
Object.freeze(CLASSIC_PAIRS);
Object.freeze(REVERSE_PAIRS);
