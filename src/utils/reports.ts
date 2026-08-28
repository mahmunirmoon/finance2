import type {
  Account, Budget, CurrencyCode, Debt, FinancialPlan, FinancialPlanItem,
  Receivable, SavingsContribution, SavingsGoal, Transaction, TransactionType,
} from "../types";
import { faNum, jalaliParts, todayISO } from "./format";
import {
  calculateBudgetUsage, calculateDebtState, calculateFinancialPlanProgress,
  calculateReceivableState, goalSaved, effectiveGoalTarget, isOperatingExpense,
  isOperatingIncome, JALALI_MONTHS, currentJalali, averageMonthlyOperatingExpense,
} from "./planning";
import { sumByCurrency } from "./planning";
import { computeAllBalances } from "./finance";

/* ─────────────────────────────────────────────────────────────
   Reporting Engine (Mission 5)
   هیچ عدد Hard-coded نیست؛ همه از Transaction Engine و داده موجود.
   ───────────────────────────────────────────────────────────── */

export type ReportRange = "today" | "week" | "month" | "lastMonth" | "3m" | "6m" | "year" | "custom";

export const REPORT_RANGES: { id: ReportRange; label: string }[] = [
  { id: "today", label: "امروز" },
  { id: "week", label: "هفته جاری" },
  { id: "month", label: "ماه جاری" },
  { id: "lastMonth", label: "ماه قبل" },
  { id: "3m", label: "۳ ماه اخیر" },
  { id: "6m", label: "۶ ماه اخیر" },
  { id: "year", label: "سال جاری" },
  { id: "custom", label: "بازه دلخواه" },
];

export interface ReportFilter {
  range: ReportRange;
  from?: string;
  to?: string;
  currency: CurrencyCode;
  memberId: string; // all | household | id
  accountId: string;
  category: string;
  type: "all" | TransactionType;
}

function monthIdx(jy: number, jm: number) {
  return jy * 12 + (jm - 1);
}

