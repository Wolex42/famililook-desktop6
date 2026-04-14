/**
 * FM-006 — ConsentContext tests.
 * Verifies default state, grantConsent, and localStorage persistence.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ConsentProvider, useConsent } from '../../src/state/ConsentContext';

function wrapper({ children }) {
  return <ConsentProvider>{children}</ConsentProvider>;
}

describe('ConsentContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('default consent is { bipaConsented: false }', () => {
    const { result } = renderHook(() => useConsent(), { wrapper });
    expect(result.current.consent.bipaConsented).toBe(false);
  });

  it('default consent has timestamp null', () => {
    const { result } = renderHook(() => useConsent(), { wrapper });
    expect(result.current.consent.timestamp).toBeNull();
  });

  it('grantConsent sets bipaConsented to true', () => {
    const { result } = renderHook(() => useConsent(), { wrapper });

    act(() => {
      result.current.grantConsent();
    });

    expect(result.current.consent.bipaConsented).toBe(true);
    expect(result.current.consent.timestamp).toBeTruthy();
  });

  it('grantConsent persists to localStorage at fl:bipa-consent', () => {
    const { result } = renderHook(() => useConsent(), { wrapper });

    act(() => {
      result.current.grantConsent();
    });

    const stored = JSON.parse(localStorage.getItem('fl:bipa-consent'));
    expect(stored.bipaConsented).toBe(true);
    expect(stored.timestamp).toBeTruthy();
  });

  it('revokeConsent resets bipaConsented to false', () => {
    const { result } = renderHook(() => useConsent(), { wrapper });

    act(() => {
      result.current.grantConsent();
    });
    expect(result.current.consent.bipaConsented).toBe(true);

    act(() => {
      result.current.revokeConsent();
    });
    expect(result.current.consent.bipaConsented).toBe(false);
    expect(result.current.consent.timestamp).toBeNull();
  });

  it('loads persisted consent on mount', () => {
    localStorage.setItem(
      'fl:bipa-consent',
      JSON.stringify({ bipaConsented: true, timestamp: '2026-01-01T00:00:00.000Z' }),
    );

    const { result } = renderHook(() => useConsent(), { wrapper });
    expect(result.current.consent.bipaConsented).toBe(true);
  });

  it('throws when useConsent is called outside ConsentProvider', () => {
    // Suppress console.error from React for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useConsent())).toThrow(
      'useConsent must be used within a ConsentProvider',
    );
    spy.mockRestore();
  });
});
