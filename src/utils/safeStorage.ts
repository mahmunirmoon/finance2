/* ─────────────────────────────────────────────────────────────
   ذخیره‌سازی امن — شکست localStorage هرگز بی‌صدا نمی‌ماند.
   هر نوشتن ناموفق یک رویداد سراسری منتشر می‌کند تا UI هشدار دهد.
   ───────────────────────────────────────────────────────────── */

export interface StorageResult {
  success: boolean;
  error?: string;
}

export interface StorageStatus {
  ok: boolean;
  at: string;
  key?: string;
}

let lastSave: StorageStatus | null = null;

const failureListeners = new Set<(status: StorageStatus) => void>();

/** ثبت شنونده شکست ذخیره — برای نمایش Toast در UI */
export function onStorageFailure(fn: (status: StorageStatus) => void): () => void {
  failureListeners.add(fn);
  return () => {
    failureListeners.delete(fn);
  };
}

export function getStorageStatus(): StorageStatus | null {
  return lastSave;
}

export function safeSetItem(key: string, value: string): StorageResult {
  try {
    localStorage.setItem(key, value);
    lastSave = { ok: true, at: new Date().toISOString(), key };
    return { success: true };
  } catch (e) {
    lastSave = { ok: false, at: new Date().toISOString(), key };
    const status = lastSave;
    failureListeners.forEach((fn) => fn(status));
    return { success: false, error: e instanceof Error ? e.message : "ذخیره ناموفق بود" };
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* حذف کم‌اهمیت است */
  }
}
