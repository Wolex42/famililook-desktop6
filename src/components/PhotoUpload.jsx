import { Camera, Upload, X } from 'lucide-react';
import { usePhotoCapture } from '../hooks/usePhotoCapture';

export default function PhotoUpload({ label, onPhotoReady, disabled }) {
  const { photo, error, loading, inputRef, handleInputChange, handleDrop, openFilePicker, clearPhoto } =
    usePhotoCapture();

  const handleReady = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Let the hook process it, then notify parent
    const fakeEvent = { target: { files: [file] } };
    handleInputChange(fakeEvent);
  };

  // When photo changes, notify parent
  const prevPhoto = photo;

  return (
    <div className="flex flex-col items-center gap-3">
      {label && <p className="text-sm text-gray-400 font-medium">{label}</p>}

      {photo ? (
        <div className="relative">
          <img
            src={photo}
            alt="Uploaded"
            className="w-40 h-40 rounded-2xl object-cover border-2 border-primary/40"
          />
          {!disabled && (
            <button
              onClick={() => {
                clearPhoto();
                onPhotoReady?.(null);
              }}
              className="absolute -top-4 -right-4 bg-red-500 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-red-600"
            >
              <X size={18} />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            handleDrop(e);
          }}
          onClick={openFilePicker}
          className={`w-40 h-40 rounded-2xl border-2 border-dashed border-gray-600
            flex flex-col items-center justify-center gap-2 cursor-pointer
            hover:border-primary/60 hover:bg-surface-light/50 transition-all
            ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          ) : (
            <>
              <Upload size={24} className="text-gray-500" />
              <span className="text-xs text-gray-500">Drop or tap</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleInputChange(e);
          // Notify parent after a tick so state updates
          const file = e.target.files?.[0];
          if (file) {
            import('../utils/photoUtils').then(({ fileToBase64 }) =>
              fileToBase64(file).then((dataUrl) => onPhotoReady?.(dataUrl))
            );
          }
        }}
        disabled={disabled}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
