import type {
  Budget, CurrencyCode, Debt, FinancialPlan, FinancialPlanItem, InstallmentItem,
  InstallmentPlan, Receivable, RecurringPayment, SavingsContribution, SavingsGoal, Transaction,
} from "../types";
import { jalaliParts, todayISO } from "./format";

/* ─────────────────────────────────────────────────────────────
   هسته محاسبات برنامه‌ریزی (Mission 3 + 4)
   همه اعداد از Transaction Engine مشتق می‌شوند.
   ───────────────────────────────────────────────────────────── */

/** هزینه عملیاتی — بازپرداخت بدهی/قسط حذف می‌شود تا Double Count نشود */
export function isOperatingExpense(t: Transaction): boolean {
  return t.type === "expense" && !t.excludeFromOperatingExpense;
}

export function isOperatingIncome(t: Transaction): boolean {
  return t.type === "income" && !t.excludeFromOperatingIncome;
}

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export function currentJalali(): { jy: number; jm: number } {
  const p = jalaliParts(todayISO());
  return p ? { jy: p.jy, jm: p.jm } : { jy: 1404, jm: 1 };
}

export function jalaliMonthLabel(year: number, month: number): string {
  return `${JALALI_MONTHS[month - 1] ?? ""} ${year.toLocaleString("fa-IR")}`;
}

export function budgetPeriodLabel(b: Budget): string {
  return b.period === "monthly" && b.month
    ? jalaliMonthLabel(b.year, b.month)
    : `سال ${b.year.toLocaleString("fa-IR")}`;
}

/* ── بودجه ── */

export type BudgetStatusId = "safe" | "warning" | "exceeded";

export interface BudgetUsage {
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatusId;
}

/** مصرف بودجه فقط از هزینه‌های عملیاتی همان دوره */
export function calculateBudgetUsage(budget: Budget, transactions: Transaction[]): BudgetUsage {
  let spent = 0;
  for (const t of transactions) {
    if (!isOperatingExpense(t)) continue;
    if (t.currency !== budget.currency) continue;
    if (budget.scope === "member" || budget.scope === "member-category") {
      if (t.memberId !== budget.memberId) continue;
    }
    if (budget.scope === "category" || budget.scope === "member-category") {
      if (t.category !== budget.categoryId) continue;
    }
    const p = jalaliParts(t.date);
    if (!p) continue;
    if (p.jy !== budget.year) continue;
    if (budget.period === "monthly" && budget.month && p.jm !== budget.month) continue;
    spent += t.amount;
  }
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  let status: BudgetStatusId = "safe";
  if (percentage > 100) status = "exceeded";
  else if (percentage >= budget.alertThreshold) status = "warning";
  return { amount: budget.amount, spent, remaining: budget.amount - spent, percentage, status };
}

/* ── بدهی و طلب ── */

function linkedSum(ids: string[], transactions: Transaction[]): number {
  const map = new Map(transactions.map((t) => [t.id, t.amount]));
  return ids.reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
}

export function calculateDebtState(debt: Debt, transactions: Transaction[]) {
  const paid = Math.min(linkedSum(debt.transactionIds, transactions), debt.originalAmount);
  const remaining = debt.originalAmount - paid;
  const today = todayISO();
  let status: Debt["status"] = "paid";
  if (remaining <= 0) status = "paid";
  else if (debt.dueDate && debt.dueDate < today) status = "overdue";
  else if (paid > 0) status = "partial";
  else status = "unpaid";
  return { paid, remaining, status };
}

export function calculateReceivableState(rec: Receivable, transactions: Transaction[]) {
  const received = Math.min(linkedSum(rec.transactionIds, transactions), rec.originalAmount);
  const remaining = rec.originalAmount - received;
  const today = todayISO();
  let status: Receivable["status"] = "received";
  if (remaining <= 0) status = "received";
  else if (rec.dueDate && rec.dueDate < today) status = "overdue";
  else if (received > 0) status = "partial";
  else status = "unpaid";
  return { received, remaining, status };
}

/* ── تاریخ ── */

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addMonthsISO(iso: string, months: number): string {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}

