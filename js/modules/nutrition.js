// ╔══════════════════════════════════════╗
// ║  Nutrition Tracking View           ║
// ╚══════════════════════════════════════╝

const NutritionView = {
  _currentDate: Format.today(),
  _viewMode: 'day', // day | week | month

  async render(params) {
    const view = DOM.create('div', { className: 'view' });

    // ── Header ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('h1', { className: 'page-header__title', text: '📊 饮食追踪' }),
      DOM.create('div', {
        className: 'pixel-chip', style: 'cursor: pointer;',
        text: '📝 做饭日记 →',
        onClick: () => Router.go('/diary'),
      })
    ));

    // ── Date Selector ──
    const dateBar = DOM.create('div', { className: 'flex items-center justify-between mb-4' });
    dateBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      text: '◀',
      onClick: () => { this._navigateDate(-1); this._refreshView(view); },
    }));
    dateBar.appendChild(DOM.create('span', { className: 'font-pixel text-sm', id: 'nutrition-date-label', text: Format.date(this._currentDate, 'weekday') }));
    dateBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      text: '▶',
      onClick: () => { this._navigateDate(1); this._refreshView(view); },
    }));
    view.appendChild(dateBar);

    // ── View Mode Tabs ──
    const modeBar = DOM.create('div', { className: 'flex mb-4' });
    [
      { id: 'day', label: '日视图' },
      { id: 'week', label: '周视图' },
      { id: 'month', label: '月视图' },
    ].forEach(mode => {
      modeBar.appendChild(DOM.create('div', {
        className: 'pixel-tab' + (this._viewMode === mode.id ? ' pixel-tab--active' : ''),
        style: 'flex: 1;',
        text: mode.label,
        onClick: (e) => {
          this._viewMode = mode.id;
          DOM.$$('.pixel-tab', modeBar).forEach(t => DOM.toggleClass(t, 'pixel-tab--active', false));
          DOM.toggleClass(e.target, 'pixel-tab--active', true);
          this._refreshView(view);
        },
      }));
    });
    view.appendChild(modeBar);

    // ── Content area ──
    const contentArea = DOM.create('div', { id: 'nutrition-content' });
    view.appendChild(contentArea);

    this._refreshView(view);
    return view;
  },

  _refreshView(view) {
    const contentArea = DOM.$('#nutrition-content', view);
    if (!contentArea) return;

    // Update date label
    const label = DOM.$('#nutrition-date-label', view);
    if (label) {
      label.textContent = this._viewMode === 'day'
        ? Format.date(this._currentDate, 'weekday')
        : this._viewMode === 'week'
          ? Format.date(Format.weekStart(this._currentDate)) + ' - ' + Format.date(this._currentDate)
          : this._currentDate.slice(0, 7);
    }

    DOM.empty(contentArea);

    const allRecipes = [...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []), ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : [])];
    const recipeMap = {};
    allRecipes.forEach(r => { recipeMap[r.id] = r; });

    if (this._viewMode === 'day') {
      this._renderDayView(contentArea, recipeMap);
    } else if (this._viewMode === 'week') {
      this._renderWeekView(contentArea, recipeMap);
    } else {
      this._renderMonthView(contentArea, recipeMap);
    }
  },

  _renderDayView(container, recipeMap) {
    const meals = Store.getMealsByDate(this._currentDate);
    const settings = Store.get('settings') || CONFIG.defaults;
    const nutrition = Format.calcMealNutrition(meals, recipeMap);

    // ── Nutrition Rings ──
    const ringsArea = DOM.create('div', { className: 'nutrition-rings mb-4' });
    const goals = [
      { key: 'calories', label: '热量', current: nutrition.calories, goal: settings.dailyCalories, unit: 'kcal', emoji: '🔥' },
      { key: 'protein', label: '蛋白质', current: nutrition.protein, goal: settings.dailyProtein, unit: 'g', emoji: '💪' },
      { key: 'carbs', label: '碳水', current: nutrition.carbs, goal: settings.dailyCarbs, unit: 'g', emoji: '🍚' },
      { key: 'fat', label: '脂肪', current: nutrition.fat, goal: settings.dailyFat, unit: 'g', emoji: '🥩' },
    ];

    const today = this._currentDate === Format.today();

    goals.forEach(g => {
      const pct = Format.goalPercent(g.current, g.goal);
      const color = Format.nutritionColor(g.current, g.goal);
      ringsArea.appendChild(DOM.create('div', { className: 'nutrition-ring' },
        DOM.create('div', {
          className: 'nutrition-ring__circle',
          style: `border-color: ${color}; color: ${color};`,
          text: Math.round(g.current),
        }),
        DOM.create('div', { className: 'nutrition-ring__label', text: g.emoji + ' ' + g.label }),
        DOM.create('div', { className: 'text-xs text-muted', text: Math.round(g.current) + '/' + g.goal + g.unit })
      ));
    });
    container.appendChild(ringsArea);

    // ── Goal Progress Bars ──
    const progressArea = DOM.create('div', { className: 'mb-4' });
    goals.forEach(g => {
      const pct = Format.goalPercent(g.current, g.goal);
      progressArea.appendChild(DOM.create('div', { className: 'mb-2' },
        DOM.create('div', { className: 'flex justify-between text-xs mb-1' },
          DOM.create('span', { text: g.emoji + ' ' + g.label }),
          DOM.create('span', { className: 'font-pixel', text: Math.round(g.current) + ' / ' + g.goal + g.unit })
        ),
        DOM.create('div', { className: 'pixel-progress' },
          DOM.create('div', {
            className: 'pixel-progress__fill' + (pct > 100 ? ' pixel-progress__fill--danger' : pct >= 80 ? ' pixel-progress__fill--success' : ''),
            style: 'width: ' + Math.min(100, pct) + '%;',
          })
        )
      ));
    });
    container.appendChild(progressArea);

    // ── Nutrition Gap Reminder ──
    if (today) {
      const reminders = [];
      if (nutrition.protein < settings.dailyProtein * 0.7) reminders.push('蛋白质还差' + Math.round(settings.dailyProtein - nutrition.protein) + 'g，晚餐可以加个鸡蛋或豆腐');
      if (nutrition.fiber < 10) reminders.push('膳食纤维偏少，多吃点蔬菜哦 🥬');
      if (nutrition.calories < settings.dailyCalories * 0.4 && meals.length > 0) reminders.push('热量摄入偏少，记得好好吃饭~');

      if (reminders.length > 0) {
        container.appendChild(DOM.create('div', { className: 'pixel-card mb-4', style: 'background: var(--color-warning-bg); border-color: var(--color-warning);' },
          DOM.create('div', { className: 'font-pixel text-xs mb-2', text: '💡 营养提醒' }),
          ...reminders.map(r => DOM.create('p', { className: 'text-sm', text: '• ' + r }))
        ));
      }
    }

    // ── Meal Log ──
    container.appendChild(DOM.create('div', { className: 'flex justify-between items-center mb-3' },
      DOM.create('h3', { className: 'font-pixel text-sm', style: 'color: var(--color-primary);', text: '🍽️ 今日饮食记录' }),
      DOM.create('button', { className: 'pixel-btn pixel-btn--small', text: '+ 添加', onClick: () => this._showAddMealModal(recipeMap, () => this._refreshView(document.querySelector('#app'))) })
    ));

    if (meals.length === 0) {
      container.appendChild(DOM.create('div', { className: 'empty-state', style: 'padding: var(--space-6);' },
        DOM.create('div', { className: 'empty-state__icon', text: '🍽️' }),
        DOM.create('p', { className: 'empty-state__text', text: '今天还没记录饮食\n点「+ 添加」开始记录吧~' })
      ));
    } else {
      // Group by meal type
      const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
      mealTypes.forEach(type => {
        const typeMeals = meals.filter(m => m.mealType === type);
        if (typeMeals.length === 0) return;

        container.appendChild(DOM.create('div', { className: 'text-xs text-muted mb-1 mt-3', text: Format.mealTypeEmoji(type) + ' ' + CONFIG.mealTypes.find(mt => mt.id === type)?.name || type }));

        typeMeals.forEach(meal => {
          const recipe = recipeMap[meal.recipeId];
          if (!recipe) return;
          container.appendChild(DOM.create('div', { className: 'meal-log-item' },
            DOM.create('span', { className: 'meal-log-item__icon', text: recipe.emoji }),
            DOM.create('div', { className: 'meal-log-item__info' },
              DOM.create('div', { className: 'meal-log-item__name', text: recipe.name }),
              DOM.create('div', { className: 'meal-log-item__detail', text: '×' + meal.portions + '份' + (meal.notes ? ' | ' + meal.notes : '') })
            ),
            DOM.create('div', { className: 'meal-log-item__cals', text: Math.round(recipe.nutrition.calories * meal.portions) + ' kcal' }),
            DOM.create('span', {
              className: 'meal-log-item__delete',
              text: '✕',
              onClick: () => {
                Store.removeMealRecord(meal.id);
                this._refreshView(document.querySelector('#app'));
                App.showToast('已删除');
              },
            })
          ));
        });
      });
    }
  },

  _renderWeekView(container, recipeMap) {
    const weekStart = Format.weekStart(this._currentDate);
    const settings = Store.get('settings') || CONFIG.defaults;

    container.appendChild(DOM.create('p', { className: 'font-pixel text-sm mb-4', text: '📈 本周 (' + Format.date(weekStart) + ' - ' + Format.date(this._currentDate) + ')' }));

    // Daily calorie bars
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const meals = Store.getMealsByDate(dateStr);
      const nut = Format.calcMealNutrition(meals, recipeMap);
      days.push({ date: dateStr, meals, nutrition: nut });
    }

    days.forEach(day => {
      const pct = Format.goalPercent(day.nutrition.calories, settings.dailyCalories);
      container.appendChild(DOM.create('div', { className: 'mb-3' },
        DOM.create('div', { className: 'flex justify-between text-xs mb-1' },
          DOM.create('span', { text: Format.date(day.date, 'short') + ' ' + (day.date === Format.today() ? '今天' : '') }),
          DOM.create('span', { className: 'font-pixel', text: Math.round(day.nutrition.calories) + '/' + settings.dailyCalories + ' kcal · ' + day.meals.length + '顿' })
        ),
        DOM.create('div', { className: 'pixel-progress' },
          DOM.create('div', {
            className: 'pixel-progress__fill' + (pct > 100 ? ' pixel-progress__fill--danger' : pct >= 80 ? ' pixel-progress__fill--success' : ''),
            style: 'width: ' + Math.min(100, pct) + '%;',
          })
        )
      ));
    });

    // Weekly totals
    const weekMeals = Store.getMealsByRange(weekStart, this._currentDate);
    const weekNut = Format.calcMealNutrition(weekMeals, recipeMap);
    const activeDays = new Set(weekMeals.map(m => m.date)).size;

    container.appendChild(DOM.create('div', { className: 'pixel-card mt-4' },
      DOM.create('div', { className: 'font-pixel text-xs mb-2', text: '📊 本周小结' }),
      DOM.create('div', { className: 'pixel-grid pixel-grid--2 gap-2' },
        this._statItem('做饭次数', weekMeals.length + '次'),
        this._statItem('下厨天数', activeDays + '天'),
        this._statItem('日均热量', Math.round(weekNut.calories / Math.max(1, activeDays)) + ' kcal'),
        this._statItem('蛋白质日均', Math.round(weekNut.protein / Math.max(1, activeDays)) + 'g'),
        this._statItem('碳水日均', Math.round(weekNut.carbs / Math.max(1, activeDays)) + 'g'),
        this._statItem('脂肪日均', Math.round(weekNut.fat / Math.max(1, activeDays)) + 'g')
      )
    ));
  },

  _renderMonthView(container, recipeMap) {
    const monthStart = Format.monthStart(this._currentDate);
    const settings = Store.get('settings') || CONFIG.defaults;

    container.appendChild(DOM.create('p', { className: 'font-pixel text-sm mb-4', text: '📅 ' + this._currentDate.slice(0, 7) }));

    const year = parseInt(this._currentDate.slice(0, 4));
    const month = parseInt(this._currentDate.slice(5, 7));
    const daysInMonth = new Date(year, month, 0).getDate();

    // Heatmap
    const heatmap = DOM.create('div', { className: 'heatmap mb-4' });
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const meals = Store.getMealsByDate(dateStr);
      const count = meals.length;
      let level = 0;
      if (count >= 4) level = 4;
      else if (count >= 3) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      const cell = DOM.create('div', {
        className: 'heatmap__cell' + (level > 0 ? ' heatmap__cell--l' + level : ''),
        title: dateStr + ': ' + count + '顿',
      });
      heatmap.appendChild(cell);
    }
    container.appendChild(heatmap);
    container.appendChild(DOM.create('p', { className: 'text-xs text-muted mb-4', text: '本月做饭热力图（颜色越深 = 做饭次数越多）' }));

    // Monthly totals
    const monthMeals = Store.getMealsByRange(monthStart, this._currentDate);
    const monthNut = Format.calcMealNutrition(monthMeals, recipeMap);
    const activeDays = new Set(monthMeals.map(m => m.date)).size;

    container.appendChild(DOM.create('div', { className: 'pixel-card' },
      DOM.create('div', { className: 'font-pixel text-xs mb-2', text: '📊 本月小结' }),
      DOM.create('div', { className: 'pixel-grid pixel-grid--2 gap-2' },
        this._statItem('做饭次数', monthMeals.length + '次'),
        this._statItem('下厨天数', activeDays + '/' + daysInMonth + '天'),
        this._statItem('日均热量', Math.round(monthNut.calories / Math.max(1, activeDays)) + ' kcal'),
        this._statItem('蛋白质日均', Math.round(monthNut.protein / Math.max(1, activeDays)) + 'g'),
        this._statItem('碳水日均', Math.round(monthNut.carbs / Math.max(1, activeDays)) + 'g'),
        this._statItem('脂肪日均', Math.round(monthNut.fat / Math.max(1, activeDays)) + 'g')
      )
    ));
  },

  _navigateDate(dir) {
    const d = new Date(this._currentDate);
    if (this._viewMode === 'day') d.setDate(d.getDate() + dir);
    else if (this._viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    this._currentDate = d.toISOString().slice(0, 10);
  },

  _statItem(label, value) {
    return DOM.create('div', { style: 'padding: var(--space-2); background: var(--color-bg-warm); border: var(--pixel-1) solid var(--color-border-pixel); text-align: center;' },
      DOM.create('div', { className: 'text-xs text-muted', text: label }),
      DOM.create('div', { className: 'font-pixel text-sm', style: 'color: var(--color-primary);', text: value })
    );
  },

  _showAddMealModal(recipeMap, onClose) {
    const content = DOM.create('div', {});
    content.appendChild(DOM.create('p', { className: 'font-pixel text-sm mb-4', text: '🍽️ 记录一顿饭' }));

    // Recipe search
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '搜索菜谱' }));
    const searchInput = DOM.create('input', { className: 'pixel-input mt-1 mb-2', placeholder: '输入菜名...' });
    content.appendChild(searchInput);

    const recipeList = DOM.create('div', { className: 'mb-3', style: 'max-height: 200px; overflow-y: auto;' });
    let selectedRecipeId = null;
    const allRecipes = Object.values(recipeMap);

    const renderRecipeList = (filter = '') => {
      DOM.empty(recipeList);
      const filtered = allRecipes.filter(r => !filter || r.name.includes(filter) || r.nameEn.toLowerCase().includes(filter.toLowerCase()));
      filtered.slice(0, 15).forEach(recipe => {
        recipeList.appendChild(DOM.create('div', {
          className: 'ingredient-item' + (selectedRecipeId === recipe.id ? ' pixel-chip--active' : ''),
          style: 'cursor: pointer;',
          onClick: function () {
            selectedRecipeId = recipe.id;
            DOM.$$('.ingredient-item', recipeList).forEach(el => el.style.background = '');
            this.style.background = 'var(--color-bg-warm)';
          },
        },
          DOM.create('span', { text: recipe.emoji, style: 'margin-right: var(--space-2);' }),
          DOM.create('span', { className: 'text-sm', text: recipe.name }),
          DOM.create('span', { className: 'text-xs text-muted', style: 'margin-left: auto;', text: Math.round(recipe.nutrition.calories) + 'kcal' })
        ));
      });
    };
    renderRecipeList();
    searchInput.addEventListener('input', () => renderRecipeList(searchInput.value.trim()));
    content.appendChild(recipeList);

    // Meal type
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '餐别' }));
    let selectedMealType = 'lunch';
    const mealTypeRow = DOM.create('div', { className: 'flex gap-2 mt-1 mb-3' });
    CONFIG.mealTypes.forEach(mt => {
      mealTypeRow.appendChild(DOM.create('span', {
        className: 'pixel-chip' + (selectedMealType === mt.id ? ' pixel-chip--active' : ''),
        text: mt.emoji + ' ' + mt.name,
        onClick: function () {
          selectedMealType = mt.id;
          DOM.$$('.pixel-chip', mealTypeRow).forEach(c => DOM.toggleClass(c, 'pixel-chip--active', false));
          DOM.toggleClass(this, 'pixel-chip--active', true);
        },
      }));
    });
    content.appendChild(mealTypeRow);

    // Portions
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '份量' }));
    let portions = 1;
    const portionRow = DOM.create('div', { className: 'flex gap-2 mt-1 mb-3 items-center' });
    portionRow.appendChild(DOM.create('button', { className: 'pixel-btn pixel-btn--small', text: '-', onClick: () => { if (portions > 0.5) { portions -= 0.5; label.textContent = String(portions) + '份'; } } }));
    const label = DOM.create('span', { className: 'font-pixel text-sm', style: 'padding: 0 var(--space-3);', text: '1份' });
    portionRow.appendChild(label);
    portionRow.appendChild(DOM.create('button', { className: 'pixel-btn pixel-btn--small', text: '+', onClick: () => { portions += 0.5; label.textContent = String(portions) + '份'; } }));
    content.appendChild(portionRow);

    // Notes
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '备注（可选）' }));
    const noteInput = DOM.create('input', { className: 'pixel-input mt-1 mb-4', placeholder: '如: 自己做的' });
    content.appendChild(noteInput);

    // Submit
    content.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--block',
      text: '✅ 记录',
      onClick: () => {
        if (!selectedRecipeId) { App.showToast('请选择一个菜谱', 'error'); return; }
        Store.addMealRecord({
          recipeId: selectedRecipeId,
          date: this._currentDate,
          mealType: selectedMealType,
          portions,
          notes: noteInput.value.trim(),
        });
        App.showToast('已记录 ✅');
        modal.close();
        if (onClose) onClose();
      },
    }));

    const modal = App.showModal(content);
  },
};
