import { useState, useRef, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { usePhotoQuality, PhotoQualityRing, PHOTO_QUALITY_COPY } from '@famililook/shared/photo';

/**
 * PhotoUpload — drag-and-drop / click-to-upload photo zone for FamiliMatch.
 *
 * Props:
 *   label:        string                     — label shown above the drop zone (e.g. "Photo A")
 *   onPhotoReady: (dataUrl: string) => void  — called with base64 data URL when a photo is selected
 */
export default function PhotoUpload({ label, onPhotoReady }) {
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

  // Preview state — show uploaded image with change option
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

  // Upload state — dashed drop zone
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
