import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Account, Family, Transaction } from "../types";
import {
  clearFinanceStorage, loadAccounts, loadTransactions, saveAccounts, saveTransactions,
} from "../storage/financeStorage";
import { createDemoFinance } from "../data/demoFinance";
import { computeAllBalances } from "../utils/finance";
import { uid } from "../utils/id";
import { useFamily } from "./useFamily";

export type AccountInput = Omit<Account, "id" | "familyId" | "createdAt" | "updatedAt">;
export type TransactionInput = Omit<Transaction, "id" | "familyId" | "createdAt" | "updatedAt">;

interface FinanceContextValue {
  accounts: Account[];
  transactions: Transaction[];
  /** موجودی محاسبه‌شده از تراکنش‌ها — هرگز ذخیره نمی‌شود */
  balances: Record<string, number>;
  accountById: (id: string) => Account | undefined;
  addAccount: (input: AccountInput) => void;
  updateAccount: (id: string, patch: Partial<AccountInput>) => void;
  deleteAccount: (id: string) => number;
  /** ایجاد تراکنش و بازگرداندن id — برای اتصال بدهی/قسط/برنامه */
  addTransaction: (input: TransactionInput) => string;
  updateTransaction: (id: string, patch: Partial<TransactionInput>) => void;
  deleteTransaction: (id: string) => void;
  loadDemoFinance: (family: Family) => { accounts: Account[]; transactions: Transaction[] };
  /** جایگزینی کامل داده مالی (Demo یکپارچه / بازیابی پشتیبان) */
  setFinanceData: (accounts: Account[], transactions: Transaction[]) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { family } = useFamily();
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());

  useEffect(() => {
    if (family) saveAccounts(accounts);
  }, [accounts, family]);

  useEffect(() => {
    if (family) saveTransactions(transactions);
  }, [transactions, family]);

  useEffect(() => {
    if (!family) {
      clearFinanceStorage();
      setAccounts([]);
      setTransactions([]);
    }
  }, [family]);

  const balances = useMemo(() => computeAllBalances(accounts, transactions), [accounts, transactions]);

  const accountById = useCallback((id: string) => accounts.find((a) => a.id === id), [accounts]);

  const familyId = family?.id ?? "";

  const addAccount = useCallback(
    (input: AccountInput) => {
      const now = new Date().toISOString();
      setAccounts((prev) => [...prev, { ...input, id: uid(), familyId, createdAt: now, updatedAt: now }]);
    },
    [familyId]
  );

  const updateAccount = useCallback((id: string, patch: Partial<AccountInput>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a)));
  }, []);

  const deleteAccount = useCallback(
    (id: string): number => {
      const affected = transactions.filter((t) => t.accountId === id || t.destinationAccountId === id).length;
      setTransactions((prev) => prev.filter((t) => t.accountId !== id && t.destinationAccountId !== id));
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      return affected;
    },
    [transactions]
  );

  const addTransaction = useCallback(
    (input: TransactionInput): string => {
      const now = new Date().toISOString();
      const id = uid();
      setTransactions((prev) => [...prev, { ...input, familyId, id, createdAt: now, updatedAt: now }]);
      return id;
    },
    [familyId]
  );

  const updateTransaction = useCallback((id: string, patch: Partial<TransactionInput>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t))
    );
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const loadDemoFinance = useCallback((fam: Family) => {
    const demo = createDemoFinance(fam);
    setAccounts(demo.accounts);
    setTransactions(demo.transactions);
    return demo;
  }, []);

  const setFinanceData = useCallback((accs: Account[], txs: Transaction[]) => {
    setAccounts(accs);
    setTransactions(txs);
  }, []);

  const value = useMemo(
    () => ({
      accounts, transactions, balances, accountById, addAccount, updateAccount, deleteAccount,
      addTransaction, updateTransaction, deleteTransaction, loadDemoFinance, setFinanceData,
    }),
    [accounts, transactions, balances, accountById, addAccount, updateAccount, deleteAccount,
      addTransaction, updateTransaction, deleteTransaction, loadDemoFinance, setFinanceData]
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance باید داخل FinanceProvider استفاده شود");
  return ctx;
}
