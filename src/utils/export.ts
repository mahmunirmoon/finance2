import type {
  Account, Budget, Debt, Family, FamilyMember, FinancialPlan, FinancialPlanItem, InstallmentItem,
  InstallmentPlan, Receivable, RecurringPayment, SavingsContribution, SavingsGoal, Transaction,
} from "../types";
import { checkDataIntegrity } from "./dataIntegrity";
import { getRoleLabel } from "../data/options";

/* ─────────────────────────────────────────────────────────────
   Export & Backup — CSV / Excel / JSON Backup
   (Repair Mission 2: اعتبارسنجی ساختاری کامل + خروجی ۱۴ برگی)
   ───────────────────────────────────────────────────────────── */

export const BACKUP_VERSION = "1.0";
export const APP_NAME = "Family Finance Manager";

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ── CSV (UTF-8 BOM برای فارسی) ── */

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const TX_TYPE_FA: Record<string, string> = { income: "درآمد", expense: "هزینه", transfer: "انتقال" };

export function exportTransactionsCSV(
  transactions: Transaction[],
  memberName: (id?: string) => string,
  accountName: (id: string) => string,
  fileName: string
) {
  const header = ["تاریخ", "نوع", "عنوان", "عضو", "حساب", "دسته", "مبلغ", "ارز", "توضیح"];
  const rows = transactions.map((t) => [
    t.date,
    TX_TYPE_FA[t.type] ?? t.type,
    t.title,
    t.memberId ? memberName(t.memberId) : "کل خانواده",
    accountName(t.accountId) + (t.destinationAccountId ? ` → ${accountName(t.destinationAccountId)}` : ""),
    t.category ?? "",
    t.amount,
    t.currency,
    t.description ?? "",
  ]);
  const body = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  downloadBlob(fileName, new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" }));
}

/* ── Excel (SheetJS — فقط هنگام درخواست، dynamic import) ── */

export async function exportExcelWorkbook(payload: {
  family: Family;
  accounts: Account[];
  transactions: Transaction[];
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
  fileName: string;
}) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const sheet = (name: string, data: (string | number)[][]) => {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), name);
  };

  const memberName = (id?: string) => payload.family.members.find((m) => m.id === id)?.name ?? "کل خانواده";
  const accountName = (id?: string) => payload.accounts.find((a) => a.id === id)?.name ?? "—";
  const planName = (id?: string) => payload.financialPlans.find((p) => p.id === id)?.title ?? "—";
  const goalName = (id?: string) => payload.savingsGoals.find((g) => g.id === id)?.title ?? "—";
  const installmentPlanName = (id?: string) => payload.installmentPlans.find((p) => p.id === id)?.title ?? "—";
  const memberRole = (m: FamilyMember) => getRoleLabel(m.role, m.customRole);

  /* ۱ — Summary */
  sheet("Summary", [
    ["گزارش خانواده", payload.family.name],
    ["تاریخ تولید", new Date().toISOString().slice(0, 10)],
    ["ارز پایه", payload.family.currency],
    ["تعداد اعضا", payload.family.members.length],
    ["تعداد حساب‌ها", payload.accounts.length],
    ["تعداد تراکنش‌ها", payload.transactions.length],
    ["تعداد بودجه‌ها", payload.budgets.length],
    ["تعداد بدهی‌ها", payload.debts.length],
    ["تعداد طلب‌ها", payload.receivables.length],
    ["تعداد طرح‌های قسط", payload.installmentPlans.length],
    ["تعداد برنامه‌های مالی", payload.financialPlans.length],
    ["تعداد اهداف پس‌انداز", payload.savingsGoals.length],
  ]);

  /* ۲ — Transactions */
  sheet("Transactions", [
    ["transactionId", "تاریخ", "نوع", "عنوان", "عضو", "memberId", "حساب", "accountId", "حساب مقصد", "destinationAccountId", "دسته", "زیردسته", "مبلغ", "ارز", "وضعیت", "نوع ارجاع مالی", "برنامه مالی", "توضیح"],
    ...payload.transactions.map((t) => [
      t.id, t.date, TX_TYPE_FA[t.type] ?? t.type, t.title,
      t.memberId ? memberName(t.memberId) : "کل خانواده", t.memberId ?? "",
      accountName(t.accountId), t.accountId,
      t.destinationAccountId ? accountName(t.destinationAccountId) : "", t.destinationAccountId ?? "",
      t.category ?? "", t.subcategory ?? "", t.amount, t.currency,
      t.status === "done" ? "تکمیل‌شده" : "در انتظار",
      t.financialReferenceType ?? "", planName(t.financialPlanId), t.description ?? "",
    ]),
  ]);

  /* ۳ — Accounts */
  sheet("Accounts", [
    ["accountId", "نام", "نوع", "ارز", "موجودی اولیه", "فعال"],
    ...payload.accounts.map((a) => [a.id, a.name, a.type, a.currency, a.initialBalance, a.isActive ? "بله" : "خیر"]),
  ]);

  /* ۴ — Family Members */
  sheet("Family Members", [
    ["memberId", "نام", "نقش", "سن", "جنسیت", "وضعیت شغلی", "وضعیت تحصیل", "وضعیت تأهل", "درآمد مستقل", "بایگانی‌شده"],
    ...payload.family.members.map((m) => [
      m.id, m.name, memberRole(m), m.age ?? "", m.gender, m.employmentStatus, m.educationStatus, m.maritalStatus,
      m.hasIncome ? "بله" : "خیر", m.isArchived ? "بله" : "خیر",
    ]),
  ]);

  /* ۵ — Budgets */
  sheet("Budgets", [
    ["عنوان", "مبلغ", "ارز", "دوره", "سال", "ماه", "عضو", "memberId", "دسته", "آستانه هشدار", "فعال"],
    ...payload.budgets.map((b) => [
      b.title, b.amount, b.currency, b.period === "monthly" ? "ماهانه" : "سالانه", b.year, b.month ?? "",
      b.memberId ? memberName(b.memberId) : "", b.memberId ?? "", b.categoryId ?? "", b.alertThreshold, b.isActive ? "بله" : "خیر",
    ]),
  ]);

  /* ۶ — Debts */
  sheet("Debts", [
    ["عنوان", "طلبکار", "مبلغ اولیه", "پرداخت‌شده", "باقی‌مانده", "ارز", "تاریخ شروع", "سررسید", "وضعیت", "عضو", "memberId"],
    ...payload.debts.map((d) => [
      d.title, d.counterparty, d.originalAmount, d.paidAmount, d.remainingAmount, d.currency,
      d.startDate, d.dueDate ?? "", d.status, d.memberId ? memberName(d.memberId) : "", d.memberId ?? "",
    ]),
  ]);

  /* ۷ — Receivables */
  sheet("Receivables", [
    ["عنوان", "بدهکار", "مبلغ اولیه", "دریافت‌شده", "باقی‌مانده", "ارز", "تاریخ شروع", "سررسید", "وضعیت", "عضو", "memberId"],
    ...payload.receivables.map((r) => [
      r.title, r.counterparty, r.originalAmount, r.receivedAmount, r.remainingAmount, r.currency,
      r.startDate, r.dueDate ?? "", r.status, r.memberId ? memberName(r.memberId) : "", r.memberId ?? "",
    ]),
  ]);

  /* ۸ — Installment Plans */
  sheet("Installment Plans", [
    ["planId", "طرح", "مبلغ کل", "تعداد اقساط", "مبلغ قسط", "ارز", "تاریخ شروع", "تکرار", "عضو", "memberId", "حساب", "accountId"],
    ...payload.installmentPlans.map((p) => [
      p.id, p.title, p.totalAmount, p.installmentCount, p.installmentAmount, p.currency,
      p.startDate, p.frequency, p.memberId ? memberName(p.memberId) : "", p.memberId ?? "",
      accountName(p.accountId), p.accountId ?? "",
    ]),
  ]);

  /* ۹ — Installment Items */
  sheet("Installment Items", [
    ["طرح", "planId", "شماره قسط", "سررسید", "مبلغ", "وضعیت", "تاریخ پرداخت", "transactionId"],
    ...payload.installmentItems.map((i) => [
      installmentPlanName(i.planId), i.planId, i.installmentNumber, i.dueDate, i.amount,
      i.status === "paid" ? "پرداخت‌شده" : i.status === "overdue" ? "عقب‌افتاده" : "در انتظار",
      i.paidDate ?? "", i.transactionId ?? "",
    ]),
  ]);

  /* ۱۰ — Recurring Payments */
  sheet("Recurring Payments", [
    ["عنوان", "مبلغ", "ارز", "تکرار", "تاریخ شروع", "سررسید بعدی", "پایان", "عضو", "memberId", "حساب", "accountId", "فعال"],
    ...payload.recurringPayments.map((r) => [
      r.title, r.amount, r.currency, r.frequency, r.startDate, r.nextDueDate, r.endDate ?? "",
      r.memberId ? memberName(r.memberId) : "", r.memberId ?? "", accountName(r.accountId), r.accountId ?? "",
      r.isActive ? "بله" : "خیر",
    ]),
  ]);

  /* ۱۱ — Financial Plans */
  sheet("Financial Plans", [
    ["planId", "برنامه", "نوع", "بودجه تخمینی", "ارز", "تاریخ شروع", "تاریخ هدف", "وضعیت", "عضو", "memberId"],
    ...payload.financialPlans.map((p) => [
      p.id, p.title, p.type, p.estimatedBudget, p.currency, p.startDate ?? "", p.targetDate ?? "",
      p.status, p.memberId ? memberName(p.memberId) : "", p.memberId ?? "",
    ]),
  ]);

  /* ۱۲ — Financial Plan Items */
  sheet("Financial Plan Items", [
    ["برنامه", "planId", "آیتم", "دسته", "مبلغ تخمینی", "سررسید", "وضعیت", "تراکنش‌های پیوند", "یادداشت"],
    ...payload.financialPlanItems.map((i) => [
      planName(i.planId), i.planId, i.title, i.category ?? "", i.estimatedAmount, i.dueDate ?? "",
      i.status, (i.transactionIds ?? []).join(" | "), i.notes ?? "",
    ]),
  ]);

  /* ۱۳ — Savings Goals */
  sheet("Savings Goals", [
    ["goalId", "هدف", "مبلغ هدف", "ارز", "نوع هدف", "ماه‌های پوشش", "تاریخ هدف", "وضعیت", "عضو", "memberId", "برنامه مالی"],
    ...payload.savingsGoals.map((g) => [
      g.id, g.title, g.targetAmount, g.currency, g.targetMode === "months" ? "چند ماه هزینه" : "مبلغ ثابت",
      g.months ?? "", g.targetDate ?? "", g.status, g.memberId ? memberName(g.memberId) : "", g.memberId ?? "",
      planName(g.financialPlanId),
    ]),
  ]);

  /* ۱۴ — Savings Contributions */
  sheet("Savings Contributions", [
    ["هدف", "goalId", "مبلغ", "ارز", "تاریخ", "حساب", "accountId", "transactionId", "یادداشت"],
    ...payload.savingsContributions.map((c) => [
      goalName(c.goalId), c.goalId, c.amount, c.currency, c.date,
      accountName(c.accountId), c.accountId ?? "", c.transactionId ?? "", c.note ?? "",
    ]),
  ]);

  XLSX.writeFile(wb, payload.fileName);
}

