/**
 * Client-side AI commentary generator.
 * Produces natural-language result descriptions from feature comparison data.
 * No API call required — all templates map directly from result fields.
 */

import { FEATURE_SHORT_LABELS } from './constants';

/** One or two commentary options per chemistry tier (index chosen by percentage) */
const TIER_COMMENTARY = {
  'Feature Twins': [
    "This is remarkable — you share the same smile structure, eye shape, and even ear proportions. Your facial geometry is strikingly similar.",
    "We've rarely seen this level of alignment. Almost every feature we analysed shows the same pattern in both of you.",
  ],
  'Magnetic Match': [
    "There's a clear affinity here. Your features align closely in several key areas, while your contrasting elements create a compelling combination.",
    "The data shows a strong match. Your shared features outnumber your differences in a meaningful way.",
  ],
  'Complementary Pair': [
    "A fascinating mix of similarities and differences. You share key patterns but have distinctly different features in other areas — this is what makes your pairing unique.",
    "Not identical, not opposites — somewhere in between, and that's where the most interesting combinations live.",
  ],
  'Interesting Contrast': [
    "Your faces tell different stories — and that's what makes this interesting. Where one has soft features, the other has bold, distinctive ones.",
    "More differences than similarities, but every one of those contrasts adds something distinctive to your combination.",
  ],
  'Opposites Attract': [
    "Almost every feature is distinct — different structures, different patterns, different expressions. You bring completely different elements to the table.",
    "The AI found very few similarities — which means your combination is truly unique. No overlap means maximum contrast.",
  ],
};

/** Template for a matching feature */
function matchComment(featureKey, traitA, traitB, nameA, nameB) {
  const label = FEATURE_SHORT_LABELS[featureKey] || featureKey;
  if (traitA && traitB && traitA.toLowerCase() === traitB.toLowerCase()) {
    return `You both share ${traitA.toLowerCase()} ${label.toLowerCase()} — one of the clearest similarities we found.`;
  }
  return `Your ${label.toLowerCase()} structures are remarkably similar — a genuine shared trait.`;
}

/** Template for a contrasting feature */
function contrastComment(featureKey, traitA, traitB, nameA, nameB) {
  const label = FEATURE_SHORT_LABELS[featureKey] || featureKey;
  const nA = nameA || 'Person A';
  const nB = nameB || 'Person B';
  if (traitA && traitB) {
    return `Where ${nA} has ${traitA.toLowerCase()} ${label.toLowerCase()}, ${nB} has ${traitB.toLowerCase()} — this contrast is part of what makes your combination distinctive.`;
  }
  return `Your ${label.toLowerCase()} couldn't be more different — and that's not a bad thing. It's what gives your combination its character.`;
}

/**
 * Generate commentary for a compatibility result.
 * @param {object} results - API result with percentage, chemistry_label, feature_comparisons, players
 * @returns {{ tierComment: string, strongestMatch: object|null, biggestContrast: object|null,
 *             strongestMatchComment: string, biggestContrastComment: string }}
 */
export function generateCommentary(results) {
  if (!results) return null;

  const { chemistry_label, feature_comparisons = [], percentage = 0, players } = results;

  // Pick commentary option — deterministic from percentage to avoid random changes on re-render
  const options = TIER_COMMENTARY[chemistry_label] || TIER_COMMENTARY['Complementary Pair'];
  const tierComment = options[Math.floor(percentage / 10) % options.length];

  const matches = feature_comparisons.filter((f) => f.match);
  const mismatches = feature_comparisons.filter((f) => !f.match);

  const strongestMatch = matches[0] || null;
  const biggestContrast = mismatches[0] || null;

  const names = players ? Object.values(players) : [];
  const nameA = names[0] || null;
  const nameB = names[1] || null;

  const strongestMatchComment = strongestMatch
    ? matchComment(strongestMatch.feature, strongestMatch.label_a, strongestMatch.label_b, nameA, nameB)
    : null;

  const biggestContrastComment = biggestContrast
    ? contrastComment(biggestContrast.feature, biggestContrast.label_a, biggestContrast.label_b, nameA, nameB)
    : null;

  return {
    tierComment,
    strongestMatch,
    biggestContrast,
    strongestMatchComment,
    biggestContrastComment,
  };
}
