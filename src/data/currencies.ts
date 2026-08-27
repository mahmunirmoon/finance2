import type { CurrencyCode } from "../types";

export interface CurrencyInfo {
  code: CurrencyCode;
  label: string;
  short: string;
}

export const CURRENCIES: CurrencyInfo[] = [
  { code: "toman", label: "تومان", short: "تومان" },
  { code: "rial", label: "ریال", short: "ریال" },
  { code: "usd", label: "دلار آمریکا", short: "USD" },
  { code: "aed", label: "درهم امارات", short: "AED" },
  { code: "eur", label: "یورو", short: "EUR" },
  { code: "gbp", label: "پوند انگلیس", short: "GBP" },
  { code: "try", label: "لیر ترکیه", short: "TRY" },
  { code: "cad", label: "دلار کانادا", short: "CAD" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "toman";

export function getCurrency(code: CurrencyCode): CurrencyInfo {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}
