import type { Family } from "../types";

const STORAGE_KEY = "ffm.family.v1";

export function loadFamily(): Family | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Family;
    if (!parsed || typeof parsed !== "object" || typeof parsed.name !== "string" || !Array.isArray(parsed.members)) {
      return null;
    }
    if (!parsed.currency) parsed.currency = "toman";
    return parsed;
  } catch {
    return null;
  }
}

export function saveFamily(family: Family): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(family));
  } catch { /* ignore */ }
}

export function clearFamily(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}
