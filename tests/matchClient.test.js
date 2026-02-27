import { describe, it, expect, vi, beforeEach } from 'vitest';
import { compareSolo } from '../src/api/matchClient';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const PHOTO_A = 'data:image/jpeg;base64,' + btoa('photo_data_a_content');
const PHOTO_B = 'data:image/jpeg;base64,' + btoa('photo_data_b_content');

function okResponse(data) {
  return { ok: true, json: () => Promise.resolve(data) };
}

// Mock /compare/faces response — matches desktop3 /compare/faces schema
const MOCK_COMPARE = {
  ok: true,
  percentage: 68,
  chemistry_label: 'Complementary Pair',
  chemistry_color: '#3B82F6',
  embedding_similarity: 0.72,
  feature_similarity: 0.625,
  feature_comparisons: [
    { feature: 'eyes',       label_a: 'Round Eyes',    label_b: 'Round Eyes',    match: true  },
    { feature: 'eyebrows',   label_a: 'Arched Brows',  label_b: 'Straight Brows',match: false },
    { feature: 'smile',      label_a: 'Wide Smile',    label_b: 'Wide Smile',    match: true  },
    { feature: 'nose',       label_a: 'Narrow Nose',   label_b: 'Wide Nose',     match: false },
    { feature: 'face_shape', label_a: 'Oval Face',     label_b: 'Oval Face',     match: true  },
    { feature: 'skin',       label_a: 'Medium Tone',   label_b: 'Medium Tone',   match: true  },
    { feature: 'hair',       label_a: 'Dark Hair',     label_b: 'Light Hair',    match: false },
    { feature: 'ears',       label_a: 'Average Ears',  label_b: 'Average Ears',  match: true  },
  ],
  shared_features: ['eyes', 'smile', 'face_shape', 'skin', 'ears'],
  calibrated_a: { eyes: { display: { title: 'Round Eyes' } } },
  calibrated_b: { eyes: { display: { title: 'Round Eyes' } } },
  name_a: 'Person A',
  name_b: 'Person B',
};

describe('compareSolo', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls /compare/faces then /face/morph', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockResolvedValueOnce(okResponse({ image: 'morphed_base64' }));

    const onProgress = vi.fn();
    const result = await compareSolo(PHOTO_A, PHOTO_B, onProgress);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.fusion_image).toBe('morphed_base64');
    expect(onProgress).toHaveBeenCalledTimes(4);
  });

  it('returns shared_features and feature_comparisons from backend', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockResolvedValueOnce(okResponse({ image: null }));

    const result = await compareSolo(PHOTO_A, PHOTO_B);

    // 5 features match: eyes, smile, face_shape, skin, ears
    expect(result.shared_features).toContain('eyes');
    expect(result.shared_features).toContain('smile');
    expect(result.shared_features).toContain('face_shape');
    expect(result.shared_features).not.toContain('eyebrows');
    expect(result.shared_features).not.toContain('nose');
    expect(result.feature_comparisons).toHaveLength(8);
    expect(result.feature_similarity).toBeCloseTo(5 / 8, 2);
  });

  it('passes through percentage and chemistry from backend', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockResolvedValueOnce(okResponse({ image: null }));

    const result = await compareSolo(PHOTO_A, PHOTO_B);
    expect(result.percentage).toBe(68);
    expect(result.chemistry_label).toBe('Complementary Pair');
    expect(result.chemistry_color).toBe('#3B82F6');
  });

  it('returns null fusion when morph fails', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockRejectedValueOnce(new Error('morph error'));

    const result = await compareSolo(PHOTO_A, PHOTO_B);
    expect(result.fusion_image).toBeNull();
  });

  it('throws when /compare/faces fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false, status: 422,
      json: () => Promise.resolve({ detail: 'No face detected in face_a' }),
    });

    await expect(compareSolo(PHOTO_A, PHOTO_B)).rejects.toThrow('No face detected');
  });

  it('returns calibrated_a, calibrated_b, name_a, name_b from backend', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockResolvedValueOnce(okResponse({ image: null }));

    const result = await compareSolo(PHOTO_A, PHOTO_B);
    expect(result.calibrated_a).toBeDefined();
    expect(result.calibrated_b).toBeDefined();
    expect(result.name_a).toBe('Person A');
    expect(result.name_b).toBe('Person B');
  });

  it('sends face_a and face_b as FormData to /compare/faces', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockResolvedValueOnce(okResponse({ image: null }));

    await compareSolo(PHOTO_A, PHOTO_B);

    const firstCallUrl = mockFetch.mock.calls[0][0];
    const firstCallBody = mockFetch.mock.calls[0][1].body;
    expect(firstCallUrl).toContain('/compare/faces');
    expect(firstCallBody).toBeInstanceOf(FormData);
    expect(firstCallBody.get('face_a')).toBeInstanceOf(Blob);
    expect(firstCallBody.get('face_b')).toBeInstanceOf(Blob);
  });

  it('passes embedding_similarity through from backend', async () => {
    mockFetch
      .mockResolvedValueOnce(okResponse(MOCK_COMPARE))
      .mockResolvedValueOnce(okResponse({ image: null }));

    const result = await compareSolo(PHOTO_A, PHOTO_B);
    expect(result.embedding_similarity).toBeCloseTo(0.72, 2);
  });
});
