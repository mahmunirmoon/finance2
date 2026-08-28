import type { CurrencyCode } from "../types";
import { getCurrency } from "../data/currencies";

const numberFormatter = new Intl.NumberFormat("fa-IR");
const dateFormatter = new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" });
const jalaliFormatter = new Intl.DateTimeFormat("fa-IR-u-nu-latn", { year: "numeric", month: "2-digit", day: "2-digit" });
const jalaliPartsFormatter = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric", day: "numeric" });

export function faNum(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return numberFormatter.format(Number.isFinite(n) ? n : 0);
}

export function formatAge(age: number | null): string {
  if (age === null || age === undefined) return "—";
  return `${faNum(age)} سال`;
}

export function formatDate(iso: string): string {
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return "—";
  }
}

/** شمسی فشرده: 1405/06/05 */
export function formatJalali(isoDate: string): string {
  try {
    return jalaliFormatter.format(new Date(`${isoDate}T12:00:00`));
  } catch {
    return isoDate;
  }
}

export function jalaliParts(isoDate: string): { jy: number; jm: number; jd: number } | null {
  try {
    const parts = jalaliPartsFormatter.formatToParts(new Date(`${isoDate}T12:00:00`));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { jy: get("year"), jm: get("month"), jd: get("day") };
  } catch {
    return null;
  }
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${faNum(rounded)} ${getCurrency(currency).short}`;
}

export function formatSignedMoney(amount: number, currency: CurrencyCode, sign: "+" | "−" | ""): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  return `${sign}${faNum(rounded)} ${getCurrency(currency).short}`;
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let s = raw.trim();
  for (let i = 0; i < 10; i++) {
    s = s.split(FA_DIGITS[i]).join(String(i)).split(AR_DIGITS[i]).join(String(i));
  }
  s = s.replace(/[٬,\s]/g, "");
  if (s === "" || isNaN(Number(s))) return null;
  return Number(s);
}
