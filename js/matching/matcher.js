// ╔══════════════════════════════════════╗
// ║  Smart Ingredient Matcher           ║
// ║  "有什么 → 做什么"                  ║
// ╚══════════════════════════════════════╝

const Matcher = {
  /**
   * Maximum number of user ingredients to consider.
   * Long inputs are truncated to avoid noise.
   */
  MAX_INPUT_INGREDIENTS: 15,

  /**
   * Number of results to keep as candidates for diversification.
   */
  DIVERSIFY_POOL_SIZE: 15,

  /**
   * Number of top results to diversify.
   */
  DIVERSIFY_TOP_N: 8,

  /**
   * ── Main Entry Point ──
   *
   * Match recipes against user-provided ingredient text.
   *
   * @param {string} input — raw ingredient text (e.g. "鸡蛋、西红柿、青椒")
   * @returns {Object} {
   *   tiers: [ { tier, label, emoji, results: [...] }, ... ],
   *   userIngredients: string[],    // normalized
   *   totalRecipes: number,         // total recipes searched
   *   matchedCount: number,         // how many recipes matched at all
   *   tip: string|null              // contextual tip for the user
   * }
   */
  match(input) {
    // ── 1. Tokenize & normalize ──
    const tokens = this._tokenize(input);
    const userIngredientsNorm = this._normalize(tokens);

    // ── Edge case: empty input ──
    if (userIngredientsNorm.length === 0) {
      return {
        tiers: [],
        userIngredients: [],
        totalRecipes: 0,
        matchedCount: 0,
        tip: '请输入你手头有的食材，用逗号或空格分隔。比如：鸡蛋、西红柿、青椒',
      };
    }

    // ── Truncate long inputs ──
    const normalized = userIngredientsNorm.slice(0, this.MAX_INPUT_INGREDIENTS);
    const wasTruncated = userIngredientsNorm.length > this.MAX_INPUT_INGREDIENTS;

    // ── 2. Get all recipes ──
    const allRecipes = this._getAllRecipes();

    if (allRecipes.length === 0) {
      return {
        tiers: [],
        userIngredients: normalized,
        totalRecipes: 0,
        matchedCount: 0,
        tip: '菜谱数据加载中，请稍后再试~',
      };
    }

    // ── 3. Score each recipe ──
    const scored = allRecipes.map(recipe => this._scoreRecipe(recipe, normalized));

    // ── 4. Sort by final score descending ──
    scored.sort((a, b) => b.finalScore - a.finalScore);

    // ── 5. Diversify top results ──
    const diversified = this._diversify(scored, this.DIVERSIFY_TOP_N);

    // ── 6. Categorize into tiers ──
    const result = this._categorize(diversified, normalized);

    // ── Attach metadata ──
    result.userIngredients = normalized;
    result.totalRecipes = allRecipes.length;
    result.matchedCount = scored.filter(s => s.finalScore > 0).length;

    if (wasTruncated) {
      result.tip = '输入食材太多，已取前' + this.MAX_INPUT_INGREDIENTS + '种进行匹配。';
    } else if (result.matchedCount === 0) {
      result.tip = '没有找到完全匹配的菜谱，试试简化输入（比如只输入1-2种主要食材）。';
    } else {
      result.tip = null;
    }

    return result;
  },

  // ──────────────────────────────────────
  //   Step 1: Tokenization
  // ──────────────────────────────────────

  /**
   * Split raw input text into individual ingredient tokens.
   * Handles Chinese/English commas, Chinese separator (、),
   * newlines, spaces, and English commas/semicolons.
   *
   * @param {string} input — raw user text
   * @returns {string[]} raw tokens (may contain duplicates)
   */
  _tokenize(input) {
    if (!input || typeof input !== 'string') {
      return [];
    }

    // Normalize separators:
    // - Chinese comma (，) and enumeration comma (、)
    // - English comma (,) and semicolon (;)
    // - Spaces, newlines, tabs
    // - Chinese/English periods
    const cleaned = input
      .replace(/[，、,;；\s\n\r\t。．.]+/g, '|')  // unify separators to pipe
      .replace(/\|+/g, '|')                        // collapse multiple pipes
      .replace(/^\||\|$/g, '');                     // trim leading/trailing

    const tokens = cleaned.split('|');

    // Filter out empty strings and overly short tokens
    return tokens
      .map(t => t.trim())
      .filter(t => t.length > 0);
  },

  // ──────────────────────────────────────
  //   Step 2: Normalization
  // ──────────────────────────────────────

  /**
   * Normalize ingredient tokens:
   * 1. Resolve synonyms to canonical names
   * 2. Deduplicate
   * 3. Remove common noise words
   *
   * @param {string[]} tokens — raw token array
   * @returns {string[]} unique normalized ingredient names
   */
  _normalize(tokens) {
    const synonymMap = this._getSynonymMap();
    const seen = new Set();
    const result = [];

    // Noise words that are not ingredients
    const noiseWords = new Set([
      '的', '了', '和', '与', '或', '还有', '有', '一些', '一点', '几个', '若干',
      '然后', '做', '菜', '饭', '吃', '想', '要', '用',
    ]);

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i].trim();

      // Skip noise words
      if (noiseWords.has(token) || token.length < 1) {
        continue;
      }

      // Apply consistent casing (lowercase for English, keep for Chinese)
      token = token.toLowerCase();

      // Resolve synonym to canonical form
      const canonical = this._resolveSynonym(token, synonymMap);

      if (canonical && !seen.has(canonical)) {
        seen.add(canonical);
        result.push(canonical);
      }
    }

    return result;
  },

  /**
   * Resolve a single token through the synonym map.
   * First checks if the token itself is a canonical name,
   * then searches synonym lists.
   *
   * @param {string} token
   * @param {Object} synonymMap
   * @returns {string|null} canonical name, or null if unrecognized
   */
  _resolveSynonym(token, synonymMap) {
    // Direct canonical match (token is already a known ingredient)
    if (synonymMap[token] !== undefined) {
      return token;
    }

    // Search synonyms
    for (const [canonical, synonyms] of Object.entries(synonymMap)) {
      if (Array.isArray(synonyms) && synonyms.includes(token)) {
        return canonical;
      }
    }

    // Not found in synonym map — return as-is (user might have typed a
    // canonical name that isn't in our map, or an unknown ingredient)
    return token;
  },

  /**
   * Get the full synonym map.
   * Uses the global INGREDIENT_SYNONYMS if available (loaded via
   * ingredient-synonyms.js), otherwise falls back to a minimal
   * built-in set.
   *
   * @returns {Object} { canonicalName: [synonyms...] }
   */
  _getSynonymMap() {
    // Use global synonym map if loaded
    if (typeof INGREDIENT_SYNONYMS !== 'undefined' && INGREDIENT_SYNONYMS) {
      return INGREDIENT_SYNONYMS;
    }

    // Minimal built-in fallback (covers common student-kitchen variations)
    return {
      '鸡蛋':    ['蛋', '鸡子儿', 'egg'],
      '西红柿':  ['番茄', '洋柿子', 'tomato'],
      '土豆':    ['马铃薯', '洋芋', 'potato'],
      '青椒':    ['菜椒', '柿子椒', '甜椒', 'green pepper'],
      '猪肉':    ['肉', '瘦肉', '五花', 'pork', '五花肉'],
      '鸡肉':    ['鸡', '鸡块', 'chicken', '鸡胸肉'],
      '牛肉':    ['牛腩', '牛', 'beef'],
      '豆腐':    ['嫩豆腐', '老豆腐', 'tofu'],
      '米饭':    ['饭', '剩饭', 'rice', '隔夜饭'],
      '面':      ['面条', '挂面', 'noodle', '意面'],
      '白菜':    ['大白菜', 'cabbage'],
      '胡萝卜':  ['红萝卜', 'carrot'],
      '黄瓜':    ['青瓜', 'cucumber'],
      '茄子':    ['矮瓜', 'eggplant'],
      '洋葱':    ['洋葱头', 'onion'],
      '蒜':      ['大蒜', '蒜头', '蒜瓣', 'garlic'],
      '葱':      ['小葱', '香葱', '大葱', '葱花'],
      '姜':      ['生姜', '姜片', 'ginger'],
      '辣椒':    ['干辣椒', '小米辣', 'chili', '辣椒粉'],
      '面包':    ['吐司', '面包片', 'bread', 'toast'],
      '牛奶':    ['奶', 'milk', '鲜奶'],
      '芝士':    ['奶酪', '芝士碎', '芝士片', 'cheese'],
      '火腿':    ['火腿肠', 'ham', '午餐肉'],
      '培根':    ['bacon', '烟肉'],
      '虾仁':    ['虾', '大虾', 'shrimp', '对虾'],
      '排骨':    ['猪排', '小排', 'ribs'],
      '鸡翅':    ['中翅', '翅中', 'wings'],
      '木耳':    ['黑木耳', '云耳'],
      '银耳':    ['白木耳', '雪耳'],
      '绿豆':    ['mung bean'],
      '红枣':    ['大枣', 'red dates'],
      '牛油果':  ['鳄梨', 'avocado'],
      '生菜':    ['lettuce', '叶生菜'],
      '白蘑菇':  ['口蘑', '蘑菇', 'mushroom'],
      '泡菜':    ['韩国泡菜', 'kimchi', '辣白菜'],
      '方便面':  ['泡面', '快熟面', 'instant noodle'],
      '粉条':    ['粉丝', '红薯粉'],
      '蒜苗':    ['青蒜'],
      '孜然':    ['孜然粉', 'cumin'],
      '糖':      ['白糖', '砂糖', '白砂糖', 'sugar', '冰糖'],
      '醋':      ['香醋', '陈醋', '白醋', 'vinegar'],
      '生抽':    ['酱油', 'soy sauce'],
      '蚝油':    ['oyster sauce'],
      '料酒':    ['黄酒', 'cooking wine'],
      '淀粉':    ['生粉', 'corn starch'],
      '面粉':    ['中筋面粉', 'all-purpose flour'],
      '番茄酱':  ['茄汁', 'ketchup', 'tomato paste'],
      '黄油':    ['牛油', 'butter'],
      '橄榄油':  ['olive oil'],
      '芝麻油':  ['香油', 'sesame oil'],
      '咖喱块':  ['咖喱', 'curry'],
      '酸奶':    ['yogurt', '优格'],
      '沙拉酱':  ['蛋黄酱', 'mayonnaise'],
      '食用油':  ['油', '菜油', 'oil'],
      '盐':      ['食盐', 'salt'],
      '黑胡椒':  ['胡椒', 'black pepper'],
      '蜂蜜':    ['honey'],
      '柠檬汁':  ['柠檬', 'lemon'],
      '花生':    ['花生米', 'peanut'],
    };
  },

  // ──────────────────────────────────────
  //   Step 3: Recipe Scoring
  // ──────────────────────────────────────

  /**
   * Score a single recipe against the normalized user ingredients.
   *
   * @param {Object} recipe          — full recipe object
   * @param {string[]} userIngredients — normalized user ingredient list
   * @returns {Object} {
   *   recipe,          // original recipe ref
   *   baseScore,       // before boost
   *   finalScore,      // after boost
   *   matchedCount,    // how many user ingredients hit
   *   matchRate,       // matchedCount / requiredCount
   *   matched: [],     // ingredient names that matched
   *   missing: [],     // ingredient names the user doesn't have
   *   boosted,         // whether classic pairing boost was applied
   * }
   */
  _scoreRecipe(recipe, userIngredients) {
    const userSet = new Set(userIngredients);
    const recipeIngredients = recipe.ingredients || [];

    const matched = [];
    const missing = [];
    let matchedCount = 0;

    for (let i = 0; i < recipeIngredients.length; i++) {
      const ing = recipeIngredients[i];
      const ingName = ing.name;

      // Check: does the user have this ingredient?
      const hasIt = this._ingredientMatches(ingName, userSet);

      if (hasIt) {
        matched.push(ingName);
        matchedCount++;
      } else if (!ing.optional) {
        // Only report missing if it is NOT optional
        missing.push(ingName);
      }
    }

    // Compute scores
    const scoreResult = Scorer.calculateFinalScore(
      recipe, userIngredients, matchedCount, userIngredients.length
    );

    // Compute match rate for tiering (uses required ingredients)
    const requiredCount = recipeIngredients.filter(ing => !ing.optional).length;
    const matchRate = requiredCount > 0
      ? Math.min(1, matchedCount / requiredCount)
      : 0;

    return {
      recipe:       recipe,
      baseScore:    scoreResult.baseScore,
      finalScore:   scoreResult.finalScore,
      matchedCount: matchedCount,
      matchRate:    matchRate,
      matched:      matched,
      missing:      missing,
      boosted:      scoreResult.boosted,
    };
  },

  /**
   * Check if an ingredient name (from a recipe) is covered by the
   * user's ingredient set. Checks exact match AND synonym expansions
   * of the recipe ingredient name.
   *
   * @param {string} recipeIngName
   * @param {Set<string>} userSet
   * @returns {boolean}
   */
  _ingredientMatches(recipeIngName, userSet) {
    // Direct match
    if (userSet.has(recipeIngName)) {
      return true;
    }

    // Check if any of the recipe ingredient's synonyms are in the user set
    const synonymMap = this._getSynonymMap();
    const synonyms = synonymMap[recipeIngName];
    if (Array.isArray(synonyms)) {
      for (let i = 0; i < synonyms.length; i++) {
        if (userSet.has(synonyms[i])) {
          return true;
        }
      }
    }

    // Also check the reverse: does the recipe ingredient name appear
    // as a synonym of any user ingredient?
    for (const userIng of userSet) {
      const userSynonyms = synonymMap[userIng];
      if (Array.isArray(userSynonyms) && userSynonyms.includes(recipeIngName)) {
        return true;
      }
    }

    return false;
  },

  // ──────────────────────────────────────
  //   Step 4: Get All Recipes
  // ──────────────────────────────────────

  /**
   * Collect all available recipes from both cuisine categories.
   * Gracefully handles the case where one or both recipe arrays
   * haven't been loaded yet.
   *
   * @returns {Object[]} combined recipe array
   */
  _getAllRecipes() {
    const all = [];

    if (typeof RECIPES_ZHONGCAN !== 'undefined' && Array.isArray(RECIPES_ZHONGCAN)) {
      all.push(...RECIPES_ZHONGCAN);
    }

    if (typeof RECIPES_XICAN !== 'undefined' && Array.isArray(RECIPES_XICAN)) {
      all.push(...RECIPES_XICAN);
    }

    return all;
  },

  // ──────────────────────────────────────
  //   Step 5: Diversification
  // ──────────────────────────────────────

  /**
   * Diversify the top-N results so the user doesn't see, for example,
   * five scrambled-egg variations as their top five.
   *
   * Strategy:
   *   - Take the highest-scoring result (always show #1).
   *   - For subsequent picks, penalize recipes that share a "category
   *     group" with any already-selected result.
   *   - Category groups are based on primary ingredient type.
   *
   * @param {Object[]} ranked  — scored results sorted by finalScore desc
   * @param {number}   n       — how many results to diversify
   * @returns {Object[]} diversified result array
   */
  _diversify(ranked, n) {
    if (ranked.length <= 1) {
      return ranked;
    }

    const selected = [];
    const categoryGroups = {
      egg:      ['西红柿炒鸡蛋', '蛋炒饭', '蛋包饭', '鸡蛋饼', '鸡蛋豆腐', '鸡蛋布丁', '韭菜炒鸡蛋'],
      chicken:  ['宫保鸡丁', '可乐鸡翅', '烤鸡翅', '咖喱饭'],
      pork:     ['青椒肉丝', '回锅肉', '鱼香肉丝', '糖醋排骨', '猪肉炖粉条'],
      beef:     ['孜然牛肉', '土豆烧牛肉', '煎牛排', '罗宋汤'],
      tofu:     ['麻婆豆腐', '鸡蛋豆腐', '红烧茄子'],
      noodle:   ['番茄鸡蛋面', '番茄意面', '奶油培根意面', '蛋炒方便面'],
      rice:     ['蛋炒饭', '韩式泡菜炒饭', '奶香焗饭', '蛋包饭', '咖喱饭'],
      soup:     ['酸辣汤', '冬瓜排骨汤', '奶油蘑菇汤', '罗宋汤', '银耳红枣汤', '绿豆汤'],
      salad:    ['凯撒沙拉', '凉拌黄瓜', '水果沙拉', '牛油果吐司'],
      potato:   ['土豆泥', '土豆烧牛肉', '地三鲜'],
      seafood:  ['蒜香虾仁'],
      dessert:  ['鸡蛋布丁', '微波炉蛋糕', '水果沙拉', '银耳红枣汤', '绿豆汤', '酸奶水果捞'],
    };

    /**
     * Determine which category groups a recipe belongs to.
     */
    const getGroups = (recipe) => {
      const groups = [];
      const id = recipe.id || '';
      const name = recipe.name || '';
      for (const [group, members] of Object.entries(categoryGroups)) {
        if (members.some(m => id.includes(m) || name.includes(m))) {
          groups.push(group);
        }
      }
      // Fallback: use cuisine as a weak group
      if (groups.length === 0) {
        groups.push('cuisine:' + (recipe.cuisine || 'other'));
      }
      return groups;
    };

    // Always take the #1 result
    selected.push(ranked[0]);
    const usedGroups = new Set(getGroups(ranked[0].recipe));

    // Fill remaining slots with diversity penalty
    const candidates = ranked.slice(1);
    while (selected.length < n && candidates.length > 0) {
      let bestIdx = 0;
      let bestEffectiveScore = -1;

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const groups = getGroups(candidate.recipe);

        // Count how many groups overlap with already-selected results
        let overlap = 0;
        for (const g of groups) {
          if (usedGroups.has(g)) overlap++;
        }

        // Diversity penalty: -0.05 per overlapping group
        const penalty = overlap * 0.05;
        const effectiveScore = candidate.finalScore - penalty;

        if (effectiveScore > bestEffectiveScore) {
          bestEffectiveScore = effectiveScore;
          bestIdx = i;
        }
      }

      // Pick the best remaining candidate
      const chosen = candidates.splice(bestIdx, 1)[0];
      selected.push(chosen);

      // Mark its groups as used
      const chosenGroups = getGroups(chosen.recipe);
      for (const g of chosenGroups) {
        usedGroups.add(g);
      }
    }

    // Append any remaining results (beyond n)
    return selected.concat(candidates);
  },

  // ──────────────────────────────────────
  //   Step 6: Categorization
  // ──────────────────────────────────────

  /**
   * Categorize scored recipes into three tiers.
   *
   * Tier 1 (经典必做): score >= 0.60, high match rate
   * Tier 2 (换个口味): score >= 0.35
   * Tier 3 (凑合能吃): everything else with ingredients shown
   *
   * @param {Object[]} ranked  — diversified scored results
   * @param {string[]} userIngredients
   * @returns {Object} { tiers: [...] }
   */
  _categorize(ranked, userIngredients) {
    const tier1 = [];
    const tier2 = [];
    const tier3 = [];

    for (let i = 0; i < ranked.length; i++) {
      const item = ranked[i];
      const cat = Scorer.categorize(item.finalScore, item.matchRate);

      // Build the enriched result object
      const result = {
        recipe:       item.recipe,
        baseScore:    item.baseScore,
        finalScore:   item.finalScore,
        matchRate:    item.matchRate,
        matched:      item.matched,
        missing:      item.missing,
        boosted:      item.boosted,
        tier:         cat.tier,
        tierLabel:    cat.label,
        tierEmoji:    cat.emoji,
        missingText:  this._formatMissingText(item.missing),
      };

      if (cat.tier === 1) {
        tier1.push(result);
      } else if (cat.tier === 2) {
        tier2.push(result);
      } else {
        tier3.push(result);
      }
    }

    const tiers = [];

    if (tier1.length > 0) {
      tiers.push({ tier: 1, label: '经典必做', emoji: '🥇', results: tier1 });
    }
    if (tier2.length > 0) {
      tiers.push({ tier: 2, label: '换个口味', emoji: '🥈', results: tier2 });
    }
    if (tier3.length > 0) {
      tiers.push({ tier: 3, label: '凑合能吃', emoji: '🥉', results: tier3 });
    }

    return { tiers };
  },

  /**
   * Format missing ingredients for display.
   *
   * @param {string[]} missing
   * @returns {string}
   */
  _formatMissingText(missing) {
    if (missing.length === 0) {
      return '齐全';
    }
    if (missing.length <= 3) {
      return '缺: ' + missing.join('、');
    }
    return '缺' + missing.length + '样食材: ' + missing.slice(0, 3).join('、') + '…';
  },

  // ──────────────────────────────────────
  //   Utility: Quick Match (for "lazy mode")
  // ──────────────────────────────────────

  /**
   * Quick-match a single dominant ingredient.
   * Returns a short list of top hits without full scoring.
   *
   * @param {string} singleIngredient
   * @returns {Object[]} top 5 recipe results
   */
  quickMatch(singleIngredient) {
    const result = this.match(singleIngredient);
    const all = [];
    for (const tier of result.tiers) {
      all.push(...tier.results);
    }
    return all.slice(0, 5);
  },

  /**
   * Search recipes by keyword (name, ingredient, tag).
   * Used for the browse/search feature.
   *
   * @param {string} query
   * @param {Object[]} [recipes] — optional pre-filtered recipe list
   * @returns {Object[]} matching recipes
   */
  search(query, recipes) {
    if (!query || query.trim().length === 0) {
      return recipes || this._getAllRecipes();
    }

    const q = query.trim().toLowerCase();
    const all = recipes || this._getAllRecipes();

    return all.filter(recipe => {
      // Match against name
      if (recipe.name && recipe.name.toLowerCase().includes(q)) return true;
      // Match against English name
      if (recipe.nameEn && recipe.nameEn.toLowerCase().includes(q)) return true;
      // Match against ingredient names
      if (recipe.ingredients) {
        for (const ing of recipe.ingredients) {
          if (ing.name && ing.name.toLowerCase().includes(q)) return true;
        }
      }
      // Match against tags
      if (recipe.tags) {
        for (const tag of recipe.tags) {
          if (tag.toLowerCase().includes(q)) return true;
        }
      }
      // Match against cuisine
      if (recipe.cuisine && recipe.cuisine.toLowerCase().includes(q)) return true;
      return false;
    });
  },
};

// Freeze the matcher
Object.freeze(Matcher);
