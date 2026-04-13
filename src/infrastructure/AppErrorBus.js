/**
 * AppErrorBus — Centralised error reporting module.
 *
 * Vanilla JS event emitter. No React context, no class syntax, no persistence.
 * Importable from any module (React components, utils, API clients).
 *
 * Note: Inlined from famililook-shared for Vercel compatibility
 * (file: dependency references don't resolve on Vercel).
 *
 * @module AppErrorBus
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'critical'} ErrorSeverity
 *
 * @typedef {Object} ErrorReport
 * @property {string}         message    - Human-readable error description
 * @property {string}         context    - Which component/module reported it (e.g. "BasketContext.save")
 * @property {ErrorSeverity}  severity   - Determines user visibility + auto-dismiss behaviour
 * @property {string}         [code]     - Optional machine-readable code (e.g. "STORAGE_FULL", "NETWORK_TIMEOUT")
 * @property {Error}          [cause]    - Optional original Error object for dev console
 * @property {Object}         [meta]     - Optional metadata (file, line, retry count, etc.)
 *
 * @typedef {Object} StoredError
 * @property {string}         id         - Unique ID (crypto.randomUUID or Date.now fallback)
 * @property {ErrorReport}    report     - The original report
 * @property {number}         timestamp  - Date.now() when reported
 * @property {boolean}        dismissed  - Whether user/auto has dismissed it
 * @property {number}         count      - Dedup counter (1 = single occurrence)
 */

// ─── Constants ──────────────────────────────────────────────────
const MAX_ACTIVE = 20;
const MAX_HISTORY = 50;
const DEDUP_WINDOW_MS = 5000;
const MAX_SUBSCRIBERS_WARNING = 10;

// ─── Internal state ─────────────────────────────────────────────
/** @type {StoredError[]} */
let errors = [];

/** @type {Set<(errors: StoredError[]) => void>} */
let subscribers = new Set();

/** @type {boolean} */
let isReporting = false;

/** @type {ErrorReport[]} */
let deferredReports = [];

// ─── Helpers ────────────────────────────────────────────────────

function generateId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

const isDev = typeof import.meta !== "undefined" && import.meta.env?.DEV;

function logToConsole(report) {
  if (!isDev) {
    // In prod, only log high and critical
    if (report.severity === "high" || report.severity === "critical") {
      console.error(`[AppErrorBus] [${report.severity}] ${report.context}: ${report.message}`, report.cause || "");
    }
    return;
  }

  // Dev mode: log everything, severity-coloured
  const prefix = `[AppErrorBus] [${report.severity}] ${report.context}:`;
  switch (report.severity) {
    case "low":
      console.debug(prefix, report.message, report.cause || "");
      break;
    case "medium":
      console.warn(prefix, report.message, report.cause || "");
      break;
    case "high":
    case "critical":
      console.error(prefix, report.message, report.cause || "");
      break;
  }
}

function notifySubscribers() {
  const active = getActive();
  for (const cb of subscribers) {
    try {
      cb(active);
    } catch {
      // Subscriber threw — do not let it break the bus
    }
  }
}

function pruneHistory() {
  if (errors.length > MAX_HISTORY) {
    errors = errors.slice(errors.length - MAX_HISTORY);
  }
}

function pruneActive() {
  // If active count exceeds MAX_ACTIVE, dismiss oldest active
  const active = errors.filter((e) => !e.dismissed);
  if (active.length > MAX_ACTIVE) {
    const excess = active.length - MAX_ACTIVE;
    let dismissed = 0;
    for (let i = 0; i < errors.length && dismissed < excess; i++) {
      if (!errors[i].dismissed) {
        errors[i] = { ...errors[i], dismissed: true };
        dismissed++;
      }
    }
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Report an error to the bus.
 * @param {ErrorReport} report
 * @returns {string} The error ID (or existing ID if deduplicated)
 */
export function report(report) {
  // Re-entrancy guard (Risk 6)
  if (isReporting) {
    deferredReports.push(report);
    queueMicrotask(processDeferredReports);
    return "";
  }

  isReporting = true;
  try {
    return _doReport(report);
  } finally {
    isReporting = false;
  }
}

function _doReport(errorReport) {
  logToConsole(errorReport);

  // Deduplication check — replace frozen object with updated count
  const existingIdx = errors.findIndex(
    (e) =>
      !e.dismissed &&
      Date.now() - e.timestamp < DEDUP_WINDOW_MS &&
      e.report.message === errorReport.message &&
      e.report.context === errorReport.context &&
      (e.report.code || "") === (errorReport.code || "")
  );
  if (existingIdx !== -1) {
    const existing = errors[existingIdx];
    errors[existingIdx] = Object.freeze({ ...existing, count: (existing.count || 1) + 1 });
    notifySubscribers();
    return existing.id;
  }

  const id = generateId();

  /** @type {StoredError} */
  const stored = Object.freeze({
    id,
    report: Object.freeze({ ...errorReport }),
    timestamp: Date.now(),
    dismissed: false,
    count: 1,
  });

  errors.push(stored);
  pruneHistory();
  pruneActive();
  notifySubscribers();

  return id;
}

function processDeferredReports() {
  while (deferredReports.length > 0) {
    const r = deferredReports.shift();
    report(r);
  }
}

/**
 * Get all non-dismissed errors, newest first. Capped at MAX_ACTIVE (20).
 * @returns {StoredError[]}
 */
export function getActive() {
  const active = errors
    .filter((e) => !e.dismissed)
    .slice(-MAX_ACTIVE)
    .reverse();
  return structuredClone(active);
}

/**
 * Get full error history (including dismissed), capped at MAX_HISTORY (50).
 * @returns {StoredError[]}
 */
export function getAll() {
  return structuredClone(errors);
}

/**
 * Dismiss a specific error by ID.
 * @param {string} id
 */
export function dismiss(id) {
  const idx = errors.findIndex((e) => e.id === id);
  if (idx !== -1) {
    // StoredError is frozen, so replace with a new object
    errors[idx] = Object.freeze({ ...errors[idx], dismissed: true });
    notifySubscribers();
  }
}

/**
 * Dismiss all errors.
 */
export function clear() {
  errors = errors.map((e) =>
    e.dismissed ? e : Object.freeze({ ...e, dismissed: true })
  );
  notifySubscribers();
}

/**
 * Subscribe to error changes. Callback receives active (non-dismissed) errors.
 * @param {(errors: StoredError[]) => void} callback
 * @returns {() => void} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);

  if (isDev && subscribers.size > MAX_SUBSCRIBERS_WARNING) {
    console.warn(
      `[AppErrorBus] ${subscribers.size} subscribers — possible leak. Ensure useEffect cleanup calls unsubscribe.`
    );
  }

  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Get summary stats for dev tools.
 * @returns {{ total: number, active: number, bySeverity: Record<ErrorSeverity, number> }}
 */
export function getStats() {
  const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
  for (const e of errors) {
    bySeverity[e.report.severity] = (bySeverity[e.report.severity] || 0) + 1;
  }
  return {
    total: errors.length,
    active: errors.filter((e) => !e.dismissed).length,
    bySeverity,
  };
}

/**
 * Reset all internal state. ONLY for use in tests.
 * @private
 */
export function _reset() {
  errors = [];
  subscribers = new Set();
  isReporting = false;
  deferredReports = [];
}
