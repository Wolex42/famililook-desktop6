/**
 * FM-006 — matchClient.js unit tests.
 * Tests dataUrlToBlob, compareFacesDirect, compareSolo, and response shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock config before importing the module under test ──────────────────────
vi.mock('../../src/utils/config', () => ({
  API_BASE: 'http://test-api:8008',
  API_KEY: 'test-key',
}));

// ── Mock response matching compare_faces.v1 contract ────────────────────────
const MOCK_COMPARE_RESPONSE = {
  ok: true,
  percentage: 78,
  chemistry_label: 'Magnetic Match',
  chemistry_color: '#8B5CF6',
  embedding_similarity: 0.82,
  feature_similarity: 0.71,
  feature_comparisons: [
    { feature: 'eyes', label_a: 'round', label_b: 'round', match: true },
    { feature: 'eyebrows', label_a: 'arched', label_b: 'straight', match: false },
    { feature: 'smile', label_a: 'wide', label_b: 'wide', match: true },
    { feature: 'nose', label_a: 'narrow', label_b: 'broad', match: false },
    { feature: 'face_shape', label_a: 'oval', label_b: 'oval', match: true },
    { feature: 'skin', label_a: 'fair', label_b: 'medium', match: false },
    { feature: 'hair', label_a: 'dark', label_b: 'dark', match: true },
    { feature: 'ears', label_a: 'attached', label_b: 'detached', match: false },
  ],
  shared_features: ['eyes', 'smile', 'face_shape', 'hair'],
  calibrated_a: { eyes: 'round' },
  calibrated_b: { eyes: 'round' },
  name_a: 'Alice',
  name_b: 'Bob',
};

const MOCK_MORPH_RESPONSE = {
  image: 'data:image/png;base64,fakemorph',
};

// ── Valid tiny PNG as a data URL for testing ─────────────────────────────────
const VALID_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// We need to import the module dynamically so mocks are in place
let compareSolo;

beforeEach(async () => {
  vi.restoreAllMocks();

  // Reset localStorage for getBiometricHeaders
  localStorage.setItem(
    'fl:bipa-consent',
    JSON.stringify({ bipaConsented: true, timestamp: new Date().toISOString() }),
  );

  // Mock global fetch
  globalThis.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/compare/faces')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_COMPARE_RESPONSE),
      });
    }
    if (url.includes('/face/morph')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MOCK_MORPH_RESPONSE),
      });
    }
    return Promise.resolve({ ok: false, status: 404 });
  });

  // Dynamic import to pick up mocks
  const mod = await import('../../src/api/matchClient.js');
  compareSolo = mod.compareSolo;
});

// ── dataUrlToBlob tests (internal fn, tested via compareSolo) ───────────────

describe('dataUrlToBlob (via compareSolo)', () => {
  it('throws on invalid data URL (no comma)', async () => {
    await expect(compareSolo('not-a-data-url', VALID_DATA_URL, vi.fn())).rejects.toThrow(
      'Invalid data URL',
    );
  });

  it('throws on null/undefined input', async () => {
    await expect(compareSolo(null, VALID_DATA_URL, vi.fn())).rejects.toThrow();
  });

  it('valid data URL flows through without error', async () => {
    await expect(
      compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn()),
    ).resolves.toBeDefined();
  });
});

// ── compareFacesDirect tests (called internally by compareSolo) ─────────────

describe('compareFacesDirect (via compareSolo)', () => {
  it('calls /compare/faces with POST and FormData', async () => {
    await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());

    const compareCall = globalThis.fetch.mock.calls.find((c) =>
      c[0].includes('/compare/faces'),
    );
    expect(compareCall).toBeDefined();
    expect(compareCall[1].method).toBe('POST');
    expect(compareCall[1].body).toBeInstanceOf(FormData);
  });

  it('sends X-API-Key header', async () => {
    await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());

    const compareCall = globalThis.fetch.mock.calls.find((c) =>
      c[0].includes('/compare/faces'),
    );
    expect(compareCall[1].headers['X-API-Key']).toBe('test-key');
  });

  it('sends X-Biometric-Consent header when consent is granted', async () => {
    await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());

    const compareCall = globalThis.fetch.mock.calls.find((c) =>
      c[0].includes('/compare/faces'),
    );
    expect(compareCall[1].headers['X-Biometric-Consent']).toBe('granted');
  });
});

// ── compareSolo tests ───────────────────────────────────────────────────────

describe('compareSolo', () => {
  it('calls both /compare/faces and /face/morph', async () => {
    await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());

    const urls = globalThis.fetch.mock.calls.map((c) => c[0]);
    expect(urls.some((u) => u.includes('/compare/faces'))).toBe(true);
    expect(urls.some((u) => u.includes('/face/morph'))).toBe(true);
  });

  it('invokes onProgress callback with step descriptions', async () => {
    const onProgress = vi.fn();
    await compareSolo(VALID_DATA_URL, VALID_DATA_URL, onProgress);

    expect(onProgress).toHaveBeenCalledWith('Analyzing faces...', 20);
    expect(onProgress).toHaveBeenCalledWith('Processing results...', 60);
    expect(onProgress).toHaveBeenCalledWith('Creating fusion...', 80);
    expect(onProgress).toHaveBeenCalledWith('Done!', 100);
  });

  it('includes fusion_image in the returned result', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());
    expect(result.fusion_image).toBe('data:image/png;base64,fakemorph');
  });

  it('returns null fusion_image when morph fails', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/compare/faces')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(MOCK_COMPARE_RESPONSE),
        });
      }
      if (url.includes('/face/morph')) {
        return Promise.resolve({ ok: false, status: 500 });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());
    expect(result.fusion_image).toBeNull();
  });
});

// ── Response shape (compare_faces.v1 contract) ─────────────────────────────

describe('compare_faces.v1 response shape', () => {
  it('returned object contains all required fields', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());

    // Top-level required fields
    expect(result).toHaveProperty('percentage');
    expect(result).toHaveProperty('chemistry_label');
    expect(result).toHaveProperty('chemistry_color');
    expect(result).toHaveProperty('embedding_similarity');
    expect(result).toHaveProperty('feature_similarity');
    expect(result).toHaveProperty('feature_comparisons');
    expect(result).toHaveProperty('shared_features');
    expect(result).toHaveProperty('calibrated_a');
    expect(result).toHaveProperty('calibrated_b');
    expect(result).toHaveProperty('name_a');
    expect(result).toHaveProperty('name_b');
    expect(result).toHaveProperty('fusion_image');
  });

  it('feature_comparisons has exactly 8 items', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());
    expect(result.feature_comparisons).toHaveLength(8);
  });

  it('each feature_comparison has feature, label_a, label_b, match', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());

    for (const fc of result.feature_comparisons) {
      expect(fc).toHaveProperty('feature');
      expect(fc).toHaveProperty('label_a');
      expect(fc).toHaveProperty('label_b');
      expect(fc).toHaveProperty('match');
      expect(typeof fc.match).toBe('boolean');
    }
  });

  it('percentage is an integer in [0, 100]', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());
    expect(Number.isInteger(result.percentage)).toBe(true);
    expect(result.percentage).toBeGreaterThanOrEqual(0);
    expect(result.percentage).toBeLessThanOrEqual(100);
  });

  it('embedding_similarity and feature_similarity are floats in [0, 1]', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());
    expect(result.embedding_similarity).toBeGreaterThanOrEqual(0);
    expect(result.embedding_similarity).toBeLessThanOrEqual(1);
    expect(result.feature_similarity).toBeGreaterThanOrEqual(0);
    expect(result.feature_similarity).toBeLessThanOrEqual(1);
  });

  it('shared_features matches features where match is true', async () => {
    const result = await compareSolo(VALID_DATA_URL, VALID_DATA_URL, vi.fn());
    const expected = result.feature_comparisons
      .filter((c) => c.match)
      .map((c) => c.feature);
    expect(result.shared_features).toEqual(expected);
  });
});
