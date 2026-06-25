// ╔══════════════════════════════════════╗
// ║  Shopping List View                ║
// ║  Grouped by category, checkable    ║
// ╚══════════════════════════════════════╝

const ShoppingListView = {
  // Category mapping for grouping ingredients
  _categoryMap: {
    '鸡蛋': '肉蛋', '猪肉': '肉蛋', '鸡肉': '肉蛋', '牛肉': '肉蛋', '羊肉': '肉蛋',
    '虾': '肉蛋', '虾仁': '肉蛋', '鱼': '肉蛋', '培根': '肉蛋', '火腿': '肉蛋',
    '香肠': '肉蛋', '午餐肉': '肉蛋', '鸡腿': '肉蛋', '鸡胸': '肉蛋', '鸡翅': '肉蛋',
    '排骨': '肉蛋', '肉末': '肉蛋', '牛肉馅': '肉蛋', '鸭': '肉蛋',

    '西红柿': '蔬菜', '土豆': '蔬菜', '青椒': '蔬菜', '茄子': '蔬菜', '白菜': '蔬菜',
    '青菜': '蔬菜', '菠菜': '蔬菜', '黄瓜': '蔬菜', '胡萝卜': '蔬菜', '白萝卜': '蔬菜',
    '豆角': '蔬菜', '花菜': '蔬菜', '西兰花': '蔬菜', '洋葱': '蔬菜', '大蒜': '蔬菜',
    '姜': '蔬菜', '葱': '蔬菜', '香菜': '蔬菜', '芹菜': '蔬菜', '玉米': '蔬菜',
    '南瓜': '蔬菜', '生菜': '蔬菜', '莲藕': '蔬菜', '山药': '蔬菜', '香菇': '蔬菜',
    '蘑菇': '蔬菜', '豆腐': '蔬菜', '豆芽': '蔬菜', '韭菜': '蔬菜', '苦瓜': '蔬菜',
    '丝瓜': '蔬菜', '冬瓜': '蔬菜', '娃娃菜': '蔬菜', '油麦菜': '蔬菜', '西葫芦': '蔬菜',
    '红薯': '蔬菜', '紫薯': '蔬菜', '芋头': '蔬菜', '竹笋': '蔬菜', '芦笋': '蔬菜',

    '盐': '调料', '糖': '调料', '酱油': '调料', '生抽': '调料', '老抽': '调料',
    '醋': '调料', '料酒': '调料', '蚝油': '调料', '豆瓣酱': '调料', '番茄酱': '调料',
    '辣椒酱': '调料', '甜面酱': '调料', '黄豆酱': '调料', '芝麻油': '调料', '花椒油': '调料',
    '食用油': '调料', '花椒': '调料', '干辣椒': '调料', '辣椒': '调料', '胡椒': '调料',
    '五香粉': '调料', '孜然': '调料', '咖喱': '调料', '淀粉': '调料', '味精': '调料',
    '鸡精': '调料', '八角': '调料', '桂皮': '调料', '香叶': '调料', '白芝麻': '调料',

    '米饭': '主食', '大米': '主食', '面条': '主食', '面粉': '主食', '面包': '主食',
    '馒头': '主食', '饺子皮': '主食', '馄饨皮': '主食', '意大利面': '主食', '粉丝': '主食',
    '粉条': '主食', '年糕': '主食', '方便面': '主食', '吐司': '主食', '燕麦': '主食',
  },

  async render(params) {
    const view = DOM.create('div', { className: 'view' });

    // ── Header ──
    view.appendChild(DOM.create('div', { className: 'page-header' },
      DOM.create('h1', { className: 'page-header__title', text: '🛒 采购清单' })
    ));

    const shoppingList = Store.get('shoppingList') || [];

    // ── Action Bar ──
    const actionBar = DOM.create('div', { className: 'flex gap-2 mb-4', style: 'flex-wrap: wrap;' });

    actionBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small',
      text: '🛒 清空已完成',
      onClick: () => {
        const hasCompleted = shoppingList.some(item => item.purchased);
        if (!hasCompleted) {
          App.showToast('没有已完成的物品~');
          return;
        }
        Store.clearPurchasedItems();
        this._refreshView(view);
        App.showToast('已清空完成项 ✅');
      },
    }));

    actionBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      text: '📋 复制清单',
      onClick: () => {
        const unpurchased = shoppingList.filter(item => !item.purchased);
        if (unpurchased.length === 0) {
          App.showToast('没有待采购的物品~');
          return;
        }
        const text = unpurchased.map(item => {
          return '☐ ' + item.ingredientName + ' ' + item.amount + item.unit;
        }).join('\n');

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            App.showToast('已复制到剪贴板 📋');
          }).catch(() => {
            App.showToast('复制失败，请手动复制');
          });
        } else {
          // Fallback
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          try {
            document.execCommand('copy');
            App.showToast('已复制到剪贴板 📋');
          } catch (e) {
            App.showToast('复制失败，请手动复制');
          }
          document.body.removeChild(textarea);
        }
      },
    }));

    view.appendChild(actionBar);

    // ── Add Item Input ──
    const addRow = DOM.create('div', { className: 'flex gap-2 mb-4' });
    const addInput = DOM.create('input', {
      className: 'pixel-input',
      placeholder: '添加物品（如: 鸡蛋 6个）',
      style: 'flex: 1;',
      id: 'shopping-add-input',
    });
    addRow.appendChild(addInput);
    addRow.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small',
      text: '+ 添加',
      onClick: () => {
        const val = addInput.value.trim();
        if (!val) {
          App.showToast('请输入物品名称');
          return;
        }
        // Parse: "鸡蛋 6个" or "鸡蛋 6 个" or just "鸡蛋"
        const match = val.match(/^(.+?)\s+(\d+\.?\d*)\s*(.*)$/);
        if (match) {
          Store.addToShoppingList({
            ingredientName: match[1].trim(),
            amount: parseFloat(match[2]) || 1,
            unit: match[3].trim() || '份',
            neededFor: [],
          });
        } else {
          Store.addToShoppingList({
            ingredientName: val,
            amount: 1,
            unit: '份',
            neededFor: [],
          });
        }
        addInput.value = '';
        addInput.focus();
        this._refreshView(view);
        App.showToast('已添加 ✅');
      },
    }));
    view.appendChild(addRow);

    // Handle Enter key
    addInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = addInput.value.trim();
        if (!val) return;
        const match = val.match(/^(.+?)\s+(\d+\.?\d*)\s*(.*)$/);
        if (match) {
          Store.addToShoppingList({
            ingredientName: match[1].trim(),
            amount: parseFloat(match[2]) || 1,
            unit: match[3].trim() || '份',
            neededFor: [],
          });
        } else {
          Store.addToShoppingList({
            ingredientName: val,
            amount: 1,
            unit: '份',
            neededFor: [],
          });
        }
        addInput.value = '';
        addInput.focus();
        this._refreshView(view);
        App.showToast('已添加 ✅');
      }
    });

    // ── Content area ──
    const listArea = DOM.create('div', { id: 'shopping-list-content' });
    view.appendChild(listArea);

    this._renderList(listArea);

    return view;
  },

  _refreshView(view) {
    const listArea = DOM.$('#shopping-list-content', view);
    if (listArea) {
      this._renderList(listArea);
    }
  },

  _renderList(container) {
    DOM.empty(container);

    const shoppingList = Store.get('shoppingList') || [];

    // ── Empty State ──
    if (shoppingList.length === 0) {
      container.appendChild(DOM.create('div', { className: 'empty-state' },
        DOM.create('div', { className: 'empty-state__icon', text: '🛒' }),
        DOM.create('p', { className: 'empty-state__text', text: '采购清单是空的~\n在菜谱详情页点击"加入采购清单"\n或在智能匹配结果中添加缺少的食材' }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--secondary mt-3',
          text: '📖 浏览菜谱',
          onClick: () => Router.go('/browse'),
        })
      ));
      return;
    }

    // ── Count Summary ──
    const totalItems = shoppingList.length;
    const purchasedCount = shoppingList.filter(i => i.purchased).length;
    const remainingCount = totalItems - purchasedCount;

    container.appendChild(DOM.create('div', {
      className: 'flex justify-between items-center mb-3',
    },
      DOM.create('span', {
        className: 'font-pixel text-xs',
        style: 'color: var(--color-primary);',
        text: '共 ' + totalItems + ' 件，' + '待采购 ' + remainingCount + ' 件',
      }),
      purchasedCount > 0 ? DOM.create('span', {
        className: 'text-xs text-muted',
        text: '已完成 ' + purchasedCount + ' 件',
      }) : null
    ));

    // ── Group by Category ──
    const categoryOrder = ['蔬菜', '肉蛋', '调料', '主食', '其他'];
    const grouped = {};

    shoppingList.forEach(item => {
      const cat = this._getCategory(item.ingredientName);
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    // Sort categories in defined order
    const sortedCats = categoryOrder.filter(cat => grouped[cat]);
    // Add any categories not in the predefined order
    Object.keys(grouped).forEach(cat => {
      if (!sortedCats.includes(cat)) sortedCats.push(cat);
    });

    sortedCats.forEach(cat => {
      const items = grouped[cat];

      const categoryEl = DOM.create('div', { className: 'shop-category' });

      // Category title with count
      const unpurchasedInCat = items.filter(i => !i.purchased).length;
      categoryEl.appendChild(DOM.create('div', {
        className: 'shop-category__title',
        text: (cat === '蔬菜' ? '🥬 ' : cat === '肉蛋' ? '🥩 ' : cat === '调料' ? '🧂 ' : cat === '主食' ? '🍚 ' : '📦 ') + cat + (unpurchasedInCat > 0 ? ' (' + unpurchasedInCat + ')' : ''),
      }));

      // Sort: unpurchased first, then by name
      items.sort((a, b) => {
        if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
        return a.ingredientName.localeCompare(b.ingredientName, 'zh');
      });

      items.forEach(item => {
        const itemEl = DOM.create('div', {
          className: 'shop-item' + (item.purchased ? ' shop-item--done' : ''),
        });

        // Checkbox
        const checkEl = DOM.create('div', {
          className: 'shop-item__check' + (item.purchased ? ' shop-item__check--done' : ''),
          onClick: () => {
            Store.toggleShoppingItem(item.id);
            this._renderList(container);
          },
        });
        if (item.purchased) {
          checkEl.textContent = '✓';
        }
        itemEl.appendChild(checkEl);

        // Name
        const nameEl = DOM.create('span', {
          className: 'shop-item__name',
          text: item.ingredientName,
        });

        // Needed-for tags
        if (item.neededFor && item.neededFor.length > 0) {
          const tagsContainer = DOM.create('span', {
            style: 'font-size: 8px; color: var(--color-text-muted); margin-left: var(--space-1);',
          });
          item.neededFor.forEach(recipeName => {
            tagsContainer.appendChild(DOM.create('span', {
              className: 'pixel-chip',
              style: 'font-size: 6px; padding: 1px var(--space-1); margin-right: 2px;',
              text: recipeName,
            }));
          });
          nameEl.appendChild(tagsContainer);
        }
        itemEl.appendChild(nameEl);

        // Amount
        itemEl.appendChild(DOM.create('span', {
          className: 'shop-item__amount',
          text: item.amount + ' ' + item.unit,
        }));

        categoryEl.appendChild(itemEl);
      });

      container.appendChild(categoryEl);
    });

    // Bottom spacing
    container.appendChild(DOM.create('div', { style: 'height: var(--space-4);' }));
  },

  _getCategory(ingredientName) {
    if (this._categoryMap[ingredientName]) {
      return this._categoryMap[ingredientName];
    }
    // Try partial matching
    for (const [key, cat] of Object.entries(this._categoryMap)) {
      if (ingredientName.includes(key) || key.includes(ingredientName)) {
        return cat;
      }
    }
    return '其他';
  },
};
