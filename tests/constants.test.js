import { describe, it, expect } from 'vitest';
import {
  FEATURE_ICONS,
  FEATURE_SHORT_LABELS,
  COMPARE_FEATURES,
  CHEMISTRY_LABELS,
  getChemistryLabel,
  ROOM_TYPES,
  MAX_PLAYERS,
} from '../src/utils/constants';

describe('constants', () => {
  it('has icons for all 8 features', () => {
    expect(Object.keys(FEATURE_ICONS)).toHaveLength(8);
    for (const key of COMPARE_FEATURES) {
      expect(FEATURE_ICONS[key]).toBeDefined();
    }
  });

  it('has short labels for all 8 features', () => {
    expect(Object.keys(FEATURE_SHORT_LABELS)).toHaveLength(8);
    for (const key of COMPARE_FEATURES) {
      expect(typeof FEATURE_SHORT_LABELS[key]).toBe('string');
    }
  });

  it('COMPARE_FEATURES has exactly 8 entries', () => {
    expect(COMPARE_FEATURES).toHaveLength(8);
  });

  it('CHEMISTRY_LABELS covers 0-100 range', () => {
    expect(CHEMISTRY_LABELS).toHaveLength(5);
    expect(CHEMISTRY_LABELS[0].min).toBe(85);
    expect(CHEMISTRY_LABELS[CHEMISTRY_LABELS.length - 1].min).toBe(0);
  });

  it('each chemistry label has label and color', () => {
    for (const tier of CHEMISTRY_LABELS) {
      expect(typeof tier.label).toBe('string');
      expect(tier.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

describe('getChemistryLabel', () => {
  it('returns Feature Twins for 85+', () => {
    expect(getChemistryLabel(85)).toEqual({ label: 'Feature Twins', color: '#FFD700' });
    expect(getChemistryLabel(100)).toEqual({ label: 'Feature Twins', color: '#FFD700' });
  });

  it('returns Magnetic Match for 70-84', () => {
    expect(getChemistryLabel(70)).toEqual({ label: 'Magnetic Match', color: '#8B5CF6' });
    expect(getChemistryLabel(84)).toEqual({ label: 'Magnetic Match', color: '#8B5CF6' });
  });

  it('returns Complementary Pair for 55-69', () => {
    expect(getChemistryLabel(55)).toEqual({ label: 'Complementary Pair', color: '#3B82F6' });
    expect(getChemistryLabel(69)).toEqual({ label: 'Complementary Pair', color: '#3B82F6' });
  });

  it('returns Interesting Contrast for 40-54', () => {
    expect(getChemistryLabel(40)).toEqual({ label: 'Interesting Contrast', color: '#14B8A6' });
    expect(getChemistryLabel(54)).toEqual({ label: 'Interesting Contrast', color: '#14B8A6' });
  });

  it('returns Opposites Attract for 0-39', () => {
    expect(getChemistryLabel(0)).toEqual({ label: 'Opposites Attract', color: '#F97316' });
    expect(getChemistryLabel(39)).toEqual({ label: 'Opposites Attract', color: '#F97316' });
  });
});

describe('room config', () => {
  it('has duo and group types', () => {
    expect(ROOM_TYPES.DUO).toBe('duo');
    expect(ROOM_TYPES.GROUP).toBe('group');
  });

  it('has correct max players', () => {
    expect(MAX_PLAYERS.duo).toBe(2);
    expect(MAX_PLAYERS.group).toBe(6);
  });
});
