import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { usePhotoQuality, PhotoQualityRing, PHOTO_QUALITY_COPY } from '@famililook/shared/photo';
import {
  useUploadPipeline,
  FacePickerModal,
  FaceSnipModal,
  fileToDataUrl,
} from '@famililook/shared/upload';
import { useConsent } from '../state/ConsentContext';
import * as localErrorBus from '../infrastructure/AppErrorBus';
import { analytics } from '../utils/analytics';
import { API_BASE, API_KEY } from '../utils/config';

/**
 * PhotoUpload — drag-and-drop / click-to-upload photo zone for FamiliMatch.
 *
 * Props:
 *   label:        string                     — label shown above the drop zone (e.g. "Photo A")
 *   onPhotoReady: (dataUrl: string) => void  — called with base64 data URL when a photo is selected
 *
 * Sprint E7 Wave 2 robust fix (2026-04-22):
 *   Three-component split + ErrorBoundary. Fresh-session users (empty
 *   localStorage, consent not yet granted) crashed silently because
 *   useUploadPipeline was mounting unconditionally inside PhotoUploadShared.
 *   Some state in its initial return was undefined at first render,
 *   JSX prop access threw, and the whole tile vanished with no toast.
 *
 *   New shape:
 *     - PhotoUpload (dispatcher)           — picks branch based on flag + consent
 *     - PipelineErrorBoundary              — catches any throw, silently falls back
 *     - PhotoUploadLegacyFlow              — pure FileReader, no pipeline hook
 *     - PhotoUploadPipelineFlow            — full shared pipeline, only mounts when
 *                                            bipaConsented === true (hook state is
 *                                            deterministic once consent is known).
 *
 *   Flags:
 *     - VITE_USE_SHARED_UPLOAD_PIPELINE=false    → always Legacy (prod default pre-E7)
 *     - VITE_USE_SHARED_UPLOAD_PIPELINE=true     → Pipeline ONLY after consent granted,
 *                                                  Legacy for pre-consent state
 */

const USE_SHARED = import.meta.env.VITE_USE_SHARED_UPLOAD_PIPELINE === 'true';

// ============================================================================
// PhotoUpload — top-level dispatcher
// ============================================================================
export default function PhotoUpload(props) {
  const { consent } = useConsent();
  const bipaGranted = !!consent?.bipaConsented;

  // If flag is off, always use legacy. If flag is on, pick based on consent.
  const useShared = USE_SHARED && bipaGranted;

  if (useShared) {
    // Wrap in ErrorBoundary so any pipeline hook throw falls back to Legacy
    // without losing the user's file selection capability.
    return (
      <PipelineErrorBoundary fallback={<PhotoUploadLegacyFlow {...props} />}>
        <PhotoUploadPipelineFlow {...props} />
      </PipelineErrorBoundary>
    );
  }

  return <PhotoUploadLegacyFlow {...props} />;
}

