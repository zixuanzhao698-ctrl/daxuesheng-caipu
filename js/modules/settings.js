// ╔══════════════════════════════════════╗
// ║  Settings / Personal Center View   ║
// ╚══════════════════════════════════════╝

const SettingsView = {
  async render(params) {
    const view = DOM.create('div', { className: 'view' });

    // ── Header ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('h1', { className: 'page-header__title', text: '👤 我的' })
    ));

    const settings = Store.get('settings') || CONFIG.defaults;
    const stats = Store.getStats();
    const achievements = Store.get('achievements') || {};

    // ── User Stats ──
    const statsCard = DOM.create('div', { className: 'pixel-card mb-4', style: 'text-align: center;' },
      DOM.create('div', {
        style: 'font-size: 48px; margin-bottom: var(--space-3);',
        text: '👨‍🍳',
      }),
      DOM.create('div', { className: 'pixel-grid pixel-grid--3 gap-2 mt-3' },
        this._statChip('🍳 累计做饭', stats.totalMeals + ' 次'),
        this._statChip('🍽️ 解锁菜品', stats.uniqueRecipes + ' 道'),
        this._statChip('💰 节省开支', '¥' + Math.round(stats.totalSaved)),
      )
    );
    view.appendChild(statsCard);

    // ── Achievement Badges ──
    const unlockedAchs = CONFIG.achievements.filter(a => achievements[a.id] && achievements[a.id].unlocked);
    const lockedAchs = CONFIG.achievements.filter(a => !achievements[a.id] || !achievements[a.id].unlocked);

    if (unlockedAchs.length > 0 || lockedAchs.length > 0) {
      const achSection = DOM.create('div', { className: 'settings-group' });
      achSection.appendChild(DOM.create('div', { className: 'settings-group__title', text: '🏅 成就徽章 (' + unlockedAchs.length + '/' + CONFIG.achievements.length + ')' }));

      const achGrid = DOM.create('div', {
        style: 'display: flex; flex-wrap: wrap; gap: var(--space-2); justify-content: flex-start;',
      });

      // Show unlocked first, then locked
      [...unlockedAchs, ...lockedAchs].forEach(ach => {
        const isUnlocked = achievements[ach.id] && achievements[ach.id].unlocked;
        achGrid.appendChild(DOM.create('div', { className: 'achievement-badge' },
          DOM.create('div', {
            className: 'achievement-badge__icon' + (isUnlocked ? '' : ' achievement-badge__icon--locked'),
            text: ach.emoji,
            title: ach.desc,
          }),
          DOM.create('div', { className: 'achievement-badge__name', text: ach.name }),
          DOM.create('div', {
            className: 'text-xs',
            style: 'font-size: 6px; color: ' + (isUnlocked ? 'var(--color-success)' : 'var(--color-text-muted)') + ';',
            text: isUnlocked ? '已解锁' : '未解锁',
          })
        ));
      });

      achSection.appendChild(achGrid);
      view.appendChild(achSection);
    }

    // ═══════════════════════════════════════
    // ── Settings Group 1: Nutrition Goals ──
    // ═══════════════════════════════════════
    const nutSection = DOM.create('div', { className: 'settings-group' });
    nutSection.appendChild(DOM.create('div', { className: 'settings-group__title', text: '🎯 营养目标（每日）' }));

    const nutGoals = [
      { key: 'dailyCalories', label: '🔥 每日热量', unit: 'kcal', value: settings.dailyCalories || CONFIG.defaults.dailyCalories, step: 100 },
      { key: 'dailyProtein', label: '💪 蛋白质', unit: 'g', value: settings.dailyProtein || CONFIG.defaults.dailyProtein, step: 5 },
      { key: 'dailyCarbs', label: '🍚 碳水化合物', unit: 'g', value: settings.dailyCarbs || CONFIG.defaults.dailyCarbs, step: 10 },
      { key: 'dailyFat', label: '🥩 脂肪', unit: 'g', value: settings.dailyFat || CONFIG.defaults.dailyFat, step: 5 },
    ];

    nutGoals.forEach(goal => {
      const row = DOM.create('div', { className: 'settings-row' });

      row.appendChild(DOM.create('span', { className: 'settings-row__label', text: goal.label }));

      const inputWrapper = DOM.create('div', { style: 'display: flex; align-items: center; gap: var(--space-1);' });
      const input = DOM.create('input', {
        className: 'pixel-input settings-row__input',
        type: 'number',
        min: '0',
        step: String(goal.step),
        value: String(goal.value),
        'data-key': goal.key,
      });
      inputWrapper.appendChild(input);
      inputWrapper.appendChild(DOM.create('span', {
        className: 'text-xs text-muted',
        text: goal.unit,
      }));
      row.appendChild(inputWrapper);

      nutSection.appendChild(row);
    });
    view.appendChild(nutSection);

    // ═══════════════════════════════════════
    // ── Settings Group 2: Equipment ──
    // ═══════════════════════════════════════
    const equipSection = DOM.create('div', { className: 'settings-group' });
    equipSection.appendChild(DOM.create('div', { className: 'settings-group__title', text: '🪇 厨房装备' }));

    const currentEquip = settings.equipment || [];
    const equipOptions = ['炒锅', '平底锅', '汤锅', '电饭煲', '烤箱', '空气炸锅', '微波炉', '蒸锅', '砂锅', '菜刀砧板'];

    const equipChips = DOM.create('div', { className: 'quick-chips', style: 'margin-bottom: var(--space-2);' });
    equipOptions.forEach(eq => {
      const isSelected = currentEquip.includes(eq);
      const chip = DOM.create('span', {
        className: 'pixel-chip' + (isSelected ? ' pixel-chip--active' : ''),
        text: eq,
        'data-equip': eq,
        onClick: function () {
          const selected = this.classList.contains('pixel-chip--active');
          DOM.toggleClass(this, 'pixel-chip--active', !selected);
        },
      });
      equipChips.appendChild(chip);
    });
    equipSection.appendChild(equipChips);

    equipSection.appendChild(DOM.create('p', {
      className: 'text-xs text-muted',
      text: '勾选你拥有的厨具，浏览菜谱时会提示是否有合适的装备',
    }));
    view.appendChild(equipSection);

    // ═══════════════════════════════════════
    // ── Settings Group 3: Taste Preferences ──
    // ═══════════════════════════════════════
    const prefSection = DOM.create('div', { className: 'settings-group' });
    prefSection.appendChild(DOM.create('div', { className: 'settings-group__title', text: '🌶️ 口味偏好' }));

    // Spice level
    prefSection.appendChild(DOM.create('div', { className: 'settings-row' },
      DOM.create('span', { className: 'settings-row__label', text: '辣度偏好' }),
      DOM.create('div', { className: 'flex gap-1' })
    ));

    const spiceRow = DOM.create('div', { className: 'quick-chips' });
    const currentSpice = (settings.preferences && settings.preferences.spice) || 'medium';
    const spiceLevels = [
      { id: 'none', label: '🚫 不辣' },
      { id: 'mild', label: '🌶️ 微辣' },
      { id: 'medium', label: '🌶️🌶️ 中辣' },
      { id: 'hot', label: '🌶️🌶️🌶️ 重辣' },
    ];

    spiceLevels.forEach(spice => {
      const spiceChip = DOM.create('span', {
        className: 'pixel-chip' + (currentSpice === spice.id ? ' pixel-chip--active' : ''),
        text: spice.label,
        'data-spice': spice.id,
        onClick: function () {
          DOM.$$('.pixel-chip[data-spice]', spiceRow).forEach(c => DOM.toggleClass(c, 'pixel-chip--active', false));
          DOM.toggleClass(this, 'pixel-chip--active', true);
        },
      });
      spiceRow.appendChild(spiceChip);
    });
    prefSection.appendChild(spiceRow);

    // Allergies
    prefSection.appendChild(DOM.create('div', { className: 'settings-row', style: 'flex-direction: column; align-items: flex-start;' },
      DOM.create('span', { className: 'settings-row__label', text: '🥜 过敏源（逗号分隔）' }),
      DOM.create('input', {
        className: 'pixel-input mt-2',
        id: 'settings-allergies-input',
        placeholder: '例如: 花生, 海鲜, 牛奶',
        value: (settings.preferences && settings.preferences.allergies) ? settings.preferences.allergies.join(', ') : '',
      })
    ));
    view.appendChild(prefSection);

    // ═══════════════════════════════════════
    // ── Quick Links ──
    // ═══════════════════════════════════════
    const linksSection = DOM.create('div', { className: 'settings-group' });
    linksSection.appendChild(DOM.create('div', { className: 'settings-group__title', text: '🔗 快捷入口' }));

    const links = [
      { icon: '❤️', label: '我的收藏', desc: '查看收藏的菜谱', path: '/favorites' },
      { icon: '🛒', label: '采购清单', desc: '管理购物清单', path: '/shopping-list' },
      { icon: '📝', label: '做饭日记', desc: '查看下厨报告', path: '/diary' },
    ];

    links.forEach(link => {
      linksSection.appendChild(DOM.create('div', {
        className: 'settings-row',
        style: 'cursor: pointer;',
        onClick: () => Router.go(link.path),
      },
        DOM.create('div', { style: 'display: flex; align-items: center; gap: var(--space-3);' },
          DOM.create('span', { text: link.icon, style: 'font-size: 20px;' }),
          DOM.create('div', {},
            DOM.create('div', { className: 'settings-row__label', text: link.label }),
            DOM.create('div', { className: 'text-xs text-muted', text: link.desc })
          )
        ),
        DOM.create('span', { className: 'settings-row__value', text: '→' })
      ));
    });
    view.appendChild(linksSection);

    // ═══════════════════════════════════════
    // ── Data Management ──
    // ═══════════════════════════════════════
    const dataSection = DOM.create('div', { className: 'settings-group' });
    dataSection.appendChild(DOM.create('div', { className: 'settings-group__title', text: '💾 数据管理' }));

    // Export data
    dataSection.appendChild(DOM.create('div', { className: 'settings-row' },
      DOM.create('span', { className: 'settings-row__label', text: '📤 导出数据' }),
      DOM.create('button', {
        className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
        text: '导出 JSON',
        onClick: () => {
          const exportData = {
            mealRecords: Store.get('mealRecords'),
            favorites: Store.get('favorites'),
            shoppingList: Store.get('shoppingList'),
            cookLog: Store.get('cookLog'),
            notes: Store.get('notes'),
            achievements: Store.get('achievements'),
            settings: Store.get('settings'),
            likes: Store.get('likes'),
            exportedAt: new Date().toISOString(),
            version: CONFIG.version,
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = '菜谱指南_数据备份_' + Format.today() + '.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          App.showToast('数据已导出 ✅');
        },
      })
    ));

    // Clear all data
    dataSection.appendChild(DOM.create('div', { className: 'settings-row' },
      DOM.create('span', { className: 'settings-row__label', text: '🗑️ 清除所有数据' }),
      DOM.create('button', {
        className: 'pixel-btn pixel-btn--small',
        style: 'background: var(--color-danger); border-color: #C62828;',
        text: '清除数据',
        onClick: () => {
          const confirmContent = DOM.create('div', {});
          confirmContent.appendChild(DOM.create('p', {
            className: 'font-pixel text-sm mb-4',
            style: 'color: var(--color-danger);',
            text: '⚠️ 确认清除所有数据？',
          }));
          confirmContent.appendChild(DOM.create('p', {
            className: 'text-sm text-muted mb-4',
            text: '这将删除所有饮食记录、收藏、采购清单、笔记和成就。此操作不可恢复。',
          }));
          confirmContent.appendChild(DOM.create('div', { className: 'flex gap-2' },
            DOM.create('button', {
              className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
              style: 'flex: 1;',
              text: '取消',
              onClick: () => confirmModal.close(),
            }),
            DOM.create('button', {
              className: 'pixel-btn pixel-btn--small',
              style: 'flex: 1; background: var(--color-danger); border-color: #C62828;',
              text: '确认清除',
              onClick: () => {
                // Clear all stored data
                Object.values(CONFIG.storageKeys).forEach(key => {
                  Storage.remove(key);
                });
                // Re-initialize store with defaults
                Store.init();
                confirmModal.close();
                // Re-render the view
                Router.go('/settings');
                App.showToast('所有数据已清除');
              },
            })
          ));

          const confirmModal = App.showModal(confirmContent);
        },
      })
    ));
    view.appendChild(dataSection);

    // ═══════════════════════════════════════
    // ── Save Button ──
    // ═══════════════════════════════════════
    view.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--block pixel-btn--large mt-4',
      text: '💾 保存设置',
      onClick: () => {
        // Collect nutrition goals
        const newSettings = {
          dailyCalories: parseInt(DOM.$('input[data-key="dailyCalories"]', view)?.value) || CONFIG.defaults.dailyCalories,
          dailyProtein: parseInt(DOM.$('input[data-key="dailyProtein"]', view)?.value) || CONFIG.defaults.dailyProtein,
          dailyCarbs: parseInt(DOM.$('input[data-key="dailyCarbs"]', view)?.value) || CONFIG.defaults.dailyCarbs,
          dailyFat: parseInt(DOM.$('input[data-key="dailyFat"]', view)?.value) || CONFIG.defaults.dailyFat,
        };

        // Collect equipment
        const equipChips = DOM.$$('.pixel-chip[data-equip]', view);
        newSettings.equipment = equipChips
          .filter(c => c.classList.contains('pixel-chip--active'))
          .map(c => c.dataset.equip);

        // Collect preferences
        const spiceChips = DOM.$$('.pixel-chip[data-spice]', view);
        const selectedSpice = spiceChips.find(c => c.classList.contains('pixel-chip--active'));
        const allergiesInput = DOM.$('#settings-allergies-input', view);
        const allergies = allergiesInput
          ? allergiesInput.value.split(/[,，、\s]+/).filter(s => s.trim())
          : [];

        newSettings.preferences = {
          spice: selectedSpice ? selectedSpice.dataset.spice : 'medium',
          allergies: allergies,
        };

        // Preserve any other existing settings keys
        const existing = Store.get('settings') || {};
        Store.updateSettings({ ...existing, ...newSettings });
        App.showToast('设置已保存 ✅');
      },
    }));

    // App version info
    view.appendChild(DOM.create('p', {
      className: 'text-center text-xs text-muted mt-6 mb-4',
      text: CONFIG.appName + ' v' + CONFIG.version,
    }));

    // Bottom spacing for navbar
    view.appendChild(DOM.create('div', { style: 'height: var(--space-8);' }));

    return view;
  },

  _statChip(label, value) {
    return DOM.create('div', {
      style: 'padding: var(--space-3); background: var(--color-bg-warm); border: var(--pixel-1) solid var(--color-border-pixel); text-align: center;',
    },
      DOM.create('div', { className: 'text-xs text-muted', text: label }),
      DOM.create('div', { className: 'font-pixel text-sm', style: 'color: var(--color-primary);', text: value })
    );
  },
};
