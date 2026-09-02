/* ─────────────────────────────────────────────────────────────
   قفل محلی با PIN (Repair Mission 3)
   هیچ PIN خامی ذخیره نمی‌شود؛ فقط salt + hash PBKDF2.
   از Web Crypto API بومی مرورگر استفاده می‌شود.
   شامل تأخیر پس از تلاش‌های ناموفق برای جلوگیری از brute-force.
   ───────────────────────────────────────────────────────────── */

const STORAGE_KEY = "ffm.pin.v2";
const MAX_FAILED_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000; // 1 second base delay per failed attempt

export interface PinRecord {
  pinEnabled: boolean;
  salt: string;
  hash: string;
  failedAttempts: number;
  lockUntil?: number; // timestamp when lock expires
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function makeSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return toHex(arr.buffer);
}

async function hashPinWithPBKDF2(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: 100000,
      salt: encoder.encode(salt),
    },
    keyMaterial,
    256
  );
  return toHex(derivedBits);
}

export function loadPinRecord(): PinRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PinRecord;
    if (parsed && typeof parsed === "object" && typeof parsed.pinEnabled === "boolean") return parsed;
    return null;
  } catch {
    return null;
  }
}

function savePinRecord(rec: PinRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch { /* ignore */ }
}

/** فعال‌سازی یا تغییر PIN — فقط salt+hash ذخیره می‌شود */
export async function setPin(pin: string): Promise<PinRecord> {
  const salt = makeSalt();
  const hash = await hashPinWithPBKDF2(pin, salt);
  const rec: PinRecord = { pinEnabled: true, salt, hash, failedAttempts: 0 };
  savePinRecord(rec);
  return rec;
}

/** غیرفعال‌سازی PIN */
export function disablePin(): void {
  savePinRecord({ pinEnabled: false, salt: "", hash: "", failedAttempts: 0 });
}

/** بررسی قفل بودن به دلیل تلاش‌های ناموفق */
export function isLockedOut(rec: PinRecord): boolean {
  if (!rec.lockUntil) return false;
  return Date.now() < rec.lockUntil;
}

/** محاسبه تأخیر بر اساس تعداد تلاش‌های ناموفق */
function getDelayMs(failedAttempts: number): number {
  if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
    // After max attempts, lock for 5 minutes
    return 5 * 60 * 1000;
  }
  return BASE_DELAY_MS * Math.pow(2, failedAttempts); // exponential backoff
}

/** بررسی صحت PIN واردشده با مدیریت تلاش‌های ناموفق و قفل */
export async function verifyPin(pin: string, rec: PinRecord): Promise<boolean> {
  if (!rec.pinEnabled || !rec.salt || !rec.hash) return true;
  
  // Check if currently locked out
  if (isLockedOut(rec)) {
    return false;
  }
  
  const hash = await hashPinWithPBKDF2(pin, rec.salt);
  const isValid = hash === rec.hash;
  
  if (isValid) {
    // Reset failed attempts on success
    rec.failedAttempts = 0;
    rec.lockUntil = undefined;
    savePinRecord(rec);
    return true;
  } else {
    // Increment failed attempts and potentially lock
    rec.failedAttempts += 1;
    if (rec.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      rec.lockUntil = Date.now() + (5 * 60 * 1000); // 5 minute lockout
    }
    savePinRecord(rec);
    return false;
  }
}

/** دریافت زمان باقی‌مانده تا رفع قفل (به میلی‌ثانیه) */
export function getLockRemainingTime(rec: PinRecord): number {
  if (!rec.lockUntil) return 0;
  const remaining = rec.lockUntil - Date.now();
  return remaining > 0 ? remaining : 0;
}

export function isPinEnabled(): boolean {
  const rec = loadPinRecord();
  return !!rec?.pinEnabled && !!rec.salt && !!rec.hash;
}