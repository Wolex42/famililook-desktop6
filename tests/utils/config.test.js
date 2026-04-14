/**
 * FM-006 — config.js exports verification.
 * Ensures API_BASE, API_KEY, and MATCH_SERVER_URL are exported strings.
 */
import { describe, it, expect } from 'vitest';
import { API_BASE, API_KEY, MATCH_SERVER_URL } from '../../src/utils/config';

describe('utils/config', () => {
  it('exports API_BASE as a string', () => {
    expect(API_BASE).toBeDefined();
    expect(typeof API_BASE).toBe('string');
  });

  it('exports API_KEY as a string', () => {
    expect(API_KEY).toBeDefined();
    expect(typeof API_KEY).toBe('string');
  });

  it('exports MATCH_SERVER_URL as a string', () => {
    expect(MATCH_SERVER_URL).toBeDefined();
    expect(typeof MATCH_SERVER_URL).toBe('string');
  });
});
