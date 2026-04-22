import { useState, useRef, useCallback, useEffect } from 'react';
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
 * Strangler-fig wrapper (Sprint E7 Wave 2, 2026-04-22):
 *   - Flag VITE_USE_SHARED_UPLOAD_PIPELINE=true → shared pipeline branch (face detect + picker + snip)
 *   - Flag false/unset → legacy branch (prod default, no-op over existing behaviour)
 *   - Parent contract `onPhotoReady(dataUrl: string)` preserved in BOTH branches.
 */

const USE_SHARED = import.meta.env.VITE_USE_SHARED_UPLOAD_PIPELINE === 'true';

export default function PhotoUpload(props) {
  if (USE_SHARED) return <PhotoUploadShared {...props} />;
  return <PhotoUploadLegacy {...props} />;
}

// ─── Legacy implementation (unchanged from pre-E7-Wave-2) ──────────────
function PhotoUploadLegacy({ label, onPhotoReady }) {
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

// ─── Shared pipeline branch ────────────────────────────────────────────
// Uses @famililook/shared/upload: useUploadPipeline + FacePickerModal + FaceSnipModal.
// Preserves parent contract: emits dataUrl string via onPhotoReady.

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

function PhotoUploadShared({ label, onPhotoReady }) {
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [quickFile, setQuickFile] = useState(null); // fed to usePhotoQuality pre-pipeline
  const inputRef = useRef(null);

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

  // X2 — photo quality check (null adapter: canvas checks only)
  const { score, grade, suggestion, loading } = usePhotoQuality(quickFile, { faceDetector: null });
  const suggestionText = suggestion ? PHOTO_QUALITY_COPY[suggestion] : null;

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setQuickFile(file);
    if (consent?.bipaConsented) {
      // Full pipeline: validate → compress → detect → picker/snip
      pipe.submit(file);
    } else {
      // Pre-consent: legacy fallback. Read as dataUrl, render preview, emit to parent.
      // /detect would 403. Consent modal is triggered later on Compare click.
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        setPreview(dataUrl);
        onPhotoReady(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [pipe, consent?.bipaConsented, onPhotoReady]);

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
    pipe.reset();
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
    if (!consent?.bipaConsented) return;           // no detect happens pre-consent, so this guard is belt+braces
    if (pipe.status === 'zero_faces' && !pipe.modalFlags.snipOpen) {
      pipe.openSnip();
    }
  }, [pipe.status, pipe.modalFlags.snipOpen, pipe, consent?.bipaConsented]);

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

        {pipe.modalFlags.pickerOpen && (
          <FacePickerModal
            open={pipe.modalFlags.pickerOpen}
            faces={pipe.faces}
            previewUrl={pipe.previewUrl}
            imageWidth={pipe.imageWidth}
            imageHeight={pipe.imageHeight}
            originalFile={pipe.processedFile || pipe.originalFile}
            onSelect={(croppedFile, faceIndex) => pipe.selectFace(croppedFile, faceIndex)}
            onCancel={() => pipe.cancelModal('picker')}
          />
        )}
        {pipe.modalFlags.snipOpen && (
          <FaceSnipModal
            open={pipe.modalFlags.snipOpen}
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

      {pipe.modalFlags.pickerOpen && (
        <FacePickerModal
          open={pipe.modalFlags.pickerOpen}
          faces={pipe.faces}
          previewUrl={pipe.previewUrl}
          imageWidth={pipe.imageWidth}
          imageHeight={pipe.imageHeight}
          originalFile={pipe.processedFile || pipe.originalFile}
          onSelect={(croppedFile, faceIndex) => pipe.selectFace(croppedFile, faceIndex)}
          onCancel={() => pipe.cancelModal('picker')}
        />
      )}
      {pipe.modalFlags.snipOpen && (
        <FaceSnipModal
          open={pipe.modalFlags.snipOpen}
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
