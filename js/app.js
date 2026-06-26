// ╔══════════════════════════════════════╗
// ║  App Bootstrap & Shell             ║
// ╚══════════════════════════════════════╝

const App = {
  _mainContent: null,
  _navbar: null,
  _indicator: null,
  _currentView: null,
  _viewCache: {},

  /**
   * Initialize the application
   */
  async init() {
    // Init store
    Store.init();

    // Get DOM refs
    this._mainContent = DOM.$('#main-content');
    this._navbar = DOM.$('#navbar');
    this._indicator = DOM.$('.navbar__indicator', this._navbar);

    // Setup routes
    this._setupRoutes();

    // Setup navbar listeners
    this._setupNavbar();

    // Update indicator on window resize
    window.addEventListener('resize', () => this._updateIndicator());

    // Register service worker (for PWA)
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // SW failed silently - app still works
        });
      });
    }

    // Listen for PWA install prompt
    this._setupInstallPrompt();

    // Start router
    Router.init();
  },

  /**
   * Register all application routes
   */
  _setupRoutes() {
    // Home
    Router.on('/', () => this._renderView('home'));

    // Smart match
    Router.on('/match', () => this._renderView('match'));

    // Recipe browser (with optional category and query)
    Router.on('/browse', (params) => this._renderView('browse', params));
    Router.on('/browse/:category', (params) => this._renderView('browse', params));

    // Recipe detail
    Router.on('/recipe/:id', (params) => this._renderView('recipe-detail', params));

    // Cooking mode
    Router.on('/recipe/:id/cook', (params) => this._renderView('cooking-mode', params));

    // Nutrition tracker
    Router.on('/nutrition', (params) => this._renderView('nutrition', params));

    // Cooking diary
    Router.on('/diary', (params) => this._renderView('diary', params));

    // Favorites
    Router.on('/favorites', () => this._renderView('favorites'));

    // Shopping list
    Router.on('/shopping-list', () => this._renderView('shopping-list'));

    // Settings
    Router.on('/settings', () => this._renderView('settings'));

    // After route change, update navbar highlight
    Router.afterEach((route) => {
      this._highlightNavbar(route);
      // Scroll to top on navigation
      this._mainContent.scrollTop = 0;
    });
  },

  /**
   * Render a view inside the main content area
   */
  async _renderView(viewName, params = {}) {
    this._currentView = viewName;
    DOM.empty(this._mainContent);

    try {
      let viewEl;
      switch (viewName) {
        case 'home':
          viewEl = await HomeView.render(params);
          break;
        case 'match':
          viewEl = await SmartMatchView.render(params);
          break;
        case 'browse':
          viewEl = await BrowseView.render(params);
          break;
        case 'recipe-detail':
          viewEl = await RecipeDetailView.render(params);
          break;
        case 'cooking-mode':
          viewEl = await CookingModeView.render(params);
          break;
        case 'nutrition':
          viewEl = await NutritionView.render(params);
          break;
        case 'diary':
          viewEl = await DiaryView.render(params);
          break;
        case 'favorites':
          viewEl = await FavoritesView.render(params);
          break;
        case 'shopping-list':
          viewEl = await ShoppingListView.render(params);
          break;
        case 'settings':
          viewEl = await SettingsView.render(params);
          break;
        default:
          viewEl = DOM.create('div', { className: 'view' },
            DOM.create('div', { className: 'empty-state' },
              DOM.create('div', { className: 'empty-state__icon', text: '🔍' }),
              DOM.create('p', { className: 'empty-state__text', text: '页面不存在' })
            )
          );
      }
      this._mainContent.appendChild(viewEl);
    } catch (e) {
      console.error(`[App] Failed to render ${viewName}:`, e);
      this._mainContent.appendChild(
        DOM.create('div', { className: 'view' },
          DOM.create('div', { className: 'empty-state' },
            DOM.create('div', { className: 'empty-state__icon', text: '💥' }),
            DOM.create('p', { className: 'empty-state__text', text: '出了点问题，刷新试试~' })
          )
        )
      );
    }
  },

  /**
   * Setup bottom tab bar
   */
  _setupNavbar() {
    const tabs = DOM.$$('.navbar__tab', this._navbar);
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const path = tab.dataset.path;
        if (path) Router.go(path);
      });
    });
  },

  /**
   * Highlight active navbar tab
   */
  _highlightNavbar(route) {
    const tabs = DOM.$$('.navbar__tab', this._navbar);
    const tabMap = {
      '/': 'home',
      '/match': 'match',
      '/browse': 'browse',
      '/browse/zhongcan': 'browse',
      '/browse/xican': 'browse',
      '/nutrition': 'nutrition',
      '/diary': 'nutrition',
      '/favorites': 'me',
      '/shopping-list': 'me',
      '/settings': 'me',
    };

    // Find the best matching tab (longest prefix wins)
    let activeTab = 'home';
    let bestLen = 0;
    for (const [pattern, tab] of Object.entries(tabMap)) {
      if (route.startsWith(pattern) && pattern.length > bestLen) {
        activeTab = tab;
        bestLen = pattern.length;
      }
    }

    tabs.forEach(tab => {
      const isActive = tab.dataset.tab === activeTab;
      DOM.toggleClass(tab, 'navbar__tab--active', isActive);
    });
    this._updateIndicator();
  },

  /**
   * Slide the indicator bar to the active tab
   */
  _updateIndicator() {
    if (!this._indicator || !this._navbar) return;
    const activeTab = DOM.$('.navbar__tab--active', this._navbar);
    if (!activeTab) return;
    const navRect = this._navbar.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    this._indicator.style.left = (tabRect.left - navRect.left) + 'px';
    this._indicator.style.width = tabRect.width + 'px';
  },

  /**
   * PWA install prompt
   */
  _setupInstallPrompt() {
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      // Show install banner after a few visits
      const visits = Storage.get('app_visits', 0) + 1;
      Storage.set('app_visits', visits);
      if (visits >= 3) {
        // Could show an install button here
      }
    });
  },

  /**
   * Show a toast notification
   */
  showToast(message, type = '') {
    const container = DOM.$('#toast-container');
    const toast = DOM.create('div', {
      className: 'toast' + (type ? ' toast--' + type : ''),
      text: message,
    });
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 200ms steps(4)';
      setTimeout(() => toast.remove(), 250);
    }, 2000);
  },

  /**
   * Show a modal sheet
   */
  showModal(contentEl, onClose) {
    const overlay = DOM.create('div', { className: 'modal-overlay', onClick: (e) => {
      if (e.target === overlay) {
        overlay.remove();
        if (onClose) onClose();
      }
    }});
    const sheet = DOM.create('div', { className: 'modal-sheet' },
      DOM.create('div', { className: 'modal-sheet__handle' }),
      contentEl
    );
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    return { overlay, sheet, close: () => { overlay.remove(); if (onClose) onClose(); } };
  },
};

// ── Bootstrap when DOM is ready ──
document.addEventListener('DOMContentLoaded', () => App.init());
