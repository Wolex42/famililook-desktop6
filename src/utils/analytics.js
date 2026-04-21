/**
 * FamiliMatch analytics — thin wrapper over @famililook/shared createAnalytics.
 * All core tracking lives in the factory; this file provides d6-specific config
 * and product-specific event helpers.
 */

import { createAnalytics } from '@famililook/shared/utils/createAnalytics';
import { API_BASE, API_KEY } from './config';

const instance = createAnalytics({
  product: 'familimatch',
  apiBase: API_BASE,
  apiKey: API_KEY,
  deferSessionStart: true,          // FM-018: fire after consent is confirmed
  captureUtm: true,
  captureRegion: true,

  isConsentGiven: () => {
    try {
      const raw = localStorage.getItem('fl:bipa-consent');
      if (!raw) return false;
      return JSON.parse(raw).bipaConsented === true;
    } catch { return false; }        // eslint-disable-line no-empty
  },

  storageKeys: {
    visitorId: 'fl:match-visitor-id',
    visitCount: 'fl:match-visit-count',
  },

  storage: {
    get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
    remove: (k) => localStorage.removeItem(k),
  },
});

// ── FamiliMatch-specific event helpers ──────────────────────────────
instance.trackComparison = function (mode, percentage, chemistryLabel) {
  this.track('analysis', { mode, percentage, chemistryLabel });
};

instance.trackModeSelected = function (mode) {
  this.track('mode_selected', { mode });
};

instance.trackResultViewed = function (percentage, chemistryLabel) {
  this.track('result_viewed', { percentage, chemistryLabel });
};

export const analytics = instance;
