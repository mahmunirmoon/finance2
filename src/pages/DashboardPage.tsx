import { lazy, Suspense, useMemo, useState } from "react";
import {
  AlertTriangle, ArrowLeftRight, Bell, CalendarClock, ChevronLeft, Coins, Flag, Landmark,
  PiggyBank, Plus, Scale, Sparkles, Target, TrendingDown, TrendingUp, Users, Wallet, Zap,
} from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import { MemberCard } from "../features/members/MemberCards";
import MemberProfileModal from "../features/members/MemberProfileModal";
import MemberFormModal from "../features/members/MemberFormModal";
import TransactionTypeBadge, { TYPE_META } from "../components/finance/TransactionTypeBadge";
import { getCurrency } from "../data/currencies";
import { getPlanTypeMeta, PLAN_STATUS_LABELS } from "../data/planTemplates";
import { flowTotals, sortTransactionsDesc } from "../utils/finance";
import {
  calculateBudgetUsage, calculateDebtState, calculateFinancialPlanProgress,
  effectiveGoalTarget, averageMonthlyOperatingExpense,
  getUpcomingFinancialCommitments, goalSaved, groupCommitments, sumByCurrency,
} from "../utils/planning";
import { getMonthlySeries, getCategoryBreakdown } from "../utils/reports";
import { faNum, formatDate, formatJalali, formatMoney, formatSignedMoney, todayISO } from "../utils/format";
import type { FamilyMember, PageId } from "../types";

const DashboardCharts = lazy(() => import("../components/charts/DashboardCharts"));

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onNewTransaction: () => void;
  onQuickExpense: () => void;
}