export function advanceByFrequency(iso: string, freq: RecurringPayment["frequency"]): string {
  switch (freq) {
    case "weekly": return addDaysISO(iso, 7);
    case "monthly": return addMonthsISO(iso, 1);
    case "quarterly": return addMonthsISO(iso, 3);
    case "yearly": return addMonthsISO(iso, 12);
  }
}

/* ── اقساط ── */

export function generateInstallmentItems(
  plan: Pick<InstallmentPlan, "id" | "installmentCount" | "installmentAmount" | "startDate" | "frequency">,
  makeId: () => string
): InstallmentItem[] {
  const stepMonths = plan.frequency === "quarterly" ? 3 : 1;
  return Array.from({ length: plan.installmentCount }, (_, i) => ({
    id: makeId(),
    planId: plan.id,
    installmentNumber: i + 1,
    dueDate: addMonthsISO(plan.startDate, i * stepMonths),
    amount: plan.installmentAmount,
    status: "upcoming" as const,
  }));
}

export function installmentItemDisplayStatus(item: InstallmentItem, today = todayISO()): InstallmentItem["status"] {
  if (item.status === "paid") return "paid";
  if (item.dueDate < today) return "overdue";
  if (item.dueDate === today) return "due";
  return "upcoming";
}

/* ── برنامه مالی زندگی ── */

export interface PlanProgress {
  estimated: number;
  actual: number;
  remaining: number;
  percentage: number;
  itemCount: number;
  paidItemCount: number;
  upcomingItemCount: number;
}

export function planItemActual(item: FinancialPlanItem, transactions: Transaction[]): number {
  return linkedSum(item.transactionIds, transactions);
}

/** پیشرفت برنامه — Actual فقط از تراکنش‌های هزینه واقعی متصل به Plan */
export function calculateFinancialPlanProgress(
  plan: FinancialPlan,
  items: FinancialPlanItem[],
  transactions: Transaction[]
): PlanProgress {
  const activeItems = items.filter((i) => i.status !== "cancelled");
  const txById = new Map(transactions.map((t) => [t.id, t]));
  let actual = 0;
  let paidItemCount = 0;
  for (const item of activeItems) {
    let itemSum = 0;
    for (const txId of item.transactionIds) {
      const t = txById.get(txId);
      if (t && t.type === "expense" && t.currency === plan.currency) itemSum += t.amount;
    }
    actual += itemSum;
    if (item.status === "paid" || itemSum > 0) paidItemCount += 1;
  }
  const estimated = activeItems.reduce((s, i) => s + i.estimatedAmount, 0);
  const base = plan.estimatedBudget > 0 ? plan.estimatedBudget : estimated;
  const percentage = base > 0 ? (actual / base) * 100 : 0;
  return {
    estimated,
    actual,
    remaining: Math.max(base - actual, 0),
    percentage,
    itemCount: activeItems.length,
    paidItemCount,
    upcomingItemCount: activeItems.filter((i) => i.status !== "paid" && i.dueDate).length,
  };
}

/* ── پس‌انداز و صندوق اضطراری ── */

export function goalSaved(goal: SavingsGoal, contributions: SavingsContribution[]): number {
  return contributions
    .filter((c) => c.goalId === goal.id && c.currency === goal.currency)
    .reduce((s, c) => s + c.amount, 0);
}

/** میانگین هزینه ماهانه عملیاتی — فقط Operating Expenseهای ارز مشخص */
export function averageMonthlyOperatingExpense(
  transactions: Transaction[],
  currency: CurrencyCode,
  months = 3
): number {
  const now = currentJalali();
  const current = now.jy * 12 + (now.jm - 1);
  let sum = 0;
  for (const t of transactions) {
    if (!isOperatingExpense(t) || t.currency !== currency) continue;
    const p = jalaliParts(t.date);
    if (!p) continue;
    const idx = p.jy * 12 + (p.jm - 1);
    if (idx > current || idx < current - (months - 1)) continue;
    sum += t.amount;
  }
  return sum / months;
}

