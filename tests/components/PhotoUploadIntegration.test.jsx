/**
 * PhotoUpload — fresh-session integration tests.
 *
 * These tests cover the class of failure that caused the E7 Wave 2 prod
 * regression: a fresh-session user (empty localStorage, no BIPA consent)
 * taps the upload tile, picks a file, and nothing happens.
 *
 * Previous failing surface: useUploadPipeline mounted unconditionally in
 * PhotoUploadShared; hook's initial return had undefined fields on first
 * render for fresh sessions, JSX access threw, the tile silently died.
 *
 * Robust fix under test:
 *   - PhotoUpload dispatches to LegacyFlow (pure FileReader) when consent
 *     is NOT yet granted — regardless of the pipeline flag.
 *   - PhotoUpload dispatches to PipelineFlow only when flag=true AND
 *     consent IS granted.
 *   - PipelineErrorBoundary catches any throw in PipelineFlow and falls
 *     back to LegacyFlow silently.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── Mock config BEFORE importing PhotoUpload ──────────────────────────
vi.mock('../../src/utils/config', () => ({
  API_BASE: 'http://test-api:8008',
  API_KEY: '',
}));

vi.mock('../../src/utils/analytics', () => ({
  analytics: {
    track: vi.fn(),
    trackPageView: vi.fn(),
    trackAction: vi.fn(),
    trackButtonClick: vi.fn(),
    fireSessionStart: vi.fn(),
  },
}));

// Mock the shared photo module — PhotoQualityRing should be a pass-through
// and usePhotoQuality returns a stable no-op result so both flows can render.
vi.mock('@famililook/shared/photo', () => ({
  usePhotoQuality: () => ({ score: null, grade: null, suggestion: null, loading: false }),
  PhotoQualityRing: ({ children }) => <>{children}</>,
  PHOTO_QUALITY_COPY: {},
}));

// Default mock for @famililook/shared/upload. Individual tests can override
// with vi.doMock + re-import inside the test.
vi.mock('@famililook/shared/upload', () => ({
  useUploadPipeline: () => ({
    status: 'idle',
    originalFile: null,
    processedFile: null,
    finalOutput: null,
    faces: [],
    previewUrl: null,
    imageWidth: 0,
    imageHeight: 0,
    modalFlags: { pickerOpen: false, snipOpen: false, groupAssignOpen: false },
    submit: vi.fn(),
    reset: vi.fn(),
    selectFace: vi.fn(),
    resolveSnip: vi.fn(),
    cancelModal: vi.fn(),
    openSnip: vi.fn(),
  }),
  FacePickerModal: () => null,
  FaceSnipModal: () => null,
  fileToDataUrl: (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    }),
}));

// ── Helpers ───────────────────────────────────────────────────────────

function makePngFile(name = 'test.png') {
  // Minimal PNG-ish file for upload path. FileReader will still emit a data URL.
  return new File(['\x89PNG\r\n\x1a\nfake'], name, { type: 'image/png' });
}

/**
 * Load PhotoUpload + ConsentProvider from the SAME module graph so that
 * the useContext lookup inside PhotoUpload sees the provider we render here.
 * Call this inside each test after any vi.doMock / env stubs are in place.
 */
async function loadModules() {
  const { default: PhotoUpload } = await import('../../src/components/PhotoUpload.jsx');
  const { ConsentProvider } = await import('../../src/state/ConsentContext.jsx');
  return { PhotoUpload, ConsentProvider };
}

function renderUpload(PhotoUpload, ConsentProvider, onPhotoReady = vi.fn()) {
  return render(
    <MemoryRouter>
      <ConsentProvider>
        <PhotoUpload label="Photo A" onPhotoReady={onPhotoReady} />
      </ConsentProvider>
    </MemoryRouter>,
  );
}

