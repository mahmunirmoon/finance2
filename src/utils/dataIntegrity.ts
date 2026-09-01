import { CURRENCIES } from "../data/currencies";
import type {
  Account, Budget, CurrencyCode, Debt, Family, FinancialPlan, FinancialPlanItem,
  InstallmentItem, InstallmentPlan, Receivable, RecurringPayment, SavingsContribution,
  SavingsGoal, Transaction,
} from "../types";

/** شکل داده مورد بررسی — با BackupData سازگار است (structural typing) */
export interface IntegrityInput {
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

/* ─────────────────────────────────────────────────────────────
   بررسی سلامت اطلاعات (Repair Mission 2)
   یک تابع خالص که همه ارجاع‌های شکسته، آیدی‌های تکراری، ارزها و
   تاریخ‌های نامعتبر را شناسایی می‌کند. داده را تغییر نمی‌دهد.
   ───────────────────────────────────────────────────────────── */

export type IssueSeverity = "error" | "warning";

export interface DataIntegrityIssue {
  id: string;
  severity: IssueSeverity;
  entity: string;
  entityId?: string;
  message: string;
}

const VALID_CURRENCY = new Set<string>(CURRENCIES.map((c) => c.code as string));
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isCurrency(c: unknown): c is CurrencyCode {
  return typeof c === "string" && VALID_CURRENCY.has(c);
}
function isDate(s: unknown): boolean {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  return !Number.isNaN(new Date(`${s}T12:00:00`).getTime());
}
function isNum(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}
function isNonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/** بررسی جامع سلامت داده — بدون تغییر داده */
export function checkDataIntegrity(data: IntegrityInput): DataIntegrityIssue[] {
  const issues: DataIntegrityIssue[] = [];
  let n = 0;
  const add = (severity: IssueSeverity, entity: string, message: string, entityId?: string) => {
    issues.push({ id: `iss-${++n}`, severity, entity, entityId, message });
  };

  /* ── آیدی‌های تکراری در هر مجموعه ── */
  const checkDup = (label: string, items: { id?: string }[]) => {
    const seen = new Set<string>();
    for (const it of items) {
      if (!isNonEmptyString(it.id)) {
        add("error", label, `یک رکورد ${label} بدون شناسه معتبر وجود دارد.`, it.id);
        continue;
      }
      if (seen.has(it.id)) add("error", label, `شناسه تکراری در ${label}: ${it.id}`, it.id);
      seen.add(it.id);
    }
  };
  checkDup("اعضا", data.family?.members ?? []);
  checkDup("حساب‌ها", data.accounts);
  checkDup("تراکنش‌ها", data.transactions);
  checkDup("بودجه‌ها", data.budgets);
  checkDup("بدهی‌ها", data.debts);
  checkDup("طلب‌ها", data.receivables);
  checkDup("طرح‌های قسط", data.installmentPlans);
  checkDup("اقساط", data.installmentItems);
  checkDup("پرداخت‌های تکرارشونده", data.recurringPayments);
  checkDup("برنامه‌های مالی", data.financialPlans);
  checkDup("آیتم‌های برنامه", data.financialPlanItems);
  checkDup("اهداف پس‌انداز", data.savingsGoals);
  checkDup("مشارکت‌های پس‌انداز", data.savingsContributions);

  /* ── مجموعه آیدی‌های مرجع ── */
  const memberIds = new Set((data.family?.members ?? []).map((m) => m.id).filter(isNonEmptyString));
  const accountIds = new Set(data.accounts.map((a) => a.id).filter(isNonEmptyString));
  const txIds = new Set(data.transactions.map((t) => t.id).filter(isNonEmptyString));
  const planIds = new Set(data.financialPlans.map((p) => p.id).filter(isNonEmptyString));
  const installmentPlanIds = new Set(data.installmentPlans.map((p) => p.id).filter(isNonEmptyString));
  const goalIds = new Set(data.savingsGoals.map((g) => g.id).filter(isNonEmptyString));

  /* ── خانواده ── */
  if (!data.family || !isNonEmptyString(data.family.id))
    add("error", "خانواده", "خانواده شناسه معتبر ندارد.");
  if (!data.family || !isNonEmptyString(data.family.name))
    add("error", "خانواده", "نام خانواده خالی است.");
  if (data.family && !isCurrency(data.family.currency))
    add("error", "خانواده", `ارز پایه نامعتبر است: ${String(data.family.currency)}`);

  /* ── اعضا ── */
  for (const m of data.family?.members ?? []) {
    if (!isNonEmptyString(m.name)) add("error", "عضو", `عضو ${m.id ?? "?"} نام ندارد.`, m.id);
    if (m.age != null && (!isNum(m.age) || m.age < 0 || m.age > 130))
      add("warning", "عضو", `سن عضو «${m.name}» نامعتبر است.`, m.id);
  }

  /* ── حساب‌ها ── */
  for (const a of data.accounts) {
    if (!isNonEmptyString(a.name)) add("error", "حساب", `حساب ${a.id ?? "?"} نام ندارد.`, a.id);
    if (!isCurrency(a.currency)) add("error", "حساب", `حساب «${a.name}» ارز نامعتبر دارد: ${String(a.currency)}`, a.id);
    if (!isNum(a.initialBalance)) add("error", "حساب", `حساب «${a.name}» موجودی اولیه عددی ندارد.`, a.id);
  }

  /* ── تراکنش‌ها ── */
  for (const t of data.transactions) {
    const label = `تراکنش «${t.title || t.id}»`;
    if (!["income", "expense", "transfer"].includes(t.type))
      add("error", "تراکنش", `${label} نوع نامعتبر دارد: ${String(t.type)}`, t.id);
    if (!isNum(t.amount) || t.amount < 0)
      add("error", "تراکنش", `${label} مبلغ نامعتبر یا منفی دارد.`, t.id);
    if (!isDate(t.date)) add("error", "تراکنش", `${label} تاریخ نامعتبر دارد: ${String(t.date)}`, t.id);
    if (!isCurrency(t.currency)) add("error", "تراکنش", `${label} ارز نامعتبر دارد.`, t.id);
    if (!accountIds.has(t.accountId))
      add("error", "تراکنش", `${label} به حسابی ارجاع دارد که وجود ندارد.`, t.id);
    if (t.type === "transfer" && (!t.destinationAccountId || !accountIds.has(t.destinationAccountId)))
      add("error", "تراکنش", `${label} (انتقال) حساب مقصد معتبر ندارد.`, t.id);
    if (t.memberId && !memberIds.has(t.memberId))
      add("error", "تراکنش", `${label} به عضوی ارجاع دارد که وجود ندارد.`, t.id);
  }

  /* ── بودجه‌ها ── */
  for (const b of data.budgets) {
    if (!isNum(b.amount) || b.amount <= 0)
      add("error", "بودجه", `بودجه «${b.title}» مبلغ نامعتبر دارد.`, b.id);
    if (!["monthly", "yearly"].includes(b.period))
      add("error", "بودجه", `بودجه «${b.title}» دوره نامعتبر دارد.`, b.id);
    if (b.memberId && !memberIds.has(b.memberId))
      add("error", "بودجه", `بودجه «${b.title}» به عضو ناموجود ارجاع دارد.`, b.id);
  }

  /* ── بدهی‌ها و طلب‌ها ── */
  for (const d of data.debts) {
    if (!isNum(d.originalAmount) || d.originalAmount < 0)
      add("error", "بدهی", `بدهی «${d.title}» مبلغ اولیه نامعتبر دارد.`, d.id);
    if (!isNum(d.remainingAmount) || d.remainingAmount < 0)
      add("error", "بدهی", `بدهی «${d.title}» مبلغ باقی‌مانده منفی دارد.`, d.id);
    if (d.memberId && !memberIds.has(d.memberId))
      add("error", "بدهی", `بدهی «${d.title}» به عضو ناموجود ارجاع دارد.`, d.id);
  }
  for (const r of data.receivables) {
    if (!isNum(r.originalAmount) || r.originalAmount < 0)
      add("error", "طلب", `طلب «${r.title}» مبلغ اولیه نامعتبر دارد.`, r.id);
    if (!isNum(r.remainingAmount) || r.remainingAmount < 0)
      add("error", "طلب", `طلب «${r.title}» مبلغ باقی‌مانده منفی دارد.`, r.id);
    if (r.memberId && !memberIds.has(r.memberId))
      add("error", "طلب", `طلب «${r.title}» به عضو ناموجود ارجاع دارد.`, r.id);
  }

  /* ── اقساط ── */
  for (const ip of data.installmentPlans) {
    if (ip.memberId && !memberIds.has(ip.memberId))
      add("error", "طرح قسط", `طرح قسط «${ip.title}» به عضو ناموجود ارجاع دارد.`, ip.id);
    if (!isNum(ip.totalAmount) || ip.totalAmount < 0)
      add("error", "طرح قسط", `طرح قسط «${ip.title}» مبلغ کل نامعتبر دارد.`, ip.id);
  }
  for (const ii of data.installmentItems) {
    if (!installmentPlanIds.has(ii.planId))
      add("error", "قسط", `قسط شماره ${ii.installmentNumber} به طرح قسط ناموجود ارجاع دارد.`, ii.id);
    if (ii.transactionId && !txIds.has(ii.transactionId))
      add("error", "قسط", `قسط شماره ${ii.installmentNumber} به تراکنش ناموجود پیوند دارد.`, ii.id);
    if (!isNum(ii.amount) || ii.amount < 0)
      add("error", "قسط", `قسط شماره ${ii.installmentNumber} مبلغ نامعتبر دارد.`, ii.id);
  }

  /* ── پرداخت‌های تکرارشونده ── */
  for (const rp of data.recurringPayments) {
    if (rp.memberId && !memberIds.has(rp.memberId))
      add("error", "پرداخت تکرارشونده", `پرداخت «${rp.title}» به عضو ناموجود ارجاع دارد.`, rp.id);
    if (rp.accountId && !accountIds.has(rp.accountId))
      add("error", "پرداخت تکرارشونده", `پرداخت «${rp.title}» به حساب ناموجود ارجاع دارد.`, rp.id);
    if (!isDate(rp.nextDueDate))
      add("error", "پرداخت تکرارشونده", `پرداخت «${rp.title}» تاریخ سررسید نامعتبر دارد.`, rp.id);
    if (!isNum(rp.amount) || rp.amount < 0)
      add("error", "پرداخت تکرارشونده", `پرداخت «${rp.title}» مبلغ نامعتبر دارد.`, rp.id);
  }

  /* ── برنامه‌های مالی ── */
  for (const p of data.financialPlans) {
    if (p.memberId && !memberIds.has(p.memberId))
      add("error", "برنامه مالی", `برنامه «${p.title}» به عضو ناموجود ارجاع دارد.`, p.id);
    if (!isNum(p.estimatedBudget) || p.estimatedBudget < 0)
      add("error", "برنامه مالی", `برنامه «${p.title}» بودجه تخمینی نامعتبر دارد.`, p.id);
  }
  for (const pi of data.financialPlanItems) {
    if (!planIds.has(pi.planId))
      add("error", "آیتم برنامه", `آیتم «${pi.title}» به برنامه مالی ناموجود ارجاع دارد.`, pi.id);
    for (const tid of pi.transactionIds ?? []) {
      if (!txIds.has(tid))
        add("error", "آیتم برنامه", `آیتم «${pi.title}» به تراکنش ناموجود پیوند دارد.`, pi.id);
    }
  }

  /* ── پس‌انداز ── */
  for (const g of data.savingsGoals) {
    if (g.memberId && !memberIds.has(g.memberId))
      add("error", "هدف پس‌انداز", `هدف «${g.title}» به عضو ناموجود ارجاع دارد.`, g.id);
    if (!isNum(g.targetAmount) || g.targetAmount < 0)
      add("error", "هدف پس‌انداز", `هدف «${g.title}» مبلغ هدف نامعتبر دارد.`, g.id);
  }
  for (const c of data.savingsContributions) {
    if (!goalIds.has(c.goalId))
      add("error", "مشارکت پس‌انداز", `مشارکت ${c.id} به هدف پس‌انداز ناموجود ارجاع دارد.`, c.id);
    if (c.transactionId && !txIds.has(c.transactionId))
      add("error", "مشارکت پس‌انداز", `مشارکت ${c.id} به تراکنش ناموجود پیوند دارد.`, c.id);
    if (!isNum(c.amount) || c.amount < 0)
      add("error", "مشارکت پس‌انداز", `مشارکت ${c.id} مبلغ نامعتبر دارد.`, c.id);
  }

  return issues;
}
