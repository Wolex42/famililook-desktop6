/**
 * Solo mode client — calls desktop3 /compare/faces + /face/morph.
 * /compare/faces: symmetric peer-to-peer comparison, no kinship assumptions.
 * Backend does ALL scoring; we just display what comes back.
 */

import { API_BASE, API_KEY } from '../utils/config';
import { report as reportError } from '../infrastructure/AppErrorBus';
import { COMPARE_FEATURES } from '../utils/constants';

function getBiometricHeaders() {
  try {
    const consent = JSON.parse(localStorage.getItem('fl:bipa-consent') || '{}');
    if (consent.bipaConsented) return { 'X-Biometric-Consent': 'granted' };
  } catch { /* localStorage parse — non-fatal */ } // eslint-disable-line no-empty
  return {};
}

/**
 * Convert a base64 data URL to a Blob for FormData upload.
 */
function dataUrlToBlob(dataUrl) {
  if (!dataUrl || !dataUrl.includes(',')) {
    throw new Error('Invalid data URL');
  }
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new Blob([arr], { type: mime });
}

/**
 * POST FormData to a desktop3 endpoint.
 */
async function postForm(path, formData) {
  const headers = { ...getBiometricHeaders(), ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) };
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!resp.ok) {
    let msg = `${path} failed: ${resp.status}`;
    try {
      const err = await resp.json();
      if (err.detail) msg = err.detail;
    } catch { /* response parse — non-fatal */ } // eslint-disable-line no-empty
    throw new Error(msg);
  }
  return resp.json();
}

/**
 * Call /compare/faces — symmetric peer-to-peer comparison.
 * Returns percentage, chemistry_*, feature_comparisons, calibrated_a/b directly.
 * No kinship framing, no fake-child workaround.
 */
async function compareFacesDirect(blobA, blobB, nameA = 'Person A', nameB = 'Person B') {
  const fd = new FormData();
  fd.append('face_a', blobA, 'PersonA.jpg');
  fd.append('face_b', blobB, 'PersonB.jpg');
  fd.append('name_a', nameA);
  fd.append('name_b', nameB);
  return postForm('/compare/faces', fd);
}

/**
 * Create face morph via /face/morph.
 * Replicates: desktop2/src/game/FaceFusion/faceCompositor.js
 */
async function createMorph(blobA, blobB, featureComparisons) {
  try {
    const fd = new FormData();
    // Build fusion slots from comparison results:
    // matched features come from face_a, unmatched from face_b
    const fusionSlots = {};
    if (featureComparisons && featureComparisons.length > 0) {
      featureComparisons.forEach((fc) => {
        fusionSlots[fc.feature] = fc.match ? 'PersonA' : 'PersonB';
      });
    } else {
      // Fallback: alternate 50/50 if no comparison data available
      COMPARE_FEATURES.forEach((f, i) => {
        fusionSlots[f] = i % 2 === 0 ? 'PersonA' : 'PersonB';
      });
    }
    fd.append('fusion_slots', JSON.stringify(fusionSlots));
    fd.append('output_size', '512');
    fd.append('face_PersonA', blobA, 'PersonA.jpg');
    fd.append('face_PersonB', blobB, 'PersonB.jpg');

    const result = await postForm('/face/morph', fd);
    return result.image || null;
  } catch (err) {
    reportError({ message: 'Face fusion could not be created.', context: 'matchClient.createMorph', severity: 'low', code: 'MORPH_FAIL', cause: err });
    return null;
  }
}

/**
 * Full solo comparison between two photos.
 * Calls /compare/faces (backend does all scoring) + /face/morph.
 *
 * @param {string} photoA - data URL
 * @param {string} photoB - data URL
 * @param {function} onProgress - (step, progress) callback
 */
export async function compareSolo(photoA, photoB, onProgress, nameA = 'Person A', nameB = 'Person B') {
  const blobA = dataUrlToBlob(photoA);
  const blobB = dataUrlToBlob(photoB);

  // Step 1: Peer-to-peer comparison (symmetric, no kinship framing)
  onProgress?.('Analyzing faces...', 20);
  const result = await compareFacesDirect(blobA, blobB, nameA, nameB);
  onProgress?.('Processing results...', 60);

  // Step 2: Face morph — the product differentiator
  onProgress?.('Creating fusion...', 80);
  const fusionImage = await createMorph(blobA, blobB, result.feature_comparisons);

  onProgress?.('Done!', 100);

  // Backend returns the complete scoring — pass through directly
  return {
    percentage: result.percentage,
    chemistry_label: result.chemistry_label,
    chemistry_color: result.chemistry_color,
    embedding_similarity: result.embedding_similarity,
    feature_similarity: result.feature_similarity,
    feature_comparisons: result.feature_comparisons,
    shared_features: result.shared_features,
    fusion_image: fusionImage,
    calibrated_a: result.calibrated_a || {},
    calibrated_b: result.calibrated_b || {},
    name_a: result.name_a || 'Person A',
    name_b: result.name_b || 'Person B',
  };
}

// ── Challenge-a-friend API ──────────────────────────────────

/**
 * Create a challenge from a Solo result.
 * Sends the user's photo to the server for storage (7-day TTL).
 */
export async function createChallenge(photoDataUrl, name, percentage, chemistry_label, chemistry_color) {
  const blob = dataUrlToBlob(photoDataUrl);
  const fd = new FormData();
  fd.append('photo', blob, 'photo.jpg');
  fd.append('name', name);
  fd.append('percentage', String(percentage));
  fd.append('chemistry_label', chemistry_label);
  fd.append('chemistry_color', chemistry_color);
  return postForm('/challenge/create', fd);
}

/**
 * Get challenge metadata (name, score). Does NOT return photo.
 */
export async function getChallenge(challengeId) {
  const headers = { ...getBiometricHeaders(), ...(API_KEY ? { 'X-API-Key': API_KEY } : {}) };
  const resp = await fetch(`${API_BASE}/challenge/${challengeId}`, { headers });
  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(`Challenge fetch failed: ${resp.status}`);
  }
  return resp.json();
}

/**
 * Accept a challenge — upload photo and compare against challenger.
 */
export async function acceptChallenge(challengeId, photoDataUrl, name) {
  const blob = dataUrlToBlob(photoDataUrl);
  const fd = new FormData();
  fd.append('photo', blob, 'photo.jpg');
  fd.append('name', name || 'Challenger');
  return postForm(`/challenge/${challengeId}/accept`, fd);
}