/** شروع هفته ایرانی — شنبه */
function weekStartISO(): string {
  const d = new Date();
  const offset = (d.getDay() + 1) % 7;
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inReportRange(dateISO: string, f: ReportFilter): boolean {
  switch (f.range) {
    case "today":
      return dateISO === todayISO();
    case "week":
      return dateISO >= weekStartISO();
    case "custom":
      if (f.from && dateISO < f.from) return false;
      if (f.to && dateISO > f.to) return false;
      return true;
    default: {
      const p = jalaliParts(dateISO);
      if (!p) return false;
      const now = currentJalali();
      const cur = monthIdx(now.jy, now.jm);
      const tx = monthIdx(p.jy, p.jm);
      switch (f.range) {
        case "month": return tx === cur;
        case "lastMonth": return tx === cur - 1;
        case "3m": return tx >= cur - 2 && tx <= cur;
        case "6m": return tx >= cur - 5 && tx <= cur;
        case "year": return p.jy === now.jy;
        default: return true;
      }
    }
  }
}

/** اعمال فیلتر گزارش روی تراکنش‌ها */
export function applyReportFilter(transactions: Transaction[], f: ReportFilter): Transaction[] {
  return transactions.filter((t) => {
    if (t.currency !== f.currency) return false;
    if (f.type !== "all" && t.type !== f.type) return false;
    if (f.memberId === "household" && t.memberId) return false;
    if (f.memberId !== "all" && f.memberId !== "household" && t.memberId !== f.memberId) return false;
    if (f.accountId !== "all" && t.accountId !== f.accountId && t.destinationAccountId !== f.accountId) return false;
    if (f.category !== "all" && t.category !== f.category) return false;
    if (!inReportRange(t.date, f)) return false;
    return true;
  });
}

/* ── سری‌های زمانی ── */

export interface MonthPoint {
  label: string;
  monthIndex: number;
  income: number;
  expense: number;
  net: number;
}

/** درآمد/هزینه عملیاتی ماه به ماه برای n ماه اخیر — برای نمودارها */
export function getMonthlySeries(transactions: Transaction[], months: number, currency: CurrencyCode): MonthPoint[] {
  const now = currentJalali();
  const cur = monthIdx(now.jy, now.jm);
  const points: MonthPoint[] = Array.from({ length: months }, (_, i) => {
    const idx = cur - (months - 1 - i);
    const jy = Math.floor(idx / 12);
    const jm = (idx % 12) + 1;
    return { label: JALALI_MONTHS[jm - 1], monthIndex: idx, income: 0, expense: 0, net: 0 };
  });
  for (const t of transactions) {
    if (t.currency !== currency) continue;
    const p = jalaliParts(t.date);
    if (!p) continue;
    const idx = monthIdx(p.jy, p.jm);
    const pt = points.find((x) => x.monthIndex === idx);
    if (!pt) continue;
    if (isOperatingIncome(t)) pt.income += t.amount;
    else if (isOperatingExpense(t)) pt.expense += t.amount;
  }
  points.forEach((pt) => (pt.net = pt.income - pt.expense));
  return points;
}

/* ── تفکیک‌ها ── */

export function getCategoryBreakdown(transactions: Transaction[], currency: CurrencyCode) {
  const map = new Map<string, number>();
  let total = 0;
  for (const t of transactions) {
    if (!isOperatingExpense(t) || t.currency !== currency) continue;
    const cat = t.category ?? "سایر";
    map.set(cat, (map.get(cat) ?? 0) + t.amount);
    total += t.amount;
  }
  const rows = [...map.entries()]
    .map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
  return { rows, total };
}

export interface MemberExpenseRow {
  memberId?: string;
  name: string;
  amount: number;
  household?: boolean;
}

/** هزینه اعضا — هزینه‌های خانوار جدا نگه داشته می‌شوند */
export function getMemberBreakdown(
  transactions: Transaction[],
  currency: CurrencyCode,
  memberName: (id?: string) => string
): { members: MemberExpenseRow[]; household: number } {
  const map = new Map<string, number>();
  let household = 0;
  for (const t of transactions) {
    if (!isOperatingExpense(t) || t.currency !== currency) continue;
    if (!t.memberId) household += t.amount;
    else map.set(t.memberId, (map.get(t.memberId) ?? 0) + t.amount);
  }
  const members = [...map.entries()]
    .map(([memberId, amount]) => ({ memberId, name: memberName(memberId) || "عضو", amount }))
    .sort((a, b) => b.amount - a.amount);
  return { members, household };
}

export function getAccountSummary(accounts: Account[], transactions: Transaction[]) {
  const balances = computeAllBalances(accounts, transactions);
  return accounts.map((a) => ({ account: a, balance: balances[a.id] ?? 0 }));
}

export function getBudgetPerformance(budgets: Budget[], transactions: Transaction[]) {
  return budgets
    .filter((b) => b.isActive)
    .map((b) => ({ budget: b, usage: calculateBudgetUsage(b, transactions) }))
    .sort((a, b) => b.usage.percentage - a.usage.percentage);
}

export function getPlanPerformance(
  plans: FinancialPlan[],
  items: FinancialPlanItem[],
  transactions: Transaction[]
) {
  return plans
    .filter((p) => p.status !== "cancelled")
    .map((p) => ({ plan: p, progress: calculateFinancialPlanProgress(p, items.filter((i) => i.planId === p.id), transactions) }));
}

export function getSavingsPerformance(
  goals: SavingsGoal[],
  contributions: SavingsContribution[],
  transactions: Transaction[]
) {
  const avg = averageMonthlyOperatingExpense(transactions, "toman");
  return goals
    .filter((g) => g.status !== "cancelled")
    .map((g) => {
      const saved = goalSaved(g, contributions);
      const target = effectiveGoalTarget(g, g.currency === "toman" ? avg : 0);
      return { goal: g, saved, target, percent: target > 0 ? (saved / target) * 100 : 0 };
    });
}

export function getObligationSummary(debts: Debt[], receivables: Receivable[], transactions: Transaction[]) {
  const debtTotals = sumByCurrency(
    debts.map((d) => ({ amount: calculateDebtState(d, transactions).remaining, currency: d.currency }))
  );
  const recTotals = sumByCurrency(
    receivables.map((r) => ({ amount: calculateReceivableState(r, transactions).remaining, currency: r.currency }))
  );
  return { debtTotals, recTotals };
}

/* ── خلاصه ماهانه ── */

export interface MonthlySummary {
  income: number;
  expense: number;
  net: number;
  transferVolume: number;
  debtPayments: number;
  receivableCollections: number;
  topCategories: { category: string; amount: number; percent: number }[];
  topMembers: MemberExpenseRow[];
}

export function getMonthlySummary(transactions: Transaction[], currency: CurrencyCode, memberName: (id?: string) => string): MonthlySummary {
  let income = 0, expense = 0, transferVolume = 0, debtPayments = 0, receivableCollections = 0;
  for (const t of transactions) {
    if (t.currency !== currency) continue;
    if (t.type === "transfer") transferVolume += t.amount;
    else if (t.type === "income") {
      if (t.excludeFromOperatingIncome) {
        if (t.financialReferenceType === "receivable-collection") receivableCollections += t.amount;
        continue;
      }
      income += t.amount;
    } else {
      if (t.excludeFromOperatingExpense) {
        if (t.financialReferenceType === "debt-payment" || t.financialReferenceType === "installment-payment") debtPayments += t.amount;
        continue;
      }
      expense += t.amount;
    }
  }
  const cats = getCategoryBreakdown(transactions, currency);
  const mb = getMemberBreakdown(transactions, currency, memberName);
  return {
    income, expense, net: income - expense, transferVolume, debtPayments, receivableCollections,
    topCategories: cats.rows.slice(0, 5),
    topMembers: mb.members.slice(0, 5),
  };
}

/* ── گزارش سالانه ── */

export interface AnnualMonthRow {
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface AnnualSummary {
  year: number;
  months: AnnualMonthRow[];
  totalIncome: number;
  totalExpense: number;
  net: number;
  avgMonthlyExpense: number;
  highestExpenseMonth: AnnualMonthRow | null;
  lowestExpenseMonth: AnnualMonthRow | null;
  highestIncomeMonth: AnnualMonthRow | null;
  topCategory: { category: string; amount: number } | null;
  topMember: MemberExpenseRow | null;
  hasData: boolean;
}

export function getAnnualSummary(
  transactions: Transaction[],
  year: number,
  currency: CurrencyCode,
  memberName: (id?: string) => string
): AnnualSummary {
  const months: AnnualMonthRow[] = JALALI_MONTHS.map((label, i) => ({
    month: i + 1, label, income: 0, expense: 0, net: 0,
  }));
  const inYear = transactions.filter((t) => {
    if (t.currency !== currency) return false;
    const p = jalaliParts(t.date);
    return p?.jy === year;
  });
  for (const t of inYear) {
    const p = jalaliParts(t.date);
    if (!p) continue;
    const row = months[p.jm - 1];
    if (isOperatingIncome(t)) row.income += t.amount;
    else if (isOperatingExpense(t)) row.expense += t.amount;
  }
  months.forEach((m) => (m.net = m.income - m.expense));

  const totalIncome = months.reduce((s, m) => s + m.income, 0);
  const totalExpense = months.reduce((s, m) => s + m.expense, 0);
  const withExpense = months.filter((m) => m.expense > 0);
  const withIncome = months.filter((m) => m.income > 0);
  const cats = getCategoryBreakdown(inYear, currency);
  const mb = getMemberBreakdown(inYear, currency, memberName);

  return {
    year,
    months,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    avgMonthlyExpense: withExpense.length > 0 ? totalExpense / Math.max(withExpense.length, 1) : 0,
    highestExpenseMonth: withExpense.length ? withExpense.reduce((a, b) => (b.expense > a.expense ? b : a)) : null,
    lowestExpenseMonth: withExpense.length ? withExpense.reduce((a, b) => (b.expense < a.expense ? b : a)) : null,
    highestIncomeMonth: withIncome.length ? withIncome.reduce((a, b) => (b.income > a.income ? b : a)) : null,
    topCategory: cats.rows[0] ? { category: cats.rows[0].category, amount: cats.rows[0].amount } : null,
    topMember: mb.members[0] ?? null,
    hasData: inYear.length > 0,
  };
}

/** بینش‌های rule-based سالانه — بدون AI */
export function getAnnualInsights(s: AnnualSummary, currency: CurrencyCode): string[] {
  const insights: string[] = [];
  if (!s.hasData) return ["برای این سال داده‌ای ثبت نشده است."];
  if (s.highestExpenseMonth)
    insights.push(`بیشترین هزینه سال مربوط به ${s.highestExpenseMonth.label} با ${faNum(Math.round(s.highestExpenseMonth.expense))} بوده است.`);
  if (s.lowestExpenseMonth && s.lowestExpenseMonth !== s.highestExpenseMonth)
    insights.push(`کم‌هزینه‌ترین ماه، ${s.lowestExpenseMonth.label} بوده است.`);
  if (s.topCategory)
    insights.push(`پرخرج‌ترین دسته «${s.topCategory.category}» با ${faNum(Math.round(s.topCategory.amount))} ${currency === "toman" ? "تومان" : ""} بوده است.`);
  if (s.avgMonthlyExpense > 0)
    insights.push(`میانگین هزینه ماهانه خانواده ${faNum(Math.round(s.avgMonthlyExpense))} بوده است.`);
  if (s.topMember)
    insights.push(`بیشترین هزینه شخصی مربوط به ${s.topMember.name} بوده است.`);
  if (s.net >= 0) insights.push("تراز سال مثبت بوده؛ خانواده بیش از درآمد خرج نکرده است.");
  else insights.push("تراز سال منفی بوده؛ هزینه‌ها از درآمد بیشتر شده است.");
  return insights;
}