// ============================================================================
// PipelineErrorBoundary — catches any throw in PipelineFlow, falls back silently
// ============================================================================
class PipelineErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    try {
      // Report via localErrorBus if available; never crash if reporting itself fails.
      if (localErrorBus && typeof localErrorBus.report === 'function') {
        localErrorBus.report({
          message: 'Upload pipeline threw, falling back to legacy flow.',
          context: 'PhotoUpload.PipelineErrorBoundary',
          severity: 'high',
          code: 'PIPELINE_FALLBACK',
          cause: error,
          meta: { componentStack: info?.componentStack },
        });
      } else if (typeof window !== 'undefined' && window.__reportErrorBus) {
        window.__reportErrorBus({
          severity: 'high',
          code: 'PIPELINE_FALLBACK',
          message: error?.message,
          context: info,
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('[PhotoUpload] pipeline flow errored, falling back to legacy:', error?.message);
      }
    } catch {
      // swallow — the fallback rendering is the important thing
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ============================================================================
// PhotoUploadLegacyFlow — byte-for-byte equivalent of pre-E7-Wave-2 PhotoUploadLegacy
// ============================================================================
function PhotoUploadLegacyFlow({ label, onPhotoReady }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  // X2 — photo quality check (null adapter: canvas checks only, no face detection)
  const { score, grade, suggestion, loading } = usePhotoQuality(file, { faceDetector: null });
  const suggestionText = suggestion ? PHOTO_QUALITY_COPY[suggestion] : null;

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      onPhotoReady(dataUrl);
    };
    reader.readAsDataURL(file);
  }, [onPhotoReady]);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    setPreview(null);
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  if (preview) {
    return (
      <div className="flex flex-col items-center gap-2">
        {label && <span className="text-xs font-semibold text-gray-400">{label}</span>}
        <PhotoQualityRing score={score} grade={grade} suggestion={suggestionText} loading={loading}>
        <div
          className="relative w-36 h-36 rounded-2xl overflow-hidden"
          style={{ border: '2px solid rgba(94,92,230,0.3)' }}
        >
          <img
            src={preview}
            alt={label || 'Uploaded photo'}
            className="w-full h-full object-cover"
          />
        </div>
        </PhotoQualityRing>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <RefreshCw size={12} />
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs font-semibold text-gray-400">{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-36 h-36 rounded-2xl flex flex-col items-center justify-center gap-2
          transition-all duration-200 cursor-pointer
          ${dragging ? 'border-brand-blue scale-[1.03]' : 'border-white/15 hover:border-white/30'}
        `}
        style={{
          border: `2px dashed ${dragging ? '#0a84ff' : 'rgba(255,255,255,0.15)'}`,
          background: dragging ? 'rgba(10,132,255,0.08)' : 'rgba(255,255,255,0.03)',
          minHeight: '44px',
          minWidth: '44px',
        }}
      >
        <Camera size={24} className="text-gray-500" />
        <span className="text-xs text-gray-500">
          {dragging ? 'Drop here' : 'Tap to upload'}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

// ============================================================================
// Shared pipeline helpers
// ============================================================================

function buildMatchHeaders() {
  // Mirrors getBiometricHeaders() from matchClient.js (do not refactor matchClient in this sprint).
  const headers = {};
  try {
    const consent = JSON.parse(localStorage.getItem('fl:bipa-consent') || '{}');
    if (consent.bipaConsented) headers['X-Biometric-Consent'] = 'granted';
  } catch { /* non-fatal */ } // eslint-disable-line no-empty
  if (API_KEY) headers['X-API-Key'] = API_KEY;
  return headers;
}

// ============================================================================
// PhotoUploadPipelineFlow — shared-powered, only mounted when consent granted
// ============================================================================
function PhotoUploadPipelineFlow({ label, onPhotoReady }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [quickFile, setQuickFile] = useState(null); // fed to usePhotoQuality pre-pipeline
  const inputRef = useRef(null);

  // Consent is guaranteed true here (dispatcher only mounts us when bipaGranted).
  // We still read it so downstream modals/headers stay in sync if consent flips.
  const { consent } = useConsent();

  const pipe = useUploadPipeline({
    apiBase: API_BASE,
    consent: { biometric: !!consent?.bipaConsented },
    getHeaders: buildMatchHeaders,
    errorBus: localErrorBus,
    analytics: {
      trackUpload: (evt, payload) => analytics.track?.(evt, payload),
      trackError: (evt, payload) => analytics.track?.(evt, { ...payload, _error: true }),
      trackAction: (evt, payload) => analytics.track?.(evt, payload),
    },
    multiFacePolicy: 'auto-open-picker',
  });

  // Defensive fallback for modalFlags — pipeline hook should always return
  // this shape, but the ErrorBoundary only catches throws, not undefined access
  // during JSX render. Belt-and-braces.
  const modalFlags = pipe.modalFlags || { pickerOpen: false, snipOpen: false, groupAssignOpen: false };

  // X2 — photo quality check (null adapter: canvas checks only)
  const { score, grade, suggestion, loading } = usePhotoQuality(quickFile, { faceDetector: null });
  const suggestionText = suggestion ? PHOTO_QUALITY_COPY[suggestion] : null;

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setQuickFile(file);
    // Consent guaranteed true at this point (dispatcher only mounts us then).
    // Always run the full pipeline — no consent branch needed here anymore.
    pipe.submit(file);
  }, [pipe]);

  const handleChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleReset = useCallback(() => {
    setPreview(null);
    setQuickFile(null);
    pipe.reset?.();
    if (inputRef.current) inputRef.current.value = '';
  }, [pipe]);

  // Emit dataUrl to parent when pipeline produces a final processed File.
  // Contract preservation: d6 parents (SoloPage, RoomPage, ChallengePage) expect
  // onPhotoReady(dataUrl: string) — we convert File → base64 here so parent code
  // remains unchanged.
  useEffect(() => {
    let cancelled = false;

    // Success conditions:
    //  - single_face auto-accept: processedFile exists + status single_face
    //  - after picker: finalOutput.method==='picker'
    //  - after snip:   finalOutput.method==='snip'
    const isSingleFaceAccept =
      pipe.status === 'single_face' && pipe.processedFile && !pipe.finalOutput;
    const isFinalized = pipe.finalOutput?.file;

    const fileToEmit = isFinalized || (isSingleFaceAccept ? pipe.processedFile : null);
    if (!fileToEmit) return;

    (async () => {
      try {
        const dataUrl = await fileToDataUrl(fileToEmit);
        if (cancelled) return;
        setPreview(dataUrl);
        onPhotoReady(dataUrl);
      } catch (err) {
        localErrorBus.report?.({
          message: 'Could not finalise photo.',
          context: 'PhotoUpload.fileToDataUrl',
          severity: 'medium',
          code: 'PHOTO_DATAURL_FAIL',
          cause: err,
        });
      }
    })();

    return () => { cancelled = true; };
  }, [pipe.status, pipe.processedFile, pipe.finalOutput, onPhotoReady]);

  // Zero-face → offer snip
  useEffect(() => {
    if (!consent?.bipaConsented) return;
    if (pipe.status === 'zero_faces' && !modalFlags.snipOpen) {
      pipe.openSnip?.();
    }
  }, [pipe.status, modalFlags.snipOpen, pipe, consent?.bipaConsented]);

  // Preview state
  if (preview) {
    return (
      <div className="flex flex-col items-center gap-2">
        {label && <span className="text-xs font-semibold text-gray-400">{label}</span>}
        <PhotoQualityRing score={score} grade={grade} suggestion={suggestionText} loading={loading}>
          <div
            className="relative w-36 h-36 rounded-2xl overflow-hidden"
            style={{ border: '2px solid rgba(94,92,230,0.3)' }}
          >
            <img
              src={preview}
              alt={label || 'Uploaded photo'}
              className="w-full h-full object-cover"
            />
          </div>
        </PhotoQualityRing>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-2"
          style={{ minHeight: '44px', minWidth: '44px' }}
        >
          <RefreshCw size={12} />
          Change
        </button>

        {modalFlags.pickerOpen && (
          <FacePickerModal
            open={modalFlags.pickerOpen}
            faces={pipe.faces}
            previewUrl={pipe.previewUrl}
            imageWidth={pipe.imageWidth}
            imageHeight={pipe.imageHeight}
            originalFile={pipe.processedFile || pipe.originalFile}
            onSelect={(croppedFile, faceIndex) => pipe.selectFace(croppedFile, faceIndex)}
            onCancel={() => pipe.cancelModal('picker')}
          />
        )}
        {modalFlags.snipOpen && (
          <FaceSnipModal
            open={modalFlags.snipOpen}
            previewUrl={pipe.previewUrl}
            imageWidth={pipe.imageWidth}
            imageHeight={pipe.imageHeight}
            originalFile={pipe.processedFile || pipe.originalFile}
            apiBase={API_BASE}
            consent={{ biometric: !!consent?.bipaConsented }}
            getHeaders={buildMatchHeaders}
            onResolve={(croppedFile, rect, verifiedFace) => pipe.resolveSnip(croppedFile, rect, verifiedFace)}
            onCancel={() => pipe.cancelModal('snip')}
          />
        )}
      </div>
    );
  }

  // Upload state
  return (
    <div className="flex flex-col items-center gap-2">
      {label && <span className="text-xs font-semibold text-gray-400">{label}</span>}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-36 h-36 rounded-2xl flex flex-col items-center justify-center gap-2
          transition-all duration-200 cursor-pointer
          ${dragging ? 'border-brand-blue scale-[1.03]' : 'border-white/15 hover:border-white/30'}
        `}
        style={{
          border: `2px dashed ${dragging ? '#0a84ff' : 'rgba(255,255,255,0.15)'}`,
          background: dragging ? 'rgba(10,132,255,0.08)' : 'rgba(255,255,255,0.03)',
          minHeight: '44px',
          minWidth: '44px',
        }}
      >
        <Camera size={24} className="text-gray-500" />
        <span className="text-xs text-gray-500">
          {dragging ? 'Drop here' : 'Tap to upload'}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {modalFlags.pickerOpen && (
        <FacePickerModal
          open={modalFlags.pickerOpen}
          faces={pipe.faces}
          previewUrl={pipe.previewUrl}
          imageWidth={pipe.imageWidth}
          imageHeight={pipe.imageHeight}
          originalFile={pipe.processedFile || pipe.originalFile}
          onSelect={(croppedFile, faceIndex) => pipe.selectFace(croppedFile, faceIndex)}
          onCancel={() => pipe.cancelModal('picker')}
        />
      )}
      {modalFlags.snipOpen && (
        <FaceSnipModal
          open={modalFlags.snipOpen}
          previewUrl={pipe.previewUrl}
          imageWidth={pipe.imageWidth}
          imageHeight={pipe.imageHeight}
          originalFile={pipe.processedFile || pipe.originalFile}
          apiBase={API_BASE}
          consent={{ biometric: !!consent?.bipaConsented }}
          getHeaders={buildMatchHeaders}
          onResolve={(croppedFile, rect, verifiedFace) => pipe.resolveSnip(croppedFile, rect, verifiedFace)}
          onCancel={() => pipe.cancelModal('snip')}
        />
      )}
    </div>
  );
}