/* ── پشتیبان‌گیری و بازیابی ── */

export interface BackupData {
  family: Family;
  accounts: Account[];
  transactions: Transaction[];
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

export interface BackupFile {
  version: string;
  exportedAt: string;
  app: string;
  data: BackupData;
}

export function exportBackup(data: BackupData) {
  const file: BackupFile = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: APP_NAME,
    data,
  };
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(
    `family-finance-backup-${date}.json`,
    new Blob([JSON.stringify(file, null, 2)], { type: "application/json;charset=utf-8" })
  );
}

export type ParseResult = { ok: true; data: BackupData } | { ok: false; error: string };

const ARRAY_KEYS: (keyof BackupData)[] = [
  "accounts", "transactions", "budgets", "debts", "receivables", "installmentPlans",
  "installmentItems", "recurringPayments", "financialPlans", "financialPlanItems",
  "savingsGoals", "savingsContributions",
];

/** اعتبارسنجی فایل پشتیبان — ساختار و نسخه بررسی می‌شود */
export function parseBackup(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "فایل پشتیبان معتبر نیست (JSON نامعتبر)." };
  }
  const file = parsed as Partial<BackupFile>;
  if (!file || typeof file !== "object" || file.app !== APP_NAME) {
    return { ok: false, error: "فایل پشتیبان معتبر نیست (ساختار ناشناخته)." };
  }
  if (typeof file.version !== "string" || !file.version.startsWith("1.")) {
    return { ok: false, error: `نسخه پشتیبان (${file.version ?? "?"}) پشتیبانی نمی‌شود.` };
  }
  const data = file.data as BackupData | undefined;
  if (!data || typeof data !== "object" || !data.family || typeof data.family.name !== "string" || !Array.isArray(data.family.members)) {
    return { ok: false, error: "فایل پشتیبان معتبر نیست (داده خانواده ناقص است)." };
  }
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(data[key])) {
      return { ok: false, error: `فایل پشتیبان معتبر نیست (بخش ${key} موجود نیست).` };
    }
  }

  /* اعتبارسنجی ساختاری کامل — هر رکورد قبل از جایگزینی داده بررسی می‌شود */
  const issues = checkDataIntegrity(data).filter((i) => i.severity === "error");
  if (issues.length > 0) {
    const first = issues[0];
    const more = issues.length > 1 ? ` (و ${issues.length - 1} مورد دیگر)` : "";
    return {
      ok: false,
      error: `فایل پشتیبان معتبر نیست: ${first.message}${more}`,
    };
  }
  return { ok: true, data };
}
