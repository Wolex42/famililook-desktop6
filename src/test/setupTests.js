/**
 * Vitest setup — jsdom environment bootstrap for FamiliMatch tests.
 */
import '@testing-library/jest-dom';

// Provide a minimal localStorage / sessionStorage for jsdom
const storageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i) => Object.keys(store)[i] ?? null,
  };
};

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', { value: storageMock() });
}
if (typeof globalThis.sessionStorage === 'undefined') {
  Object.defineProperty(globalThis, 'sessionStorage', { value: storageMock() });
}

// Reset storage between tests
afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
