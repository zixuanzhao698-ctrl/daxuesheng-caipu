// ╔══════════════════════════════════════╗
// ║  Cooking Diary View                ║
// ║  Weekly/Monthly/Yearly Reports     ║
// ╚══════════════════════════════════════╝

const DiaryView = {
  _period: 'week', // week | month | year
  _cursorDate: Format.today(),

  async render(params) {
    // Check for period param
    if (params.query && params.query.period) {
      this._period = params.query.period;
    }
    if (params.query && params.query.date) {
      this._cursorDate = params.query.date;
    }

    const view = DOM.create('div', { className: 'view' });

    // ── Header ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('h1', { className: 'page-header__title', text: '📝 做饭日记' }),
      DOM.create('div', {
        className: 'pixel-chip', style: 'cursor: pointer;',
        text: '📊 饮食追踪 →',
        onClick: () => Router.go('/nutrition'),
      })
    ));

    // ── Period Tabs ──
    const tabBar = DOM.create('div', { className: 'flex mb-4' });
    [
      { id: 'week', label: '📅 周报' },
      { id: 'month', label: '📆 月报' },
      { id: 'year', label: '📊 年报' },
    ].forEach(tab => {
      const tabEl = DOM.create('div', {
        className: 'pixel-tab' + (this._period === tab.id ? ' pixel-tab--active' : ''),
        style: 'flex: 1;',
        text: tab.label,
        onClick: () => {
          this._period = tab.id;
          this._cursorDate = Format.today();
          this._renderContent(view);
          DOM.$$('.pixel-tab', tabBar).forEach(t => DOM.toggleClass(t, 'pixel-tab--active', false));
          DOM.toggleClass(tabEl, 'pixel-tab--active', true);
        },
      });
      tabBar.appendChild(tabEl);
    });
    view.appendChild(tabBar);

    // ── Date Navigation ──
    const dateNav = DOM.create('div', { className: 'flex items-center justify-between mb-4' });
    dateNav.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      text: '◀',
      onClick: () => {
        this._navigateDate(-1);
        this._renderContent(view);
      },
    }));
    const dateLabel = DOM.create('span', {
      id: 'diary-date-label',
      className: 'font-pixel text-sm',
      style: 'color: var(--color-primary);',
    });
    dateNav.appendChild(dateLabel);
    dateNav.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      text: '▶',
      onClick: () => {
        this._navigateDate(1);
        this._renderContent(view);
      },
    }));
    view.appendChild(dateNav);

    // ── Content area ──
    const contentArea = DOM.create('div', { id: 'diary-content' });
    view.appendChild(contentArea);

    this._renderContent(view);
    return view;
  },

  _renderContent(view) {
    const contentArea = DOM.$('#diary-content', view);
    const dateLabel = DOM.$('#diary-date-label', view);
    if (!contentArea) return;

    DOM.empty(contentArea);

    const { startDate, endDate } = this._getPeriodRange();
    const allRecipes = [
      ...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []),
      ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : []),
    ];
    const recipeMap = {};
    allRecipes.forEach(r => { recipeMap[r.id] = r; });

    const meals = Store.getMealsByRange(startDate, endDate);
    const cookLogsInRange = Store.get('cookLog').filter(l => l.date >= startDate && l.date <= endDate);

    // Update date label
    if (dateLabel) {
      if (this._period === 'week') {
        const weekEnd = new Date(startDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndStr = weekEnd.toISOString().slice(0, 10);
        dateLabel.textContent = Format.date(startDate) + ' - ' + Format.date(weekEndStr);
      } else if (this._period === 'month') {
        dateLabel.textContent = this._cursorDate.slice(0, 7);
      } else {
        dateLabel.textContent = this._cursorDate.slice(0, 4) + '年';
      }
    }

    // ── No Data Empty State ──
    if (meals.length === 0) {
      contentArea.appendChild(DOM.create('div', { className: 'empty-state' },
        DOM.create('div', { className: 'empty-state__icon', text: '🍳' }),
        DOM.create('p', { className: 'empty-state__text', text: '这个周期还没有做饭记录~\n快去选个菜谱开始下厨吧！' }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--secondary mt-3',
          text: '📖 浏览菜谱',
          onClick: () => Router.go('/browse'),
        })
      ));
      return;
    }

    // ── Stats ──
    const uniqueRecipeIds = new Set(meals.map(m => m.recipeId));
    const totalMeals = meals.length;
    const uniqueDishes = uniqueRecipeIds.size;
    const cookingDays = new Set(meals.map(m => m.date)).size;
    const avgRating = cookLogsInRange.length > 0
      ? (cookLogsInRange.reduce((sum, l) => sum + l.rating, 0) / cookLogsInRange.length).toFixed(1)
      : 0;

    // ── Summary Section ──
    const summarySection = DOM.create('div', { className: 'report-section' });
    summarySection.appendChild(DOM.create('div', { className: 'report-section__title', text: '📋 概览' }));

    const summaryText = this._period === 'week'
      ? '本周你做了 ' + uniqueDishes + ' 道菜，累计下厨 ' + totalMeals + ' 次'
      : this._period === 'month'
        ? '本月你做了 ' + uniqueDishes + ' 道菜，累计下厨 ' + totalMeals + ' 次'
        : '今年你做了 ' + uniqueDishes + ' 道菜，累计下厨 ' + totalMeals + ' 次';

    summarySection.appendChild(DOM.create('p', {
      className: 'font-pixel text-sm mb-3',
      style: 'color: var(--color-text-primary);',
      text: summaryText,
    }));

    // Stat rows
    const statGrid = DOM.create('div', { className: 'pixel-grid pixel-grid--2 gap-2 mb-3' });
    const daysInPeriod = this._period === 'week' ? 7 : this._period === 'month'
      ? new Date(parseInt(this._cursorDate.slice(0, 4)), parseInt(this._cursorDate.slice(5, 7)), 0).getDate()
      : 365;

    statGrid.appendChild(this._statItem('🍳 做饭次数', totalMeals + ' 次'));
    statGrid.appendChild(this._statItem('📅 下厨天数', cookingDays + '/' + daysInPeriod + ' 天'));
    statGrid.appendChild(this._statItem('🍽️ 不同菜品', uniqueDishes + ' 道'));
    if (cookLogsInRange.length > 0) {
      statGrid.appendChild(this._statItem('⭐ 平均评分', avgRating + ' 分'));
    }

    // Cost savings
    const homeCost = totalMeals * 10;
    const takeoutCost = totalMeals * CONFIG.avgTakeoutCost;
    const saved = takeoutCost - homeCost;
    statGrid.appendChild(this._statItem('💰 对比外卖', '省 ¥' + Math.round(saved)));
    statGrid.appendChild(this._statItem('🏠 做饭花费', '约 ¥' + homeCost));

    summarySection.appendChild(statGrid);

    // Cost detail
    summarySection.appendChild(DOM.create('div', {
      className: 'text-xs text-muted mb-3',
      style: 'padding: var(--space-3); background: var(--color-bg-warm); border: var(--pixel-1) solid var(--color-border-pixel);',
    },
      DOM.create('p', { text: '💡 按每顿外卖 ¥' + CONFIG.avgTakeoutCost + ' vs 自己做饭约 ¥10 估算' }),
      DOM.create('p', { text: '外卖总花费: ¥' + takeoutCost + ' | 做饭总花费: 约 ¥' + homeCost }),
      DOM.create('p', { style: 'color: var(--color-success); font-weight: bold;', text: '节省: ¥' + Math.round(saved) + (saved >= 500 ? ' 🎉' : '') })
    ));
    contentArea.appendChild(summarySection);

    // ── Top 5 Most Cooked ──
    const recipeCounts = {};
    meals.forEach(m => {
      recipeCounts[m.recipeId] = (recipeCounts[m.recipeId] || 0) + 1;
    });
    const sortedRecipes = Object.entries(recipeCounts)
      .map(([id, count]) => ({ id, count, recipe: recipeMap[id] }))
      .filter(r => r.recipe)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (sortedRecipes.length > 0) {
      const topSection = DOM.create('div', { className: 'report-section' });
      topSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '🏆 最爱菜品 TOP ' + sortedRecipes.length }));

      sortedRecipes.forEach((item, idx) => {
        let rankClass = '';
        let rankEmoji = '';
        if (idx === 0) { rankClass = 'report-rank-num--gold'; rankEmoji = '🥇'; }
        else if (idx === 1) { rankClass = 'report-rank-num--silver'; rankEmoji = '🥈'; }
        else if (idx === 2) { rankClass = 'report-rank-num--bronze'; rankEmoji = '🥉'; }

        topSection.appendChild(DOM.create('div', { className: 'report-rank-item' },
          DOM.create('div', { className: 'report-rank-num' + (rankClass ? ' ' + rankClass : ''), text: rankEmoji || String(idx + 1) }),
          DOM.create('span', { text: item.recipe.emoji, style: 'font-size: 24px;' }),
          DOM.create('span', {
            className: 'font-pixel text-sm',
            style: 'flex: 1;',
            text: item.recipe.name,
          }),
          DOM.create('span', {
            className: 'font-pixel text-xs',
            style: 'color: var(--color-primary);',
            text: '×' + item.count,
          })
        ));
      });
      contentArea.appendChild(topSection);
    }

    // ── "回头菜" Section (recipes cooked >= 2 times) ──
    const repeatRecipes = sortedRecipes.filter(r => r.count >= 2);
    if (repeatRecipes.length > 0) {
      const repeatSection = DOM.create('div', { className: 'report-section' });
      repeatSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '🔄 回头菜（做过2次以上）' }));
      repeatSection.appendChild(DOM.create('p', {
        className: 'text-xs text-muted mb-2',
        text: '这些菜你反复在做，看来是真爱！一共 ' + repeatRecipes.length + ' 道回头菜',
      }));

      repeatRecipes.forEach(r => {
        repeatSection.appendChild(DOM.create('div', { className: 'report-rank-item' },
          DOM.create('span', { text: r.recipe.emoji, style: 'font-size: 20px;' }),
          DOM.create('span', { className: 'font-pixel text-sm', style: 'flex: 1;', text: r.recipe.name }),
          DOM.create('span', { className: 'font-pixel text-xs', style: 'color: var(--color-primary);', text: '做了 ' + r.count + ' 次' })
        ));
      });
      contentArea.appendChild(repeatSection);
    }

    // ── "新尝试" Section (first-time recipes this period) ──
    const allCookLogsPast = Store.get('cookLog').filter(l => l.date < startDate);
    const pastRecipeIds = new Set(allCookLogsPast.map(l => l.recipeId));

    const firstTimeIds = [...uniqueRecipeIds].filter(id => !pastRecipeIds.has(id));
    const firstTimeRecipes = firstTimeIds.map(id => recipeMap[id]).filter(r => r);

    if (firstTimeRecipes.length > 0) {
      const newSection = DOM.create('div', { className: 'report-section' });
      newSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '🆕 新尝试（首次挑战）' }));
      newSection.appendChild(DOM.create('p', {
        className: 'text-xs text-muted mb-2',
        text: '这个周期你勇敢尝试了 ' + firstTimeRecipes.length + ' 道新菜！',
      }));

      firstTimeRecipes.slice(0, 10).forEach(r => {
        const count = recipeCounts[r.id] || 1;
        newSection.appendChild(DOM.create('div', { className: 'report-rank-item' },
          DOM.create('span', { text: r.emoji, style: 'font-size: 20px;' }),
          DOM.create('span', { className: 'font-pixel text-sm', style: 'flex: 1;', text: r.name }),
          DOM.create('span', { className: 'font-pixel text-xs', style: 'color: var(--color-text-muted);', text: Format.difficultyStars(r.difficulty) }),
          DOM.create('span', { className: 'font-pixel text-xs', style: 'color: var(--color-primary); margin-left: var(--space-2);', text: '×' + count })
        ));
      });
      contentArea.appendChild(newSection);
    }

    // ── Cuisine Preference Analysis ──
    const cuisineCounts = {};
    meals.forEach(m => {
      const recipe = recipeMap[m.recipeId];
      if (recipe && recipe.cuisine) {
        cuisineCounts[recipe.cuisine] = (cuisineCounts[recipe.cuisine] || 0) + 1;
      }
    });
    const sortedCuisines = Object.entries(cuisineCounts).sort((a, b) => b[1] - a[1]);

    if (sortedCuisines.length > 0) {
      const cuisineSection = DOM.create('div', { className: 'report-section' });
      cuisineSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '🍜 菜系偏好分析' }));

      const maxCount = sortedCuisines[0][1];
      sortedCuisines.forEach(([cuisine, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        cuisineSection.appendChild(DOM.create('div', { className: 'report-bar' },
          DOM.create('div', { className: 'report-bar__label', text: cuisine }),
          DOM.create('div', { className: 'report-bar__track' },
            DOM.create('div', {
              className: 'report-bar__fill',
              style: 'width: ' + pct + '%;',
            })
          ),
          DOM.create('div', { className: 'report-bar__count', text: String(count) + '次' })
        ));
      });
      contentArea.appendChild(cuisineSection);
    }

    // ── Ingredient Frequency Analysis ──
    const ingredientCounts = {};
    meals.forEach(m => {
      const recipe = recipeMap[m.recipeId];
      if (recipe) {
        recipe.ingredients.forEach(ing => {
          ingredientCounts[ing.name] = (ingredientCounts[ing.name] || 0) + 1;
        });
      }
    });
    const sortedIngredients = Object.entries(ingredientCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    if (sortedIngredients.length > 0) {
      const ingSection = DOM.create('div', { className: 'report-section' });
      ingSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '🧺 常用食材排行' }));

      const maxIng = sortedIngredients[0][1];
      sortedIngredients.forEach(([name, count]) => {
        const pct = Math.round((count / maxIng) * 100);
        ingSection.appendChild(DOM.create('div', { className: 'report-bar' },
          DOM.create('div', { className: 'report-bar__label', text: name }),
          DOM.create('div', { className: 'report-bar__track' },
            DOM.create('div', {
              className: 'report-bar__fill',
              style: 'width: ' + pct + '%; background: var(--color-secondary);',
            })
          ),
          DOM.create('div', { className: 'report-bar__count', text: String(count) + '次' })
        ));
      });
      contentArea.appendChild(ingSection);
    }

    // ── Nutrition Trend Summary ──
    const nutrition = Format.calcMealNutrition(meals, recipeMap);
    const settings = Store.get('settings') || CONFIG.defaults;
    const avgPerDay = cookingDays > 0 ? cookingDays : 1;

    const nutSection = DOM.create('div', { className: 'report-section' });
    nutSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '📊 营养趋势' }));

    nutSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
      DOM.create('span', { text: '🔥 日均热量' }),
      DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-primary);', text: Math.round(nutrition.calories / avgPerDay) + ' kcal' }),
    ));
    nutSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
      DOM.create('span', { text: '💪 蛋白质日均' }),
      DOM.create('span', { className: 'font-pixel', style: 'color: ' + Format.nutritionColor(nutrition.protein / avgPerDay, settings.dailyProtein) + ';', text: Math.round(nutrition.protein / avgPerDay) + 'g / ' + settings.dailyProtein + 'g' }),
    ));
    nutSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
      DOM.create('span', { text: '🍚 碳水日均' }),
      DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-text-muted);', text: Math.round(nutrition.carbs / avgPerDay) + 'g' }),
    ));
    nutSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
      DOM.create('span', { text: '🥩 脂肪日均' }),
      DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-text-muted);', text: Math.round(nutrition.fat / avgPerDay) + 'g' }),
    ));
    if (nutrition.fiber > 0) {
      nutSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
        DOM.create('span', { text: '🥬 纤维日均' }),
        DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-text-muted);', text: Math.round(nutrition.fiber / avgPerDay) + 'g' }),
      ));
    }
    contentArea.appendChild(nutSection);

    // ── Yearly: Achievements ──
    if (this._period === 'year') {
      const achievements = Store.get('achievements') || {};
      const unlockedList = Object.entries(achievements).filter(([_, v]) => v && v.unlocked);

      if (unlockedList.length > 0) {
        const achSection = DOM.create('div', { className: 'report-section' });
        achSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '🏅 年度成就' }));

        const achGrid = DOM.create('div', { className: 'pixel-grid pixel-grid--3 gap-2' });
        unlockedList.forEach(([achId, achData]) => {
          const achDef = CONFIG.achievements.find(a => a.id === achId);
          if (!achDef) return;
          achGrid.appendChild(DOM.create('div', { className: 'achievement-badge' },
            DOM.create('div', { className: 'achievement-badge__icon', text: achDef.emoji }),
            DOM.create('div', { className: 'achievement-badge__name', text: achDef.name }),
            DOM.create('div', {
              className: 'text-xs text-muted',
              style: 'font-size: 6px;',
              text: achData.unlockedAt ? Format.date(new Date(achData.unlockedAt).toISOString().slice(0, 10)) : '',
            })
          ));
        });
        achSection.appendChild(achGrid);
        contentArea.appendChild(achSection);
      }

      // Yearly cumulative stats
      const yearNutrition = Format.calcMealNutrition(meals, recipeMap);
      const cumSection = DOM.create('div', { className: 'report-section' });
      cumSection.appendChild(DOM.create('div', { className: 'report-section__title', text: '📈 年度累计' }));
      cumSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
        DOM.create('span', { text: '累计热量摄入' }),
        DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-primary);', text: Format.calories(yearNutrition.calories) }),
      ));
      cumSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
        DOM.create('span', { text: '累计蛋白质' }),
        DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-text-muted);', text: Format.grams(yearNutrition.protein) }),
      ));
      cumSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
        DOM.create('span', { text: '做饭总花费（估）' }),
        DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-text-muted);', text: '¥' + (totalMeals * 10) }),
      ));
      cumSection.appendChild(DOM.create('div', { className: 'report-stat-row' },
        DOM.create('span', { text: '对比外卖节省' }),
        DOM.create('span', { className: 'font-pixel', style: 'color: var(--color-success);', text: '¥' + Math.round(saved) }),
      ));
      contentArea.appendChild(cumSection);
    }

    // ── Footer note ──
    contentArea.appendChild(DOM.create('p', {
      className: 'text-center text-xs text-muted mt-6',
      text: '统计周期: ' + Format.date(startDate) + ' - ' + Format.date(endDate),
    }));
  },

  _getPeriodRange() {
    let startDate, endDate;
    if (this._period === 'week') {
      startDate = Format.weekStart(this._cursorDate);
      const end = new Date(startDate);
      end.setDate(end.getDate() + 6);
      endDate = end.toISOString().slice(0, 10);
      if (endDate > Format.today()) endDate = Format.today();
    } else if (this._period === 'month') {
      startDate = Format.monthStart(this._cursorDate);
      const y = parseInt(this._cursorDate.slice(0, 4));
      const m = parseInt(this._cursorDate.slice(5, 7));
      const lastDay = new Date(y, m, 0).getDate();
      const todayStr = Format.today();
      const monthEnd = y + '-' + String(m).padStart(2, '0') + '-' + String(lastDay).padStart(2, '0');
      endDate = monthEnd > todayStr ? todayStr : monthEnd;
    } else {
      startDate = this._cursorDate.slice(0, 4) + '-01-01';
      const yearEnd = this._cursorDate.slice(0, 4) + '-12-31';
      const todayStr = Format.today();
      endDate = yearEnd > todayStr ? todayStr : yearEnd;
    }
    return { startDate, endDate };
  },

  _navigateDate(dir) {
    const d = new Date(this._cursorDate);
    if (this._period === 'week') {
      d.setDate(d.getDate() + dir * 7);
    } else if (this._period === 'month') {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setFullYear(d.getFullYear() + dir);
    }
    this._cursorDate = d.toISOString().slice(0, 10);
  },

  _statItem(label, value) {
    return DOM.create('div', {
      style: 'padding: var(--space-2); background: var(--color-bg-warm); border: var(--pixel-1) solid var(--color-border-pixel); text-align: center;',
    },
      DOM.create('div', { className: 'text-xs text-muted', text: label }),
      DOM.create('div', { className: 'font-pixel text-sm', style: 'color: var(--color-primary);', text: value })
    );
  },
};
