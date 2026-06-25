// ╔══════════════════════════════════════╗
// ║  Centralized State + LocalStorage  ║
// ╚══════════════════════════════════════╝

const Store = {
  _state: {},
  _listeners: {},
  _ready: false,

  /**
   * Initialize store by loading persisted data
   */
  init() {
    this._state = {
      // Meal records: { id, recipeId, date, mealType, portions, notes, createdAt }
      mealRecords: Storage.get(CONFIG.storageKeys.mealRecords, []),

      // Favorites: array of recipe IDs
      favorites: Storage.get(CONFIG.storageKeys.favorites, []),

      // Shopping list: [{ ingredientName, amount, unit, purchased, neededFor }]
      shoppingList: Storage.get(CONFIG.storageKeys.shoppingList, []),

      // Recipe likes: { recipeId: count }
      likes: Storage.get(CONFIG.storageKeys.likes, {}),

      // Cook log: [{ recipeId, date, rating, actualTime, notes }]
      cookLog: Storage.get(CONFIG.storageKeys.cookLog, []),

      // Notes: { recipeId: [{ text, date }] }
      notes: Storage.get(CONFIG.storageKeys.notes, {}),

      // Match history: array of ingredient arrays
      matchHistory: Storage.get(CONFIG.storageKeys.matchHistory, []),

      // Achievements: { achievementId: { unlocked, unlockedAt } }
      achievements: Storage.get(CONFIG.storageKeys.achievements, {}),

      // Settings
      settings: Storage.get(CONFIG.storageKeys.settings, {
        dailyCalories: CONFIG.defaults.dailyCalories,
        dailyProtein: CONFIG.defaults.dailyProtein,
        dailyCarbs: CONFIG.defaults.dailyCarbs,
        dailyFat: CONFIG.defaults.dailyFat,
        equipment: [],
        preferences: { spice: 'medium', allergies: [] },
      }),
    };
    this._ready = true;
    this._checkAchievements();
  },

  // ── Generic get/set ──
  get(key) {
    return this._state[key];
  },

  set(key, value) {
    this._state[key] = value;
    this._persist(key);
    this._notify(key);
  },

  // ── Persistence ──
  _persist(key) {
    const storageKey = CONFIG.storageKeys[key];
    if (storageKey) {
      Storage.set(storageKey, this._state[key]);
    }
  },

  // ── Reactive listeners ──
  on(key, fn) {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key].push(fn);
    // Return unsubscribe function
    return () => {
      this._listeners[key] = this._listeners[key].filter(f => f !== fn);
    };
  },

  _notify(key) {
    if (this._listeners[key]) {
      this._listeners[key].forEach(fn => fn(this._state[key]));
    }
    // Also notify global listeners
    if (this._listeners['*']) {
      this._listeners['*'].forEach(fn => fn(key, this._state[key]));
    }
  },

  // ── Meal Records ──
  addMealRecord(record) {
    const meal = {
      id: DOM.uid('meal_'),
      recipeId: record.recipeId,
      date: record.date || new Date().toISOString().slice(0, 10),
      mealType: record.mealType || 'lunch',
      portions: record.portions || 1,
      notes: record.notes || '',
      createdAt: Date.now(),
    };
    const records = [...this._state.mealRecords, meal];
    this.set('mealRecords', records);
    this._checkAchievements();
    return meal;
  },

  removeMealRecord(id) {
    const records = this._state.mealRecords.filter(r => r.id !== id);
    this.set('mealRecords', records);
  },

  getMealsByDate(date) {
    return this._state.mealRecords.filter(r => r.date === date);
  },

  getMealsByRange(startDate, endDate) {
    return this._state.mealRecords.filter(r => r.date >= startDate && r.date <= endDate);
  },

  // ── Favorites ──
  toggleFavorite(recipeId) {
    const favs = [...this._state.favorites];
    const idx = favs.indexOf(recipeId);
    if (idx === -1) {
      favs.push(recipeId);
    } else {
      favs.splice(idx, 1);
    }
    this.set('favorites', favs);
    return idx === -1; // true = added, false = removed
  },

  isFavorite(recipeId) {
    return this._state.favorites.includes(recipeId);
  },

  // ── Likes ──
  toggleLike(recipeId) {
    const likes = { ...this._state.likes };
    if (likes[recipeId]) {
      likes[recipeId]--;
      if (likes[recipeId] <= 0) delete likes[recipeId];
    } else {
      likes[recipeId] = 1;
    }
    this.set('likes', likes);
    return likes[recipeId] || 0;
  },

  getLikes(recipeId) {
    return this._state.likes[recipeId] || 0;
  },

  // ── Cook Log ──
  addCookLog(entry) {
    const log = [...this._state.cookLog, {
      id: DOM.uid('cook_'),
      recipeId: entry.recipeId,
      date: entry.date || new Date().toISOString().slice(0, 10),
      rating: entry.rating || 0,
      actualTime: entry.actualTime || 0,
      notes: entry.notes || '',
    }];
    this.set('cookLog', log);
    this._checkAchievements();
    return log;
  },

  getCookLogByRecipe(recipeId) {
    return this._state.cookLog.filter(l => l.recipeId === recipeId);
  },

  // ── Notes ──
  addNote(recipeId, text) {
    const notes = { ...this._state.notes };
    if (!notes[recipeId]) notes[recipeId] = [];
    notes[recipeId].push({ text, date: new Date().toISOString().slice(0, 10) });
    this.set('notes', notes);
  },

  getNotes(recipeId) {
    return this._state.notes[recipeId] || [];
  },

  // ── Shopping List ──
  addToShoppingList(item) {
    const list = [...this._state.shoppingList];
    // Check if already exists
    const existing = list.find(i => i.ingredientName === item.ingredientName && !i.purchased);
    if (existing) {
      existing.amount += item.amount || 0;
      if (item.neededFor) {
        existing.neededFor = [...new Set([...existing.neededFor, ...item.neededFor])];
      }
    } else {
      list.push({
        id: DOM.uid('shop_'),
        ingredientName: item.ingredientName,
        amount: item.amount || 1,
        unit: item.unit || '份',
        purchased: false,
        neededFor: item.neededFor || [],
      });
    }
    this.set('shoppingList', list);
  },

  toggleShoppingItem(id) {
    const list = this._state.shoppingList.map(item =>
      item.id === id ? { ...item, purchased: !item.purchased } : item
    );
    this.set('shoppingList', list);
  },

  clearPurchasedItems() {
    const list = this._state.shoppingList.filter(item => !item.purchased);
    this.set('shoppingList', list);
  },

  // ── Match History ──
  addMatchHistory(ingredients) {
    const history = [ingredients, ...this._state.matchHistory.filter(
      h => JSON.stringify(h) !== JSON.stringify(ingredients)
    )].slice(0, 10);
    this.set('matchHistory', history);
  },

  // ── Settings ──
  updateSettings(partial) {
    const settings = { ...this._state.settings, ...partial };
    this.set('settings', settings);
  },

  // ── Achievements ──
  _checkAchievements() {
    const achievements = { ...this._state.achievements };
    let changed = false;

    const totalCooks = this._state.mealRecords.length;
    const uniqueRecipes = new Set(this._state.mealRecords.map(r => r.recipeId)).size;
    const mealsByDate = {};
    this._state.mealRecords.forEach(r => {
      mealsByDate[r.date] = (mealsByDate[r.date] || 0) + 1;
    });

    // Check total cook counts
    const cookThresholds = [
      { id: 'first_cook', count: 1 },
      { id: 'cook_10', count: 10 },
      { id: 'cook_50', count: 50 },
      { id: 'cook_100', count: 100 },
    ];
    cookThresholds.forEach(({ id, count }) => {
      if (totalCooks >= count && !achievements[id]) {
        achievements[id] = { unlocked: true, unlockedAt: Date.now() };
        changed = true;
      }
    });

    // Unique recipes
    const unlockThresholds = [
      { id: 'unlock_10', count: 10 },
      { id: 'unlock_30', count: 30 },
    ];
    unlockThresholds.forEach(({ id, count }) => {
      if (uniqueRecipes >= count && !achievements[id]) {
        achievements[id] = { unlocked: true, unlockedAt: Date.now() };
        changed = true;
      }
    });

    if (changed) {
      this.set('achievements', achievements);
    }
  },

  // ── Statistics helpers ──
  getStats() {
    const totalMeals = this._state.mealRecords.length;
    const uniqueRecipes = new Set(this._state.mealRecords.map(r => r.recipeId)).size;
    const totalSaved = totalMeals * (CONFIG.avgTakeoutCost - 10); // rough estimate

    return { totalMeals, uniqueRecipes, totalSaved };
  },
};
