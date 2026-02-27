/**
 * FamiliMatch analytics — sends events to desktop3 /analytics/track.
 * Gated on BIPA consent. Every event carries product='familimatch'
 * so the dashboard can distinguish traffic sources.
 */

import { API_BASE, API_KEY } from './config';

function isConsentGiven() {
  try {
    const raw = localStorage.getItem('fl:bipa-consent');
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return consent.bipaConsented === true;
  } catch {
    return false;
  }
}

class Analytics {
  constructor() {
    this.product = 'familimatch';
    this.sessionId = this.generateSessionId();
    this.sessionStart = Date.now();
    this.events = [];
    // Fire session_start after consent state has initialised
    setTimeout(() => this.track('session_start', {}), 0);
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
      eventType,
      timestamp: new Date().toISOString(),
      sessionTime: Date.now() - this.sessionStart,
      url: window.location.pathname,
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
    } catch {
      // Silent — never break the app
    }
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
