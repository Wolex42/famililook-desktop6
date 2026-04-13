/**
 * MatchContext — shared state for FamiliMatch sessions.
 *
 * Exposes via useMatch():
 *   userName  / setUserName   — persisted to sessionStorage at 'fm:username'
 *   mode      / setMode       — 'solo' | 'duo' | 'group'
 *   results   / setResults    — latest comparison results (backend-authoritative)
 *   tierToken / setTierToken  — signed HMAC token for Duo/Group tier gating
 *   resetMatch()              — clear results + mode + tierToken for a fresh run
 */

import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const USERNAME_KEY = 'fm:username';

function loadUserName() {
  try {
    return sessionStorage.getItem(USERNAME_KEY) || '';
  } catch { return ''; } // eslint-disable-line no-empty
}

function saveUserName(name) {
  try {
    if (name) {
      sessionStorage.setItem(USERNAME_KEY, name);
    } else {
      sessionStorage.removeItem(USERNAME_KEY);
    }
  } catch { /* non-fatal */ } // eslint-disable-line no-empty
}

const MatchContext = createContext(undefined);

export function MatchProvider({ children }) {
  const [userName, setUserNameState] = useState(loadUserName);
  const [mode, setMode] = useState('solo');
  const [results, setResults] = useState(null);
  const [tierToken, setTierToken] = useState('');

  const setUserName = useCallback((name) => {
    setUserNameState(name);
    saveUserName(name);
  }, []);

  const resetMatch = useCallback(() => {
    setMode('solo');
    setResults(null);
    setTierToken('');
  }, []);

  const value = useMemo(
    () => ({
      userName,
      setUserName,
      mode,
      setMode,
      results,
      setResults,
      tierToken,
      setTierToken,
      resetMatch,
    }),
    [userName, setUserName, mode, results, tierToken, resetMatch],
  );

  return (
    <MatchContext.Provider value={value}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const ctx = useContext(MatchContext);
  if (ctx === undefined) {
    throw new Error('useMatch must be used within a MatchProvider');
  }
  return ctx;
}
