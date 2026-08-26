import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  BarChart3, CalendarRange, Download, FileSpreadsheet, Filter, Printer, Sparkles, Wallet,
} from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import EmptyState from "../components/ui/EmptyState";
import { IncomeExpenseChart, CashFlowChart, CategoryDonut, MemberBarChart, BudgetCompareChart } from "../components/charts";
import { CURRENCIES, getCurrency } from "../data/currencies";
import { allCategoryLabels } from "../data/categories";
import {
  applyReportFilter, getMonthlySeries, getCategoryBreakdown, getMemberBreakdown,
  getBudgetPerformance, getPlanPerformance, getSavingsPerformance, getObligationSummary,
  getAnnualSummary, getAnnualInsights, getMonthlySummary, REPORT_RANGES, type ReportFilter, type ReportRange,
} from "../utils/reports";
import { calculateBudgetUsage, JALALI_MONTHS, currentJalali, budgetPeriodLabel } from "../utils/planning";
import { getPlanTypeMeta, PLAN_STATUS_LABELS } from "../data/planTemplates";
import { exportTransactionsCSV, exportExcelWorkbook } from "../utils/export";
import { faNum, formatJalali, formatMoney, jalaliParts, todayISO } from "../utils/format";
import type { CurrencyCode, TransactionType } from "../types";

type SectionId = "overview" | "flow" | "categories" | "members" | "budgets" | "plans" | "obligations" | "savings" | "annual";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "overview", label: "خلاصه مالی" },
  { id: "flow", label: "درآمد و هزینه" },
  { id: "categories", label: "دسته‌بندی هزینه‌ها" },
  { id: "members", label: "اعضای خانواده" },
  { id: "budgets", label: "بودجه" },
  { id: "plans", label: "برنامه‌های مالی" },
  { id: "obligations", label: "بدهی و طلب" },
  { id: "savings", label: "پس‌انداز" },
  { id: "annual", label: "گزارش سالانه" },
];

const STATUS_CLS: Record<string, string> = {
  safe: "bg-success-soft text-success",
  warning: "bg-saffron-100 text-saffron-700",
  exceeded: "bg-danger-soft text-danger",
};
const STATUS_LABEL: Record<string, string> = { safe: "سالم", warning: "نزدیک سقف", exceeded: "تجاوز" };

