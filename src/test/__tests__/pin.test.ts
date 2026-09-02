import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isValidPin, 
  loadPinRecord, 
  setPin, 
  disablePin, 
  isLockedOut, 
  verifyPin, 
  getLockRemainingTime,
  isPinEnabled 
} from '../../utils/pin';

// Mock localStorage for tests
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

describe('PIN Utility - Repair Mission 3', () => {
  describe('isValidPin', () => {
    it('should accept valid PINs (4-8 digits)', () => {
      expect(isValidPin('1234')).toBe(true);
      expect(isValidPin('123456')).toBe(true);
      expect(isValidPin('12345678')).toBe(true);
    });

    it('should reject invalid PINs', () => {
      expect(isValidPin('123')).toBe(false); // too short
      expect(isValidPin('123456789')).toBe(false); // too long
      expect(isValidPin('abcd')).toBe(false); // letters
      expect(isValidPin('12ab')).toBe(false); // mixed
      expect(isValidPin('')).toBe(false); // empty
    });
  });

  describe('setPin and loadPinRecord', () => {
    it('should set and load PIN record with PBKDF2 hash', async () => {
      const pin = '123456';
      const record = await setPin(pin);
      
      expect(record.pinEnabled).toBe(true);
      expect(record.salt).toBeDefined();
      expect(record.hash).toBeDefined();
      expect(record.failedAttempts).toBe(0);
      expect(record.salt.length).toBeGreaterThan(0);
      expect(record.hash.length).toBeGreaterThan(0);
      
      const loaded = loadPinRecord();
      expect(loaded).not.toBeNull();
      expect(loaded?.pinEnabled).toBe(true);
      expect(loaded?.salt).toBe(record.salt);
      expect(loaded?.hash).toBe(record.hash);
    });

    it('should generate different hashes for same PIN due to salt', async () => {
      const pin = '1234';
      const record1 = await setPin(pin);
      localStorageMock.clear();
      const record2 = await setPin(pin);
      
      expect(record1.salt).not.toBe(record2.salt);
      expect(record1.hash).not.toBe(record2.hash);
    });
  });

  describe('verifyPin', () => {
    it('should verify correct PIN', async () => {
      const pin = '9876';
      await setPin(pin);
      const record = loadPinRecord()!;
      
      const result = await verifyPin(pin, record);
      expect(result).toBe(true);
    });

    it('should reject incorrect PIN', async () => {
      const pin = '1111';
      await setPin(pin);
      const record = loadPinRecord()!;
      
      const result = await verifyPin('2222', record);
      expect(result).toBe(false);
    });

    it('should increment failed attempts on wrong PIN', async () => {
      const pin = '5555';
      await setPin(pin);
      let record = loadPinRecord()!;
      
      await verifyPin('0000', record);
      record = loadPinRecord()!;
      expect(record.failedAttempts).toBe(1);
      
      await verifyPin('0000', record);
      record = loadPinRecord()!;
      expect(record.failedAttempts).toBe(2);
    });

    it('should reset failed attempts on correct PIN', async () => {
      const pin = '7777';
      await setPin(pin);
      let record = loadPinRecord()!;
      
      // Fail twice
      await verifyPin('0000', record);
      await verifyPin('0000', record);
      record = loadPinRecord()!;
      expect(record.failedAttempts).toBe(2);
      
      // Succeed
      await verifyPin(pin, record);
      record = loadPinRecord()!;
      expect(record.failedAttempts).toBe(0);
    });

    it('should lock out after max failed attempts', async () => {
      const pin = '8888';
      await setPin(pin);
      let record = loadPinRecord()!;
      
      // Fail 5 times (MAX_FAILED_ATTEMPTS)
      for (let i = 0; i < 5; i++) {
        await verifyPin('0000', record);
      }
      
      record = loadPinRecord()!;
      expect(record.failedAttempts).toBe(5);
      expect(record.lockUntil).toBeDefined();
      expect(isLockedOut(record)).toBe(true);
    });

    it('should not verify PIN when locked out', async () => {
      const pin = '9999';
      await setPin(pin);
      let record = loadPinRecord()!;
      
      // Lock out
      for (let i = 0; i < 5; i++) {
        await verifyPin('0000', record);
      }
      
      // Try correct PIN while locked
      record = loadPinRecord()!;
      const result = await verifyPin(pin, record);
      expect(result).toBe(false);
    });

    it('should allow verification when PIN is disabled', async () => {
      disablePin();
      const record = loadPinRecord()!;
      
      const result = await verifyPin('any', record);
      expect(result).toBe(true);
    });
  });

  describe('isLockedOut', () => {
    it('should return false when no lockUntil', () => {
      const record = {
        pinEnabled: true,
        salt: 'abc',
        hash: 'def',
        failedAttempts: 0,
      };
      expect(isLockedOut(record)).toBe(false);
    });

    it('should return false when lockUntil is in the past', () => {
      const record = {
        pinEnabled: true,
        salt: 'abc',
        hash: 'def',
        failedAttempts: 5,
        lockUntil: Date.now() - 10000, // 10 seconds ago
      };
      expect(isLockedOut(record)).toBe(false);
    });

    it('should return true when lockUntil is in the future', () => {
      const record = {
        pinEnabled: true,
        salt: 'abc',
        hash: 'def',
        failedAttempts: 5,
        lockUntil: Date.now() + 300000, // 5 minutes from now
      };
      expect(isLockedOut(record)).toBe(true);
    });
  });

  describe('getLockRemainingTime', () => {
    it('should return 0 when no lockUntil', () => {
      const record = {
        pinEnabled: true,
        salt: 'abc',
        hash: 'def',
        failedAttempts: 0,
      };
      expect(getLockRemainingTime(record)).toBe(0);
    });

    it('should return 0 when lockUntil is in the past', () => {
      const record = {
        pinEnabled: true,
        salt: 'abc',
        hash: 'def',
        failedAttempts: 5,
        lockUntil: Date.now() - 10000,
      };
      expect(getLockRemainingTime(record)).toBe(0);
    });

    it('should return positive value when lockUntil is in the future', () => {
      const futureTime = Date.now() + 300000; // 5 minutes
      const record = {
        pinEnabled: true,
        salt: 'abc',
        hash: 'def',
        failedAttempts: 5,
        lockUntil: futureTime,
      };
      const remaining = getLockRemainingTime(record);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(300000);
    });
  });

  describe('disablePin', () => {
    it('should disable PIN and reset attempts', () => {
      disablePin();
      const record = loadPinRecord()!;
      
      expect(record.pinEnabled).toBe(false);
      expect(record.salt).toBe('');
      expect(record.hash).toBe('');
      expect(record.failedAttempts).toBe(0);
    });
  });

  describe('isPinEnabled', () => {
    it('should return true when PIN is enabled', async () => {
      await setPin('1234');
      expect(isPinEnabled()).toBe(true);
    });

    it('should return false when PIN is disabled', () => {
      disablePin();
      expect(isPinEnabled()).toBe(false);
    });

    it('should return false when no PIN record exists', () => {
      localStorageMock.clear();
      expect(isPinEnabled()).toBe(false);
    });
  });
});
