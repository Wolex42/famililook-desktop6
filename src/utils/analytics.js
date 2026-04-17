/**
 * FamiliMatch analytics — sends events to desktop3 /analytics/track.
 * Gated on BIPA consent. Every event carries product='familimatch'
 * so the dashboard can distinguish traffic sources.
 */

import { API_BASE, API_KEY } from './config';

function isConsentGiven() {
  // Dev bypass: ConsentModal returns null in dev, so fl:bipa-consent is never set.
  // Without this bypass, ALL analytics events are silently dropped in dev.
  if (import.meta.env.DEV) return true;
  try {
    const raw = localStorage.getItem('fl:bipa-consent');
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent.bipaConsented === true;
  } catch { return false; } // eslint-disable-line no-empty
}

class Analytics {
  constructor() {
    this.product = 'familimatch';
    this.sessionId = this.generateSessionId();
    this.visitorId = this.getOrCreateVisitorId();
    this.sessionStart = Date.now();
    this.events = [];
    this.region = this.captureRegion();
    this.isReturning = this.detectReturningVisitor();
    this.utm = this.captureUtmParams();
    // FM-018: session_start is deferred until consent is confirmed.
    // fireSessionStart() must be called explicitly after consent is granted.
    this._sessionStartFired = false;
  }

  /** Call after consent is granted to fire the initial session_start event. */
  fireSessionStart() {
    if (this._sessionStartFired) return;
    this._sessionStartFired = true;
    this.track('session_start', { isReturning: this.isReturning });
  }

  getOrCreateVisitorId() {
    try {
      const existing = localStorage.getItem('fl:match-visitor-id');
      if (existing) return existing;
      if (isConsentGiven()) {
        const id = `mv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('fl:match-visitor-id', id);
        return id;
      }
      return `ephemeral_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch { return null; } // eslint-disable-line no-empty
  }

  detectReturningVisitor() {
    try {
      if (!isConsentGiven()) return false;
      const count = parseInt(localStorage.getItem('fl:match-visit-count') || '0', 10) + 1;
      localStorage.setItem('fl:match-visit-count', String(count));
      return count > 1;
    } catch { return false; } // eslint-disable-line no-empty
  }

  captureRegion() {
    try {
      return {
        language: navigator.language || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      };
    } catch { return {}; } // eslint-disable-line no-empty
  }

  captureUtmParams() {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm = {};
      for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref']) {
        const val = params.get(key);
        if (val) utm[key] = val;
      }
      return Object.keys(utm).length > 0 ? utm : null;
    } catch { return null; } // eslint-disable-line no-empty
  }

  generateSessionId() {
    return `fm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackPageView(page) {
    this.track('page_view', { page, url: window.location.href });
  }

  trackButtonClick(buttonName, context = {}) {
    this.track('button_click', { buttonName, ...context });
  }

  trackFeatureUse(feature, details = {}) {
    this.track('feature_use', { feature, ...details });
  }

  trackUpload(type, fileCount, totalSize) {
    this.track('upload', {
      type,
      fileCount,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    });
  }

  /** FamiliMatch-specific: fired when a comparison completes. */
  trackComparison(mode, percentage, chemistryLabel) {
    this.track('analysis', {
      mode,         // 'solo' | 'duo' | 'group'
      percentage,
      chemistryLabel,
    });
  }

  trackError(errorType, errorMessage, context = {}) {
    this.track('error', {
      errorType,
      errorMessage: String(errorMessage).substring(0, 200),
      ...context,
    });
  }

  // --- Conversion funnel events ---

  trackEmailCaptured(context) {
    this.track('email_captured', { context });
  }

  trackShareInitiated(platform, contentType) {
    this.track('share_initiated', { platform, contentType });
  }

  trackShareCompleted(platform, contentType) {
    this.track('share_completed', { platform, contentType });
  }

  trackModeSelected(mode) {
    this.track('mode_selected', { mode });
  }

  trackResultViewed(percentage, chemistryLabel) {
    this.track('result_viewed', { percentage, chemistryLabel });
  }

  trackCrossProductClicked(targetProduct) {
    this.track('cross_product_clicked', { sourceProduct: 'familimatch', targetProduct });
  }

  // Core tracking — consent-gated
  track(eventType, data) {
    if (!isConsentGiven()) return;

    const event = {
      product: this.product,
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      eventType,
      timestamp: new Date().toISOString(),
      sessionTime: Date.now() - this.sessionStart,
      url: window.location.pathname,
      region: this.region,
      utm: this.utm,
      ...data,
    };

    this.events.push(event);
    this.sendToBackend(event);

    if (import.meta.env.DEV) {
      console.log('[Analytics:familimatch]', eventType, data);
    }
  }

  async sendToBackend(event) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (API_KEY) headers['X-API-Key'] = API_KEY;
      await fetch(`${API_BASE}/analytics/track`, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
      });
    } catch { /* analytics send — never break the app */ } // eslint-disable-line no-empty
  }

  getSessionSummary() {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStart,
      eventCount: this.events.length,
    };
  }
}

export const analytics = new Analytics();

window.addEventListener('beforeunload', () => {
  analytics.track('session_end', analytics.getSessionSummary());
});
