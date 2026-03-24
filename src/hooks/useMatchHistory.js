// useMatchHistory.js — Stores past comparison results in localStorage
// Max 20 entries, FIFO. No photos or biometric data — just scores + names.

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'fl:match_history';
const MAX_ENTRIES = 20;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
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
      } catch { /* quota */ }
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { /* */ }
  }, []);

  return { history, addEntry, clearHistory };
}
