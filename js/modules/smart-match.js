// ╔══════════════════════════════════════╗
// ║  Smart Match View - 食材智能匹配   ║
// ╚══════════════════════════════════════╝

const SmartMatchView = {
  _selectedIngredients: [],
  _results: null,

  async render(params) {
    this._selectedIngredients = [];
    this._results = null;
    const isLazy = params.query && params.query.lazy === '1';

    const view = DOM.create('div', { className: 'view' });

    // ── Header ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('h1', { className: 'page-header__title', text: isLazy ? '💬 懒人模式' : '🔍 做点啥' }),
      DOM.create('div', {
        className: 'pixel-chip', style: 'cursor: pointer;',
        text: isLazy ? '切换到食材输入' : '懒人模式',
        onClick: () => Router.go(isLazy ? '/match' : '/match?lazy=1'),
      })
    ));

    // ── Input Area ──
    const inputSection = DOM.create('div', { className: 'mb-4' });

    if (isLazy) {
      // Lazy mode: free text input
      const lazyInput = DOM.create('textarea', {
        className: 'pixel-input',
        placeholder: '描述你想吃什么...\n例如: 想吃点辣的，简单一点的，最好20分钟以内',
        rows: '3',
        style: 'resize: none;',
      });
      inputSection.appendChild(lazyInput);

      const lazyBtn = DOM.create('button', {
        className: 'pixel-btn pixel-btn--block mt-3',
        text: '✨ 帮我推荐',
        onClick: () => this._handleLazyMatch(lazyInput.value, resultsArea),
      });
      inputSection.appendChild(lazyBtn);
    } else {
      // Ingredient input mode
      const inputRow = DOM.create('div', { className: 'flex gap-2' });
      const textInput = DOM.create('input', {
        className: 'pixel-input',
        placeholder: '输入食材，用逗号分隔（如: 西红柿, 鸡蛋）',
        style: 'flex: 1;',
        id: 'ingredient-input',
      });
      inputRow.appendChild(textInput);
      inputRow.appendChild(DOM.create('button', {
        className: 'pixel-btn',
        text: '添加',
        onClick: () => {
          this._addIngredient(textInput.value, chipsContainer);
          textInput.value = '';
          textInput.focus();
        },
      }));
      inputSection.appendChild(inputRow);

      // Handle Enter key
      textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this._addIngredient(textInput.value, chipsContainer);
          textInput.value = '';
        }
      });

      // Selected ingredient chips
      const chipsContainer = DOM.create('div', { className: 'quick-chips mt-3', id: 'selected-chips' });
      inputSection.appendChild(chipsContainer);

      // Quick select common ingredients
      inputSection.appendChild(DOM.create('p', { className: 'text-xs text-muted mt-3 mb-2', text: '常用食材（点击快速添加）' }));
      const quickContainer = DOM.create('div', { className: 'quick-chips' });
      const commonIngredients = ['鸡蛋', '西红柿', '土豆', '青椒', '猪肉', '鸡肉', '豆腐', '白菜', '胡萝卜', '洋葱', '茄子', '西兰花', '牛肉', '虾', '米饭', '面条', '火腿', '生菜', '玉米', '蘑菇'];
      commonIngredients.forEach(ing => {
        quickContainer.appendChild(DOM.create('span', {
          className: 'pixel-chip',
          text: ing,
          onClick: () => this._addIngredient(ing, chipsContainer),
        }));
      });
      inputSection.appendChild(quickContainer);

      // History
      const history = Store.get('matchHistory') || [];
      if (history.length > 0) {
        inputSection.appendChild(DOM.create('p', { className: 'text-xs text-muted mt-3 mb-2', text: '历史记录' }));
        const histContainer = DOM.create('div', { className: 'quick-chips' });
        history.slice(0, 5).forEach(h => {
          histContainer.appendChild(DOM.create('span', {
            className: 'pixel-chip pixel-chip--warm',
            text: h.join('、'),
            onClick: () => {
              h.forEach(ing => this._addIngredient(ing, chipsContainer));
            },
          }));
        });
        inputSection.appendChild(histContainer);
      }

      // Match button
      const matchBtn = DOM.create('button', {
        className: 'pixel-btn pixel-btn--large pixel-btn--block mt-4',
        text: '🔍 开始匹配',
        onClick: () => this._handleMatch(resultsArea),
      });
      inputSection.appendChild(matchBtn);
    }

    view.appendChild(inputSection);

    // ── Results Area ──
    const resultsArea = DOM.create('div', { id: 'match-results' });
    view.appendChild(resultsArea);

    return view;
  },

  _addIngredient(input, container) {
    const tokens = input.split(/[,，、\s]+/).filter(t => t.trim());
    tokens.forEach(token => {
      const name = token.trim();
      if (!name) return;
      const normalized = this._resolveName(name);
      if (normalized && !this._selectedIngredients.includes(normalized)) {
        this._selectedIngredients.push(normalized);
        // Add chip
        const chip = DOM.create('span', {
          className: 'pixel-chip pixel-chip--active',
          text: normalized + ' ✕',
          onClick: () => {
            this._selectedIngredients = this._selectedIngredients.filter(i => i !== normalized);
            chip.remove();
          },
        });
        container.appendChild(chip);
      }
    });
  },

  _resolveName(name) {
    if (typeof INGREDIENT_SYNONYMS !== 'undefined' && INGREDIENT_SYNONYMS[name]) {
      return name;
    }
    if (typeof SYNONYM_TO_STANDARD !== 'undefined' && SYNONYM_TO_STANDARD[name]) {
      return SYNONYM_TO_STANDARD[name];
    }
    // Try fuzzy: if the name contains or is contained by a known ingredient
    if (typeof INGREDIENT_SYNONYMS !== 'undefined') {
      for (const std of Object.keys(INGREDIENT_SYNONYMS)) {
        if (std.includes(name) || name.includes(std)) return std;
        if (INGREDIENT_SYNONYMS[std].some(a => a.includes(name) || name.includes(a))) return std;
      }
    }
    return name; // Return as-is if not found
  },

  _handleMatch(resultsArea) {
    if (this._selectedIngredients.length === 0) {
      App.showToast('请先添加至少一种食材~', 'error');
      return;
    }

    const input = this._selectedIngredients.join(', ');
    const raw = Matcher.match(input);

    // Save to history
    Store.addMatchHistory([...this._selectedIngredients]);

    // Adapt matcher's { tiers: [...] } format to { tier1, tier2, tier3 } format
    const results = { tier1: [], tier2: [], tier3: [], totalResults: raw.totalResults || 0 };
    if (raw.tiers) {
      raw.tiers.forEach(t => {
        const mapped = t.results.map(r => ({
          recipe: r.recipe,
          score: r.finalScore || r.score || 0,
          matchRate: r.matchRate || 0,
          missing: r.missing || [],
        }));
        if (t.tier === 1) results.tier1 = mapped;
        else if (t.tier === 2) results.tier2 = mapped;
        else results.tier3 = mapped;
      });
      results.totalResults = results.tier1.length + results.tier2.length + results.tier3.length;
    }

    this._results = results;
    this._renderResults(results, resultsArea);
  },

  _handleLazyMatch(text, resultsArea) {
    if (!text.trim()) {
      App.showToast('请描述你想吃什么~', 'error');
      return;
    }

    // Parse the lazy input to extract constraints
    const constraints = this._parseLazyInput(text);
    const allRecipes = [...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []), ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : [])];

    let filtered = allRecipes.filter(r => {
      if (constraints.difficulty && r.difficulty > constraints.difficulty) return false;
      if (constraints.maxTime && (r.prepTime + r.cookTime) > constraints.maxTime) return false;
      if (constraints.mealType && !r.mealType.includes(constraints.mealType)) return false;
      if (constraints.cuisine && r.cuisine && !r.cuisine.includes(constraints.cuisine)) return false;
      return true;
    });

    // Score by taste rating
    filtered.sort((a, b) => b.tasteRating - a.tasteRating);

    if (filtered.length === 0) {
      filtered = allRecipes.sort((a, b) => b.tasteRating - a.tasteRating).slice(0, 5);
    }

    const results = {
      tier1: filtered.slice(0, 3).map(r => ({ recipe: r, score: 0.8, matchRate: 0.5, missing: [] })),
      tier2: filtered.slice(3, 6).map(r => ({ recipe: r, score: 0.5, matchRate: 0.3, missing: [] })),
      tier3: filtered.slice(6, 9).map(r => ({ recipe: r, score: 0.3, matchRate: 0.1, missing: r.ingredients.filter(i => !i.optional).map(i => i.name) })),
      totalResults: filtered.length,
      isLazy: true,
    };

    this._results = results;
    this._renderResults(results, resultsArea);
  },

  _parseLazyInput(text) {
    const constraints = {};
    if (/辣/.test(text)) constraints.cuisine = '川菜';
    if (/简单|易|快|新手/.test(text)) constraints.difficulty = 1;
    if (/中等/.test(text)) constraints.difficulty = 2;
    if (/(\d+)分钟/.test(text)) constraints.maxTime = parseInt(text.match(/(\d+)分钟/)[1]);
    if (/早饭|早上|早餐/.test(text)) constraints.mealType = 'breakfast';
    if (/午饭|中午|午餐/.test(text)) constraints.mealType = 'lunch';
    if (/晚饭|晚上|晚餐/.test(text)) constraints.mealType = 'dinner';
    if (/中餐|中国/.test(text)) constraints.category = 'zhongcan';
    if (/西餐|西方|意|法|美式/.test(text)) constraints.category = 'xican';
    return constraints;
  },

  _renderResults(results, container) {
    DOM.empty(container);

    const total = results.totalResults || ((results.tier1?.length || 0) + (results.tier2?.length || 0) + (results.tier3?.length || 0));

    container.appendChild(DOM.create('p', { className: 'font-pixel text-sm mb-3', style: 'color: var(--color-primary);', text: `找到 ${total} 个匹配结果` }));

    if (total === 0) {
      container.appendChild(DOM.create('div', { className: 'empty-state' },
        DOM.create('div', { className: 'empty-state__icon', text: '🔍' }),
        DOM.create('p', { className: 'empty-state__text', text: '没有找到匹配的菜谱\n试试减少食材或浏览菜谱库~' }),
        DOM.create('button', { className: 'pixel-btn pixel-btn--secondary mt-3', text: '📖 浏览所有菜谱', onClick: () => Router.go('/browse') })
      ));
      return;
    }

    // Tier 1: 经典必做
    if (results.tier1 && results.tier1.length > 0) {
      container.appendChild(DOM.create('div', { className: 'font-pixel text-sm mb-2', style: 'color: var(--color-success);', text: '🥇 经典必做' }));
      results.tier1.forEach(r => container.appendChild(this._createResultCard(r, 'best')));
    }

    // Tier 2: 换个口味
    if (results.tier2 && results.tier2.length > 0) {
      container.appendChild(DOM.create('div', { className: 'font-pixel text-sm mb-2 mt-4', style: 'color: var(--color-warning);', text: '🥈 换个口味' }));
      results.tier2.forEach(r => container.appendChild(this._createResultCard(r, 'alt')));
    }

    // Tier 3: 凑合能吃
    if (results.tier3 && results.tier3.length > 0) {
      container.appendChild(DOM.create('div', { className: 'font-pixel text-sm mb-2 mt-4', style: 'color: var(--color-text-muted);', text: '🥉 凑合能吃（缺几样食材）' }));
      results.tier3.forEach(r => container.appendChild(this._createResultCard(r, 'partial')));
    }
  },

  _createResultCard(result, tier) {
    const recipe = result.recipe;
    const card = DOM.create('div', {
      className: 'match-result-card' + (tier === 'best' ? ' match-result-card--best' : ''),
      onClick: () => Router.go('/recipe/' + recipe.id),
    });

    // Best match badge
    if (tier === 'best') {
      card.appendChild(DOM.create('div', { className: 'match-result-card__badge', text: 'BEST' }));
    }

    card.appendChild(DOM.create('div', { className: 'flex items-center gap-3' },
      DOM.create('span', { text: recipe.emoji, style: 'font-size: 36px;' }),
      DOM.create('div', { className: 'flex-1' },
        DOM.create('div', { className: 'font-pixel text-sm', text: recipe.name }),
        DOM.create('div', { className: 'flex items-center gap-2 mt-1' },
          DOM.create('span', { className: 'pixel-badge pixel-badge--' + (recipe.difficulty === 1 ? 'easy' : recipe.difficulty === 2 ? 'medium' : 'hard'), text: Format.difficultyText(recipe.difficulty) }),
          DOM.create('span', { className: 'recipe-card__time', text: (recipe.prepTime + recipe.cookTime) + '分钟' })
        )
      )
    ));

    // Score bar
    if (result.score !== undefined) {
      const pct = Math.round(result.score * 100);
      card.appendChild(DOM.create('div', { className: 'mt-2' },
        DOM.create('div', { className: 'flex justify-between text-xs mb-1' },
          DOM.create('span', { className: 'text-muted', text: '匹配度' }),
          DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-primary);', text: pct + '%' })
        ),
        DOM.create('div', { className: 'pixel-progress' },
          DOM.create('div', { className: 'pixel-progress__fill', style: 'width: ' + pct + '%;' })
        )
      ));
    }

    // Missing ingredients
    if (result.missing && result.missing.length > 0) {
      card.appendChild(DOM.create('div', { className: 'match-result-card__missing' },
        '🧺 还缺: ' + result.missing.join('、'),
        DOM.create('span', {
          className: 'pixel-chip pixel-chip--warm',
          style: 'margin-left: var(--space-2); cursor: pointer;',
          text: '＋加入采购清单',
          onClick: (e) => {
            e.stopPropagation();
            result.missing.forEach(name => {
              Store.addToShoppingList({ ingredientName: name, amount: 1, unit: '份', neededFor: [recipe.name] });
            });
            App.showToast('已加入采购清单 ✅');
          },
        })
      ));
    }

    return card;
  },
};