describe('PhotoUpload — fresh-session integration', () => {
  let fetchSpy;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubEnv('VITE_USE_SHARED_UPLOAD_PIPELINE', 'true');
    fetchSpy = vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fetchSpy.mockRestore();
    vi.resetModules();
  });

  it('fresh session, flag=true, no consent — uploads via legacy flow, no /detect call', async () => {
    vi.resetModules();
    const { PhotoUpload, ConsentProvider } = await loadModules();

    const onPhotoReady = vi.fn();
    renderUpload(PhotoUpload, ConsentProvider, onPhotoReady);

    // Grab the file input (hidden) and simulate a file pick
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = makePngFile('fresh.png');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    // The critical assertion: onPhotoReady MUST fire on a fresh session
    await waitFor(() => {
      expect(onPhotoReady).toHaveBeenCalledTimes(1);
    });

    const dataUrl = onPhotoReady.mock.calls[0][0];
    expect(typeof dataUrl).toBe('string');
    expect(dataUrl.startsWith('data:image/')).toBe(true);

    // No /detect call was made — legacy flow is pure FileReader
    const detectCalls = fetchSpy.mock.calls.filter((call) => {
      const url = typeof call[0] === 'string' ? call[0] : call[0]?.url || '';
      return url.includes('/detect');
    });
    expect(detectCalls.length).toBe(0);
  });

  it('flag=false (legacy mode) — fresh session upload still works', async () => {
    vi.unstubAllEnvs();
    vi.stubEnv('VITE_USE_SHARED_UPLOAD_PIPELINE', 'false');
    vi.resetModules();
    const { PhotoUpload, ConsentProvider } = await loadModules();

    const onPhotoReady = vi.fn();
    renderUpload(PhotoUpload, ConsentProvider, onPhotoReady);

    const input = document.querySelector('input[type="file"]');
    const file = makePngFile('legacy.png');

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(onPhotoReady).toHaveBeenCalledTimes(1);
    });

    const dataUrl = onPhotoReady.mock.calls[0][0];
    expect(dataUrl.startsWith('data:image/')).toBe(true);

    const detectCalls = fetchSpy.mock.calls.filter((call) => {
      const url = typeof call[0] === 'string' ? call[0] : call[0]?.url || '';
      return url.includes('/detect');
    });
    expect(detectCalls.length).toBe(0);
  });

  it('flag=true + consent granted, pipeline throws — falls back to LegacyFlow', async () => {
    // Pre-grant consent so dispatcher picks the pipeline branch
    localStorage.setItem(
      'fl:bipa-consent',
      JSON.stringify({ bipaConsented: true, timestamp: '2026-01-01T00:00:00.000Z' }),
    );

    // Re-mock shared/upload so useUploadPipeline throws on mount
    vi.resetModules();
    vi.doMock('@famililook/shared/upload', () => ({
      useUploadPipeline: () => {
        throw new Error('simulated pipeline mount failure');
      },
      FacePickerModal: () => null,
      FaceSnipModal: () => null,
      fileToDataUrl: (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        }),
    }));

    const { PhotoUpload, ConsentProvider } = await loadModules();

    const onPhotoReady = vi.fn();

    // Suppress the expected error-boundary console.error during this test
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderUpload(PhotoUpload, ConsentProvider, onPhotoReady);

    // Fallback LegacyFlow should have rendered — its file input is present
    const input = document.querySelector('input[type="file"]');
    expect(input).toBeTruthy();

    const file = makePngFile('fallback.png');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(onPhotoReady).toHaveBeenCalledTimes(1);
    });

    const dataUrl = onPhotoReady.mock.calls[0][0];
    expect(dataUrl.startsWith('data:image/')).toBe(true);

    // Still no /detect call — we're on the fallback legacy flow
    const detectCalls = fetchSpy.mock.calls.filter((call) => {
      const url = typeof call[0] === 'string' ? call[0] : call[0]?.url || '';
      return url.includes('/detect');
    });
    expect(detectCalls.length).toBe(0);

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    vi.doUnmock('@famililook/shared/upload');
  });
});
