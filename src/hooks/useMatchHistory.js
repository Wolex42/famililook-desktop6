// useMatchHistory.js — Stores past comparison results in localStorage
// Max 20 entries, FIFO. No photos or biometric data — just scores + names.

import { useState, useCallback } from 'react';
import { report as reportError } from '../infrastructure/AppErrorBus';

const STORAGE_KEY = 'fl:match_history';
const MAX_ENTRIES = 20;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; } // eslint-disable-line no-empty
}

export function useMatchHistory() {
  const [history, setHistory] = useState(loadHistory);

  const addEntry = useCallback((result) => {
    const entry = {
      id: `m_${Date.now()}`,
      name_a: result.name_a || 'Person A',
      name_b: result.name_b || 'Person B',
      percentage: result.percentage,
      chemistry_label: result.chemistry_label,
      chemistry_color: result.chemistry_color,
      shared_features: result.shared_features?.length || 0,
      total_features: result.feature_comparisons?.length || 8,
      timestamp: new Date().toISOString(),
    };

    setHistory(prev => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        reportError({ message: 'Could not save match history — storage may be full.', context: 'useMatchHistory.addEntry', severity: 'medium', code: 'HISTORY_SAVE_FAIL', cause: e });
      }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* clear history — non-fatal */ } // eslint-disable-line no-empty
  }, []);

  return { history, addEntry, clearHistory };
}
