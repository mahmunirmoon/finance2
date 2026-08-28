import type {
  Budget, Debt, FinancialPlan, FinancialPlanItem, InstallmentItem, InstallmentPlan,
  Receivable, RecurringPayment, SavingsContribution, SavingsGoal,
} from "../types";

/** کلیدهای نسخه‌بندی‌شده — داده‌های Mission 1 و 2 دست‌نخورده می‌مانند */
const KEYS = {
  budgets: "ffm.budgets.v1",
  debts: "ffm.debts.v1",
  receivables: "ffm.receivables.v1",
  installmentPlans: "ffm.installmentPlans.v1",
  installmentItems: "ffm.installmentItems.v1",
  recurring: "ffm.recurringPayments.v1",
  plans: "ffm.financialPlans.v1",
  planItems: "ffm.financialPlanItems.v1",
  goals: "ffm.savingsGoals.v1",
  contributions: "ffm.savingsContributions.v1",
} as const;

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function save(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

export const planningStorage = {
  loadBudgets: (): Budget[] => load<Budget>(KEYS.budgets),
  saveBudgets: (d: Budget[]) => save(KEYS.budgets, d),
  loadDebts: (): Debt[] => load<Debt>(KEYS.debts),
  saveDebts: (d: Debt[]) => save(KEYS.debts, d),
  loadReceivables: (): Receivable[] => load<Receivable>(KEYS.receivables),
  saveReceivables: (d: Receivable[]) => save(KEYS.receivables, d),
  loadInstallmentPlans: (): InstallmentPlan[] => load<InstallmentPlan>(KEYS.installmentPlans),
  saveInstallmentPlans: (d: InstallmentPlan[]) => save(KEYS.installmentPlans, d),
  loadInstallmentItems: (): InstallmentItem[] => load<InstallmentItem>(KEYS.installmentItems),
  saveInstallmentItems: (d: InstallmentItem[]) => save(KEYS.installmentItems, d),
  loadRecurring: (): RecurringPayment[] => load<RecurringPayment>(KEYS.recurring),
  saveRecurring: (d: RecurringPayment[]) => save(KEYS.recurring, d),
  loadPlans: (): FinancialPlan[] => load<FinancialPlan>(KEYS.plans),
  savePlans: (d: FinancialPlan[]) => save(KEYS.plans, d),
  loadPlanItems: (): FinancialPlanItem[] => load<FinancialPlanItem>(KEYS.planItems),
  savePlanItems: (d: FinancialPlanItem[]) => save(KEYS.planItems, d),
  loadGoals: (): SavingsGoal[] => load<SavingsGoal>(KEYS.goals),
  saveGoals: (d: SavingsGoal[]) => save(KEYS.goals, d),
  loadContributions: (): SavingsContribution[] => load<SavingsContribution>(KEYS.contributions),
  saveContributions: (d: SavingsContribution[]) => save(KEYS.contributions, d),
  /** پاک‌سازی همه کلیدها — فقط برای «شروع دوباره» */
  clearAll: () => {
    try {
      Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
  },
};
