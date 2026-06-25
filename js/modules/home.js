// ╔══════════════════════════════════════╗
// ║  Home View                         ║
// ╚══════════════════════════════════════╝

const HomeView = {
  async render(params) {
    const view = DOM.create('div', { className: 'view' });

    // ── Hero Banner ──
    const hero = DOM.create('div', { className: 'recipe-hero', style: 'margin-bottom: var(--space-4);' },
      DOM.create('div', { text: '🍳', style: 'font-size: 56px; margin-bottom: var(--space-3); image-rendering: pixelated;' }),
      DOM.create('h1', { className: 'font-pixel', style: 'font-size: var(--font-size-xl); color: var(--color-primary);', text: '大学生菜谱指南' }),
      DOM.create('p', { className: 'text-sm text-muted mt-2', text: '从「有什么」到「吃什么」，一键搞定' })
    );
    view.appendChild(hero);

    // ── Quick Actions ──
    const actions = DOM.create('div', { className: 'pixel-grid pixel-grid--2', style: 'margin-bottom: var(--space-6);' });

    const actionCards = [
      { icon: '🔍', label: '食材匹配', desc: '输入食材找菜谱', path: '/match', color: '#FF6B35' },
      { icon: '💬', label: '懒人模式', desc: '一句话生成推荐', path: '/match?lazy=1', color: '#FF8A65' },
      { icon: '📖', label: '中餐菜谱', desc: '25道家常中餐', path: '/browse/zhongcan', color: '#D84315' },
      { icon: '🍝', label: '西餐菜谱', desc: '25道简易西餐', path: '/browse/xican', color: '#FFB347' },
    ];

    actionCards.forEach(card => {
      const el = DOM.create('div', {
        className: 'pixel-card pixel-card--clickable',
        style: `text-align: center; padding: var(--space-4); border-left: var(--pixel-2) solid ${card.color};`,
        onClick: () => Router.go(card.path),
      },
        DOM.create('div', { text: card.icon, style: 'font-size: 28px; margin-bottom: var(--space-2);' }),
        DOM.create('div', { className: 'font-pixel text-sm', text: card.label }),
        DOM.create('div', { className: 'text-xs text-muted mt-1', text: card.desc })
      );
      actions.appendChild(el);
    });
    view.appendChild(actions);

    // ── Today's Recommendation ──
    const allRecipes = [...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []), ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : [])];
    if (allRecipes.length > 0) {
      const todaySeed = parseInt(Format.today().replace(/-/g, '')) % allRecipes.length;
      const recipe = allRecipes[todaySeed];

      view.appendChild(DOM.create('div', { className: 'font-pixel text-sm mb-2', style: 'color: var(--color-primary);', text: '🎲 今日推荐' }));

      const recCard = this._createRecipeCard(recipe);
      recCard.addEventListener('click', () => Router.go('/recipe/' + recipe.id));
      view.appendChild(recCard);
    }

    // ── Recent Meals ──
    const recentMeals = Store.getMealsByRange(Format.daysAgo(7), Format.today());
    if (recentMeals.length > 0) {
      view.appendChild(DOM.create('div', { className: 'font-pixel text-sm mb-2 mt-6', style: 'color: var(--color-primary);', text: '🕐 最近做的菜' }));

      const recentIds = [...new Set(recentMeals.slice(-5).map(r => r.recipeId).reverse())];
      const scrollRow = DOM.create('div', { className: 'scroll-row' });
      recentIds.forEach(id => {
        const r = allRecipes.find(rec => rec.id === id);
        if (r) {
          const mini = DOM.create('div', {
            className: 'pixel-card pixel-card--clickable',
            style: 'width: 120px; text-align: center; padding: var(--space-3);',
            onClick: () => Router.go('/recipe/' + r.id),
          },
            DOM.create('div', { text: r.emoji, style: 'font-size: 32px;' }),
            DOM.create('div', { className: 'font-pixel text-xs mt-2', text: r.name })
          );
          scrollRow.appendChild(mini);
        }
      });
      view.appendChild(scrollRow);
    }

    // ── Weekly Stats Card ──
    const thisWeek = Store.getMealsByRange(Format.weekStart(), Format.today());
    if (thisWeek.length > 0) {
      const allRecipeMap = {};
      allRecipes.forEach(r => { allRecipeMap[r.id] = r; });
      const nutrition = Format.calcMealNutrition(thisWeek, allRecipeMap);

      view.appendChild(DOM.create('div', { className: 'font-pixel text-sm mb-2 mt-6', style: 'color: var(--color-primary);', text: '📊 本周概览' }));

      const statsCard = DOM.create('div', { className: 'pixel-card', style: 'padding: var(--space-4);' },
        DOM.create('div', { className: 'flex justify-between items-center', style: 'margin-bottom: var(--space-3);' },
          DOM.create('span', { className: 'font-pixel text-sm', text: `本周做饭 ${thisWeek.length} 次` }),
          DOM.create('span', { className: 'font-pixel text-xs text-muted', text: `${Format.date(Format.weekStart())} - 今天` })
        ),
        DOM.create('div', { className: 'pixel-grid pixel-grid--2 gap-2' },
          this._statChip('🔥 热量', Math.round(nutrition.calories / Math.max(1, new Date().getDay() || 7)) + '/天'),
          this._statChip('💪 蛋白', Math.round(nutrition.protein) + 'g'),
          this._statChip('🍚 碳水', Math.round(nutrition.carbs) + 'g'),
          this._statChip('🥩 脂肪', Math.round(nutrition.fat) + 'g')
        )
      );
      view.appendChild(statsCard);
    }

    return view;
  },

  _createRecipeCard(recipe) {
    return DOM.create('div', { className: 'recipe-card', style: 'margin-bottom: var(--space-3);' },
      DOM.create('div', { className: 'recipe-card__image', text: recipe.emoji }),
      DOM.create('div', { className: 'recipe-card__body' },
        DOM.create('div', { className: 'recipe-card__title', text: recipe.name }),
        DOM.create('div', { className: 'recipe-card__meta' },
          DOM.create('span', { className: 'pixel-badge pixel-badge--' + (recipe.difficulty === 1 ? 'easy' : recipe.difficulty === 2 ? 'medium' : 'hard'), text: Format.difficultyText(recipe.difficulty) }),
          DOM.create('span', { className: 'recipe-card__time', text: recipe.prepTime + recipe.cookTime + '分钟' }),
          DOM.create('span', { className: 'pixel-stars', text: '★'.repeat(Math.round(recipe.tasteRating)) })
        )
      )
    );
  },

  _statChip(label, value) {
    return DOM.create('div', { style: 'padding: var(--space-2); background: var(--color-bg-warm); border: var(--pixel-1) solid var(--color-border-pixel); text-align: center;' },
      DOM.create('div', { className: 'text-xs text-muted', text: label }),
      DOM.create('div', { className: 'font-pixel text-sm', style: 'color: var(--color-primary);', text: value })
    );
  },
};
