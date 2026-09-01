import type { Account, Transaction } from "../types";

import { safeSetItem } from "../utils/safeStorage";

const ACCOUNTS_KEY = "ffm.accounts.v1";
const TRANSACTIONS_KEY = "ffm.transactions.v1";

export function loadAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Account[]) : [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: Account[]): void {
  safeSetItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
  } catch {
    return [];
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  safeSetItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function clearFinanceStorage(): void {
  try {
    localStorage.removeItem(ACCOUNTS_KEY);
    localStorage.removeItem(TRANSACTIONS_KEY);
  } catch { /* ignore */ }
}
