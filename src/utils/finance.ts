import type { Account, Transaction, TransactionType } from "../types";
import { jalaliParts, todayISO } from "./format";

/* ─────────────────────────────────────────────────────────────
   Central Transaction Engine — تنها مرجع محاسبات مالی.
   موجودی‌ها هرگز ذخیره نمی‌شوند؛ همیشه از تراکنش‌ها محاسبه می‌شوند:
   initial + incomes − expenses − outgoing transfers + incoming transfers
   ───────────────────────────────────────────────────────────── */

export function calculateAccountBalance(account: Account, transactions: Transaction[]): number {
  let balance = account.initialBalance;
  for (const t of transactions) {
    if (t.accountId === account.id) {
      if (t.type === "income") balance += t.amount;
      else balance -= t.amount;
    } else if (t.type === "transfer" && t.destinationAccountId === account.id) {
      balance += t.amount;
    }
  }
  return balance;
}

export function computeAllBalances(accounts: Account[], transactions: Transaction[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const a of accounts) result[a.id] = a.initialBalance;
  for (const t of transactions) {
    const from = result[t.accountId];
    if (from !== undefined) {
      result[t.accountId] = t.type === "income" ? from + t.amount : from - t.amount;
    }
    if (t.type === "transfer" && t.destinationAccountId) {
      const to = result[t.destinationAccountId];
      if (to !== undefined) result[t.destinationAccountId] = to + t.amount;
    }
  }
  return result;
}

export interface FlowTotals {
  income: number;
  expense: number;
  net: number;
  count: number;
}

/**
 * مجموع درآمد و هزینه عملیاتی — Transfer کنار گذاشته می‌شود؛
 * بازپرداخت بدهی/قسط و دریافت طلب نیز Double Count نمی‌شوند.
 */
export function flowTotals(transactions: Transaction[], currency?: string): FlowTotals {
  let income = 0;
  let expense = 0;
  let count = 0;
  for (const t of transactions) {
    if (currency && t.currency !== currency) continue;
    if (t.type === "income") {
      if (t.excludeFromOperatingIncome) continue;
      income += t.amount;
    } else if (t.type === "expense") {
      if (t.excludeFromOperatingExpense) continue;
      expense += t.amount;
    } else continue;
    count += 1;
  }
  return { income, expense, net: income - expense, count };
}

export function memberFlow(transactions: Transaction[], memberId: string): FlowTotals {
  return flowTotals(transactions.filter((t) => t.memberId === memberId));
}

export function memberLatest(transactions: Transaction[], memberId: string, limit = 3): Transaction[] {
  return sortTransactionsDesc(transactions.filter((t) => t.memberId === memberId)).slice(0, limit);
}

export function sortTransactionsDesc(list: Transaction[]): Transaction[] {
  return [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

/* ─────────────── فیلتر و جستجو ─────────────── */

export type DateRangeId = "all" | "month" | "lastMonth" | "3months" | "year";

export const DATE_RANGES: { id: DateRangeId; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "month", label: "این ماه" },
  { id: "lastMonth", label: "ماه قبل" },
  { id: "3months", label: "۳ ماه اخیر" },
  { id: "year", label: "امسال" },
];

export interface TxFilter {
  query: string;
  type: "all" | TransactionType;
  memberId: string;
  accountId: string;
  category: string;
  range: DateRangeId;
}

export const EMPTY_FILTER: TxFilter = {
  query: "",
  type: "all",
  memberId: "all",
  accountId: "all",
  category: "all",
  range: "all",
};

function monthIndex(jy: number, jm: number): number {
  return jy * 12 + (jm - 1);
}

function inRange(isoDate: string, range: DateRangeId): boolean {
  if (range === "all") return true;
  const parts = jalaliParts(isoDate);
  if (!parts) return false;
  const nowParts = jalaliParts(todayISO());
  if (!nowParts) return false;
  const cur = monthIndex(nowParts.jy, nowParts.jm);
  const tx = monthIndex(parts.jy, parts.jm);
  switch (range) {
    case "month": return tx === cur;
    case "lastMonth": return tx === cur - 1;
    case "3months": return tx >= cur - 2 && tx <= cur;
    case "year": return parts.jy === nowParts.jy;
    default: return true;
  }
}

interface Lookups {
  memberName: (id?: string) => string;
  accountName: (id: string) => string;
}

export function filterTransactions(
  transactions: Transaction[],
  filter: TxFilter,
  lookups: Lookups
): Transaction[] {
  const q = filter.query.trim().toLowerCase();
  return sortTransactionsDesc(transactions).filter((t) => {
    if (filter.type !== "all" && t.type !== filter.type) return false;
    if (filter.memberId === "household" && t.memberId) return false;
    if (filter.memberId !== "all" && filter.memberId !== "household" && t.memberId !== filter.memberId) return false;
    if (filter.accountId !== "all" && t.accountId !== filter.accountId && t.destinationAccountId !== filter.accountId) return false;
    if (filter.category !== "all" && t.category !== filter.category) return false;
    if (!inRange(t.date, filter.range)) return false;
    if (q) {
      const haystack = [
        t.title, t.description ?? "", t.category ?? "", t.subcategory ?? "",
        lookups.memberName(t.memberId), lookups.accountName(t.accountId),
        t.destinationAccountId ? lookups.accountName(t.destinationAccountId) : "",
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
