import { useState, useCallback, useRef } from 'react';
import { fileToBase64 } from '../utils/photoUtils';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function usePhotoCapture() {
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const validate = useCallback((file) => {
    if (!file) return 'No file selected';
    if (!ACCEPTED_TYPES.includes(file.type)) return 'Please use JPEG, PNG, or WebP';
    if (file.size > MAX_FILE_SIZE) return 'File must be under 10MB';
    return null;
  }, []);

  const handleFile = useCallback(async (file) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const dataUrl = await fileToBase64(file);
      setPhoto(dataUrl);
      return dataUrl;
    } catch {
      setError('Failed to process image');
      return null;
    } finally {
      setLoading(false);
    }
  }, [validate]);

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return {
    photo,
    error,
    loading,
    inputRef,
    handleFile,
    handleInputChange,
    handleDrop,
    openFilePicker,
    clearPhoto,
  };
}
