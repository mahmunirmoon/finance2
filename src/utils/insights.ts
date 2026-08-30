import type {
  Budget, Debt, Family, FinancialPlan, FinancialPlanItem, InstallmentItem, InstallmentPlan,
  Receivable, RecurringPayment, SavingsContribution, SavingsGoal, Transaction,
} from "../types";
import {
  averageMonthlyOperatingExpense, calculateBudgetUsage, calculateDebtState,
  calculateFinancialPlanProgress, calculateReceivableState, currentJalali, effectiveGoalTarget,
  getUpcomingFinancialCommitments, goalSaved, groupCommitments, isOperatingExpense,
} from "./planning";
import { faNum, formatJalali, formatMoney, jalaliParts, todayISO } from "./format";

/* ─────────────────────────────────────────────────────────────
   موتور هوش کمکی — کاملاً محلی و Rule-Based (بدون هیچ API).
   همه محاسبات از داده‌ها و utilityهای موجود (planning.ts) خوانده می‌شوند؛
   هیچ منطق مالی موازی ساخته نمی‌شود و ارزهای مختلف هرگز با هم جمع نمی‌شوند.
   ───────────────────────────────────────────────────────────── */

export type InsightPriority = "critical" | "warning" | "opportunity" | "info";

export type InsightType =
  | "spending-trend"
  | "budget-warning"
  | "upcoming-payments"
  | "debt-alert"
  | "installment-alert"
  | "savings-goal"
  | "emergency-fund"
  | "top-expense"
  | "member-spending"
  | "plan-progress";

export interface FinancialInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  message: string;
  createdAt: string;
  /** برای مرتب‌سازی بر اساس نزدیک‌ترین سررسید */
  dueDate?: string;
}

