/**
 * resultsContract — Canonical winner determination, percentage calculation,
 * feature vote extraction, and 50/50 nudge rule.
 *
 * Pure functions module. No state, no side effects, no React dependencies,
 * no AppErrorBus, no AppStorage. Same input = same output, always.
 *
 * This is the SINGLE SOURCE OF TRUTH for all results logic across all
 * products. No other file may re-derive winner, percentages, feature
 * votes, or apply the 50/50 rule.
 *
 * @module resultsContract
 */

// ─── Constants ──────────────────────────────────────────────────

/**
 * The 8 canonical features. Every analysis result must have exactly these.
 * Order is display order (eyes first, ears last).
 */
export const CANONICAL_FEATURES = Object.freeze([
  'eyes', 'eyebrows', 'smile', 'nose', 'face_shape', 'skin', 'hair', 'ears',
]);

/**
 * Human-readable labels for display.
 */
export const FEATURE_LABELS = Object.freeze({
  eyes: 'Eyes',
  eyebrows: 'Eyebrows',
  smile: 'Smile',
  nose: 'Nose',
  face_shape: 'Face Shape',
  skin: 'Skin',
  hair: 'Hair',
  ears: 'Ears',
});

/** Minimum percentage gap before the nudge rule fires. */
export const MIN_PERCENTAGE_GAP = 2;

/** Nudge values when percentages are too close. */
export const NUDGE_WINNER_PCT = 51;
export const NUDGE_LOSER_PCT = 49;

// ─── Normalization helpers ──────────────────────────────────────

/**
 * Normalize a raw backend winner/vote value to 'parent1' | 'parent2' | 'unknown'.
 * @param {*} value - Raw backend value
 * @returns {'parent1' | 'parent2' | 'unknown'}
 */
function normalizeParent(value) {
  if (value === 'parent1' || value === 'parent_a' || value === 'mum') return 'parent1';
  if (value === 'parent2' || value === 'parent_b' || value === 'dad') return 'parent2';
  return 'unknown';
}

/**
 * Normalize a winner value, returning null for non-deterministic outcomes.
 * @param {*} value - Raw backend winner
 * @returns {'parent1' | 'parent2' | null}
 */