export default function ReportsPage() {
  const { family, pushToast } = useFamily();
  const { accounts, transactions, balances } = useFinance();
  const planning = usePlanning();

  const now = currentJalali();
  const [section, setSection] = useState<SectionId>("overview");
  const [filter, setFilter] = useState<ReportFilter>({
    range: "month",
    currency: family?.currency ?? "toman",
    memberId: "all",
    accountId: "all",
    category: "all",
    type: "all",
  });
  const [annualYear, setAnnualYear] = useState(now.jy);
  const [exporting, setExporting] = useState(false);

  const memberName = (id?: string) => (id ? family?.members.find((m) => m.id === id)?.name ?? "" : "کل خانواده");
  const accountName = (id: string) => accounts.find((a) => a.id === id)?.name ?? "—";

  const filtered = useMemo(() => applyReportFilter(transactions, filter), [transactions, filter]);
  const series = useMemo(() => getMonthlySeries(transactions, filter.range === "3m" ? 3 : filter.range === "6m" ? 6 : 6, filter.currency), [transactions, filter.range, filter.currency]);
  const categoryData = useMemo(() => getCategoryBreakdown(filtered, filter.currency), [filtered, filter.currency]);
  const memberData = useMemo(() => getMemberBreakdown(filtered, filter.currency, memberName), [filtered, filter.currency, memberName]);
  const monthly = useMemo(() => getMonthlySummary(filtered, filter.currency, memberName), [filtered, filter.currency, memberName]);
  const budgetPerf = useMemo(
    () => getBudgetPerformance(planning.budgets.filter((b) => b.currency === filter.currency), transactions),
    [planning.budgets, transactions, filter.currency]
  );
  const planPerf = useMemo(() => getPlanPerformance(planning.financialPlans, planning.financialPlanItems, transactions), [planning, transactions]);
  const savingsPerf = useMemo(() => getSavingsPerformance(planning.savingsGoals, planning.savingsContributions, transactions), [planning, transactions]);
  const obligations = useMemo(() => getObligationSummary(planning.debts, planning.receivables, transactions), [planning, transactions]);
  const annual = useMemo(() => getAnnualSummary(transactions, annualYear, filter.currency, memberName), [transactions, annualYear, filter.currency, memberName]);
  const insights = useMemo(() => getAnnualInsights(annual, filter.currency), [annual, filter.currency]);
  const availableYears = useMemo(() => {
    const years = new Set<number>([now.jy]);
    transactions.forEach((t) => {
      const p = jalaliParts(t.date);
      if (p) years.add(p.jy);
    });
    return [...years].sort((a, b) => b - a);
  }, [transactions, now.jy]);

  if (!family) return null;

  const currencyShort = getCurrency(filter.currency).short;
  const selCls = "rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft transition focus:border-pine-500 focus:outline-none";

  const doCSV = () => {
    try {
      const p = jalaliParts(todayISO());
      exportTransactionsCSV(filtered, memberName, accountName, `transactions-${p?.jy ?? ""}-${String(p?.jm ?? "").padStart(2, "0")}.csv`);
      pushToast("فایل CSV با کدگذاری UTF-8 (فارسی) دانلود شد");
    } catch {
      pushToast("خروجی CSV ناموفق بود", "danger");
    }
  };

  const doExcel = async () => {
    setExporting(true);
    try {
      await exportExcelWorkbook({
        family, accounts, transactions,
        budgets: planning.budgets, debts: planning.debts, receivables: planning.receivables,
        installmentPlans: planning.installmentPlans, installmentItems: planning.installmentItems,
        financialPlans: planning.financialPlans, financialPlanItems: planning.financialPlanItems,
        savingsGoals: planning.savingsGoals, savingsContributions: planning.savingsContributions,
        fileName: `family-finance-${annualYear.toLocaleString("fa-IR")}.xlsx`,
      });
      pushToast("فایل Excel با ۹ برگه دانلود شد");
    } catch {
      pushToast("خروجی Excel ناموفق بود", "danger");
    } finally {
      setExporting(false);
    }
  };

  const doPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">گزارش‌ها</h1>
          <p className="mt-1 text-xs text-mute">
            همه محاسبات از تراکنش‌های واقعی است · ارزهای مختلف هرگز با هم جمع نمی‌شوند
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={doCSV} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-extrabold text-ink-soft shadow-card transition hover:border-pine-300 hover:text-pine-700 active:scale-[0.97]">
            <Download size={14} />
            CSV
          </button>
          <button onClick={doExcel} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-extrabold text-ink-soft shadow-card transition hover:border-pine-300 hover:text-pine-700 active:scale-[0.97] disabled:opacity-50">
            <FileSpreadsheet size={14} />
            {exporting ? "در حال ساخت…" : "Excel"}
          </button>
          <button onClick={doPrint} className="inline-flex items-center gap-1.5 rounded-xl bg-pine-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
            <Printer size={14} />
            چاپ / PDF
          </button>
        </div>
      </div>

      {/* فیلترها */}
      <div className="print-hidden space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={15} className="text-mute" />
          <select value={filter.range} onChange={(e) => setFilter((f) => ({ ...f, range: e.target.value as ReportRange }))} className={selCls} aria-label="بازه زمانی">
            {REPORT_RANGES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          {filter.range === "custom" && (
            <>
              <input type="date" value={filter.from ?? ""} onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))} className={selCls} aria-label="از تاریخ" />
              <input type="date" value={filter.to ?? ""} onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))} className={selCls} aria-label="تا تاریخ" />
            </>
          )}
          <select value={filter.currency} onChange={(e) => setFilter((f) => ({ ...f, currency: e.target.value as CurrencyCode }))} className={selCls} aria-label="ارز گزارش">
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value as "all" | TransactionType }))} className={selCls} aria-label="نوع تراکنش">
            <option value="all">همه انواع</option>
            <option value="income">درآمد</option>
            <option value="expense">هزینه</option>
            <option value="transfer">انتقال</option>
          </select>
          <select value={filter.memberId} onChange={(e) => setFilter((f) => ({ ...f, memberId: e.target.value }))} className={selCls} aria-label="عضو">
            <option value="all">همه اعضا</option>
            <option value="household">فقط کل خانواده</option>
            {family.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select value={filter.accountId} onChange={(e) => setFilter((f) => ({ ...f, accountId: e.target.value }))} className={selCls} aria-label="حساب">
            <option value="all">همه حساب‌ها</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))} className={selCls} aria-label="دسته">
            <option value="all">همه دسته‌ها</option>
            {allCategoryLabels().map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <p className="text-[10px] font-bold text-mute">
          {faNum(filtered.length)} تراکنش {currencyShort} در بازه انتخابی · جمع‌ها فقط برای ارز انتخابی محاسبه می‌شوند
        </p>
      </div>

      {/* تب‌های بخش‌ها */}
      <div className="print-hidden flex gap-1.5 overflow-x-auto pb-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-extrabold transition-all ${
              section === s.id ? "bg-pine-600 text-white shadow-card" : "bg-surface text-mute shadow-card hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ── خلاصه مالی ── */}
      {section === "overview" && (
        <div className="animate-fade-up space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "درآمد عملیاتی", value: monthly.income, cls: "text-success" },
              { label: "هزینه عملیاتی", value: monthly.expense, cls: "text-danger" },
              { label: "خالص جریان", value: monthly.net, cls: monthly.net >= 0 ? "text-pine-700" : "text-danger" },
              { label: "حجم انتقال‌ها", value: monthly.transferVolume, cls: "text-ink" },
            ].map((c, i) => (
              <div key={i} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                <p className="text-[10px] font-bold text-mute">{c.label}</p>
                <p className={`font-display mt-1.5 text-lg ${c.cls}`}>{formatMoney(c.value, filter.currency)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[10px] font-bold text-mute">بازپرداخت بدهی/اقساط</p>
              <p className="font-display mt-1.5 text-lg text-ink">{formatMoney(monthly.debtPayments, filter.currency)}</p>
              <p className="text-[9px] font-bold text-mute">جزو هزینه عملیاتی نیست</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[10px] font-bold text-mute">دریافت طلب</p>
              <p className="font-display mt-1.5 text-lg text-ink">{formatMoney(monthly.receivableCollections, filter.currency)}</p>
              <p className="text-[9px] font-bold text-mute">جزو درآمد عملیاتی نیست</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[10px] font-bold text-mute">تعداد حساب‌ها</p>
              <p className="font-display mt-1.5 text-lg text-ink">{faNum(accounts.length)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
              <p className="text-[10px] font-bold text-mute">تراکنش‌های بازه</p>
              <p className="font-display mt-1.5 text-lg text-ink">{faNum(filtered.length)}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h3 className="mb-3 text-sm font-extrabold text-ink">پرخرج‌ترین دسته‌ها</h3>
              {monthly.topCategories.length === 0 ? (
                <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">برای این بازه داده‌ای وجود ندارد.</p>
              ) : (
                <div className="space-y-2.5">
                  {monthly.topCategories.map((c) => (
                    <div key={c.category}>
                      <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-ink">{c.category}</span>
                        <span className="text-mute">{formatMoney(c.amount, filter.currency)} · {faNum(Math.round(c.percent))}٪</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
                        <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${c.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ink"><Wallet size={15} className="text-pine-600" /> موجودی حساب‌ها (همه ارزها جدا)</h3>
              <div className="space-y-2">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2">
                    <span className="text-[11px] font-bold text-ink">{a.name}</span>
                    <span className={`text-[11px] font-black ${(balances[a.id] ?? 0) >= 0 ? "text-ink" : "text-danger"}`}>
                      {formatMoney(balances[a.id] ?? 0, a.currency)}
                    </span>
                  </div>
                ))}
                {accounts.length === 0 && <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">حسابی ثبت نشده است.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── درآمد و هزینه ── */}
      {section === "flow" && (
        <div className="animate-fade-up grid gap-4">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">درآمد در برابر هزینه — ماه به ماه ({currencyShort})</h3>
            <IncomeExpenseChart data={series} currency={filter.currency} />
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">روند خالص جریان نقدی</h3>
            <CashFlowChart data={series} currency={filter.currency} />
          </div>
        </div>
      )}

      {/* ── دسته‌بندی ── */}
      {section === "categories" && (
        <div className="animate-fade-up grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">سهم هر دسته از هزینه‌ها</h3>
            <CategoryDonut data={categoryData.rows.map((r) => ({ name: r.category, value: r.amount }))} currency={filter.currency} />
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">جدول دسته‌ها</h3>
            {categoryData.rows.length === 0 ? (
              <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">برای این بازه داده‌ای وجود ندارد.</p>
            ) : (
              <div className="space-y-2">
                {categoryData.rows.map((r) => (
                  <div key={r.category} className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2.5">
                    <span className="text-xs font-extrabold text-ink">{r.category}</span>
                    <span className="text-[11px] font-black text-danger">{formatMoney(r.amount, filter.currency)} <span className="font-bold text-mute">({faNum(Math.round(r.percent))}٪)</span></span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-pine-50 px-3 py-2.5">
                  <span className="text-xs font-extrabold text-pine-800">جمع</span>
                  <span className="text-[11px] font-black text-pine-800">{formatMoney(categoryData.total, filter.currency)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── اعضا ── */}
      {section === "members" && (
        <div className="animate-fade-up grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">مقایسه هزینه اعضا ({currencyShort})</h3>
            <MemberBarChart data={memberData.members.map((m) => ({ name: m.name, value: m.amount }))} currency={filter.currency} />
            <p className="mt-2 text-[10px] font-bold text-mute">
              هزینه‌های «کل خانواده» ({formatMoney(memberData.household, filter.currency)}) جدا نگه داشته شده و بین اعضا تقسیم نمی‌شود.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">جدول اعضا</h3>
            {memberData.members.length === 0 ? (
              <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">برای این بازه داده‌ای وجود ندارد.</p>
            ) : (
              <div className="space-y-2">
                {memberData.members.map((m) => (
                  <div key={m.memberId} className="flex items-center justify-between rounded-lg bg-paper/60 px-3 py-2.5">
                    <span className="text-xs font-extrabold text-ink">{m.name}</span>
                    <span className="text-[11px] font-black text-danger">{formatMoney(m.amount, filter.currency)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg bg-saffron-50 px-3 py-2.5">
                  <span className="text-xs font-extrabold text-saffron-700">هزینه‌های کل خانواده (مشترک)</span>
                  <span className="text-[11px] font-black text-saffron-700">{formatMoney(memberData.household, filter.currency)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── بودجه ── */}
      {section === "budgets" && (
        <div className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
          <h3 className="mb-4 text-sm font-extrabold text-ink">بودجه در برابر مصرف واقعی</h3>
          <BudgetCompareChart data={budgetPerf.slice(0, 6).map(({ budget, usage }) => ({ label: budget.title, budget: budget.amount, spent: usage.spent }))} currency={filter.currency} />
          <div className="mt-4 space-y-2">
            {budgetPerf.map(({ budget, usage }) => (
              <div key={budget.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-paper/60 px-3 py-2.5">
                <div>
                  <p className="text-xs font-extrabold text-ink">{budget.title}</p>
                  <p className="text-[9px] font-bold text-mute">{budgetPeriodLabel(budget)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-mute">{formatMoney(usage.spent, budget.currency)} از {formatMoney(usage.amount, budget.currency)}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${STATUS_CLS[usage.status]}`}>
                    {faNum(Math.round(usage.percentage))}٪ · {STATUS_LABEL[usage.status]}
                  </span>
                </div>
              </div>
            ))}
            {budgetPerf.length === 0 && <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">بودجه‌ای تعریف نشده است.</p>}
          </div>
        </div>
      )}

      {/* ── برنامه‌ها ── */}
      {section === "plans" && (
        <div className="animate-fade-up space-y-3">
          {planPerf.length === 0 && (
            <EmptyState icon={<BarChart3 size={24} />} title="برنامه مالی‌ای وجود ندارد" description="در بخش «برنامه‌های مالی» برای اتفاق‌های مهم زندگی برنامه بسازید." />
          )}
          {planPerf.map(({ plan, progress }) => {
            const meta = getPlanTypeMeta(plan.type);
            return (
              <div key={plan.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl ${meta.tint}`}>{meta.emoji}</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-ink">{plan.title}</h3>
                      <p className="text-[10px] font-bold text-mute">
                        {meta.label} · {PLAN_STATUS_LABELS[plan.status]}
                        {plan.targetDate && ` · هدف ${formatJalali(plan.targetDate)}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-display text-xl text-pine-700">{faNum(Math.round(progress.percentage))}٪</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                  <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${Math.min(progress.percentage, 100)}%` }} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] font-bold">
                  <span className="text-mute">تخمینی: {formatMoney(plan.estimatedBudget, plan.currency)}</span>
                  <span className="text-danger">واقعی: {formatMoney(progress.actual, plan.currency)}</span>
                  <span className="text-success">باقی: {formatMoney(progress.remaining, plan.currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── بدهی و طلب ── */}
      {section === "obligations" && (
        <div className="animate-fade-up grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">بدهی باقی‌مانده (به تفکیک ارز)</h3>
            {Object.keys(obligations.debtTotals).length === 0 ? (
              <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">بدهی‌ای ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(obligations.debtTotals).map(([c, v]) => (
                  <div key={c} className="flex items-center justify-between rounded-lg bg-danger-soft/60 px-3 py-3">
                    <span className="text-xs font-extrabold text-danger">{getCurrency(c as CurrencyCode).label}</span>
                    <span className="font-display text-lg text-danger">{formatMoney(v, c as CurrencyCode)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h3 className="mb-3 text-sm font-extrabold text-ink">طلب باقی‌مانده (به تفکیک ارز)</h3>
            {Object.keys(obligations.recTotals).length === 0 ? (
              <p className="rounded-xl bg-paper/60 px-4 py-5 text-center text-xs text-mute">طلبی ثبت نشده است.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(obligations.recTotals).map(([c, v]) => (
                  <div key={c} className="flex items-center justify-between rounded-lg bg-success-soft/70 px-3 py-3">
                    <span className="text-xs font-extrabold text-success">{getCurrency(c as CurrencyCode).label}</span>
                    <span className="font-display text-lg text-success">{formatMoney(v, c as CurrencyCode)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── پس‌انداز ── */}
      {section === "savings" && (
        <div className="animate-fade-up space-y-3">
          {savingsPerf.length === 0 && (
            <EmptyState icon={<Wallet size={24} />} title="هدف پس‌اندازی وجود ندارد" description="در بخش «پس‌انداز و اهداف» هدف تعیین کنید." />
          )}
          {savingsPerf.map(({ goal, saved, target, percent }) => (
            <div key={goal.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-ink">
                    {goal.title}
                    {goal.isEmergency && <span className="ms-2 rounded-full bg-saffron-100 px-2 py-0.5 text-[9px] font-extrabold text-saffron-700">صندوق اضطراری</span>}
                  </h3>
                  <p className="text-[10px] font-bold text-mute">
                    {goal.targetMode === "months" ? `هدف: ${faNum(goal.months ?? 0)} ماه هزینه خانواده` : `هدف: ${formatMoney(goal.targetAmount, goal.currency)}`}
                  </p>
                </div>
                <span className="font-display text-xl text-pine-700">{faNum(Math.round(percent))}٪</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                <div className={`animate-grow-bar h-full rounded-full ${percent >= 100 ? "bg-success" : "bg-pine-500"}`} style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
              <p className="mt-2 text-[10px] font-bold text-mute">
                {formatMoney(saved, goal.currency)} پس‌انداز شده از {formatMoney(target, goal.currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── گزارش سالانه ── */}
      {section === "annual" && (
        <div className="animate-fade-up space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-ink">
              <CalendarRange size={16} className="text-pine-600" />
              گزارش سالانه خانواده — {currencyShort}
            </h3>
            <select value={annualYear} onChange={(e) => setAnnualYear(Number(e.target.value))} className={selCls} aria-label="انتخاب سال">
              {availableYears.map((y) => (
                <option key={y} value={y}>{y.toLocaleString("fa-IR")}</option>
              ))}
            </select>
          </div>

          {!annual.hasData ? (
            <EmptyState icon={<CalendarRange size={24} />} title={`برای سال ${annualYear.toLocaleString("fa-IR")} داده‌ای ثبت نشده`} description="سال دیگری انتخاب کنید یا تراکنش ثبت کنید — نمودار جعلی ساخته نمی‌شود." />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "درآمد سال", value: formatMoney(annual.totalIncome, filter.currency), cls: "text-success" },
                  { label: "هزینه سال", value: formatMoney(annual.totalExpense, filter.currency), cls: "text-danger" },
                  { label: "خالص جریان", value: formatMoney(annual.net, filter.currency), cls: annual.net >= 0 ? "text-pine-700" : "text-danger" },
                  { label: "میانگین هزینه ماهانه", value: formatMoney(Math.round(annual.avgMonthlyExpense), filter.currency), cls: "text-ink" },
                ].map((c, i) => (
                  <div key={i} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                    <p className="text-[10px] font-bold text-mute">{c.label}</p>
                    <p className={`font-display mt-1.5 text-lg ${c.cls}`}>{c.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <h3 className="mb-3 text-sm font-extrabold text-ink">جدول ۱۲ ماهه</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-xs">
                    <thead>
                      <tr className="border-b border-line text-[10px] font-extrabold text-mute">
                        <th className="px-3 py-2 text-start">ماه</th>
                        <th className="px-3 py-2 text-end">درآمد</th>
                        <th className="px-3 py-2 text-end">هزینه</th>
                        <th className="px-3 py-2 text-end">خالص</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annual.months.map((m) => (
                        <tr key={m.month} className={`border-b border-line/60 ${m.expense === 0 && m.income === 0 ? "text-mute/50" : ""}`}>
                          <td className="px-3 py-2 font-extrabold text-ink">{m.label}</td>
                          <td className="px-3 py-2 text-end font-bold text-success">{m.income > 0 ? faNum(Math.round(m.income)) : "—"}</td>
                          <td className="px-3 py-2 text-end font-bold text-danger">{m.expense > 0 ? faNum(Math.round(m.expense)) : "—"}</td>
                          <td className={`px-3 py-2 text-end font-black ${m.net >= 0 ? "text-pine-700" : "text-danger"}`}>{m.income === 0 && m.expense === 0 ? "—" : faNum(Math.round(m.net))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-pine-200 bg-pine-50/70 p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-pine-800">
                  <Sparkles size={15} className="text-saffron-500" />
                  بینش‌های سال {annualYear.toLocaleString("fa-IR")} (قانون‌محور، بدون هوش مصنوعی)
                </h3>
                <ul className="space-y-2">
                  {insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs font-bold leading-6 text-pine-800/90">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" />
                      {ins}
                    </li>
                  ))}
                  {annual.highestExpenseMonth && annual.topCategory && (
                    <li className="flex items-start gap-2 text-xs font-bold leading-6 text-pine-800/90">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-saffron-500" />
                      پرخرج‌ترین عضو سال {annual.topMember ? annual.topMember.name : "—"} بوده است.
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ناحیه چاپ — با Portal خارج از پوسته برنامه، فقط هنگام Print دیده می‌شود ── */}
      {createPortal(
      <div className="print-area" dir="rtl">
        <div style={{ fontFamily: "Vazirmatn, sans-serif", color: "#1b2a24" }}>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>گزارش سالانه {family.name} — سال {annualYear.toLocaleString("fa-IR")}</h1>
          <p style={{ fontSize: 11, color: "#74867c", marginTop: 4 }}>
            تولیدشده در {formatJalali(todayISO())} · ارز گزارش: {currencyShort} · همه اعداد از تراکنش‌های واقعی
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 11 }}>
            <thead>
              <tr>
                {["ماه", "درآمد", "هزینه", "خالص"].map((h) => (
                  <th key={h} style={{ border: "1px solid #c7d3c9", padding: "6px 10px", background: "#edf4f1", textAlign: h === "ماه" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {annual.months.map((m) => (
                <tr key={m.month}>
                  <td style={{ border: "1px solid #c7d3c9", padding: "5px 10px" }}>{m.label}</td>
                  <td style={{ border: "1px solid #c7d3c9", padding: "5px 10px" }}>{faNum(Math.round(m.income))}</td>
                  <td style={{ border: "1px solid #c7d3c9", padding: "5px 10px" }}>{faNum(Math.round(m.expense))}</td>
                  <td style={{ border: "1px solid #c7d3c9", padding: "5px 10px" }}>{faNum(Math.round(m.net))}</td>
                </tr>
              ))}
              <tr>
                <td style={{ border: "1px solid #c7d3c9", padding: "6px 10px", fontWeight: 900 }}>جمع سال</td>
                <td style={{ border: "1px solid #c7d3c9", padding: "6px 10px", fontWeight: 900 }}>{faNum(Math.round(annual.totalIncome))}</td>
                <td style={{ border: "1px solid #c7d3c9", padding: "6px 10px", fontWeight: 900 }}>{faNum(Math.round(annual.totalExpense))}</td>
                <td style={{ border: "1px solid #c7d3c9", padding: "6px 10px", fontWeight: 900 }}>{faNum(Math.round(annual.net))}</td>
              </tr>
            </tbody>
          </table>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 18 }}>بینش‌ها</h2>
          <ul style={{ fontSize: 11, lineHeight: 1.9, paddingRight: 18 }}>
            {insights.map((ins, i) => (
              <li key={i}>{ins}</li>
            ))}
          </ul>
          <h2 style={{ fontSize: 14, fontWeight: 900, marginTop: 18 }}>خلاصه بازه انتخابی</h2>
          <p style={{ fontSize: 11, lineHeight: 2 }}>
            درآمد عملیاتی: {formatMoney(monthly.income, filter.currency)} · هزینه عملیاتی: {formatMoney(monthly.expense, filter.currency)} ·
            خالص: {formatMoney(monthly.net, filter.currency)} · انتقال‌ها: {formatMoney(monthly.transferVolume, filter.currency)}
          </p>
        </div>
      </div>,
      document.body
      )}
    </div>
  );
}