export interface InsightData {
  family: Family;
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

const PRIORITY_RANK: Record<InsightPriority, number> = {
  critical: 0,
  warning: 1,
  opportunity: 2,
  info: 3,
};

function daysUntil(iso: string): number {
  const a = new Date(`${todayISO()}T12:00:00`).getTime();
  const b = new Date(`${iso}T12:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

function monthsUntil(iso: string): number {
  const t = jalaliParts(todayISO());
  const d = jalaliParts(iso);
  if (!t || !d) return 0;
  return Math.max((d.jy - t.jy) * 12 + (d.jm - t.jm), 0);
}

function prevMonthOf(cur: { jy: number; jm: number }) {
  return cur.jm === 1 ? { jy: cur.jy - 1, jm: 12 } : { jy: cur.jy, jm: cur.jm - 1 };
}

function faPct(n: number): string {
  return `${faNum(Math.round(n))}٪`;
}

/** تولید همه Insightها از داده‌های واقعی برنامه */
export function generateInsights(data: InsightData): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const now = new Date().toISOString();
  const today = todayISO();
  const base = data.family.currency;
  const cur = currentJalali();
  const prev = prevMonthOf(cur);
  const todayParts = jalaliParts(today);

  const push = (i: Omit<FinancialInsight, "createdAt">) =>
    insights.push({ ...i, createdAt: now });

  /* ۱ — بودجه‌ها (فقط ارز پایه؛ هر بودجه جدا) */
  for (const b of data.budgets) {
    if (!b.isActive || b.currency !== base) continue;
    const usage = calculateBudgetUsage(b, data.transactions);
    const pct = Math.round(usage.percentage);
    if (usage.percentage > 100) {
      push({
        id: `budget-${b.id}`,
        type: "budget-warning",
        priority: "critical",
        title: "عبور از سقف بودجه",
        message: `بودجه «${b.title}» ${faPct(pct - 100)} از سقف تعیین‌شده بیشتر شده است.`,
      });
    } else if (usage.percentage >= b.alertThreshold) {
      push({
        id: `budget-${b.id}`,
        type: "budget-warning",
        priority: "warning",
        title: "نزدیک به سقف بودجه",
        message: `بودجه «${b.title}» به ${faPct(pct)} رسیده است.`,
      });
    }
  }

  /* ۲ — تعهدات نزدیک (بدهی، قسط، تکرارشونده، آیتم برنامه) */
  const commitments = getUpcomingFinancialCommitments({
    debts: data.debts,
    installmentPlans: data.installmentPlans,
    installmentItems: data.installmentItems,
    recurringPayments: data.recurringPayments,
    financialPlans: data.financialPlans,
    planItems: data.financialPlanItems,
    transactions: data.transactions,
  });
  const groups = groupCommitments(commitments, today);
  if (groups.overdue.length > 0) {
    push({
      id: "commit-overdue",
      type: "upcoming-payments",
      priority: "critical",
      title: "پرداخت سررسید گذشته",
      message: `${faNum(groups.overdue.length)} پرداخت سررسید گذشته دارید؛ هرچه زودتر تعیین تکلیف کنید.`,
      dueDate: groups.overdue[0].date,
    });
  }
  const dueSoon = groups.today.length + groups.week.length;
  if (dueSoon > 0) {
    const first = groups.today[0] ?? groups.week[0];
    push({
      id: "commit-week",
      type: "upcoming-payments",
      priority: "warning",
      title: "پرداخت‌های نزدیک",
      message: `در ۷ روز آینده ${faNum(dueSoon)} پرداخت دارید.`,
      dueDate: first?.date,
    });
  }

  /* ۳ — بدهی‌های معوق */
  for (const d of data.debts) {
    const s = calculateDebtState(d, data.transactions);
    if (s.status === "overdue" && s.remaining > 0) {
      push({
        id: `debt-${d.id}`,
        type: "debt-alert",
        priority: "critical",
        title: "بدهی سررسید گذشته",
        message: `بدهی «${d.title}» به ${d.counterparty} از سررسید گذشته است؛ ${formatMoney(s.remaining, d.currency)} باقی مانده.`,
        dueDate: d.dueDate,
      });
    }
  }

  /* ۳ب — طلب‌های معوق */
  for (const r of data.receivables) {
    const s = calculateReceivableState(r, data.transactions);
    if (s.status === "overdue" && s.remaining > 0) {
      push({
        id: `rec-${r.id}`,
        type: "debt-alert",
        priority: "warning",
        title: "طلب معوق",
        message: `طلب «${r.title}» از ${r.counterparty} از سررسید گذشته؛ پیگیری دریافت ${formatMoney(s.remaining, r.currency)} توصیه می‌شود.`,
        dueDate: r.dueDate,
      });
    }
  }

  /* ۴ — اقساط نزدیک */
  const planById = new Map(data.installmentPlans.map((p) => [p.id, p]));
  const unpaidItems = data.installmentItems
    .filter((i) => i.status !== "paid" && planById.get(i.planId)?.isActive)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  for (const item of unpaidItems.slice(0, 2)) {
    const plan = planById.get(item.planId);
    if (!plan) continue;
    const days = daysUntil(item.dueDate);
    if (days >= 0 && days <= 7) {
      push({
        id: `inst-${item.id}`,
        type: "installment-alert",
        priority: "warning",
        title: "قسط نزدیک",
        message: `قسط ${faNum(item.installmentNumber)} «${plan.title}» ${days === 0 ? "امروز" : `${faNum(days)} روز دیگر`} سررسید می‌شود (${formatMoney(item.amount, plan.currency)}).`,
        dueDate: item.dueDate,
      });
    }
  }

  /* ۵ — صندوق اضطراری (فقط ارز پایه — میانگین هزینه فقط با ارز پایه مقایسه می‌شود) */
  const avgMonthly = averageMonthlyOperatingExpense(data.transactions, base, 3);
  const emergency = data.savingsGoals.find((g) => g.isEmergency && g.status !== "cancelled");
  if (emergency && emergency.currency === base && avgMonthly > 0) {
    const saved = goalSaved(emergency, data.savingsContributions);
    const target = effectiveGoalTarget(emergency, avgMonthly);
    const coverage = saved / avgMonthly;
    const covTxt = coverage.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
    if (coverage < 3) {
      push({
        id: `emg-${emergency.id}`,
        type: "emergency-fund",
        priority: "warning",
        title: "صندوق اضطراری کم",
        message: `صندوق اضطراری فعلی حدود ${covTxt} ماه از هزینه‌های خانواده را پوشش می‌دهد؛ کمتر از ۳ ماه توصیه می‌شود تقویت شود.`,
      });
    } else {
      push({
        id: `emg-${emergency.id}`,
        type: "emergency-fund",
        priority: "info",
        title: "پوشش صندوق اضطراری",
        message: `صندوق اضطراری حدود ${covTxt} ماه از هزینه‌های خانواده را پوشش می‌دهد.`,
      });
    }
    if (target > saved && target > 0) {
      push({
        id: `emg-gap-${emergency.id}`,
        type: "emergency-fund",
        priority: "opportunity",
        title: "تکمیل صندوق اضطراری",
        message: `برای رسیدن به سقف صندوق اضطراری هنوز ${formatMoney(target - saved, base)} باقی مانده است.`,
      });
    }
  }

  /* ۶ — اهداف پس‌انداز (فقط ارز پایه) */
  for (const g of data.savingsGoals) {
    if (g.status !== "active" || g.isEmergency || g.currency !== base) continue;
    const target = effectiveGoalTarget(g, avgMonthly);
    if (target <= 0) continue;
    const saved = goalSaved(g, data.savingsContributions);
    const remaining = Math.max(target - saved, 0);
    const pct = (saved / target) * 100;

    if (remaining > 0) {
      push({
        id: `goal-${g.id}`,
        type: "savings-goal",
        priority: "opportunity",
        title: "ادامه پس‌انداز",
        message: `برای رسیدن به هدف «${g.title}» هنوز ${formatMoney(remaining, base)} باقی مانده است (${faPct(pct)} تکمیل).`,
        dueDate: g.targetDate,
      });
      if (g.targetDate) {
        const mLeft = monthsUntil(g.targetDate);
        if (mLeft > 0) {
          const required = Math.ceil(remaining / mLeft);
          if (pct < 30 && mLeft <= 6) {
            push({
              id: `goal-pace-${g.id}`,
              type: "savings-goal",
              priority: "warning",
              title: "سرعت پس‌انداز کافی نیست",
              message: `برای رسیدن به هدف «${g.title}» تا ${formatJalali(g.targetDate)}، ماهانه حدود ${formatMoney(required, base)} پس‌انداز لازم است.`,
              dueDate: g.targetDate,
            });
          } else {
            push({
              id: `goal-plan-${g.id}`,
              type: "savings-goal",
              priority: "opportunity",
              title: "پیشنهاد پس‌انداز ماهانه",
              message: `با پس‌انداز ماهانه حدود ${formatMoney(required, base)}، هدف «${g.title}» سر موعد تکمیل می‌شود.`,
              dueDate: g.targetDate,
            });
          }
        }
      }
    } else {
      push({
        id: `goal-done-${g.id}`,
        type: "savings-goal",
        priority: "info",
        title: "هدف تکمیل شد",
        message: `هدف پس‌انداز «${g.title}» به‌طور کامل تأمین شده است.`,
      });
    }
  }

  /* ۷ — روند هزینه: مقایسه هم‌تراز (از ابتدای ماه تا امروزِ هر دو ماه) */
  const catThis: Record<string, number> = {};
  const catPrevAligned: Record<string, number> = {};
  const memberThis: Record<string, number> = {};
  for (const t of data.transactions) {
    if (!isOperatingExpense(t) || t.currency !== base) continue;
    const p = jalaliParts(t.date);
    if (!p) continue;
    if (p.jy === cur.jy && p.jm === cur.jm) {
      if (t.category) catThis[t.category] = (catThis[t.category] ?? 0) + t.amount;
      if (t.memberId) memberThis[t.memberId] = (memberThis[t.memberId] ?? 0) + t.amount;
    } else if (
      todayParts &&
      p.jy === prev.jy &&
      p.jm === prev.jm &&
      p.jd <= todayParts.jd &&
      t.category
    ) {
      catPrevAligned[t.category] = (catPrevAligned[t.category] ?? 0) + t.amount;
    }
  }
  const thisMonthTotal = Object.values(catThis).reduce((s, v) => s + v, 0);
  const prevAlignedTotal = Object.values(catPrevAligned).reduce((s, v) => s + v, 0);

  if (prevAlignedTotal > 0 && thisMonthTotal >= prevAlignedTotal * 1.15) {
    const inc = (thisMonthTotal / prevAlignedTotal - 1) * 100;
    push({
      id: "trend-total",
      type: "spending-trend",
      priority: "warning",
      title: "افزایش هزینه",
      message: `هزینه این ماه نسبت به مدت مشابه ماه قبل ${faPct(inc)} افزایش قابل توجهی داشته است.`,
    });
  }

  /* روند هر دسته — فقط افزایش‌های معنادار */
  for (const [cat, val] of Object.entries(catThis)) {
    const prevVal = catPrevAligned[cat] ?? 0;
    if (prevVal <= 0 || val < prevVal * 1.15) continue;
    if (thisMonthTotal > 0 && val < thisMonthTotal * 0.1) continue;
    const inc = (val / prevVal - 1) * 100;
    push({
      id: `trend-${cat}`,
      type: "spending-trend",
      priority: inc >= 25 ? "warning" : "info",
      title: `افزایش هزینه ${cat}`,
      message: `هزینه «${cat}» این ماه ${faPct(inc)} نسبت به ماه قبل افزایش داشته است.`,
    });
  }

  /* ۸ — پرهزینه‌ترین دسته این ماه */
  const topCat = Object.entries(catThis).sort((a, b) => b[1] - a[1])[0];
  if (topCat && topCat[1] > 0) {
    push({
      id: "top-category",
      type: "top-expense",
      priority: "info",
      title: "بیشترین هزینه ماه",
      message: `بیشترین هزینه این ماه مربوط به «${topCat[0]}» بوده است (${formatMoney(topCat[1], base)}).`,
    });
  }

  /* ۹ — پرهزینه‌ترین عضو این ماه (هزینه‌های کل خانواده هرگز به اعضا نسبت داده نمی‌شوند) */
  const topMember = Object.entries(memberThis).sort((a, b) => b[1] - a[1])[0];
  if (topMember && topMember[1] > 0) {
    const name = data.family.members.find((m) => m.id === topMember[0])?.name;
    if (name) {
      push({
        id: "top-member",
        type: "member-spending",
        priority: "info",
        title: "پرهزینه‌ترین عضو",
        message: `بیشترین هزینه فردی این ماه مربوط به ${name} بوده است (${formatMoney(topMember[1], base)}).`,
      });
    }
  }

  /* ۱۰ — پیشرفت برنامه‌های مالی (فقط ارز پایه) */
  for (const p of data.financialPlans) {
    if (p.currency !== base || p.estimatedBudget <= 0) continue;
    if (p.status !== "active" && p.status !== "planning") continue;
    const prog = calculateFinancialPlanProgress(
      p,
      data.financialPlanItems.filter((i) => i.planId === p.id),
      data.transactions
    );
    const pct = Math.round(prog.percentage);
    if (pct > 100) {
      push({
        id: `plan-over-${p.id}`,
        type: "plan-progress",
        priority: "warning",
        title: "فراتر از بودجه برنامه",
        message: `برنامه «${p.title}» ${faPct(pct - 100)} بیش از بودجه تخمینی مصرف کرده است.`,
        dueDate: p.targetDate,
      });
    } else if (pct >= 1) {
      push({
        id: `plan-${p.id}`,
        type: "plan-progress",
        priority: "info",
        title: "پیشرفت برنامه مالی",
        message: `برنامه مالی «${p.title}» ${faPct(pct)} از بودجه تخمینی خود را مصرف کرده است.`,
        dueDate: p.targetDate,
      });
    }
  }

  /* مرتب‌سازی: اولویت، سپس نزدیک‌ترین سررسید */
  return insights.sort(
    (a, b) =>
      PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
      (a.dueDate ?? "9999-12-31").localeCompare(b.dueDate ?? "9999-12-31")
  );
}

/** آیا داده کافی برای تحلیل وجود دارد؟ */
export function hasEnoughData(data: InsightData): boolean {
  return (
    data.transactions.length > 0 ||
    data.budgets.length > 0 ||
    data.savingsGoals.length > 0 ||
    data.financialPlans.length > 0 ||
    data.debts.length > 0
  );
}
