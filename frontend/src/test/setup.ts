import '@testing-library/jest-dom';
import { beforeEach } from 'vitest';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      // Return null if key doesn't exist, otherwise return the value (even if empty string)
      return key in store ? store[key] : null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock window object
Object.defineProperty(global, 'window', {
  value: global,
  writable: true,
});

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
