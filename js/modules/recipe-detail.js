// ╔══════════════════════════════════════╗
// ║  Recipe Detail View                ║
// ╚══════════════════════════════════════╝

const RecipeDetailView = {
  _recipe: null,

  async render(params) {
    const recipeId = params.id;
    const allRecipes = [...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []), ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : [])];
    this._recipe = allRecipes.find(r => r.id === recipeId);

    if (!this._recipe) {
      return DOM.create('div', { className: 'view' },
        DOM.create('div', { className: 'empty-state' },
          DOM.create('div', { className: 'empty-state__icon', text: '🔍' }),
          DOM.create('p', { className: 'empty-state__text', text: '找不到这个菜谱~' }),
          DOM.create('button', { className: 'pixel-btn pixel-btn--secondary mt-3', text: '← 返回菜谱库', onClick: () => Router.go('/browse') })
        )
      );
    }

    const recipe = this._recipe;
    const view = DOM.create('div', { className: 'view' });
    view.style.padding = '0';

    // ── Back button ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('div', { className: 'page-header__back', text: '←', onClick: () => window.history.back() }),
      DOM.create('h1', { className: 'page-header__title', text: recipe.name })
    ));

    // ── Recipe Hero ──
    const hero = DOM.create('div', { className: 'recipe-hero' },
      DOM.create('div', { className: 'recipe-hero__icon', text: recipe.emoji }),
      DOM.create('h2', { className: 'recipe-hero__name', text: recipe.name }),
      DOM.create('div', { className: 'recipe-meta-bar' },
        this._metaItem('⏱️', (recipe.prepTime + recipe.cookTime) + '分钟'),
        this._metaItem('📊', Format.difficultyStars(recipe.difficulty)),
        this._metaItem('⭐', recipe.tasteRating + '分'),
        this._metaItem('🍽️', recipe.servings + '人份')
      )
    );
    if (recipe.cuisine) {
      hero.appendChild(DOM.create('p', { className: 'text-xs text-muted mt-3', text: '菜系: ' + recipe.cuisine + (recipe.tags ? ' | ' + recipe.tags.slice(0, 3).join(' · ') : '') }));
    }
    view.appendChild(hero);

    // ── Content sections (wrapped in padding) ──
    const body = DOM.create('div', { style: 'padding: 0 var(--space-4);' });

    // ── Action Bar ──
    const actionBar = DOM.create('div', { className: 'flex gap-2 mb-4', style: 'flex-wrap: wrap;' });
    const isFav = Store.isFavorite(recipe.id);
    const likeCount = Store.getLikes(recipe.id);

    actionBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      html: (isFav ? '❤️' : '🤍') + ' 收藏',
      onClick: () => {
        const added = Store.toggleFavorite(recipe.id);
        actionBar.querySelector('button').innerHTML = (added ? '❤️' : '🤍') + ' 收藏';
        App.showToast(added ? '已收藏 ⭐' : '已取消收藏');
      },
    }));
    actionBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      html: '👍 ' + likeCount,
      onClick: () => {
        const count = Store.toggleLike(recipe.id);
        actionBar.querySelectorAll('button')[1].innerHTML = '👍 ' + count;
      },
    }));
    actionBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small',
      text: '✅ 我做过',
      onClick: () => this._showCookedModal(recipe),
    }));
    actionBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small',
      style: 'background: var(--color-text-primary); border-color: var(--color-text-primary);',
      text: '👨‍🍳 开始烹饪',
      onClick: () => Router.go('/recipe/' + recipe.id + '/cook'),
    }));
    body.appendChild(actionBar);

    // ── Ingredients ──
    body.appendChild(DOM.create('h3', { className: 'font-pixel text-sm mb-3', style: 'color: var(--color-primary);', text: '📋 食材清单' }));

    const ingredientList = DOM.create('div', { className: 'ingredient-list mb-4' });
    recipe.ingredients.forEach(ing => {
      const item = DOM.create('div', { className: 'ingredient-item' },
        DOM.create('div', {
          className: 'ingredient-item__check',
          text: '',
          onClick: function () {
            DOM.toggleClass(this, 'ingredient-item__check--done');
            this.textContent = this.classList.contains('ingredient-item__check--done') ? '✓' : '';
          },
        }),
        DOM.create('span', { className: 'ingredient-item__name', text: ing.name }),
        DOM.create('span', { className: 'ingredient-item__amount', text: ing.amount + ' ' + ing.unit }),
        ing.optional ? DOM.create('span', { className: 'ingredient-item__optional', text: '可选' }) : null
      );
      if (ing.alternatives && ing.alternatives.length > 0) {
        const alt = DOM.create('span', { className: 'text-xs text-muted', style: 'margin-left: var(--space-1);', text: '替代: ' + ing.alternatives.join('、') });
        item.appendChild(alt);
      }
      ingredientList.appendChild(item);
    });
    body.appendChild(ingredientList);

    // Add all to shopping list button
    body.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary mb-4',
      text: '🛒 缺少食材？加入采购清单',
      onClick: () => {
        recipe.ingredients.filter(i => !i.optional).forEach(ing => {
          Store.addToShoppingList({ ingredientName: ing.name, amount: ing.amount, unit: ing.unit, neededFor: [recipe.name] });
        });
        App.showToast('已加入采购清单 ✅');
      },
    }));

    body.appendChild(DOM.create('hr', { className: 'pixel-divider' }));

    // ── Cooking Steps ──
    body.appendChild(DOM.create('h3', { className: 'font-pixel text-sm mb-3', style: 'color: var(--color-primary);', text: '👨‍🍳 做菜教程' }));

    const stepList = DOM.create('div', { className: 'step-list mb-4' });
    recipe.steps.forEach(step => {
      const stepItem = DOM.create('div', { className: 'step-item' },
        DOM.create('div', { className: 'step-item__number', text: String(step.order) }),
        DOM.create('div', { className: 'step-item__content' },
          DOM.create('p', { text: step.instruction }),
          step.tip ? DOM.create('p', { className: 'text-xs text-muted', style: 'margin-top: var(--space-1);', text: '💡 ' + step.tip }) : null,
          step.duration ? DOM.create('span', {
            className: 'step-item__timer',
            text: '⏱️ ' + step.duration + '秒',
            onClick: () => {
              // Start timer (could integrate with cooking timer)
              App.showToast('计时器: ' + step.duration + '秒 ⏱️');
            },
          }) : null
        )
      );
      stepList.appendChild(stepItem);
    });
    body.appendChild(stepList);

    // ── Pro Tips ──
    if (recipe.tips && recipe.tips.length > 0) {
      body.appendChild(DOM.create('div', { className: 'pixel-card mb-4', style: 'background: var(--color-bg-warm);' },
        DOM.create('div', { className: 'font-pixel text-xs mb-2', style: 'color: var(--color-primary);', text: '💡 厨艺小贴士' }),
        ...recipe.tips.map(t => DOM.create('p', { className: 'text-sm', style: 'margin-bottom: var(--space-1);', text: '• ' + t }))
      ));
    }

    body.appendChild(DOM.create('hr', { className: 'pixel-divider' }));

    // ── Nutrition Facts ──
    body.appendChild(DOM.create('h3', { className: 'font-pixel text-sm mb-3', style: 'color: var(--color-primary);', text: '📊 营养信息（每份）' }));
    const nutritionPanel = DOM.create('div', { className: 'nutrition-facts mb-4' },
      DOM.create('div', { className: 'nutrition-facts__title', text: '营养成份表' }),
      DOM.create('div', { className: 'nutrition-facts__row' }, DOM.create('span', { text: '热量' }), DOM.create('span', { text: Format.calories(recipe.nutrition.calories) })),
      DOM.create('div', { className: 'nutrition-facts__row' }, DOM.create('span', { text: '蛋白质' }), DOM.create('span', { text: Format.grams(recipe.nutrition.protein) })),
      DOM.create('div', { className: 'nutrition-facts__row' }, DOM.create('span', { text: '碳水化合物' }), DOM.create('span', { text: Format.grams(recipe.nutrition.carbs) })),
      DOM.create('div', { className: 'nutrition-facts__row' }, DOM.create('span', { text: '脂肪' }), DOM.create('span', { text: Format.grams(recipe.nutrition.fat) })),
      recipe.nutrition.fiber ? DOM.create('div', { className: 'nutrition-facts__row' }, DOM.create('span', { text: '膳食纤维' }), DOM.create('span', { text: Format.grams(recipe.nutrition.fiber) })) : null,
      DOM.create('div', { className: 'nutrition-facts__row nutrition-facts__row--bold' }, DOM.create('span', { text: '每份约' }), DOM.create('span', { text: recipe.servings + '人份' }))
    );
    body.appendChild(nutritionPanel);

    // ── Equipment ──
    if (recipe.equipment && recipe.equipment.length > 0) {
      body.appendChild(DOM.create('div', { className: 'mb-4' },
        DOM.create('span', { className: 'text-xs text-muted', text: '🪇 所需厨具: ' }),
        ...recipe.equipment.map(eq => DOM.create('span', { className: 'pixel-chip', style: 'margin: 2px;', text: eq }))
      ));
    }

    // ── Similar Recipes ──
    body.appendChild(DOM.create('hr', { className: 'pixel-divider' }));
    body.appendChild(DOM.create('h3', { className: 'font-pixel text-sm mb-3', style: 'color: var(--color-primary);', text: '🔗 相关推荐' }));

    // Find similar recipes (same cuisine or shared ingredients)
    const similar = allRecipes
      .filter(r => r.id !== recipe.id)
      .map(r => {
        const sharedIngredients = r.ingredients.filter(ri =>
          recipe.ingredients.some(oi => oi.name === ri.name)
        ).length;
        return { recipe: r, shared: sharedIngredients };
      })
      .filter(r => r.shared >= 2 || r.recipe.cuisine === recipe.cuisine)
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 4);

    if (similar.length > 0) {
      const simRow = DOM.create('div', { className: 'scroll-row' });
      similar.forEach(s => {
        simRow.appendChild(DOM.create('div', {
          className: 'pixel-card pixel-card--clickable',
          style: 'width: 140px; text-align: center; padding: var(--space-3);',
          onClick: () => Router.go('/recipe/' + s.recipe.id),
        },
          DOM.create('div', { text: s.recipe.emoji, style: 'font-size: 32px;' }),
          DOM.create('div', { className: 'font-pixel text-xs mt-2', text: s.recipe.name }),
          DOM.create('div', { className: 'text-xs text-muted mt-1', text: Format.difficultyStars(s.recipe.difficulty) })
        ));
      });
      body.appendChild(simRow);
    }

    // ── User Notes ──
    const notes = Store.getNotes(recipe.id);
    if (notes.length > 0) {
      body.appendChild(DOM.create('hr', { className: 'pixel-divider' }));
      body.appendChild(DOM.create('h3', { className: 'font-pixel text-sm mb-3', style: 'color: var(--color-primary);', text: '📝 我的心得 (' + notes.length + ')' }));
      notes.slice(-5).reverse().forEach(n => {
        body.appendChild(DOM.create('div', { className: 'pixel-card mb-2', style: 'background: var(--color-bg-warm);' },
          DOM.create('p', { className: 'text-sm', text: n.text }),
          DOM.create('p', { className: 'text-xs text-muted mt-1', text: Format.date(n.date) })
        ));
      });
    }

    view.appendChild(body);

    // Bottom spacing
    view.appendChild(DOM.create('div', { style: 'height: var(--space-8);' }));

    return view;
  },

  _metaItem(label, value) {
    return DOM.create('div', { className: 'recipe-meta-item' },
      DOM.create('span', { className: 'recipe-meta-item__value', text: value }),
      DOM.create('span', { text: label })
    );
  },

  _showCookedModal(recipe) {
    const content = DOM.create('div', {});

    content.appendChild(DOM.create('p', { className: 'font-pixel text-sm mb-4', text: '✅ 标记「' + recipe.name + '」为已做' }));

    // Rating
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '评分' }));
    const ratingRow = DOM.create('div', { className: 'flex gap-2 mb-3 mt-1' });
    let rating = 5;
    [1, 2, 3, 4, 5].forEach(i => {
      ratingRow.appendChild(DOM.create('span', {
        text: i <= rating ? '⭐' : '☆',
        style: 'font-size: 24px; cursor: pointer;',
        onClick: function () {
          rating = i;
          DOM.$$('span', ratingRow).forEach((s, idx) => { s.textContent = idx < i ? '⭐' : '☆'; });
        },
      }));
    });
    content.appendChild(ratingRow);

    // Actual time
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '实际用时（分钟）' }));
    const timeInput = DOM.create('input', {
      className: 'pixel-input mt-1 mb-3',
      type: 'number',
      placeholder: String(recipe.prepTime + recipe.cookTime),
      value: String(recipe.prepTime + recipe.cookTime),
    });
    content.appendChild(timeInput);

    // Notes
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '心得笔记' }));
    const noteInput = DOM.create('textarea', {
      className: 'pixel-input mt-1 mb-3',
      placeholder: '例如: 糖减半更好吃...',
      rows: '2',
      style: 'resize: none;',
    });
    content.appendChild(noteInput);

    // Submit
    content.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--block',
      text: '✅ 确认提交',
      onClick: () => {
        Store.addCookLog({
          recipeId: recipe.id,
          rating,
          actualTime: parseInt(timeInput.value) || (recipe.prepTime + recipe.cookTime),
          notes: noteInput.value.trim(),
        });
        if (noteInput.value.trim()) {
          Store.addNote(recipe.id, noteInput.value.trim());
        }
        Store.addMealRecord({
          recipeId: recipe.id,
          mealType: 'lunch',
          portions: 1,
        });
        App.showToast('已记录！同时加入今日饮食 📊');
        modal.close();
      },
    }));
    content.appendChild(DOM.create('p', { className: 'text-xs text-muted text-center mt-2', text: '提交后会自动记录到今日饮食追踪' }));

    const modal = App.showModal(content);
  },
};
