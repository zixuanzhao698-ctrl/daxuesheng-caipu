// ╔══════════════════════════════════════╗
// ║  Favorites View                    ║
// ║  Grid of favorited recipes         ║
// ╚══════════════════════════════════════╝

const FavoritesView = {
  async render(params) {
    const view = DOM.create('div', { className: 'view' });

    // ── Header ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('h1', { className: 'page-header__title', text: '❤️ 我的收藏' })
    ));

    const favorites = Store.get('favorites') || [];
    const allRecipes = [
      ...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []),
      ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : []),
    ];

    // ── Empty State ──
    if (favorites.length === 0) {
      view.appendChild(DOM.create('div', { className: 'empty-state' },
        DOM.create('div', { className: 'empty-state__icon', text: '💝' }),
        DOM.create('p', { className: 'empty-state__text', text: '还没有收藏菜谱~\n浏览菜谱时点击 ❤️ 即可收藏' }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--secondary mt-3',
          text: '📖 去发现美味',
          onClick: () => Router.go('/browse'),
        })
      ));
      return view;
    }

    // ── Recipe Grid ──
    const favoritedRecipes = favorites
      .map(id => allRecipes.find(r => r.id === id))
      .filter(r => r);

    if (favoritedRecipes.length === 0) {
      // Data mismatch: favorites exist but recipes aren't loaded
      view.appendChild(DOM.create('div', { className: 'empty-state' },
        DOM.create('div', { className: 'empty-state__icon', text: '💝' }),
        DOM.create('p', { className: 'empty-state__text', text: '还没有收藏菜谱~\n浏览菜谱时点击 ❤️ 即可收藏' }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--secondary mt-3',
          text: '📖 去发现美味',
          onClick: () => Router.go('/browse'),
        })
      ));
      return view;
    }

    // Show count
    view.appendChild(DOM.create('p', {
      className: 'text-xs text-muted mb-4',
      text: '共收藏 ' + favoritedRecipes.length + ' 道菜谱',
    }));

    // Sort by taste rating
    favoritedRecipes.sort((a, b) => b.tasteRating - a.tasteRating);

    const grid = DOM.create('div', { className: 'pixel-grid pixel-grid--2' });
    favoritedRecipes.forEach(recipe => {
      grid.appendChild(this._createFavoriteCard(recipe));
    });
    view.appendChild(grid);

    // Bottom spacing
    view.appendChild(DOM.create('div', { style: 'height: var(--space-8);' }));

    return view;
  },

  _createFavoriteCard(recipe) {
    const card = DOM.create('div', {
      className: 'recipe-card',
      onClick: (e) => {
        // Don't navigate if unfavorite button was clicked
        if (e.target.closest('.recipe-card__fav')) return;
        Router.go('/recipe/' + recipe.id);
      },
    });

    // Image area with emoji
    card.appendChild(DOM.create('div', { className: 'recipe-card__image', text: recipe.emoji }));

    // Unfavorite button
    const favBtn = DOM.create('div', {
      className: 'recipe-card__fav recipe-card__fav--active',
      text: '❤️',
      onClick: (e) => {
        e.stopPropagation();
        Store.toggleFavorite(recipe.id);
        // Remove card with animation
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
        card.style.transition = 'all 200ms steps(6)';
        setTimeout(() => {
          card.remove();
          // If no more cards, show empty state
          const grid = card.parentElement;
          if (grid && grid.children.length === 0) {
            const view = grid.closest('.view');
            if (view) {
              const emptyState = DOM.create('div', { className: 'empty-state' },
                DOM.create('div', { className: 'empty-state__icon', text: '💝' }),
                DOM.create('p', { className: 'empty-state__text', text: '还没有收藏菜谱~\n浏览菜谱时点击 ❤️ 即可收藏' }),
                DOM.create('button', {
                  className: 'pixel-btn pixel-btn--secondary mt-3',
                  text: '📖 去发现美味',
                  onClick: () => Router.go('/browse'),
                })
              );
              // Replace grid with empty state
              const countText = view.querySelector('.text-xs.text-muted');
              if (countText) countText.textContent = '';

              // Find the grid and replace it
              const existingGrid = view.querySelector('.pixel-grid--2');
              if (existingGrid) {
                existingGrid.replaceWith(emptyState);
              }
            }
          }
        }, 250);
        App.showToast('已取消收藏 💔');
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

    // Tags row
    if (recipe.tags && recipe.tags.length > 0) {
      body.appendChild(DOM.create('div', {
        className: 'flex gap-1 mt-2',
        style: 'flex-wrap: wrap;',
      },
        ...recipe.tags.slice(0, 2).map(tag =>
          DOM.create('span', { className: 'pixel-chip', style: 'font-size: 7px; padding: 1px var(--space-2);', text: tag })
        )
      ));
    }

    card.appendChild(body);
    return card;
  },
};
