// ╔══════════════════════════════════════╗
// ║  Hash-based SPA Router             ║
// ╚══════════════════════════════════════╝

const Router = {
  routes: {},
  _currentRoute: null,
  _currentParams: {},
  _beforeHooks: [],
  _afterHooks: [],

  /**
   * Register a route
   * @param {string} pattern - e.g. '/recipe/:id'
   * @param {Function} handler - receives params object
   */
  on(pattern, handler) {
    const keys = [];
    const regexStr = pattern.replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    this.routes[pattern] = { regex: new RegExp('^' + regexStr + '$'), keys, handler };
  },

  /**
   * Navigate to a path
   * @param {string} path - e.g. '/recipe/xi-hong-shi-chao-ji-dan'
   */
  go(path) {
    if (!path.startsWith('#')) {
      path = '#' + path;
    }
    window.location.hash = path;
  },

  /**
   * Get current path without hash
   */
  currentPath() {
    return window.location.hash.slice(1) || '/';
  },

  /**
   * Get a query param from the hash (e.g. #/browse?q=鸡蛋)
   */
  getQuery() {
    const hash = window.location.hash;
    const qIdx = hash.indexOf('?');
    if (qIdx === -1) return {};
    const params = new URLSearchParams(hash.slice(qIdx));
    const result = {};
    for (const [k, v] of params) result[k] = v;
    return result;
  },

  /**
   * Register a hook that runs before each route change
   */
  beforeEach(hook) {
    this._beforeHooks.push(hook);
  },

  /**
   * Register a hook that runs after each route change
   */
  afterEach(hook) {
    this._afterHooks.push(hook);
  },

  /**
   * Match and dispatch the current route
   */
  _dispatch() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, queryStr] = hash.split('?');
    const query = {};
    if (queryStr) {
      new URLSearchParams(queryStr).forEach((v, k) => { query[k] = v; });
    }

    let matched = null;
    let params = {};

    for (const [pattern, { regex, keys }] of Object.entries(this.routes)) {
      const match = path.match(regex);
      if (match) {
        matched = pattern;
        keys.forEach((key, i) => { params[key] = decodeURIComponent(match[i + 1]); });
        break;
      }
    }

    if (!matched) {
      // Default to home
      this.go('/');
      return;
    }

    const route = this.routes[matched];
    this._currentRoute = matched;
    this._currentParams = { ...params, query };

    // Run before hooks
    for (const hook of this._beforeHooks) {
      if (hook(matched, params) === false) return; // Hook can cancel navigation
    }

    // Dispatch handler
    route.handler({ ...params, query });

    // Run after hooks
    for (const hook of this._afterHooks) {
      hook(matched, params);
    }
  },

  /**
   * Initialize the router
   */
  init() {
    window.addEventListener('hashchange', () => this._dispatch());
    // Initial dispatch
    if (window.location.hash) {
      this._dispatch();
    } else {
      this.go('/');
    }
  },
};
