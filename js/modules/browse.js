// ╔══════════════════════════════════════╗
// ║  Recipe Browser View               ║
// ╚══════════════════════════════════════╝

const BrowseView = {
  _activeTab: 'zhongcan',
  _filters: { difficulty: 0, maxTime: Infinity, scene: '', cuisine: '', mealType: '' },
  _searchQuery: '',

  async render(params) {
    this._activeTab = params.category || 'zhongcan';
    this._filters = { difficulty: 0, maxTime: Infinity, scene: '', cuisine: '', mealType: '' };
    this._searchQuery = params.query ? params.query.q || '' : '';

    const view = DOM.create('div', { className: 'view' });

    // ── Category Tabs ──
    const tabBar = DOM.create('div', { className: 'flex', style: 'margin-bottom: var(--space-4);' });
    [
      { id: 'zhongcan', label: '🥘 中餐', count: typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN.length : 0 },
      { id: 'xican', label: '🍝 西餐', count: typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN.length : 0 },
    ].forEach(tab => {
      const tabEl = DOM.create('div', {
        className: 'pixel-tab' + (this._activeTab === tab.id ? ' pixel-tab--active' : ''),
        style: 'flex: 1;',
        text: tab.label + ' (' + tab.count + ')',
        onClick: () => {
          this._activeTab = tab.id;
          this._renderRecipeGrid(view);
          // Update tab styles
          DOM.$$('.pixel-tab', tabBar).forEach(t => DOM.toggleClass(t, 'pixel-tab--active', false));
          DOM.toggleClass(tabEl, 'pixel-tab--active', true);
        },
      });
      tabBar.appendChild(tabEl);
    });
    view.appendChild(tabBar);

    // ── Search ──
    const searchRow = DOM.create('div', { className: 'flex gap-2 mb-4' });
    const searchInput = DOM.create('input', {
      className: 'pixel-input',
      placeholder: '搜索菜名、食材、标签...',
      value: this._searchQuery,
      style: 'flex: 1;',
    });
    searchRow.appendChild(searchInput);
    searchRow.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small',
      text: '🔍',
      onClick: () => {
        this._searchQuery = searchInput.value.trim();
        this._renderRecipeGrid(view);
      },
    }));
    view.appendChild(searchRow);

    // Handle search on Enter
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this._searchQuery = searchInput.value.trim();
        this._renderRecipeGrid(view);
      }
    });

    // ── Filter Chips ──
    const filterArea = DOM.create('div', { className: 'mb-4' });

    // Difficulty filter
    filterArea.appendChild(DOM.create('p', { className: 'text-xs text-muted mb-2', text: '难度' }));
    const diffRow = DOM.create('div', { className: 'quick-chips mb-2' });
    [{ v: 0, l: '全部' }, { v: 1, l: '⭐ 简单' }, { v: 2, l: '⭐⭐ 中等' }, { v: 3, l: '⭐⭐⭐ 困难' }].forEach(d => {
      diffRow.appendChild(DOM.create('span', {
        className: 'pixel-chip' + (this._filters.difficulty === d.v ? ' pixel-chip--active' : ''),
        text: d.l,
        onClick: (e) => {
          this._filters.difficulty = d.v;
          DOM.$$('.pixel-chip', diffRow).forEach(c => DOM.toggleClass(c, 'pixel-chip--active', false));
          DOM.toggleClass(e.target, 'pixel-chip--active', true);
          this._renderRecipeGrid(view);
        },
      }));
    });
    filterArea.appendChild(diffRow);

    // Time filter
    filterArea.appendChild(DOM.create('p', { className: 'text-xs text-muted mb-2', text: '时间' }));
    const timeRow = DOM.create('div', { className: 'quick-chips mb-2' });
    CONFIG.timeFilters.forEach(tf => {
      timeRow.appendChild(DOM.create('span', {
        className: 'pixel-chip' + (this._filters.maxTime === tf.value ? ' pixel-chip--active' : ''),
        text: tf.name,
        onClick: (e) => {
          this._filters.maxTime = tf.value;
          DOM.$$('.pixel-chip', timeRow).forEach(c => DOM.toggleClass(c, 'pixel-chip--active', false));
          DOM.toggleClass(e.target, 'pixel-chip--active', true);
          this._renderRecipeGrid(view);
        },
      }));
    });
    filterArea.appendChild(timeRow);

    // Scene filter
    filterArea.appendChild(DOM.create('p', { className: 'text-xs text-muted mb-2', text: '场景' }));
    const sceneRow = DOM.create('div', { className: 'quick-chips mb-2' });
    [{ v: '', l: '全部' }, ...CONFIG.scenes].forEach(sc => {
      sceneRow.appendChild(DOM.create('span', {
        className: 'pixel-chip' + (this._filters.scene === (sc.v || sc.id) ? ' pixel-chip--active' : ''),
        text: (sc.emoji || '') + ' ' + (sc.l || sc.name),
        onClick: (e) => {
          this._filters.scene = sc.v || sc.id;
          DOM.$$('.pixel-chip', sceneRow).forEach(c => DOM.toggleClass(c, 'pixel-chip--active', false));
          DOM.toggleClass(e.target, 'pixel-chip--active', true);
          this._renderRecipeGrid(view);
        },
      }));
    });
    filterArea.appendChild(sceneRow);

    view.appendChild(filterArea);

    // ── Recipe Grid (insert point) ──
    const gridContainer = DOM.create('div', { id: 'recipe-grid-container' });
    view.appendChild(gridContainer);

    // Initial render
    this._renderRecipeGrid(view);

    return view;
  },

  _renderRecipeGrid(view) {
    const container = DOM.$('#recipe-grid-container', view);
    if (!container) return;
    DOM.empty(container);

    const recipes = this._activeTab === 'zhongcan'
      ? (typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : [])
      : (typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : []);

    // Apply filters
    let filtered = recipes.filter(r => {
      if (this._filters.difficulty > 0 && r.difficulty !== this._filters.difficulty) return false;
      if (this._filters.maxTime < Infinity && (r.prepTime + r.cookTime) > this._filters.maxTime) return false;
      if (this._filters.scene && r.scene && !r.scene.includes(this._filters.scene)) return false;
      if (this._filters.cuisine && r.cuisine !== this._filters.cuisine) return false;
      if (this._filters.mealType && !r.mealType.includes(this._filters.mealType)) return false;
      return true;
    });

    // Apply search
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.includes(q) ||
        r.nameEn.toLowerCase().includes(q) ||
        r.ingredients.some(i => i.name.includes(q)) ||
        (r.tags && r.tags.some(t => t.includes(q))) ||
        (r.cuisine && r.cuisine.includes(q))
      );
    }

    // Sort
    filtered.sort((a, b) => b.tasteRating - a.tasteRating);

    if (filtered.length === 0) {
      container.appendChild(DOM.create('div', { className: 'empty-state' },
        DOM.create('div', { className: 'empty-state__icon', text: '📭' }),
        DOM.create('p', { className: 'empty-state__text', text: '没有找到匹配的菜谱\n试试调整筛选条件~' }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--secondary mt-3',
          text: '🔄 清除筛选',
          onClick: () => {
            this._filters = { difficulty: 0, maxTime: Infinity, scene: '', cuisine: '', mealType: '' };
            this._searchQuery = '';
            Router.go('/browse/' + this._activeTab);
          },
        })
      ));
      return;
    }

    const grid = DOM.create('div', { className: 'pixel-grid pixel-grid--2' });
    filtered.forEach(recipe => {
      grid.appendChild(this._createRecipeCard(recipe));
    });
    container.appendChild(grid);

    container.appendChild(DOM.create('p', { className: 'text-center text-xs text-muted mt-4', text: `显示 ${filtered.length} 个菜谱` }));
  },

  _createRecipeCard(recipe) {
    const card = DOM.create('div', {
      className: 'recipe-card',
      onClick: () => Router.go('/recipe/' + recipe.id),
    });

    // Cuisine-based hue for card image background
    const hueMap = { '川菜':5,'粤菜':40,'鲁菜':25,'苏菜':45,'浙菜':160,'闽菜':35,'湘菜':10,'徽菜':30,'东北菜':30,'西北':40,'家常':28,'意式':120,'法式':200,'日式':175,'韩式':15,'印度':20,'东南亚':70,'墨西哥':15,'美式':210 };
    card.style.setProperty('--card-hue', hueMap[recipe.cuisine] || 28);

    // Image area with emoji
    const imgDiv = DOM.create('div', { className: 'recipe-card__image' });
    imgDiv.appendChild(DOM.create('span', { className: 'card-emoji', text: recipe.emoji }));
    card.appendChild(imgDiv);

    // Favorite button
    const isFav = Store.isFavorite(recipe.id);
    const favBtn = DOM.create('div', {
      className: 'recipe-card__fav' + (isFav ? ' recipe-card__fav--active' : ''),
      text: isFav ? '❤️' : '🤍',
      onClick: (e) => {
        e.stopPropagation();
        const added = Store.toggleFavorite(recipe.id);
        favBtn.textContent = added ? '❤️' : '🤍';
        DOM.toggleClass(favBtn, 'recipe-card__fav--active', added);
        App.showToast(added ? '已收藏 ⭐' : '已取消收藏');
      },
    });
    card.appendChild(favBtn);

    // Body
    const body = DOM.create('div', { className: 'recipe-card__body' });
    body.appendChild(DOM.create('div', { className: 'recipe-card__title', text: recipe.name }));
    body.appendChild(DOM.create('div', { className: 'recipe-card__meta' },
      DOM.create('span', {
        className: 'pixel-badge pixel-badge--' + (recipe.difficulty === 1 ? 'easy' : recipe.difficulty === 2 ? 'medium' : 'hard'),
        text: Format.difficultyText(recipe.difficulty),
      }),
      DOM.create('span', { className: 'recipe-card__time', text: (recipe.prepTime + recipe.cookTime) + '分钟' }),
      DOM.create('span', { className: 'pixel-stars', text: '★'.repeat(Math.round(recipe.tasteRating)) })
    ));
    card.appendChild(body);

    return card;
  },
};
