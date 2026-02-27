/**
 * Solo mode client — calls desktop3 /compare/faces + /face/morph.
 * /compare/faces: symmetric peer-to-peer comparison, no kinship assumptions.
 * Backend does ALL scoring; we just display what comes back.
 */

import { API_BASE, API_KEY } from '../utils/config';
import { COMPARE_FEATURES } from '../utils/constants';

/**
 * Convert a base64 data URL to a Blob for FormData upload.
 */
function dataUrlToBlob(dataUrl) {
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
  const headers = API_KEY ? { 'X-API-Key': API_KEY } : undefined;
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
    } catch { /* ignore */ }
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
async function createMorph(blobA, blobB) {
  try {
    const fd = new FormData();
    // Split features 50/50 between both people for a real blend
    const fusionSlots = {};
    COMPARE_FEATURES.forEach((f, i) => {
      fusionSlots[f] = i % 2 === 0 ? 'PersonA' : 'PersonB';
    });
    fd.append('fusion_slots', JSON.stringify(fusionSlots));
    fd.append('output_size', '512');
    fd.append('face_PersonA', blobA, 'PersonA.jpg');
    fd.append('face_PersonB', blobB, 'PersonB.jpg');

    const result = await postForm('/face/morph', fd);
    return result.image || null;
  } catch (err) {
    console.warn('[morph] Failed:', err.message);
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
export async function compareSolo(photoA, photoB, onProgress) {
  const blobA = dataUrlToBlob(photoA);
  const blobB = dataUrlToBlob(photoB);

  // Step 1: Peer-to-peer comparison (symmetric, no kinship framing)
  onProgress?.('Analyzing faces...', 20);
  const result = await compareFacesDirect(blobA, blobB);
  onProgress?.('Processing results...', 60);

  // Step 2: Face morph — the product differentiator
  onProgress?.('Creating fusion...', 80);
  const fusionImage = await createMorph(blobA, blobB);

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
