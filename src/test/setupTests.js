/**
 * Vitest setup — jsdom environment bootstrap for FamiliMatch tests.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @famililook/shared sub-paths that ship .jsx source files.
// Node ESM loader cannot handle .jsx from node_modules in Vitest.
// These components are tested in famililook-shared (325 tests).
vi.mock('@famililook/shared/photo', () => ({
  PhotoQualityRing: ({ children }) => children,
  usePhotoQuality: () => ({ score: 85, grade: 'excellent', issues: [], suggestion: null, confidence: 1, loading: false, error: null }),
  useBestShotSelector: () => ({ bestIndex: 0, scores: [85] }),
  PHOTO_QUALITY_COPY: {},
  PHOTO_QUALITY_GRADE_COPY: { excellent: 'Looking good' },
  PHOTO_QUALITY_CHECKS: [],
}));

vi.mock('@famililook/shared/rewards', () => ({
  CelebrationBurst: ({ children }) => children,
  MicroReward: ({ children }) => children,
  StatHighlight: ({ children }) => children,
  ProgressReveal: ({ children }) => children,
  useVariableReward: () => ({ reward: null }),
}));

vi.mock('@famililook/shared/journey', () => ({
  SwipeJourney: ({ children }) => children,
  JourneyCard: ({ children }) => children,
  useJourneyProgress: () => ({ currentIndex: 0, completed: false, goTo: () => {}, goForward: () => {}, goBack: () => {} }),
  familimatchJourney: [
    { id: 'score', type: 'reveal', component: 'CompatibilityScore', props: {} },
    { id: 'label', type: 'verdict', component: 'ChemistryLabel', props: {} },
    { id: 'features', type: 'proof', component: 'FeatureBreakdown', props: {} },
    { id: 'shared', type: 'contrast', component: 'SharedFeatures', props: {} },
    { id: 'science', type: 'deepdive', component: 'ScienceExplainer', props: {} },
    { id: 'rare', type: 'deepdive', component: 'RareStat', props: {} },
    { id: 'share', type: 'share', component: 'ShareCard', props: {} },
    { id: 'upgrade', type: 'upsell', component: 'DuoUpgrade', props: {} },
  ],
  famililookJourney: [],
}));

// Provide a minimal localStorage / sessionStorage for jsdom
const storageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: storageMock() });
}
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: storageMock() });
}

// Reset storage between tests
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
