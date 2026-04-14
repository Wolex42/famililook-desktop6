/**
 * FM-006 — MatchContext tests.
 * Verifies default state, setUserName persistence, setResults, and resetMatch.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MatchProvider, useMatch } from '../../src/state/MatchContext';

function wrapper({ children }) {
  return <MatchProvider>{children}</MatchProvider>;
}

describe('MatchContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('default userName is empty string (no session data)', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });
    expect(result.current.userName).toBe('');
  });

  it('default mode is solo', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });
    expect(result.current.mode).toBe('solo');
  });

  it('default results is null', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });
    expect(result.current.results).toBeNull();
  });

  it('setUserName updates userName', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });

    act(() => {
      result.current.setUserName('Alice');
    });

    expect(result.current.userName).toBe('Alice');
  });

  it('setUserName persists to sessionStorage at fm:username', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });

    act(() => {
      result.current.setUserName('Bob');
    });

    expect(sessionStorage.getItem('fm:username')).toBe('Bob');
  });

  it('setUserName with empty string removes from sessionStorage', () => {
    sessionStorage.setItem('fm:username', 'Alice');
    const { result } = renderHook(() => useMatch(), { wrapper });

    act(() => {
      result.current.setUserName('');
    });

    expect(sessionStorage.getItem('fm:username')).toBeNull();
  });

  it('loads persisted userName from sessionStorage on mount', () => {
    sessionStorage.setItem('fm:username', 'Charlie');

    const { result } = renderHook(() => useMatch(), { wrapper });
    expect(result.current.userName).toBe('Charlie');
  });

  it('setResults stores results object', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });
    const mockResults = { percentage: 85, chemistry_label: 'Magnetic Match' };

    act(() => {
      result.current.setResults(mockResults);
    });

    expect(result.current.results).toEqual(mockResults);
  });

  it('setMode updates the mode', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });

    act(() => {
      result.current.setMode('duo');
    });

    expect(result.current.mode).toBe('duo');
  });

  it('resetMatch clears mode back to solo and results to null', () => {
    const { result } = renderHook(() => useMatch(), { wrapper });

    act(() => {
      result.current.setMode('group');
      result.current.setResults({ percentage: 50 });
    });

    expect(result.current.mode).toBe('group');
    expect(result.current.results).toBeDefined();

    act(() => {
      result.current.resetMatch();
    });

    expect(result.current.mode).toBe('solo');
    expect(result.current.results).toBeNull();
  });

  it('throws when useMatch is called outside MatchProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useMatch())).toThrow(
      'useMatch must be used within a MatchProvider',
    );
    spy.mockRestore();
  });
});
