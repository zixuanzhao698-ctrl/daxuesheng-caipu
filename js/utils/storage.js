// ╔══════════════════════════════════════╗
// ║  LocalStorage Wrapper              ║
// ╚══════════════════════════════════════╝

const Storage = {
  /**
   * Get a value from localStorage
   * @param {string} key
   * @param {*} fallback - Default if key doesn't exist
   * @returns {*}
   */
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[Storage] Failed to read "${key}":`, e.message);
      return fallback;
    }
  },

  /**
   * Set a value in localStorage
   * @param {string} key
   * @param {*} value
   * @returns {boolean} success
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`[Storage] Failed to write "${key}":`, e.message);
      if (e.name === 'QuotaExceededError') {
        this._handleQuotaExceeded();
      }
      return false;
    }
  },

  /**
   * Remove a key from localStorage
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Check if a key exists
   */
  has(key) {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get all keys matching a prefix
   */
  keys(prefix = '') {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        result.push(key);
      }
    }
    return result;
  },

  /**
   * Get estimated storage usage in bytes
   */
  getUsage() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        total += key.length + (localStorage.getItem(key) || '').length;
      }
    }
    return total * 2; // UTF-16
  },

  /**
   * Handle quota exceeded - prune old data
   */
  _handleQuotaExceeded() {
    // Try to prune meal records older than 90 days
    const records = this.get(CONFIG.storageKeys.mealRecords, []);
    if (records.length > 50) {
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const pruned = records.filter(r => r.createdAt > cutoff);
      this.set(CONFIG.storageKeys.mealRecords, pruned);
    }
  },
};
