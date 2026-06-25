// ╔══════════════════════════════════════╗
// ║  Format & Calculation Utilities    ║
// ╚══════════════════════════════════════╝

const Format = {
  /**
   * Format calories
   */
  calories(kcal) {
    return Math.round(kcal) + ' kcal';
  },

  /**
   * Format grams
   */
  grams(g, unit = 'g') {
    return Math.round(g) + unit;
  },

  /**
   * Format a date string (YYYY-MM-DD) to display
   */
  date(dateStr, format = 'zh') {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (format === 'zh') {
      return `${m}月${d}日`;
    }
    if (format === 'short') {
      return `${m}/${d}`;
    }
    if (format === 'weekday') {
      const date = new Date(y, m - 1, d);
      const days = ['日', '一', '二', '三', '四', '五', '六'];
      return `${m}月${d}日 周${days[date.getDay()]}`;
    }
    return dateStr;
  },

  /**
   * Get today's date string
   */
  today() {
    return new Date().toISOString().slice(0, 10);
  },

  /**
   * Get date N days ago
   */
  daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
  },

  /**
   * Get start of week (Monday)
   */
  weekStart(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().slice(0, 10);
  },

  /**
   * Get start of month
   */
  monthStart(dateStr) {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  },

  /**
   * Format minutes to human readable
   */
  duration(minutes) {
    if (minutes < 60) return minutes + '分钟';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}小时${m}分钟` : `${h}小时`;
  },

  /**
   * Format number with Chinese units
   */
  number(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(Math.round(n));
  },

  /**
   * Calculate nutrition totals from meal records
   */
  calcMealNutrition(mealRecords, recipeLookup) {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
    mealRecords.forEach(record => {
      const recipe = recipeLookup[record.recipeId];
      if (recipe && recipe.nutrition) {
        const mult = record.portions || 1;
        totals.calories += (recipe.nutrition.calories || 0) * mult;
        totals.protein += (recipe.nutrition.protein || 0) * mult;
        totals.carbs += (recipe.nutrition.carbs || 0) * mult;
        totals.fat += (recipe.nutrition.fat || 0) * mult;
        totals.fiber += (recipe.nutrition.fiber || 0) * mult;
      }
    });
    return totals;
  },

  /**
   * Calculate nutrition goal percentage
   */
  goalPercent(current, goal) {
    if (!goal) return 0;
    return Math.min(100, Math.round((current / goal) * 100));
  },

  /**
   * Get emoji for meal type
   */
  mealTypeEmoji(type) {
    const map = { breakfast: '🌅', lunch: '🌞', dinner: '🌙', snack: '🍪' };
    return map[type] || '🍽️';
  },

  /**
   * Get difficulty text
   */
  difficultyText(level) {
    const map = { 1: '简单', 2: '中等', 3: '困难' };
    return map[level] || '未知';
  },

  /**
   * Get difficulty stars
   */
  difficultyStars(level) {
    return '⭐'.repeat(level);
  },

  /**
   * Compute a simple color based on value vs goal
   */
  nutritionColor(current, goal) {
    if (!goal) return 'var(--color-text-muted)';
    const pct = current / goal;
    if (pct >= 0.9 && pct <= 1.1) return 'var(--color-success)';
    if (pct < 0.7) return 'var(--color-danger)';
    if (pct > 1.3) return 'var(--color-warning)';
    return 'var(--color-primary)';
  },
};
