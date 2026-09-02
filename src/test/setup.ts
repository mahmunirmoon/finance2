import '@testing-library/jest-dom';

// Mock crypto for tests
if (typeof global.crypto === 'undefined') {
  global.crypto = require('crypto').webcrypto as Crypto;
}

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem(key: string) {
    return this.store[key] || null;
  },
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  },
  removeItem(key: string) {
    delete this.store[key];
  },
  clear() {
    this.store = {};
  },
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

beforeEach(() => {
  localStorageMock.clear();
});
