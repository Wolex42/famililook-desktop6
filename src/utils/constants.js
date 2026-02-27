/** Feature icons — aligned with desktop3 BE contract (8 core features) */
export const FEATURE_ICONS = {
  eyes: '👀',
  eyebrows: '🤨',
  smile: '😊',
  nose: '👃',
  face_shape: '💠',
  skin: '✨',
  hair: '💇',
  ears: '👂',
};

/** Short display labels for feature badges */
export const FEATURE_SHORT_LABELS = {
  eyes: 'Eyes',
  eyebrows: 'Brows',
  smile: 'Smile',
  nose: 'Nose',
  face_shape: 'Face',
  skin: 'Skin',
  hair: 'Hair',
  ears: 'Ears',
};

/** All 8 comparison features in display order */
export const COMPARE_FEATURES = [
  'eyes', 'eyebrows', 'smile', 'nose',
  'face_shape', 'skin', 'hair', 'ears',
];

/** Chemistry labels — must match desktop7 comparison.py thresholds */
export const CHEMISTRY_LABELS = [
  { min: 85, label: 'Feature Twins', color: '#FFD700' },
  { min: 70, label: 'Magnetic Match', color: '#8B5CF6' },
  { min: 55, label: 'Complementary Pair', color: '#3B82F6' },
  { min: 40, label: 'Interesting Contrast', color: '#14B8A6' },
  { min: 0,  label: 'Opposites Attract', color: '#F97316' },
];

/** Get chemistry label + color for a percentage score */
export function getChemistryLabel(percentage) {
  for (const tier of CHEMISTRY_LABELS) {
    if (percentage >= tier.min) {
      return { label: tier.label, color: tier.color };
    }
  }
  return { label: 'Opposites Attract', color: '#95E1D3' };
}

/** Room types */
export const ROOM_TYPES = {
  DUO: 'duo',
  GROUP: 'group',
};

/** Max players by room type */
export const MAX_PLAYERS = {
  duo: 2,
  group: 6,
};
