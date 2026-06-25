// ╔══════════════════════════════════════╗
// ║  Recipe Scoring Engine              ║
// ╚══════════════════════════════════════╝

const Scorer = {
  /**
   * Score weight configuration.
   * Weights are tuned so that ingredient coverage is the
   * dominant factor, flavor / ease / coverage are tie-breakers.
   */
  WEIGHTS: {
    matchRate:   0.30,  // how many of the recipe's ingredients the user has
    tasteScore:  0.25,  // built-in taste rating normalized to [0,1]
    easeScore:   0.25,  // inverted difficulty — easy recipes score higher
    coverage:    0.20,  // how many of the user's ingredients were consumed
  },

  /**
   * Minimum score required for tier-1 ("经典必做") recommendations.
   */
  TIER_1_THRESHOLD: 0.60,

  /**
   * Minimum score required for tier-2 ("换个口味") recommendations.
   */
  TIER_2_THRESHOLD: 0.35,

  /**
   * Calculate the base match score for a recipe against the user's
   * ingredient set. Returns a value in [0, 1].
   *
   * @param {Object}   recipe           — full recipe object
   * @param {string[]} userIngredients  — normalized ingredient names
   * @param {number}   matchedCount     — how many recipe ingredients were matched
   * @param {number}   totalUserCount   — total number of user-provided ingredients
   * @returns {number} baseScore in [0, 1]
   */
  calculateScore(recipe, userIngredients, matchedCount, totalUserCount) {
    const recipeIngredientCount = recipe.ingredients ? recipe.ingredients.length : 0;

    if (recipeIngredientCount === 0) {
      return 0;
    }

    // ── Component 1: Ingredient match rate ──
    // What fraction of the recipe's required ingredients does the user have?
    // We count only non-optional ingredients as "required" for this ratio,
    // but `matchedCount` already accounts for all ingredients the user hit
    // (optional or not). So we cap at 1.0.
    const requiredCount = recipe.ingredients.filter(ing => !ing.optional).length;
    const matchRate = requiredCount > 0
      ? Math.min(1, matchedCount / requiredCount)
      : 0;

    // ── Component 2: Taste score ──
    // Built-in tasteRating (1.0-5.0 scale) normalized to [0, 1]
    const tasteScore = (recipe.tasteRating || 3.0) / 5.0;

    // ── Component 3: Ease score ──
    // Inverted difficulty: 1 → 1.0, 2 → 0.5, 3 → 0.0
    const diff = recipe.difficulty || 2;
    const easeScore = 1 - (diff - 1) / 2;

    // ── Component 4: Coverage bonus ──
    // What fraction of the user's supplied ingredients went into this recipe?
    // Rewards recipes that make good use of the user's available stash.
    const coverage = totalUserCount > 0
      ? Math.min(1, matchedCount / totalUserCount)
      : 0;

    // ── Weighted sum ──
    let score =
        this.WEIGHTS.matchRate  * matchRate
      + this.WEIGHTS.tasteScore * tasteScore
      + this.WEIGHTS.easeScore  * easeScore
      + this.WEIGHTS.coverage   * coverage;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  },

  /**
   * Apply a classic pairing boost to the base score.
   *
   * Checks whether every ingredient listed in any CLASSIC_PAIRS entry
   * that targets this recipe is present in `userIngredientsNorm`.
   * If so, the boost for that entry is added to the base score (capped at 1.0).
   *
   * Only the single HIGHEST matching boost is applied per recipe so that
   * multiple partial matches don't stack unrealistically.
   *
   * @param {string}   recipeId            — the recipe id (e.g. 'xi-hong-shi-chao-ji-dan')
   * @param {string[]} userIngredientsNorm — user's ingredients after normalization
   * @param {number}   baseScore           — the pre-boost score in [0, 1]
   * @returns {number} boosted score in [0, 1]
   */
  applyClassicBoost(recipeId, userIngredientsNorm, baseScore) {
    // Quick-path: no classic pairings for this recipe
    const pairIndexes = REVERSE_PAIRS[recipeId];
    if (!pairIndexes || pairIndexes.length === 0) {
      return baseScore;
    }

    const userSet = new Set(userIngredientsNorm);
    let bestBoost = 0;

    // Check each classic pairing that targets this recipe
    for (let i = 0; i < pairIndexes.length; i++) {
      const pair = CLASSIC_PAIRS[pairIndexes[i]];

      // All required ingredients must be present
      const allPresent = pair.required.every(ing => userSet.has(ing));
      if (allPresent && pair.boost > bestBoost) {
        bestBoost = pair.boost;
      }
    }

    // Apply the single best matching boost, cap at 1.0
    return Math.min(1, baseScore + bestBoost);
  },

  /**
   * Calculate the complete final score for a recipe including the
   * classic pairing boost. Convenience wrapper around calculateScore +
   * applyClassicBoost.
   *
   * @param {Object}   recipe
   * @param {string[]} userIngredientsNorm
   * @param {number}   matchedCount
   * @param {number}   totalUserCount
   * @returns {{ baseScore: number, finalScore: number, boosted: boolean }}
   */
  calculateFinalScore(recipe, userIngredientsNorm, matchedCount, totalUserCount) {
    const baseScore = this.calculateScore(
      recipe, userIngredientsNorm, matchedCount, totalUserCount
    );
    const finalScore = this.applyClassicBoost(
      recipe.id, userIngredientsNorm, baseScore
    );
    return {
      baseScore:   baseScore,
      finalScore:  finalScore,
      boosted:     finalScore > baseScore + 0.001, // small epsilon for float
    };
  },

  /**
   * Assign a tier label to a final score.
   *
   * Tier 1 (经典必做): score >= 0.60 — high confidence match
   * Tier 2 (换个口味): score >= 0.35 — usable with some gaps
   * Tier 3 (凑合能吃): everything below tier-2
   *
   * @param {number} finalScore
   * @param {number} matchRate     — used to promote high-match but low-coverage cases
   * @returns {{ tier: number, label: string, emoji: string }}
   */
  categorize(finalScore, matchRate) {
    if (finalScore >= this.TIER_1_THRESHOLD || matchRate >= 0.75) {
      return { tier: 1, label: '经典必做', emoji: '🥇' };
    }
    if (finalScore >= this.TIER_2_THRESHOLD) {
      return { tier: 2, label: '换个口味', emoji: '🥈' };
    }
    return { tier: 3, label: '凑合能吃', emoji: '🥉' };
  },

  /**
   * Return a plain-language reason string explaining WHY a recipe
   * scored the way it did (for the "missing ingredients" hint).
   *
   * @param {Object} scoreResult — from calculateFinalScore
   * @param {number} matchedCount
   * @param {number} totalNeeded
   * @param {string[]} missingIngredients
   * @returns {string}
   */
  explain(scoreResult, matchedCount, requiredCount, missingIngredients) {
    const parts = [];

    if (scoreResult.boosted) {
      parts.push('经典搭配加成');
    }

    if (matchedCount === requiredCount) {
      parts.push('食材刚好齐全');
    } else if (matchedCount >= requiredCount * 0.6) {
      parts.push('还差' + missingIngredients.length + '样就能做');
    } else {
      parts.push('缺' + missingIngredients.length + '样食材');
    }

    if (missingIngredients.length > 0 && missingIngredients.length <= 4) {
      parts.push('缺: ' + missingIngredients.join('、'));
    }

    return parts.join(' · ');
  },
};

// Freeze configuration
Object.freeze(Scorer.WEIGHTS);
Object.freeze(Scorer);
