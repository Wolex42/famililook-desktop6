import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'fl:bipa-consent';

const ConsentContext = createContext(null);

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { bipaConsented: false, timestamp: null };
}

function saveConsent(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function ConsentProvider({ children }) {
  const [consent, setConsent] = useState(loadConsent);

  const grantConsent = useCallback(() => {
    const next = { bipaConsented: true, timestamp: Date.now() };
    setConsent(next);
    saveConsent(next);
  }, []);

  const revokeConsent = useCallback(() => {
    const next = { bipaConsented: false, timestamp: null };
    setConsent(next);
    saveConsent(next);
  }, []);

  return (
    <ConsentContext.Provider value={{ consent, grantConsent, revokeConsent }}>
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be inside ConsentProvider');
  return ctx;
}
