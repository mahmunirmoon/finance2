import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  Account, Budget, Debt, FinancialPlan, FinancialPlanItem, InstallmentItem, InstallmentPlan,
  Receivable, RecurringPayment, SavingsContribution, SavingsGoal,
} from "../types";
import { planningStorage } from "../storage/planningStorage";
import { useFinance } from "./useFinance";
import { useFamily } from "./useFamily";
import {
  advanceByFrequency, calculateDebtState, calculateReceivableState,
  generateInstallmentItems, planItemActual,
} from "../utils/planning";
import { uid } from "../utils/id";
import type { DemoPlanningBundle } from "../data/demoPlanning";

/* ─────────────────────────────────────────────────────────────
   Context برنامه‌ریزی (Mission 3 + 4) — سوار بر Transaction Engine.
   Sync Guard: پس از هر تغییر تراکنش‌ها (از جمله حذف از صفحات M2)،
   وضعیت ذخیره‌شده بدهی/طلب/اقساط/آیتم‌های برنامه بازهمگام می‌شود.
   ───────────────────────────────────────────────────────────── */

type WithoutSys<T> = Omit<T, "id" | "familyId" | "createdAt" | "updatedAt">;

export type BudgetInput = WithoutSys<Budget>;
export type DebtInput = WithoutSys<Debt>;
export type ReceivableInput = WithoutSys<Receivable>;
export type InstallmentPlanInput = WithoutSys<InstallmentPlan>;
export type RecurringInput = WithoutSys<RecurringPayment>;
export type PlanInput = WithoutSys<FinancialPlan>;
export type PlanItemInput = WithoutSys<FinancialPlanItem>;
export type GoalInput = WithoutSys<SavingsGoal>;

interface PayTxOptions {
  accountId: string;
  amount: number;
  date: string;
  title?: string;
}

export interface PlanningState {
  budgets: Budget[];
  debts: Debt[];
  receivables: Receivable[];
  installmentPlans: InstallmentPlan[];
  installmentItems: InstallmentItem[];
  recurringPayments: RecurringPayment[];
  financialPlans: FinancialPlan[];
  financialPlanItems: FinancialPlanItem[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
}

interface PlanningContextValue extends PlanningState {
  addBudget: (input: BudgetInput) => void;
  updateBudget: (id: string, patch: Partial<BudgetInput>) => void;
  deleteBudget: (id: string) => void;

  addDebt: (input: DebtInput) => void;
  updateDebt: (id: string, patch: Partial<DebtInput>) => void;
  deleteDebt: (id: string) => void;
  recordDebtPayment: (debtId: string, opts: PayTxOptions) => string | null;

  addReceivable: (input: ReceivableInput) => void;
  updateReceivable: (id: string, patch: Partial<ReceivableInput>) => void;
  deleteReceivable: (id: string) => void;
  recordReceivableCollection: (receivableId: string, opts: PayTxOptions) => string | null;

  addInstallmentPlan: (input: InstallmentPlanInput) => void;
  updateInstallmentPlan: (id: string, patch: Partial<InstallmentPlanInput>) => void;
  deleteInstallmentPlan: (id: string) => void;
  payInstallment: (itemId: string, opts: PayTxOptions) => string | null;

  addRecurring: (input: RecurringInput) => void;
  updateRecurring: (id: string, patch: Partial<RecurringInput>) => void;
  deleteRecurring: (id: string) => void;
  payRecurringPayment: (id: string, opts: PayTxOptions) => string | null;

  addFinancialPlan: (input: PlanInput) => string;
  updateFinancialPlan: (id: string, patch: Partial<PlanInput>) => void;
  deleteFinancialPlan: (id: string) => void;
  addPlanItem: (input: PlanItemInput) => void;
  updatePlanItem: (id: string, patch: Partial<PlanItemInput>) => void;
  deletePlanItem: (id: string) => void;
  recordPlanExpense: (planId: string, itemId: string | null, opts: PayTxOptions & { category?: string }) => string | null;

