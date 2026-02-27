/** Environment-driven configuration */

export const API_BASE = import.meta.env.VITE_API_BASE || '';

export const API_KEY = import.meta.env.VITE_API_KEY || '';

export const MATCH_SERVER_URL =
  import.meta.env.VITE_MATCH_SERVER_URL || 'ws://localhost:8030/ws/match';
