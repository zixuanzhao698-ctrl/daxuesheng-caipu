// ╔══════════════════════════════════════╗
// ║  App Configuration                 ║
// ╚══════════════════════════════════════╝

const CONFIG = {
  appName: '大学生菜谱指南',
  appShortName: '菜谱指南',
  version: '1.0.0',

  // Default nutrition goals (per day)
  defaults: {
    dailyCalories: 2000,
    dailyProtein: 60,    // g
    dailyCarbs: 250,     // g
    dailyFat: 65,        // g
    dailyFiber: 25,      // g
  },

  // Meal types
  mealTypes: [
    { id: 'breakfast', name: '早餐', emoji: '🌅', icon: '☀️' },
    { id: 'lunch', name: '午餐', emoji: '🌞', icon: '🍱' },
    { id: 'dinner', name: '晚餐', emoji: '🌙', icon: '🍲' },
    { id: 'snack', name: '加餐', emoji: '🍪', icon: '☕' },
  ],

  // Cuisine categories
  cuisines: {
    zhongcan: { id: 'zhongcan', name: '中餐', emoji: '🥘', icon: '🍚' },
    xican: { id: 'xican', name: '西餐', emoji: '🍝', icon: '🍞' },
  },

  // Difficulty levels
  difficulties: [
    { value: 1, name: '简单', badge: 'easy', emoji: '⭐' },
    { value: 2, name: '中等', badge: 'medium', emoji: '⭐⭐' },
    { value: 3, name: '困难', badge: 'hard', emoji: '⭐⭐⭐' },
  ],

  // Time filters
  timeFilters: [
    { value: 15, name: '<15分钟', emoji: '⚡' },
    { value: 30, name: '<30分钟', emoji: '⏱️' },
    { value: 60, name: '<60分钟', emoji: '🕐' },
    { value: Infinity, name: '不限', emoji: '♾️' },
  ],

  // Scene tags
  scenes: [
    { id: 'quick', name: '下班快手菜', emoji: '🏃' },
    { id: 'weekend', name: '周末仪式感', emoji: '✨' },
    { id: 'party', name: '朋友聚会', emoji: '🎉' },
    { id: 'solo', name: '一人食', emoji: '🍽️' },
  ],

  // Cuisine tags for filtering
  cuisineTags: {
    zhongcan: ['川菜', '粤菜', '鲁菜', '苏菜', '浙菜', '闽菜', '湘菜', '徽菜', '家常'],
    xican: ['意式', '法式', '美式', '日式', '韩式', '简餐'],
  },

  // Common equipment options
  equipment: [
    '炒锅', '平底锅', '汤锅', '电饭煲', '烤箱',
    '空气炸锅', '微波炉', '蒸锅', '砂锅', '菜刀砧板'
  ],

  // Achievement definitions
  achievements: [
    { id: 'first_cook', name: '厨房新手', desc: '完成第一道菜', emoji: '🍳', icon: 'chef_hat' },
    { id: 'cook_10', name: '下厨达人', desc: '累计做菜10次', emoji: '🔥', icon: 'fire' },
    { id: 'cook_50', name: '厨房老手', desc: '累计做菜50次', emoji: '👨‍🍳', icon: 'master_chef' },
    { id: 'cook_100', name: '厨神降临', desc: '累计做菜100次', emoji: '👑', icon: 'crown' },
    { id: 'unlock_10', name: '探索者', desc: '解锁10道不同菜谱', emoji: '🗺️', icon: 'map' },
    { id: 'unlock_30', name: '菜谱收集家', desc: '解锁30道不同菜谱', emoji: '📚', icon: 'book' },
    { id: 'week_streak', name: '一周五练', desc: '连续5天做饭', emoji: '💪', icon: 'streak' },
    { id: 'balanced', name: '营养均衡', desc: '连续7天蛋白质达标', emoji: '⚖️', icon: 'balance' },
    { id: 'save_500', name: '省钱小能手', desc: '对比外卖累计节省¥500', emoji: '💰', icon: 'money' },
    { id: 'save_2000', name: '省钱之王', desc: '对比外卖累计节省¥2000', emoji: '💎', icon: 'diamond' },
  ],

  // Average takeout cost per meal (for savings calculation)
  avgTakeoutCost: 25,

  // LocalStorage keys
  storageKeys: {
    mealRecords: 'cook_meal_records',
    favorites: 'cook_favorites',
    shoppingList: 'cook_shopping_list',
    settings: 'cook_settings',
    matchHistory: 'cook_match_history',
    notes: 'cook_notes',
    achievements: 'cook_achievements',
    cookLog: 'cook_log',
    likes: 'cook_likes',
  },

  // Pagination
  pageSize: 20,
};

// Freeze to prevent accidental mutations
Object.freeze(CONFIG);
Object.freeze(CONFIG.defaults);
Object.freeze(CONFIG.storageKeys);
