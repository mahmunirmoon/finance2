import type {
  Account, Budget, Debt, Family, FinancialPlan, FinancialPlanItem, InstallmentItem,
  InstallmentPlan, Receivable, RecurringPayment, SavingsContribution, SavingsGoal, Transaction,
} from "../types";

/* ─────────────────────────────────────────────────────────────
   Export & Backup (Mission 5) — CSV / Excel / JSON Backup
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

  sheet("Summary", [
    ["گزارش خانواده", payload.family.name],
    ["تاریخ تولید", new Date().toISOString().slice(0, 10)],
    ["تعداد اعضا", payload.family.members.length],
    ["تعداد حساب‌ها", payload.accounts.length],
    ["تعداد تراکنش‌ها", payload.transactions.length],
  ]);

  const memberName = (id?: string) => payload.family.members.find((m) => m.id === id)?.name ?? "کل خانواده";
  const accountName = (id: string) => payload.accounts.find((a) => a.id === id)?.name ?? "—";

  sheet("Transactions", [
    ["تاریخ", "نوع", "عنوان", "عضو", "حساب", "دسته", "مبلغ", "ارز", "توضیح"],
    ...payload.transactions.map((t) => [
      t.date, TX_TYPE_FA[t.type] ?? t.type, t.title, memberName(t.memberId), accountName(t.accountId),
      t.category ?? "", t.amount, t.currency, t.description ?? "",
    ]),
  ]);

  sheet("Accounts", [
    ["نام", "نوع", "ارز", "موجودی اولیه"],
    ...payload.accounts.map((a) => [a.name, a.type, a.currency, a.initialBalance]),
  ]);

  sheet("Budgets", [
    ["عنوان", "مبلغ", "ارز", "دوره", "سال", "ماه"],
    ...payload.budgets.map((b) => [b.title, b.amount, b.currency, b.period, b.year, b.month ?? ""]),
  ]);

  sheet("Debts", [
    ["عنوان", "طلبکار", "مبلغ اولیه", "باقی‌مانده", "سررسید"],
    ...payload.debts.map((d) => [d.title, d.counterparty, d.originalAmount, d.remainingAmount, d.dueDate ?? ""]),
  ]);

  sheet("Receivables", [
    ["عنوان", "بدهکار", "مبلغ اولیه", "باقی‌مانده", "سررسید"],
    ...payload.receivables.map((r) => [r.title, r.counterparty, r.originalAmount, r.remainingAmount, r.dueDate ?? ""]),
  ]);

  sheet("Installments", [
    ["طرح", "مبلغ کل", "تعداد اقساط", "مبلغ قسط"],
    ...payload.installmentPlans.map((p) => [p.title, p.totalAmount, p.installmentCount, p.installmentAmount]),
  ]);

  sheet("Plans", [
    ["برنامه", "نوع", "بودجه تخمینی", "تاریخ هدف"],
    ...payload.financialPlans.map((p) => [p.title, p.type, p.estimatedBudget, p.targetDate ?? ""]),
  ]);

  sheet("Savings", [
    ["هدف", "مبلغ هدف", "ارز"],
    ...payload.savingsGoals.map((g) => [g.title, g.targetAmount, g.currency]),
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
  return { ok: true, data };
}
