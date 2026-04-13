/**
 * ConsentContext — BIPA / biometric consent state for FamiliMatch.
 *
 * Persists to localStorage at key 'fl:bipa-consent'.
 * Consumed via useConsent() which exposes { consent, grantConsent, revokeConsent }.
 *
 * The consent object shape:
 *   { bipaConsented: boolean, timestamp: string | null }
 *
 * matchClient.js reads 'fl:bipa-consent' directly from localStorage
 * to set the X-Biometric-Consent header, so the stored shape must stay stable.
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { analytics } from '../utils/analytics';

const STORAGE_KEY = 'fl:bipa-consent';

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.bipaConsented === 'boolean') return parsed;
    }
  } catch { /* corrupted — treat as no consent */ } // eslint-disable-line no-empty
  return { bipaConsented: false, timestamp: null };
}

function saveConsent(consent) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch { /* storage full or blocked — non-fatal */ } // eslint-disable-line no-empty
}

const ConsentContext = createContext(undefined);

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(loadConsent);

  const grantConsent = useCallback(() => {
    const next = { bipaConsented: true, timestamp: new Date().toISOString() };
    setConsent(next);
    saveConsent(next);
    // FM-018: fire deferred session_start now that consent is confirmed
    analytics.fireSessionStart();
  }, []);

  const revokeConsent = useCallback(() => {
    const next = { bipaConsented: false, timestamp: null };
    setConsent(next);
    saveConsent(next);
  }, []);

  // FM-018: if consent was already granted (returning visitor), fire session_start on mount
  useEffect(() => {
    if (consent.bipaConsented) {
      analytics.fireSessionStart();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ consent, grantConsent, revokeConsent }),
    [consent, grantConsent, revokeConsent],
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (ctx === undefined) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return ctx;
}
