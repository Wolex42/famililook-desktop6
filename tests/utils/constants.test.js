/**
 * FM-006 — constants.js verification.
 * Ensures COMPARE_FEATURES matches the compare_faces.v1 contract (exactly 8 features).
 */
import { describe, it, expect } from 'vitest';
import { COMPARE_FEATURES } from '../../src/utils/constants';

const EXPECTED_FEATURES = [
  'eyes',
  'eyebrows',
  'smile',
  'nose',
  'face_shape',
  'skin',
  'hair',
  'ears',
];

describe('utils/constants', () => {
  it('COMPARE_FEATURES is an array', () => {
    expect(Array.isArray(COMPARE_FEATURES)).toBe(true);
  });

  it('COMPARE_FEATURES has exactly 8 items', () => {
    expect(COMPARE_FEATURES).toHaveLength(8);
  });

  it('COMPARE_FEATURES contains all 8 compare_faces.v1 feature names', () => {
    expect(COMPARE_FEATURES).toEqual(EXPECTED_FEATURES);
  });

  it('COMPARE_FEATURES has no duplicates', () => {
    const unique = new Set(COMPARE_FEATURES);
    expect(unique.size).toBe(COMPARE_FEATURES.length);
  });
});
