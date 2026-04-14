/**
 * FamiliMatch configuration — environment variables with safe fallback defaults.
 * Uses Vite's import.meta.env for build-time substitution.
 */

/** REST API base URL (desktop3 backend). */
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:8008';

/** Optional API key sent as X-API-Key header. */
export const API_KEY =
  import.meta.env.VITE_API_KEY || '';

/** WebSocket URL for multiplayer match rooms. */
export const MATCH_SERVER_URL =
  import.meta.env.VITE_MATCH_SERVER_URL || 'ws://localhost:8008/ws/match';