function normalizeWinner(value) {
  if (value == null) return null;
  const norm = normalizeParent(value);
  return norm === 'unknown' ? null : norm;
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Extract and normalize the winner from a backend child result.
 *
 * Field resolution order (first non-null wins):
 *   1. childResult.inheritance?.winner
 *   2. childResult.winner
 *   3. childResult.verdict?.primary_parent
 *   4. childResult.verdict?.primaryParent
 *
 * @param {Object|null|undefined} childResult - Backend child result object
 * @returns {'parent1' | 'parent2' | null} Normalized winner or null
 */
export function getWinner(childResult) {
  if (!childResult) return null;

  const raw =
    childResult.inheritance?.winner ??
    childResult.winner ??
    childResult.verdict?.primary_parent ??
    childResult.verdict?.primaryParent ??
    null;

  return normalizeWinner(raw);
}

/**
 * Extract and normalize the 8-feature vote map from a backend child result.
 *
 * Field resolution order:
 *   1. childResult.feature_votes
 *   2. childResult.features?.feature_votes
 *   3. childResult.inheritance?.feature_votes
 *
 * Always returns exactly 8 keys. Missing features default to 'unknown'.
 *
 * @param {Object|null|undefined} childResult - Backend child result object
 * @returns {Object} Normalized feature votes with exactly 8 canonical keys
 */
export function extractFeatureVotes(childResult) {
  const raw =
    childResult?.feature_votes ||
    childResult?.features?.feature_votes ||
    childResult?.inheritance?.feature_votes ||
    {};

  const votes = {};
  for (const feature of CANONICAL_FEATURES) {
    votes[feature] = normalizeParent(raw[feature]);
  }
  return votes;
}

/**
 * Count features per parent from a FeatureVotes object.
 *
 * @param {Object|null|undefined} featureVotes - Output from extractFeatureVotes
 * @returns {{ parent1Count: number, parent2Count: number, unknownCount: number, invariantHolds: boolean }}
 */
export function countFeatures(featureVotes) {
  if (!featureVotes) {
    return { parent1Count: 0, parent2Count: 0, unknownCount: 8, invariantHolds: true };
  }

  let parent1Count = 0;
  let parent2Count = 0;
  let unknownCount = 0;

  for (const feature of CANONICAL_FEATURES) {
    const vote = featureVotes[feature];
    if (vote === 'parent1') parent1Count++;
    else if (vote === 'parent2') parent2Count++;
    else unknownCount++;
  }

  return {
    parent1Count,
    parent2Count,
    unknownCount,
    invariantHolds: parent1Count + parent2Count + unknownCount === 8,
  };
}

/**
 * Apply the 50/50 nudge rule. NEVER show 50/50.
 *
 * If the gap between percentages is < MIN_PERCENTAGE_GAP (2), forces 51/49
 * in the winner's direction. If percentages disagree with winner, flips to match.
 *
 * @param {number} parent1Pct - Parent 1 integer percentage
 * @param {number} parent2Pct - Parent 2 integer percentage
 * @param {'parent1' | 'parent2' | null} winner - Who won
 * @returns {{ parent1Pct: number, parent2Pct: number, nudged: boolean }}
 */
export function apply5050Rule(parent1Pct, parent2Pct, winner) {
  const effectiveWinner = winner || 'parent1'; // arbitrary tiebreak

  // Check if gap is too small
  if (Math.abs(parent1Pct - parent2Pct) < MIN_PERCENTAGE_GAP) {
    if (effectiveWinner === 'parent1') {
      return { parent1Pct: NUDGE_WINNER_PCT, parent2Pct: NUDGE_LOSER_PCT, nudged: true };
    }
    return { parent1Pct: NUDGE_LOSER_PCT, parent2Pct: NUDGE_WINNER_PCT, nudged: true };
  }

  // Check if percentages disagree with winner
  if (effectiveWinner === 'parent1' && parent2Pct > parent1Pct) {
    return {
      parent1Pct: Math.max(parent1Pct, NUDGE_WINNER_PCT),
      parent2Pct: 100 - Math.max(parent1Pct, NUDGE_WINNER_PCT),
      nudged: true,
    };
  }
  if (effectiveWinner === 'parent2' && parent1Pct > parent2Pct) {
    return {
      parent1Pct: 100 - Math.max(parent2Pct, NUDGE_WINNER_PCT),
      parent2Pct: Math.max(parent2Pct, NUDGE_WINNER_PCT),
      nudged: true,
    };
  }

  return { parent1Pct, parent2Pct, nudged: false };
}

/**
 * Calculate display percentages from backend scores or feature counts.
 *
 * Always returns integers that sum to exactly 100.
 * Applies the 50/50 nudge rule.
 *
 * @param {Object|null|undefined} childResult - Backend child result object
 * @param {'parent1' | 'parent2' | null} winner - Normalized winner
 * @returns {{ parent1Pct: number, parent2Pct: number, nudged: boolean }}
 */
export function getPercentages(childResult, winner) {
  let parent1Pct;
  let parent2Pct;

  const scores = childResult?.parent_scores;
  const hasScores =
    scores &&
    typeof scores.parent1 === 'number' &&
    typeof scores.parent2 === 'number';

  if (hasScores) {
    const total = scores.parent1 + scores.parent2;
    if (total > 0) {
      parent1Pct = Math.round((scores.parent1 / total) * 100);
      parent2Pct = 100 - parent1Pct;
    } else {
      parent1Pct = 50;
      parent2Pct = 50;
    }
  } else {
    const featureVotes = extractFeatureVotes(childResult);
    const counts = countFeatures(featureVotes);
    const known = counts.parent1Count + counts.parent2Count;

    if (known > 0) {
      parent1Pct = Math.round((counts.parent1Count / 8) * 100);
      parent2Pct = 100 - parent1Pct;
    } else {
      parent1Pct = 50;
      parent2Pct = 50;
    }
  }

  return apply5050Rule(parent1Pct, parent2Pct, winner);
}

/**
 * Build a complete, consistent, display-ready summary for one child.
 *
 * This is the recommended entry point for most consumers.
 *
 * @param {Object|null|undefined} childResult - Backend child result object
 * @returns {Object|null} ResultsSummary or null if input is null/undefined
 */
export function buildResultsSummary(childResult) {
  if (!childResult) return null;

  const winner = getWinner(childResult);
  const featureVotes = extractFeatureVotes(childResult);
  const featureCounts = countFeatures(featureVotes);
  const percentages = getPercentages(childResult, winner);
  const winnerReason =
    childResult.inheritance?.winner_reason ??
    childResult.winner_reason ??
    null;

  const winnerPct = winner === 'parent1' ? percentages.parent1Pct
    : winner === 'parent2' ? percentages.parent2Pct
    : Math.max(percentages.parent1Pct, percentages.parent2Pct);

  const loserPct = 100 - winnerPct;

  return {
    winner,
    winnerReason,
    percentages,
    featureVotes,
    featureCounts,
    winnerPct,
    loserPct,
  };
}

/**
 * Validate a backend child result for contract violations.
 *
 * Does NOT throw — returns errors as data.
 *
 * @param {Object|null|undefined} childResult - Backend child result object
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateResults(childResult) {
  const errors = [];

  if (!childResult) {
    errors.push('childResult is null or undefined');
    return { valid: false, errors };
  }

  const rawVotes =
    childResult.feature_votes ||
    childResult.features?.feature_votes ||
    childResult.inheritance?.feature_votes;

  if (!rawVotes) {
    errors.push('No feature_votes found in any field path');
  } else {
    const keys = Object.keys(rawVotes);
    if (keys.length !== 8) {
      errors.push(`Expected 8 features, got ${keys.length}`);
    }

    for (const feature of CANONICAL_FEATURES) {
      if (!(feature in rawVotes)) {
        errors.push(`Missing canonical feature: ${feature}`);
      }
    }

    for (const [key, value] of Object.entries(rawVotes)) {
      const valid = ['parent1', 'parent2', 'parent_a', 'parent_b', 'mum', 'dad', 'unknown'];
      if (!valid.includes(value)) {
        errors.push(`Invalid vote value for ${key}: "${value}"`);
      }
    }
  }

  const featureVotes = extractFeatureVotes(childResult);
  const counts = countFeatures(featureVotes);
  if (!counts.invariantHolds) {
    errors.push(`Feature count invariant violated: ${counts.parent1Count} + ${counts.parent2Count} + ${counts.unknownCount} !== 8`);
  }

  const winner = getWinner(childResult);
  if (winner && counts.unknownCount === 0) {
    const winnerCount = winner === 'parent1' ? counts.parent1Count : counts.parent2Count;
    const loserCount = winner === 'parent1' ? counts.parent2Count : counts.parent1Count;
    if (loserCount > winnerCount) {
      errors.push(`Winner is ${winner} but has fewer features (${winnerCount}) than opponent (${loserCount})`);
    }
  }

  const scores = childResult.parent_scores;
  if (scores) {
    if (typeof scores.parent1 === 'number' && (scores.parent1 < 0 || scores.parent1 > 1)) {
      errors.push(`parent_scores.parent1 out of range [0,1]: ${scores.parent1}`);
    }
    if (typeof scores.parent2 === 'number' && (scores.parent2 < 0 || scores.parent2 > 1)) {
      errors.push(`parent_scores.parent2 out of range [0,1]: ${scores.parent2}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── Default export ─────────────────────────────────────────────

export default Object.freeze({
  getWinner,
  extractFeatureVotes,
  countFeatures,
  getPercentages,
  apply5050Rule,
  buildResultsSummary,
  validateResults,
  CANONICAL_FEATURES,
  FEATURE_LABELS,
  MIN_PERCENTAGE_GAP,
  NUDGE_WINNER_PCT,
  NUDGE_LOSER_PCT,
});
