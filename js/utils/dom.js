// ╔══════════════════════════════════════╗
// ║  DOM Utility Helpers               ║
// ╚══════════════════════════════════════╝

const DOM = {
  /**
   * Create an element with attributes and children
   * @param {string} tag
   * @param {Object} attrs - attributes and properties
   * @param {...(string|Node|Array)} children
   * @returns {HTMLElement}
   */
  create(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);

    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = val;
      } else if (key === 'dataset') {
        Object.assign(el.dataset, val);
      } else if (key === 'style' && typeof val === 'object') {
        Object.assign(el.style, val);
      } else if (key.startsWith('on') && typeof val === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key === 'html') {
        el.innerHTML = val;
      } else if (key === 'text') {
        el.textContent = val;
      } else {
        el.setAttribute(key, val);
      }
    }

    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      if (typeof child === 'string' || typeof child === 'number') {
        el.appendChild(document.createTextNode(String(child)));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }

    return el;
  },

  /**
   * Query selector shorthand
   */
  $(selector, parent = document) {
    return parent.querySelector(selector);
  },

  /**
   * Query selector all shorthand
   */
  $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  },

  /**
   * Clear all children from an element
   */
  empty(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    return el;
  },

  /**
   * Render content into an element (clears first)
   */
  render(el, ...children) {
    this.empty(el);
    for (const child of children.flat(Infinity)) {
      if (child == null || child === false) continue;
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
    return el;
  },

  /**
   * Toggle a CSS class
   */
  toggleClass(el, className, force) {
    el.classList.toggle(className, force);
  },

  /**
   * Add/remove multiple classes
   */
  setClasses(el, classes) {
    el.className = '';
    for (const [cls, on] of Object.entries(classes)) {
      if (on) el.classList.add(cls);
    }
  },

  /**
   * Slide an element onto screen (bottom sheet)
   */
  slideIn(el) {
    el.style.transform = 'translateY(100%)';
    el.style.transition = 'transform 250ms steps(6)';
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(0)';
    });
  },

  /**
   * Create a pixel icon element
   */
  pixelIcon(emoji, size = 'md') {
    const sizes = { sm: 20, md: 32, lg: 48, xl: 64 };
    const px = sizes[size] || sizes.md;
    return this.create('span', {
      className: 'pixel-icon-frame',
      style: { width: px + 'px', height: px + 'px', fontSize: (px * 0.6) + 'px' },
      text: emoji,
    });
  },

  /**
   * Debounce a function
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Generate a simple unique ID
   */
  uid(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },
};