/** داشبورد نهایی — Mission 1 تا 5 (بدون هیچ عدد Hard-coded) */
export default function DashboardPage({ onNavigate, onQuickExpense, onNewTransaction }: DashboardPageProps) {
  const { family } = useFamily();
  const { accounts, transactions, balances, accountById } = useFinance();
  const planning = usePlanning();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<FamilyMember | null>(null);

  const baseCurrency = family?.currency ?? "toman";

  const monthTx = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return transactions.filter((t) => {
      const d = new Date(`${t.date}T12:00:00`);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }, [transactions]);

  const data = useMemo(() => {
    const totals = flowTotals(transactions, baseCurrency);
    const monthTotals = flowTotals(monthTx, baseCurrency);
    const balanceByCurrency = sumByCurrency(accounts.map((a) => ({ amount: balances[a.id] ?? 0, currency: a.currency })));
    const series = getMonthlySeries(transactions, 6, baseCurrency);
    const categories = getCategoryBreakdown(transactions, baseCurrency).rows.slice(0, 6).map((r) => ({ name: r.category, value: r.amount }));
    const budgets = planning.budgets.filter((b) => b.isActive && b.currency === baseCurrency)
      .map((b) => ({ budget: b, usage: calculateBudgetUsage(b, transactions) }))
      .sort((a, b) => b.usage.percentage - a.usage.percentage);
    const commitments = getUpcomingFinancialCommitments({
      debts: planning.debts,
      installmentPlans: planning.installmentPlans,
      installmentItems: planning.installmentItems,
      recurringPayments: planning.recurringPayments,
      financialPlans: planning.financialPlans,
      planItems: planning.financialPlanItems,
      transactions,
    });
    const groups = groupCommitments(commitments);
    const debtRemaining = sumByCurrency(planning.debts.map((d) => ({ amount: calculateDebtState(d, transactions).remaining, currency: d.currency })));
    const activePlans = planning.financialPlans
      .filter((p) => p.status === "active" || p.status === "planning")
      .map((p) => ({ plan: p, progress: calculateFinancialPlanProgress(p, planning.financialPlanItems.filter((i) => i.planId === p.id), transactions) }))
      .slice(0, 4);
    const avgMonthly = averageMonthlyOperatingExpense(transactions, baseCurrency);
    const goals = planning.savingsGoals.filter((g) => g.status !== "cancelled")
      .map((g) => ({ goal: g, saved: goalSaved(g, planning.savingsContributions), target: effectiveGoalTarget(g, g.currency === baseCurrency ? avgMonthly : 0) }))
      .sort((a, b) => (b.target > 0 ? b.saved / b.target : 0) - (a.target > 0 ? a.saved / a.target : 0));
    const emergency = goals.find((g) => g.goal.isEmergency);
    const latest = sortTransactionsDesc(transactions).slice(0, 6);
    return {
      totals, monthTotals, balanceByCurrency, series, categories, budgets, groups,
      overdueCount: groups.overdue.length + groups.today.length,
      debtRemaining, activePlans, goals, emergency, avgMonthly, latest,
    };
  }, [accounts, transactions, balances, monthTx, baseCurrency, planning]);

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name : "کل خانواده");
  const profile = family.members.find((m) => m.id === profileId) ?? null;

  /* هشدارهای مالی */
  const alerts: { icon: React.ReactNode; text: string; tone: string }[] = [];
  for (const { budget, usage } of data.budgets.slice(0, 3)) {
    if (usage.status === "exceeded")
      alerts.push({ icon: <AlertTriangle size={14} />, text: `بودجه «${budget.title}» ${faNum(Math.round(usage.percentage - 100))}٪ بیش از سقف است.`, tone: "bg-danger-soft text-danger border-danger/30" });
    else if (usage.status === "warning")
      alerts.push({ icon: <Bell size={14} />, text: `بودجه «${budget.title}» به ${faNum(Math.round(usage.percentage))}٪ رسیده است.`, tone: "bg-saffron-50 text-saffron-700 border-saffron-300" });
  }
  if (data.groups.overdue.length > 0)
    alerts.push({ icon: <AlertTriangle size={14} />, text: `${faNum(data.groups.overdue.length)} تعهد سررسید گذشته دارید.`, tone: "bg-danger-soft text-danger border-danger/30" });
  if (data.groups.today.length + data.groups.week.length > 0)
    alerts.push({ icon: <CalendarClock size={14} />, text: `${faNum(data.groups.today.length + data.groups.week.length)} پرداخت تا ۷ روز آینده دارید.`, tone: "bg-saffron-50 text-saffron-700 border-saffron-300" });

  const upcomingList = [...data.groups.overdue, ...data.groups.today, ...data.groups.week, ...data.groups.month].slice(0, 5);

  return (
    <div className="space-y-6">
      {/* سربرگ */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-mute">خوش آمدید · خانواده از {formatDate(family.createdAt)} ثبت شده است</p>
          <h1 className="font-display mt-1.5 text-3xl text-ink sm:text-4xl">سلام، {family.name}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onNewTransaction} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
            <Plus size={15} strokeWidth={3} />
            ثبت تراکنش
          </button>
          <button onClick={onQuickExpense} className="inline-flex items-center gap-2 rounded-xl bg-saffron-500 px-4 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-saffron-600 active:scale-[0.97]">
            <Zap size={15} />
            ثبت سریع هزینه
          </button>
        </div>
      </div>

      {/* هشدارها */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={`animate-fade-up flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-extrabold ${a.tone}`} style={{ animationDelay: `${i * 60}ms` }}>
              {a.icon}
              {a.text}
            </div>
          ))}
        </div>
      )}

      {/* ۱ — خلاصه امروز */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="animate-fade-up col-span-2 rounded-2xl bg-pine-800 p-5 text-pine-50 shadow-card lg:col-span-1">
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-pine-200"><Wallet size={13} /> موجودی حساب‌ها</p>
          <div className="mt-2 space-y-1">
            {Object.keys(data.balanceByCurrency).length === 0 && <p className="font-display text-xl">—</p>}
            {Object.entries(data.balanceByCurrency).map(([c, v]) => (
              <p key={c} className={`font-display text-xl leading-7 ${v >= 0 ? "text-white" : "text-[#f2a79b]"}`}>{formatMoney(v, c as never)}</p>
            ))}
          </div>
        </div>
        {[
          { icon: <TrendingUp size={16} />, tint: "bg-success-soft text-success", value: formatMoney(data.monthTotals.income, baseCurrency), label: "درآمد این ماه" },
          { icon: <TrendingDown size={16} />, tint: "bg-danger-soft text-danger", value: formatMoney(data.monthTotals.expense, baseCurrency), label: "هزینه این ماه" },
          { icon: <Scale size={16} />, tint: "bg-pine-50 text-pine-700", value: formatMoney(data.monthTotals.net, baseCurrency), label: "خالص جریان مالی" },
        ].map((card, i) => (
          <div key={i} className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop" style={{ animationDelay: `${(i + 1) * 70}ms` }}>
            <p className={`flex items-center gap-1.5 text-[11px] font-bold text-mute`}>
              <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.tint}`}>{card.icon}</span>
              {card.label}
            </p>
            <p className="font-display mt-2.5 text-xl text-ink sm:text-2xl">{card.value}</p>
          </div>
        ))}
      </div>

      {/* ۲ — بودجه این ماه */}
      {data.budgets.length > 0 && (
        <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink"><Target size={16} className="text-pine-600" /> وضعیت بودجه</h2>
            <button onClick={() => onNavigate("budgets")} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-pine-600 transition hover:gap-2">
              همه بودجه‌ها <ChevronLeft size={13} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.budgets.slice(0, 3).map(({ budget, usage }) => (
              <div key={budget.id}>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="truncate text-ink">{budget.title}</span>
                  <span className={usage.status === "exceeded" ? "text-danger" : usage.status === "warning" ? "text-saffron-600" : "text-pine-700"}>
                    {faNum(Math.round(usage.percentage))}٪
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
                  <div className={`animate-grow-bar h-full rounded-full ${usage.status === "exceeded" ? "bg-danger" : usage.status === "warning" ? "bg-saffron-400" : "bg-pine-500"}`} style={{ width: `${Math.min(usage.percentage, 100)}%` }} />
                </div>
                <p className="mt-1 text-[10px] font-bold text-mute">
                  {formatMoney(usage.spent, budget.currency)} از {formatMoney(usage.amount, budget.currency)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ۳ — نمودار مالی (lazy) */}
      <Suspense fallback={
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
          <div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
        </div>
      }>
        <DashboardCharts series={data.series} categories={data.categories} currency={baseCurrency} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ۴ — تعهدات آینده */}
        <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink"><CalendarClock size={16} className="text-saffron-600" /> پرداخت‌های نزدیک</h2>
            {data.overdueCount > 0 && (
              <span className="rounded-full bg-danger-soft px-2.5 py-1 text-[10px] font-extrabold text-danger">{faNum(data.overdueCount)} فوری</span>
            )}
          </div>
          {upcomingList.length === 0 ? (
            <p className="rounded-xl bg-paper/60 px-4 py-6 text-center text-xs text-mute">تعهدی در ۳۰ روز آینده نیست.</p>
          ) : (
            <div className="space-y-2">
              {upcomingList.map((c) => {
                const overdue = c.date < todayISO();
                const isToday = c.date === todayISO();
                return (
                  <div key={c.id} className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 transition ${overdue ? "border-danger/30 bg-danger-soft/50" : isToday ? "border-saffron-300 bg-saffron-50" : "border-line bg-surface"}`}>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-ink">{c.title}</p>
                      <p className="text-[9px] font-bold text-mute">{c.sourceLabel} · {memberName(c.memberId)}</p>
                    </div>
                    <div className="text-end">
                      <p className={`text-[11px] font-black ${overdue ? "text-danger" : "text-ink"}`}>{formatMoney(c.amount, c.currency)}</p>
                      <p className="text-[9px] font-bold text-mute" dir="ltr">{formatJalali(c.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4">
            <div className="rounded-xl bg-danger-soft/60 px-3 py-2.5">
              <p className="text-[9px] font-extrabold text-danger/80">مجموع بدهی باقی‌مانده</p>
              <p className="mt-0.5 text-[11px] font-black leading-4 text-danger">
                {Object.keys(data.debtRemaining).length === 0 ? "ندارید" : Object.entries(data.debtRemaining).map(([c, v]) => formatMoney(v, c as never)).join(" + ")}
              </p>
            </div>
            <button onClick={() => onNavigate("debts")} className="rounded-xl border border-line bg-surface px-3 py-2.5 text-start transition hover:border-pine-300">
              <p className="flex items-center gap-1 text-[11px] font-extrabold text-pine-700"><Scale size={12} /> مدیریت بدهی و طلب</p>
            </button>
          </div>
        </section>

        {/* ۵ — برنامه‌های آینده */}
        <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink"><Flag size={16} className="text-pine-600" /> برنامه‌های آینده خانواده</h2>
            <button onClick={() => onNavigate("plans")} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-pine-600 transition hover:gap-2">
              همه برنامه‌ها <ChevronLeft size={13} />
            </button>
          </div>
          {data.activePlans.length === 0 ? (
            <p className="rounded-xl bg-paper/60 px-4 py-6 text-center text-xs text-mute">
              هنوز برنامه مالی فعالی ندارید — برای ازدواج، دانشگاه یا خرید خودرو برنامه بسازید.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {data.activePlans.map(({ plan, progress }) => {
                const meta = getPlanTypeMeta(plan.type);
                return (
                  <button key={plan.id} onClick={() => onNavigate("plans")} className="group rounded-xl border border-line bg-surface p-3.5 text-start transition hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-card">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${meta.tint}`}>{meta.emoji}</span>
                    <p className="mt-2 truncate text-[11px] font-extrabold text-ink group-hover:text-pine-700">{plan.title}</p>
                    <p className="text-[9px] font-bold text-mute">{memberName(plan.memberId)} · {PLAN_STATUS_LABELS[plan.status]}</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                      <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${Math.min(progress.percentage, 100)}%` }} />
                    </div>
                    <p className="mt-1 text-[9px] font-bold text-mute">{faNum(Math.round(progress.percentage))}٪ از {formatMoney(plan.estimatedBudget, plan.currency)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* ۶ — پس‌انداز */}
      {data.goals.length > 0 && (
        <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink"><PiggyBank size={16} className="text-saffron-600" /> اهداف پس‌انداز</h2>
            <button onClick={() => onNavigate("savings")} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-pine-600 transition hover:gap-2">
              همه اهداف <ChevronLeft size={13} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.emergency && (
              <div className="rounded-xl bg-pine-800 p-4 text-pine-50">
                <p className="flex items-center gap-1.5 text-[10px] font-bold text-pine-200"><Sparkles size={12} className="text-saffron-300" /> صندوق اضطراری</p>
                <p className="font-display mt-1.5 text-lg text-white">{formatMoney(data.emergency.saved, data.emergency.goal.currency)}</p>
                <p className="text-[10px] font-bold text-pine-200">
                  {data.avgMonthly > 0
                    ? `پوشش ${(data.emergency.saved / data.avgMonthly).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ماه هزینه`
                    : "هدف چند ماه هزینه"}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pine-700">
                  <div className="animate-grow-bar h-full rounded-full bg-saffron-400" style={{ width: `${Math.min(data.emergency.target > 0 ? (data.emergency.saved / data.emergency.target) * 100 : 0, 100)}%` }} />
                </div>
              </div>
            )}
            {data.goals.filter((g) => !g.goal.isEmergency).slice(0, data.emergency ? 2 : 3).map(({ goal, saved, target }) => {
              const pct = target > 0 ? (saved / target) * 100 : 0;
              return (
                <div key={goal.id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
                  <p className="truncate text-[11px] font-extrabold text-ink">{goal.title}</p>
                  <p className="font-display mt-1.5 text-lg text-pine-700">{faNum(Math.round(pct))}٪</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-mute">{formatMoney(saved, goal.currency)} از {formatMoney(target, goal.currency)}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ۷ — آخرین تراکنش‌ها */}
      <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink"><ArrowLeftRight size={16} className="text-pine-600" /> آخرین تراکنش‌ها</h2>
          <button onClick={() => onNavigate("transactions")} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-pine-600 transition hover:gap-2">
            همه تراکنش‌ها <ChevronLeft size={13} />
          </button>
        </div>
        {data.latest.length === 0 ? (
          <p className="rounded-xl bg-paper/60 px-4 py-6 text-center text-xs text-mute">
            هنوز تراکنشی ثبت نشده — با «ثبت سریع هزینه» شروع کنید.
          </p>
        ) : (
          <div className="divide-y divide-line/70">
            {data.latest.map((t) => {
              const meta = TYPE_META[t.type];
              const Icon = meta.icon;
              return (
                <div key={t.id} className="flex items-center gap-3 py-2.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.badge}`}><Icon size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-extrabold text-ink">{t.title}</p>
                    <p className="text-[10px] font-bold text-mute">
                      {memberName(t.memberId)} · {accountById(t.accountId)?.name ?? "—"} · {t.category ?? ""}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className={`text-xs font-black ${meta.amount}`} dir="ltr">{formatSignedMoney(t.amount, t.currency, meta.sign)}</p>
                    <p className="text-[9px] font-bold text-mute" dir="ltr">{formatJalali(t.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ۸ — اعضای خانواده (Mission 1) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink"><Users size={16} className="text-pine-600" /> اعضای خانواده</h2>
          <button onClick={() => onNavigate("members")} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-pine-600 transition hover:gap-2">
            مدیریت اعضا <ChevronLeft size={13} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {family.members.map((m, i) => (
            <MemberCard key={m.id} member={m} index={i} onOpen={() => setProfileId(m.id)} />
          ))}
          {family.members.length === 0 && (
            <p className="rounded-xl border border-dashed border-line-strong bg-surface/60 px-4 py-8 text-center text-xs text-mute sm:col-span-2 xl:col-span-3">
              هنوز عضوی اضافه نشده است.
            </p>
          )}
        </div>
      </section>

      <MemberProfileModal
        member={profile}
        onClose={() => setProfileId(null)}
        onEdit={(m) => {
          setProfileId(null);
          setEditMember(m);
        }}
      />
      <MemberFormModal open={editMember !== null} member={editMember} onClose={() => setEditMember(null)} />

      <p className="flex items-center gap-1.5 pb-2 text-[10px] font-bold text-mute">
        <Landmark size={11} />
        همه اعداد از تراکنش‌های واقعی محاسبه می‌شوند — {faNum(data.totals.count)} تراکنش عملیاتی {getCurrency(baseCurrency).short}
        <Coins size={11} />
      </p>
    </div>
  );
}
