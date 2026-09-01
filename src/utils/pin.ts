/* ─────────────────────────────────────────────────────────────
   قفل محلی با PIN (Repair Mission 2)
   هیچ PIN خامی ذخیره نمی‌شود؛ فقط salt + hash SHA-256.
   از Web Crypto API بومی مرورگر استفاده می‌شود.
   ───────────────────────────────────────────────────────────── */

const STORAGE_KEY = "ffm.pin.v1";

export interface PinRecord {
  pinEnabled: boolean;
  salt: string;
  hash: string;
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

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
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
  const hash = await hashPin(pin, salt);
  const rec: PinRecord = { pinEnabled: true, salt, hash };
  savePinRecord(rec);
  return rec;
}

/** غیرفعال‌سازی PIN */
export function disablePin(): void {
  savePinRecord({ pinEnabled: false, salt: "", hash: "" });
}

/** بررسی صحت PIN واردشده */
export async function verifyPin(pin: string, rec: PinRecord): Promise<boolean> {
  if (!rec.pinEnabled || !rec.salt || !rec.hash) return true;
  const hash = await hashPin(pin, rec.salt);
  return hash === rec.hash;
}

export function isPinEnabled(): boolean {
  const rec = loadPinRecord();
  return !!rec?.pinEnabled && !!rec.salt && !!rec.hash;
}