/** هدف مؤثر: مبلغ ثابت یا چند ماه هزینه */
export function effectiveGoalTarget(goal: SavingsGoal, avgMonthlyExpense: number): number {
  if (goal.targetMode === "months" && goal.months) {
    return Math.round(goal.months * avgMonthlyExpense);
  }
  return goal.targetAmount;
}

/* ── جمع امن چندارزی — هرگز ارزها با هم جمع نمی‌شوند ── */

export function sumByCurrency(items: { amount: number; currency: CurrencyCode }[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const it of items) {
    result[it.currency] = (result[it.currency] ?? 0) + it.amount;
  }
  return result;
}

/* ── تعهدات مالی آینده ── */

export type CommitmentKind = "debt" | "installment" | "recurring" | "plan-item";

export interface Commitment {
  id: string;
  kind: CommitmentKind;
  title: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  memberId?: string;
  sourceLabel: string;
}

export const COMMITMENT_KIND_LABEL: Record<CommitmentKind, string> = {
  debt: "بدهی",
  installment: "قسط",
  recurring: "پرداخت تکرارشونده",
  "plan-item": "هزینه برنامه",
};

interface CommitmentInput {
  debts: Debt[];
  installmentPlans: InstallmentPlan[];
  installmentItems: InstallmentItem[];
  recurringPayments: RecurringPayment[];
  financialPlans: FinancialPlan[];
  planItems: FinancialPlanItem[];
  transactions: Transaction[];
}

export function getUpcomingFinancialCommitments(input: CommitmentInput): Commitment[] {
  const result: Commitment[] = [];

  for (const d of input.debts) {
    const state = calculateDebtState(d, input.transactions);
    if (state.remaining > 0 && d.dueDate) {
      result.push({
        id: `debt-${d.id}`, kind: "debt", title: d.title, amount: state.remaining,
        currency: d.currency, date: d.dueDate, memberId: d.memberId, sourceLabel: d.counterparty,
      });
    }
  }

  const instPlanById = new Map(input.installmentPlans.map((p) => [p.id, p]));
  for (const item of input.installmentItems) {
    if (item.status === "paid") continue;
    const plan = instPlanById.get(item.planId);
    if (!plan?.isActive) continue;
    result.push({
      id: `inst-${item.id}`, kind: "installment",
      title: `${plan.title} — قسط ${item.installmentNumber.toLocaleString("fa-IR")}`,
      amount: item.amount, currency: plan.currency, date: item.dueDate,
      memberId: plan.memberId, sourceLabel: "اقساط",
    });
  }

  for (const r of input.recurringPayments) {
    if (!r.isActive) continue;
    result.push({
      id: `rec-${r.id}`, kind: "recurring", title: r.title, amount: r.amount,
      currency: r.currency, date: r.nextDueDate, memberId: r.memberId, sourceLabel: "تکرارشونده",
    });
  }

  const lifePlanById = new Map(input.financialPlans.map((p) => [p.id, p]));
  for (const item of input.planItems) {
    if (item.status === "paid" || item.status === "cancelled" || !item.dueDate) continue;
    const plan = lifePlanById.get(item.planId);
    if (!plan || plan.status === "cancelled" || plan.status === "completed") continue;
    const paid = planItemActual(item, input.transactions);
    result.push({
      id: `plan-${item.id}`, kind: "plan-item", title: `${plan.title} — ${item.title}`,
      amount: Math.max(item.estimatedAmount - paid, 0), currency: plan.currency,
      date: item.dueDate, memberId: plan.memberId, sourceLabel: "برنامه مالی",
    });
  }

  return result.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface CommitmentGroups {
  overdue: Commitment[];
  today: Commitment[];
  week: Commitment[];
  month: Commitment[];
}

export function groupCommitments(list: Commitment[], today = todayISO()): CommitmentGroups {
  const weekLimit = addDaysISO(today, 7);
  const monthLimit = addDaysISO(today, 30);
  const groups: CommitmentGroups = { overdue: [], today: [], week: [], month: [] };
  for (const c of list) {
    if (c.date < today) groups.overdue.push(c);
    else if (c.date === today) groups.today.push(c);
    else if (c.date <= weekLimit) groups.week.push(c);
    else if (c.date <= monthLimit) groups.month.push(c);
  }
  return groups;
}
