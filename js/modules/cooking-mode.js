// ╔══════════════════════════════════════╗
// ║  Cooking Mode View                 ║
// ║  Fullscreen step-by-step cooking   ║
// ╚══════════════════════════════════════╝

const CookingModeView = {
  _recipe: null,
  _currentStep: 0,
  _completedSteps: {},
  _activeTimers: {},

  async render(params) {
    const recipeId = params.id;
    const allRecipes = [
      ...(typeof RECIPES_ZHONGCAN !== 'undefined' ? RECIPES_ZHONGCAN : []),
      ...(typeof RECIPES_XICAN !== 'undefined' ? RECIPES_XICAN : []),
    ];
    this._recipe = allRecipes.find(r => r.id === recipeId);

    if (!this._recipe) {
      return DOM.create('div', { className: 'view' },
        DOM.create('div', { className: 'empty-state' },
          DOM.create('div', { className: 'empty-state__icon', text: '🔍' }),
          DOM.create('p', { className: 'empty-state__text', text: '找不到这个菜谱~' }),
          DOM.create('button', {
            className: 'pixel-btn pixel-btn--secondary mt-3',
            text: '← 返回菜谱库',
            onClick: () => Router.go('/browse'),
          })
        )
      );
    }

    this._currentStep = 0;
    this._completedSteps = {};
    this._activeTimers = {};

    const recipe = this._recipe;
    const totalSteps = recipe.steps.length;

    // ── Fullscreen view container (darker kitchen background) ──
    const view = DOM.create('div', {
      className: 'view',
      style: 'padding: 0; min-height: 100vh; min-height: 100dvh; background: #2D2013; color: #FFF5EE; display: flex; flex-direction: column;',
    });

    // ── Top Bar ──
    const topBar = DOM.create('div', {
      style: 'display: flex; align-items: center; padding: var(--space-3) var(--space-4); background: #3E2A1A; border-bottom: var(--pixel-1) solid #5D4037; flex-shrink: 0;',
    });
    topBar.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      text: '← 返回',
      style: 'background: #5D4037; color: #FFCC80; border-color: #8D6E63;',
      onClick: () => Router.go('/recipe/' + recipe.id),
    }));
    topBar.appendChild(DOM.create('div', {
      style: 'flex: 1; text-align: center; font-family: var(--font-pixel); font-size: var(--font-size-sm); color: #FFCC80;',
      text: '👨‍🍳 ' + recipe.name,
    }));
    topBar.appendChild(DOM.create('div', {
      style: 'width: 60px; font-family: var(--font-pixel-en); font-size: 8px; color: var(--color-text-muted); text-align: right;',
      id: 'cooking-step-indicator-top',
      text: '第 1 步 / 共 ' + totalSteps + ' 步',
    }));
    view.appendChild(topBar);

    // ── Progress Bar ──
    const progressBar = DOM.create('div', {
      style: 'height: 6px; background: #3E2A1A; flex-shrink: 0;',
    });
    const progressFill = DOM.create('div', {
      id: 'cooking-progress-fill',
      style: 'height: 100%; background: var(--color-primary); transition: width 300ms steps(10); width: ' + (1 / totalSteps * 100) + '%;',
    });
    progressBar.appendChild(progressFill);
    view.appendChild(progressBar);

    // ── Step Display Area (main content) ──
    const stepArea = DOM.create('div', {
      id: 'cooking-step-area',
      style: 'flex: 1; overflow-y: auto; padding: var(--space-4); display: flex; flex-direction: column; -webkit-overflow-scrolling: touch;',
    });
    view.appendChild(stepArea);

    // ── Bottom Navigation Bar ──
    const bottomBar = DOM.create('div', {
      style: 'display: flex; align-items: center; gap: var(--space-2); padding: var(--space-4); background: #3E2A1A; border-top: var(--pixel-1) solid #5D4037; flex-shrink: 0;',
    });

    const prevBtn = DOM.create('button', {
      className: 'pixel-btn pixel-btn--small pixel-btn--secondary',
      id: 'cooking-prev-btn',
      text: '◀ 上一步',
      style: 'flex: 1; background: #5D4037; color: #FFCC80; border-color: #8D6E63;',
      onClick: () => this._navigateStep(-1, view),
    });
    bottomBar.appendChild(prevBtn);

    const nextBtn = DOM.create('button', {
      className: 'pixel-btn pixel-btn--small',
      id: 'cooking-next-btn',
      text: '下一步 ▶',
      style: 'flex: 1;',
      onClick: () => this._navigateStep(1, view),
    });
    bottomBar.appendChild(nextBtn);

    view.appendChild(bottomBar);

    // ── Render initial step ──
    this._renderStep(view, 0);

    // ── Swipe support ──
    let touchStartX = 0;
    let touchStartY = 0;
    stepArea.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });
    stepArea.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
        if (dx < 0) {
          this._navigateStep(1, view);
        } else {
          this._navigateStep(-1, view);
        }
      }
    });

    return view;
  },

  _navigateStep(direction, view) {
    const recipe = this._recipe;
    const totalSteps = recipe.steps.length;
    const newStep = this._currentStep + direction;

    if (newStep < 0 || newStep >= totalSteps) return;

    this._currentStep = newStep;
    this._renderStep(view, newStep);

    // Update progress bar
    const progressFill = DOM.$('#cooking-progress-fill', view);
    if (progressFill) {
      progressFill.style.width = ((newStep + 1) / totalSteps * 100) + '%';
    }

    // Update top indicator
    const indicator = DOM.$('#cooking-step-indicator-top', view);
    if (indicator) {
      indicator.textContent = '第 ' + (newStep + 1) + ' 步 / 共 ' + totalSteps + ' 步';
    }

    // Update nav buttons
    const prevBtn = DOM.$('#cooking-prev-btn', view);
    const nextBtn = DOM.$('#cooking-next-btn', view);
    if (prevBtn) {
      prevBtn.disabled = newStep === 0;
      prevBtn.style.opacity = newStep === 0 ? '0.4' : '1';
    }
    if (nextBtn) {
      if (newStep === totalSteps - 1) {
        nextBtn.textContent = '🎉 完成';
        nextBtn.style.background = 'var(--color-success)';
        nextBtn.style.borderColor = '#43A047';
      } else {
        nextBtn.textContent = '下一步 ▶';
        nextBtn.style.background = 'var(--color-primary)';
        nextBtn.style.borderColor = 'var(--color-primary-dark)';
      }
    }

    // Scroll step content to top
    const stepArea = DOM.$('#cooking-step-area', view);
    if (stepArea) stepArea.scrollTop = 0;
  },

  _renderStep(view, stepIndex) {
    const recipe = this._recipe;
    const step = recipe.steps[stepIndex];
    const totalSteps = recipe.steps.length;
    const stepArea = DOM.$('#cooking-step-area', view);
    if (!stepArea) return;

    DOM.empty(stepArea);

    const isLastStep = stepIndex === totalSteps - 1;
    const isCompleted = this._completedSteps[stepIndex];

    // ── Step Number & Header ──
    const stepHeader = DOM.create('div', {
      style: 'text-align: center; margin-bottom: var(--space-6);',
    },
      DOM.create('div', {
        style: 'display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: var(--color-primary); border: var(--pixel-2) solid var(--color-primary-dark); font-family: var(--font-pixel-en); font-size: var(--font-size-2xl); color: white; margin-bottom: var(--space-3);',
        text: String(stepIndex + 1),
      }),
      DOM.create('div', {
        className: 'font-pixel',
        style: 'font-size: var(--font-size-xs); color: #BCAAA4;',
        text: '第 ' + (stepIndex + 1) + ' 步 / 共 ' + totalSteps + ' 步',
      })
    );
    stepArea.appendChild(stepHeader);

    // ── Step Instruction (large font for kitchen viewing) ──
    const instruction = DOM.create('div', {
      style: 'background: #3E2A1A; border: var(--pixel-2) solid #5D4037; padding: var(--space-6) var(--space-4); margin-bottom: var(--space-4); text-align: center;',
    },
      DOM.create('p', {
        style: 'font-family: var(--font-pixel); font-size: 18px; line-height: 2; color: #FFF5EE;',
        text: step.instruction,
      })
    );
    stepArea.appendChild(instruction);

    // ── Step Tip ──
    if (step.tip) {
      stepArea.appendChild(DOM.create('div', {
        style: 'background: #4A3724; border: var(--pixel-1) solid #6D5D4B; padding: var(--space-4); margin-bottom: var(--space-4);',
      },
        DOM.create('p', {
          style: 'font-family: var(--font-pixel); font-size: var(--font-size-sm); color: #FFCC80; line-height: 1.8;',
          text: '💡 ' + step.tip,
        })
      ));
    }

    // ── Timer Button ──
    if (step.duration) {
      const timerKey = 'step_' + stepIndex;
      const timerActive = !!this._activeTimers[timerKey];

      const timerBtn = DOM.create('button', {
        id: 'cooking-timer-btn-' + stepIndex,
        className: 'pixel-btn pixel-btn--small',
        style: 'display: block; width: 100%; margin-bottom: var(--space-4); font-size: var(--font-size-base); padding: var(--space-4);' + (timerActive ? ' background: var(--color-danger); border-color: #C62828; animation: pixel-pulse 1s steps(4) infinite;' : ''),
        text: (timerActive ? '⏱️ 计时中... ' : '⏱️ 启动计时器: ') + this._formatDuration(step.duration),
        onClick: () => {
          this._toggleTimer(stepIndex, step.duration, timerBtn);
        },
      });
      stepArea.appendChild(timerBtn);
    }

    // ── Mark Complete Checkbox ──
    const checkRow = DOM.create('div', {
      style: 'display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); background: #3E2A1A; border: var(--pixel-1) solid #5D4037; margin-bottom: var(--space-4); cursor: pointer;',
      onClick: () => {
        this._completedSteps[stepIndex] = !this._completedSteps[stepIndex];
        this._renderStep(view, stepIndex);
      },
    });

    const checkBox = DOM.create('div', {
      style: 'width: 28px; height: 28px; border: var(--pixel-2) solid ' + (isCompleted ? 'var(--color-success)' : '#BCAAA4') + '; display: flex; align-items: center; justify-content: center; font-size: 16px; color: white;' + (isCompleted ? ' background: var(--color-success);' : ''),
      text: isCompleted ? '✓' : '',
    });
    checkRow.appendChild(checkBox);

    checkRow.appendChild(DOM.create('span', {
      className: 'font-pixel',
      style: 'font-size: var(--font-size-base); color: ' + (isCompleted ? 'var(--color-success)' : '#FFF5EE') + ';',
      text: isCompleted ? '✅ 已完成此步骤' : '☐ 标记完成',
    }));
    stepArea.appendChild(checkRow);

    // ── Last Step: Completion CTA ──
    if (isLastStep) {
      stepArea.appendChild(DOM.create('div', {
        style: 'text-align: center; margin-top: var(--space-6);',
      },
        DOM.create('div', {
          style: 'font-size: 48px; margin-bottom: var(--space-4);',
          text: '🎉',
        }),
        DOM.create('p', {
          className: 'font-pixel',
          style: 'font-size: var(--font-size-base); color: #FFCC80; margin-bottom: var(--space-4);',
          text: '恭喜！你已经完成了「' + recipe.name + '」的所有步骤！',
        }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--large pixel-btn--block',
          style: 'font-size: var(--font-size-md);',
          text: '🎉 完成烹饪，记录到饮食',
          onClick: () => {
            this._showCompleteModal(recipe);
          },
        }),
        DOM.create('button', {
          className: 'pixel-btn pixel-btn--small pixel-btn--secondary mt-3',
          style: 'background: #5D4037; color: #FFCC80; border-color: #8D6E63;',
          text: '← 回到菜谱详情',
          onClick: () => Router.go('/recipe/' + recipe.id),
        })
      ));
    }

    // ── Step Dots (visual indicator of all steps) ──
    const dotsRow = DOM.create('div', {
      style: 'display: flex; justify-content: center; gap: var(--space-2); margin-top: auto; padding-top: var(--space-4); flex-wrap: wrap;',
    });
    recipe.steps.forEach((s, idx) => {
      const isDone = this._completedSteps[idx];
      const isCurrent = idx === stepIndex;
      dotsRow.appendChild(DOM.create('div', {
        style: 'width: ' + (isCurrent ? '32px' : '16px') + '; height: 16px; border: var(--pixel-1) solid ' + (isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : '#5D4037') + '; background: ' + (isDone ? 'var(--color-success)' : isCurrent ? 'var(--color-primary)' : 'transparent') + '; cursor: pointer; transition: all var(--transition-fast);',
        onClick: () => {
          this._currentStep = idx;
          this._renderStep(view, idx);
          const progressFill = DOM.$('#cooking-progress-fill', view);
          if (progressFill) {
            progressFill.style.width = ((idx + 1) / totalSteps * 100) + '%';
          }
          const indicator = DOM.$('#cooking-step-indicator-top', view);
          if (indicator) {
            indicator.textContent = '第 ' + (idx + 1) + ' 步 / 共 ' + totalSteps + ' 步';
          }
          const prevBtn = DOM.$('#cooking-prev-btn', view);
          const nextBtn = DOM.$('#cooking-next-btn', view);
          if (prevBtn) {
            prevBtn.disabled = idx === 0;
            prevBtn.style.opacity = idx === 0 ? '0.4' : '1';
          }
          if (nextBtn) {
            if (idx === totalSteps - 1) {
              nextBtn.textContent = '🎉 完成';
              nextBtn.style.background = 'var(--color-success)';
              nextBtn.style.borderColor = '#43A047';
            } else {
              nextBtn.textContent = '下一步 ▶';
              nextBtn.style.background = 'var(--color-primary)';
              nextBtn.style.borderColor = 'var(--color-primary-dark)';
            }
          }
          stepArea.scrollTop = 0;
        },
      }));
    });
    stepArea.appendChild(dotsRow);
  },

  _formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0 && s > 0) return m + '分' + s + '秒';
    if (m > 0) return m + '分钟';
    return s + '秒';
  },

  _toggleTimer(stepIndex, duration, btnEl) {
    const timerKey = 'step_' + stepIndex;

    if (this._activeTimers[timerKey]) {
      // Stop timer
      clearInterval(this._activeTimers[timerKey].interval);
      delete this._activeTimers[timerKey];
      btnEl.textContent = '⏱️ 启动计时器: ' + this._formatDuration(duration);
      btnEl.style.background = 'var(--color-primary)';
      btnEl.style.borderColor = 'var(--color-primary-dark)';
      btnEl.style.animation = '';
      App.showToast('计时器已停止 ⏱️');
    } else {
      // Start timer
      let remaining = duration;
      this._activeTimers[timerKey] = {
        remaining,
        interval: setInterval(() => {
          remaining--;
          this._activeTimers[timerKey].remaining = remaining;
          btnEl.textContent = '⏱️ 计时中... ' + this._formatDuration(remaining);
          if (remaining <= 0) {
            clearInterval(this._activeTimers[timerKey].interval);
            delete this._activeTimers[timerKey];
            btnEl.textContent = '⏱️ 时间到！启动计时器: ' + this._formatDuration(duration);
            btnEl.style.background = 'var(--color-primary)';
            btnEl.style.borderColor = 'var(--color-primary-dark)';
            btnEl.style.animation = '';
            App.showToast('⏰ 时间到！');
            // Vibrate if available
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
          }
        }, 1000),
      };
      btnEl.textContent = '⏱️ 计时中... ' + this._formatDuration(duration);
      btnEl.style.background = 'var(--color-danger)';
      btnEl.style.borderColor = '#C62828';
      btnEl.style.animation = 'pixel-pulse 1s steps(4) infinite';
      App.showToast('计时器开始 ⏱️ ' + this._formatDuration(duration));
    }
  },

  _showCompleteModal(recipe) {
    // Stop all active timers
    Object.keys(this._activeTimers).forEach(key => {
      clearInterval(this._activeTimers[key].interval);
    });
    this._activeTimers = {};

    const content = DOM.create('div', {});

    content.appendChild(DOM.create('p', {
      className: 'font-pixel text-sm mb-4',
      style: 'color: var(--color-primary);',
      text: '🎉 完成「' + recipe.name + '」'
    }));

    // Rating
    content.appendChild(DOM.create('label', { className: 'text-xs text-muted', text: '给这道菜打分' }));
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
      placeholder: '例如: 火候大了点，下次注意...',
      rows: '2',
      style: 'resize: none;',
    });
    content.appendChild(noteInput);

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

    // Submit
    content.appendChild(DOM.create('button', {
      className: 'pixel-btn pixel-btn--block',
      text: '✅ 完成并记录',
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
          mealType: selectedMealType,
          portions: 1,
        });
        App.showToast('已记录！同时加入今日饮食 📊');
        modal.close();
        Router.go('/recipe/' + recipe.id);
      },
    }));

    content.appendChild(DOM.create('p', {
      className: 'text-xs text-muted text-center mt-2',
      text: '提交后会自动记录到今日饮食追踪',
    }));

    const modal = App.showModal(content);
  },
};
