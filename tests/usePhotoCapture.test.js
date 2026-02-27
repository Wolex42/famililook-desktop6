import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePhotoCapture } from '../src/hooks/usePhotoCapture';

// Mock fileToBase64
vi.mock('../src/utils/photoUtils', () => ({
  fileToBase64: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockdata'),
}));

function makeFile(type = 'image/jpeg', size = 1024, name = 'test.jpg') {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe('usePhotoCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no photo and no error', () => {
    const { result } = renderHook(() => usePhotoCapture());
    expect(result.current.photo).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('processes a valid JPEG file', async () => {
    const { result } = renderHook(() => usePhotoCapture());
    const file = makeFile('image/jpeg');

    await act(async () => {
      await result.current.handleFile(file);
    });

    expect(result.current.photo).toBe('data:image/jpeg;base64,mockdata');
    expect(result.current.error).toBeNull();
  });

  it('rejects files over 10MB', async () => {
    const { result } = renderHook(() => usePhotoCapture());
    const bigFile = makeFile('image/jpeg', 11 * 1024 * 1024);

    await act(async () => {
      await result.current.handleFile(bigFile);
    });

    expect(result.current.photo).toBeNull();
    expect(result.current.error).toBe('File must be under 10MB');
  });

  it('rejects non-image files', async () => {
    const { result } = renderHook(() => usePhotoCapture());
    const textFile = makeFile('text/plain', 100, 'test.txt');

    await act(async () => {
      await result.current.handleFile(textFile);
    });

    expect(result.current.photo).toBeNull();
    expect(result.current.error).toBe('Please use JPEG, PNG, or WebP');
  });

  it('accepts PNG files', async () => {
    const { result } = renderHook(() => usePhotoCapture());
    const pngFile = makeFile('image/png');

    await act(async () => {
      await result.current.handleFile(pngFile);
    });

    expect(result.current.photo).toBe('data:image/jpeg;base64,mockdata');
  });

  it('accepts WebP files', async () => {
    const { result } = renderHook(() => usePhotoCapture());
    const webpFile = makeFile('image/webp');

    await act(async () => {
      await result.current.handleFile(webpFile);
    });

    expect(result.current.photo).toBe('data:image/jpeg;base64,mockdata');
  });

  it('clears photo', async () => {
    const { result } = renderHook(() => usePhotoCapture());
    const file = makeFile('image/jpeg');

    await act(async () => {
      await result.current.handleFile(file);
    });
    expect(result.current.photo).not.toBeNull();

    act(() => {
      result.current.clearPhoto();
    });
    expect(result.current.photo).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns null for empty input', async () => {
    const { result } = renderHook(() => usePhotoCapture());

    let returnVal;
    await act(async () => {
      returnVal = await result.current.handleFile(null);
    });

    expect(returnVal).toBeNull();
    expect(result.current.error).toBe('No file selected');
  });
});