  addSavingsGoal: (input: GoalInput) => void;
  updateSavingsGoal: (id: string, patch: Partial<GoalInput>) => void;
  deleteSavingsGoal: (id: string) => void;
  addSavingsContribution: (
    goalId: string,
    opts: { amount: number; date: string; note?: string; accountId?: string; savingsAccountId?: string; asTransfer?: boolean }
  ) => string | null;
  deleteSavingsContribution: (id: string) => void;

  loadDemoPlanning: (bundle: DemoPlanningBundle) => void;
  restorePlanning: (state: PlanningState) => void;
  resetPlanning: () => void;
}

const PlanningContext = createContext<PlanningContextValue | null>(null);
const now = () => new Date().toISOString();

export function PlanningProvider({ children }: { children: ReactNode }) {
  const { family } = useFamily();
  const { transactions, addTransaction, accountById } = useFinance();

  const [budgets, setBudgets] = useState<Budget[]>(planningStorage.loadBudgets);
  const [debts, setDebts] = useState<Debt[]>(planningStorage.loadDebts);
  const [receivables, setReceivables] = useState<Receivable[]>(planningStorage.loadReceivables);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>(planningStorage.loadInstallmentPlans);
  const [installmentItems, setInstallmentItems] = useState<InstallmentItem[]>(planningStorage.loadInstallmentItems);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>(planningStorage.loadRecurring);
  const [financialPlans, setFinancialPlans] = useState<FinancialPlan[]>(planningStorage.loadPlans);
  const [financialPlanItems, setFinancialPlanItems] = useState<FinancialPlanItem[]>(planningStorage.loadPlanItems);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(planningStorage.loadGoals);
  const [savingsContributions, setSavingsContributions] = useState<SavingsContribution[]>(planningStorage.loadContributions);

  useEffect(() => planningStorage.saveBudgets(budgets), [budgets]);
  useEffect(() => planningStorage.saveDebts(debts), [debts]);
  useEffect(() => planningStorage.saveReceivables(receivables), [receivables]);
  useEffect(() => planningStorage.saveInstallmentPlans(installmentPlans), [installmentPlans]);
  useEffect(() => planningStorage.saveInstallmentItems(installmentItems), [installmentItems]);
  useEffect(() => planningStorage.saveRecurring(recurringPayments), [recurringPayments]);
  useEffect(() => planningStorage.savePlans(financialPlans), [financialPlans]);
  useEffect(() => planningStorage.savePlanItems(financialPlanItems), [financialPlanItems]);
  useEffect(() => planningStorage.saveGoals(savingsGoals), [savingsGoals]);
  useEffect(() => planningStorage.saveContributions(savingsContributions), [savingsContributions]);

  useEffect(() => {
    if (!family) {
      setBudgets([]); setDebts([]); setReceivables([]); setInstallmentPlans([]);
      setInstallmentItems([]); setRecurringPayments([]); setFinancialPlans([]);
      setFinancialPlanItems([]); setSavingsGoals([]); setSavingsContributions([]);
    }
  }, [family]);

  /* ── SYNC GUARD ── */
  const txIds = useMemo(() => new Set(transactions.map((t) => t.id)), [transactions]);
  const syncRef = useRef("");
  useEffect(() => {
    const sig = `${transactions.length}:${transactions.map((t) => t.updatedAt).join(",")}`;
    if (sig === syncRef.current) return;
    syncRef.current = sig;

    setDebts((prev) => {
      let changed = false;
      const next = prev.map((d) => {
        const liveIds = d.transactionIds.filter((id) => txIds.has(id));
        const state = calculateDebtState({ ...d, transactionIds: liveIds }, transactions);
        if (liveIds.length !== d.transactionIds.length || state.paid !== d.paidAmount || state.remaining !== d.remainingAmount || state.status !== d.status) {
          changed = true;
          return { ...d, transactionIds: liveIds, paidAmount: state.paid, remainingAmount: state.remaining, status: state.status, updatedAt: now() };
        }
        return d;
      });
      return changed ? next : prev;
    });

    setReceivables((prev) => {
      let changed = false;
      const next = prev.map((r) => {
        const liveIds = r.transactionIds.filter((id) => txIds.has(id));
        const state = calculateReceivableState({ ...r, transactionIds: liveIds }, transactions);
        if (liveIds.length !== r.transactionIds.length || state.received !== r.receivedAmount || state.remaining !== r.remainingAmount || state.status !== r.status) {
          changed = true;
          return { ...r, transactionIds: liveIds, receivedAmount: state.received, remainingAmount: state.remaining, status: state.status, updatedAt: now() };
        }
        return r;
      });
      return changed ? next : prev;
    });

    setInstallmentItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.status === "paid" && item.transactionId && !txIds.has(item.transactionId)) {
          changed = true;
          return { ...item, status: "upcoming" as const, paidDate: undefined, transactionId: undefined };
        }
        return item;
      });
      return changed ? next : prev;
    });

    setFinancialPlanItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        if (item.status === "paid") {
          const actual = planItemActual(
            { ...item, transactionIds: item.transactionIds.filter((id) => txIds.has(id)) },
            transactions
          );
          if (actual <= 0) {
            changed = true;
            return { ...item, status: "planned" as const, transactionIds: item.transactionIds.filter((id) => txIds.has(id)), updatedAt: now() };
          }
        }
        return item;
      });
      return changed ? next : prev;
    });
  }, [txIds, transactions]);

  const familyId = family?.id ?? "";

  /* ── Budget ── */
  const addBudget = useCallback((input: BudgetInput) => {
    const t = now();
    setBudgets((prev) => [...prev, { ...input, id: uid(), familyId, createdAt: t, updatedAt: t }]);
  }, [familyId]);
  const updateBudget = useCallback((id: string, patch: Partial<BudgetInput>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: now() } : b)));
  }, []);
  const deleteBudget = useCallback((id: string) => setBudgets((prev) => prev.filter((b) => b.id !== id)), []);

  /* ── Debt ── */
  const addDebt = useCallback((input: DebtInput) => {
    const t = now();
    setDebts((prev) => [...prev, { ...input, id: uid(), familyId, createdAt: t, updatedAt: t }]);
  }, [familyId]);
  const updateDebt = useCallback((id: string, patch: Partial<DebtInput>) => {
    setDebts((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d)));
  }, []);
  const deleteDebt = useCallback((id: string) => setDebts((prev) => prev.filter((d) => d.id !== id)), []);

  const recordDebtPayment = useCallback((debtId: string, opts: PayTxOptions): string | null => {
    const debt = debts.find((d) => d.id === debtId);
    const account = accountById(opts.accountId);
    if (!debt || !account) return null;
    const txId = addTransaction({
      type: "expense",
      title: opts.title || `بازپرداخت ${debt.title}`,
      amount: opts.amount, currency: account.currency, date: opts.date, accountId: account.id,
      memberId: debt.memberId, category: "بازپرداخت بدهی", status: "done",
      financialReferenceType: "debt-payment", financialReferenceId: debtId,
      excludeFromOperatingExpense: true,
    });
    setDebts((prev) => prev.map((d) => (d.id === debtId ? { ...d, transactionIds: [...d.transactionIds, txId], updatedAt: now() } : d)));
    return txId;
  }, [debts, accountById, addTransaction]);

  /* ── Receivable ── */
  const addReceivable = useCallback((input: ReceivableInput) => {
    const t = now();
    setReceivables((prev) => [...prev, { ...input, id: uid(), familyId, createdAt: t, updatedAt: t }]);
  }, [familyId]);
  const updateReceivable = useCallback((id: string, patch: Partial<ReceivableInput>) => {
    setReceivables((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r)));
  }, []);
  const deleteReceivable = useCallback((id: string) => setReceivables((prev) => prev.filter((r) => r.id !== id)), []);

  const recordReceivableCollection = useCallback((receivableId: string, opts: PayTxOptions): string | null => {
    const rec = receivables.find((r) => r.id === receivableId);
    const account = accountById(opts.accountId);
    if (!rec || !account) return null;
    const txId = addTransaction({
      type: "income",
      title: opts.title || `دریافت ${rec.title}`,
      amount: opts.amount, currency: account.currency, date: opts.date, accountId: account.id,
      memberId: rec.memberId, category: "دریافت طلب", status: "done",
      financialReferenceType: "receivable-collection", financialReferenceId: receivableId,
      excludeFromOperatingIncome: true,
    });
    setReceivables((prev) => prev.map((r) => (r.id === receivableId ? { ...r, transactionIds: [...r.transactionIds, txId], updatedAt: now() } : r)));
    return txId;
  }, [receivables, accountById, addTransaction]);

  /* ── Installments ── */
  const addInstallmentPlan = useCallback((input: InstallmentPlanInput) => {
    const t = now();
    const plan: InstallmentPlan = { ...input, id: uid(), familyId, createdAt: t, updatedAt: t };
    setInstallmentPlans((prev) => [...prev, plan]);
    setInstallmentItems((prev) => [...prev, ...generateInstallmentItems(plan, uid)]);
  }, [familyId]);
  const updateInstallmentPlan = useCallback((id: string, patch: Partial<InstallmentPlanInput>) => {
    setInstallmentPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)));
  }, []);
  const deleteInstallmentPlan = useCallback((id: string) => {
    setInstallmentPlans((prev) => prev.filter((p) => p.id !== id));
    setInstallmentItems((prev) => prev.filter((i) => i.planId !== id));
  }, []);

  const payInstallment = useCallback((itemId: string, opts: PayTxOptions): string | null => {
    const item = installmentItems.find((i) => i.id === itemId);
    const plan = item ? installmentPlans.find((p) => p.id === item.planId) : undefined;
    const account = accountById(opts.accountId);
    if (!item || !plan || !account || item.status === "paid") return null;
    const txId = addTransaction({
      type: "expense",
      title: opts.title || `${plan.title} — قسط ${item.installmentNumber.toLocaleString("fa-IR")}`,
      amount: opts.amount, currency: account.currency, date: opts.date, accountId: account.id,
      memberId: plan.memberId, category: plan.categoryId, status: "done",
      financialReferenceType: "installment-payment", financialReferenceId: itemId,
      excludeFromOperatingExpense: true,
    });
    setInstallmentItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: "paid" as const, paidDate: opts.date, transactionId: txId } : i)));
    return txId;
  }, [installmentItems, installmentPlans, accountById, addTransaction]);

  /* ── Recurring ── */
  const addRecurring = useCallback((input: RecurringInput) => {
    const t = now();
    setRecurringPayments((prev) => [...prev, { ...input, id: uid(), familyId, createdAt: t, updatedAt: t }]);
  }, [familyId]);
  const updateRecurring = useCallback((id: string, patch: Partial<RecurringInput>) => {
    setRecurringPayments((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: now() } : r)));
  }, []);
  const deleteRecurring = useCallback((id: string) => setRecurringPayments((prev) => prev.filter((r) => r.id !== id)), []);

  const payRecurringPayment = useCallback((id: string, opts: PayTxOptions): string | null => {
    const rec = recurringPayments.find((r) => r.id === id);
    const account = accountById(opts.accountId);
    if (!rec || !account) return null;
    addTransaction({
      type: "expense",
      title: opts.title || rec.title,
      amount: opts.amount, currency: account.currency, date: opts.date, accountId: account.id,
      memberId: rec.memberId, category: rec.categoryId, status: "done",
      financialReferenceType: "recurring-payment", financialReferenceId: id,
    });
    setRecurringPayments((prev) => prev.map((r) => (r.id === id ? { ...r, nextDueDate: advanceByFrequency(r.nextDueDate, r.frequency), updatedAt: now() } : r)));
    return id;
  }, [recurringPayments, accountById, addTransaction]);

  /* ── Financial Plans ── */
  const addFinancialPlan = useCallback((input: PlanInput): string => {
    const t = now();
    const id = uid();
    setFinancialPlans((prev) => [...prev, { ...input, id, familyId, createdAt: t, updatedAt: t }]);
    return id;
  }, [familyId]);
  const updateFinancialPlan = useCallback((id: string, patch: Partial<PlanInput>) => {
    setFinancialPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: now() } : p)));
  }, []);
  const deleteFinancialPlan = useCallback((id: string) => {
    setFinancialPlans((prev) => prev.filter((p) => p.id !== id));
    setFinancialPlanItems((prev) => prev.filter((i) => i.planId !== id));
  }, []);
  const addPlanItem = useCallback((input: PlanItemInput) => {
    const t = now();
    setFinancialPlanItems((prev) => [...prev, { ...input, id: uid(), createdAt: t, updatedAt: t }]);
  }, []);
  const updatePlanItem = useCallback((id: string, patch: Partial<PlanItemInput>) => {
    setFinancialPlanItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: now() } : i)));
  }, []);
  const deletePlanItem = useCallback((id: string) => setFinancialPlanItems((prev) => prev.filter((i) => i.id !== id)), []);

  const recordPlanExpense = useCallback((planId: string, itemId: string | null, opts: PayTxOptions & { category?: string }): string | null => {
    const plan = financialPlans.find((p) => p.id === planId);
    const account = accountById(opts.accountId);
    if (!plan || !account) return null;
    const item = itemId ? financialPlanItems.find((i) => i.id === itemId) : undefined;
    const txId = addTransaction({
      type: "expense",
      title: opts.title || (item ? `${plan.title} — ${item.title}` : plan.title),
      amount: opts.amount, currency: account.currency, date: opts.date, accountId: account.id,
      memberId: plan.memberId, category: opts.category || item?.category, status: "done",
      financialPlanId: planId, financialPlanItemId: itemId ?? undefined,
    });
    if (item) {
      setFinancialPlanItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, transactionIds: [...i.transactionIds, txId], status: "paid" as const, updatedAt: now() } : i)));
    }
    return txId;
  }, [financialPlans, financialPlanItems, accountById, addTransaction]);

  /* ── Savings ── */
  const addSavingsGoal = useCallback((input: GoalInput) => {
    const t = now();
    setSavingsGoals((prev) => [...prev, { ...input, id: uid(), familyId, createdAt: t, updatedAt: t }]);
  }, [familyId]);
  const updateSavingsGoal = useCallback((id: string, patch: Partial<GoalInput>) => {
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch, updatedAt: now() } : g)));
  }, []);
  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    setSavingsContributions((prev) => prev.filter((c) => c.goalId !== id));
  }, []);

  const addSavingsContribution = useCallback((goalId: string, opts: {
    amount: number; date: string; note?: string; accountId?: string; savingsAccountId?: string; asTransfer?: boolean;
  }): string | null => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return null;
    let transactionId: string | undefined;
    if (opts.asTransfer && opts.accountId && opts.savingsAccountId) {
      const src = accountById(opts.accountId);
      transactionId = addTransaction({
        type: "transfer",
        title: opts.note || `پس‌انداز — ${goal.title}`,
        amount: opts.amount, currency: src?.currency ?? goal.currency, date: opts.date,
        accountId: opts.accountId, destinationAccountId: opts.savingsAccountId, status: "done",
        financialReferenceType: "savings-contribution", financialReferenceId: goalId,
      });
    }
    setSavingsContributions((prev) => [...prev, {
      id: uid(), goalId, amount: opts.amount, currency: goal.currency, date: opts.date,
      accountId: opts.accountId, transactionId, note: opts.note, createdAt: now(),
    }]);
    return goalId;
  }, [savingsGoals, accountById, addTransaction]);

  const deleteSavingsContribution = useCallback((id: string) => {
    setSavingsContributions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  /* ── Demo / Restore / Reset ── */
  const loadDemoPlanning = useCallback((bundle: DemoPlanningBundle) => {
    setBudgets(bundle.budgets);
    setDebts(bundle.debts);
    setReceivables(bundle.receivables);
    setInstallmentPlans(bundle.installmentPlans);
    setInstallmentItems(bundle.installmentItems);
    setRecurringPayments(bundle.recurringPayments);
    setFinancialPlans(bundle.financialPlans);
    setFinancialPlanItems(bundle.financialPlanItems);
    setSavingsGoals(bundle.savingsGoals);
    setSavingsContributions(bundle.savingsContributions);
  }, []);

  const restorePlanning = useCallback((s: PlanningState) => {
    setBudgets(s.budgets); setDebts(s.debts); setReceivables(s.receivables);
    setInstallmentPlans(s.installmentPlans); setInstallmentItems(s.installmentItems);
    setRecurringPayments(s.recurringPayments); setFinancialPlans(s.financialPlans);
    setFinancialPlanItems(s.financialPlanItems); setSavingsGoals(s.savingsGoals);
    setSavingsContributions(s.savingsContributions);
  }, []);

  const resetPlanning = useCallback(() => {
    planningStorage.clearAll();
    setBudgets([]); setDebts([]); setReceivables([]); setInstallmentPlans([]);
    setInstallmentItems([]); setRecurringPayments([]); setFinancialPlans([]);
    setFinancialPlanItems([]); setSavingsGoals([]); setSavingsContributions([]);
  }, []);

  const value = useMemo<PlanningContextValue>(() => ({
    budgets, debts, receivables, installmentPlans, installmentItems, recurringPayments,
    financialPlans, financialPlanItems, savingsGoals, savingsContributions,
    addBudget, updateBudget, deleteBudget, addDebt, updateDebt, deleteDebt, recordDebtPayment,
    addReceivable, updateReceivable, deleteReceivable, recordReceivableCollection,
    addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan, payInstallment,
    addRecurring, updateRecurring, deleteRecurring, payRecurringPayment,
    addFinancialPlan, updateFinancialPlan, deleteFinancialPlan, addPlanItem, updatePlanItem,
    deletePlanItem, recordPlanExpense, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    addSavingsContribution, deleteSavingsContribution, loadDemoPlanning, restorePlanning, resetPlanning,
  }), [
    budgets, debts, receivables, installmentPlans, installmentItems, recurringPayments,
    financialPlans, financialPlanItems, savingsGoals, savingsContributions,
    addBudget, updateBudget, deleteBudget, addDebt, updateDebt, deleteDebt, recordDebtPayment,
    addReceivable, updateReceivable, deleteReceivable, recordReceivableCollection,
    addInstallmentPlan, updateInstallmentPlan, deleteInstallmentPlan, payInstallment,
    addRecurring, updateRecurring, deleteRecurring, payRecurringPayment,
    addFinancialPlan, updateFinancialPlan, deleteFinancialPlan, addPlanItem, updatePlanItem,
    deletePlanItem, recordPlanExpense, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal,
    addSavingsContribution, deleteSavingsContribution, loadDemoPlanning, restorePlanning, resetPlanning,
  ]);

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}

export function usePlanning(): PlanningContextValue {
  const ctx = useContext(PlanningContext);
  if (!ctx) throw new Error("usePlanning باید داخل PlanningProvider استفاده شود");
  return ctx;
}
