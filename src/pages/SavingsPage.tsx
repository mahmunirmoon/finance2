import { useState } from "react";
import { Filter, LifeBuoy, Pencil, PiggyBank, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import SavingsGoalFormModal from "../components/planning/SavingsGoalFormModal";
import ContributionModal from "../components/planning/ContributionModal";
import {
  averageMonthlyOperatingExpense, effectiveGoalTarget, goalSaved, JALALI_MONTHS, currentJalali,
} from "../utils/planning";
import { faNum, formatJalali, formatMoney } from "../utils/format";
import type { SavingsGoal } from "../types";

export default function SavingsPage() {
  const { family, pushToast } = useFamily();
  const { transactions } = useFinance();
  const { savingsGoals, savingsContributions, financialPlans, deleteSavingsGoal, deleteSavingsContribution, updateSavingsGoal } = usePlanning();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [contributing, setContributing] = useState<SavingsGoal | null>(null);
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name : "کل خانواده");
  const avgMonthly = averageMonthlyOperatingExpense(transactions, family.currency);
  const now = currentJalali();

  const goals = savingsGoals.filter((g) => memberFilter === "all" || g.memberId === memberFilter);
  const emergencyGoal = savingsGoals.find((g) => g.isEmergency && g.status !== "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">پس‌انداز و اهداف</h1>
          <p className="mt-1 text-xs text-mute">
            پس‌انداز هزینه جعلی نیست؛ با مشارکت واقعی (مجازی یا انتقال بین حساب‌ها) پیشرفت می‌کند.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          هدف پس‌انداز جدید
        </button>
      </div>

      {/* صندوق اضطراری */}
      {emergencyGoal && (() => {
        const saved = goalSaved(emergencyGoal, savingsContributions);
        const target = effectiveGoalTarget(emergencyGoal, avgMonthly);
        const pct = target > 0 ? (saved / target) * 100 : 0;
        const coverage = avgMonthly > 0 ? saved / avgMonthly : 0;
        return (
          <section className="animate-fade-up overflow-hidden rounded-2xl bg-pine-800 text-pine-50 shadow-pop">
            <div className="relative p-5 sm:p-6">
              <div className="absolute -end-10 -top-10 h-36 w-36 rounded-full bg-pine-700/70" aria-hidden="true" />
              <div className="relative flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-700 text-saffron-300">
                    <LifeBuoy size={22} />
                  </span>
                  <div>
                    <h2 className="font-display text-xl">صندوق اضطراری خانواده</h2>
                    <p className="mt-0.5 text-[11px] font-bold text-pine-200">
                      میانگین هزینه ماهانه عملیاتی: {formatMoney(Math.round(avgMonthly), family.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-pine-200">ذخیره فعلی</p>
                    <p className="font-display text-xl text-white">{formatMoney(saved, emergencyGoal.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-pine-200">هدف</p>
                    <p className="font-display text-xl text-saffron-300">{formatMoney(target, emergencyGoal.currency)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-pine-200">پوشش</p>
                    <p className="font-display text-xl text-white">{coverage.toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ماه</p>
                  </div>
                </div>
              </div>
              <div className="relative mt-4 h-2.5 overflow-hidden rounded-full bg-pine-700">
                <div className="animate-grow-bar h-full rounded-full bg-saffron-400" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <div className="relative mt-2 flex items-center justify-between">
                <p className="text-[11px] font-bold text-pine-200">{faNum(Math.round(pct))}٪ تکمیل شده</p>
                <div className="flex gap-2">
                  <button onClick={() => setContributing(emergencyGoal)} className="rounded-lg bg-saffron-500 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-saffron-600 active:scale-[0.97]">
                    افزودن پس‌انداز
                  </button>
                  <button onClick={() => { setEditing(emergencyGoal); setFormOpen(true); }} className="rounded-lg bg-pine-700 p-2 text-pine-100 transition hover:bg-pine-600" aria-label="ویرایش صندوق اضطراری">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        );
      })()}

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-mute" />
        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه اعضا</option>
          {family.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1.5 text-[10px] font-extrabold text-success">
          <ShieldCheck size={12} />
          بدون تغییر خودکار موجودی حساب‌ها
        </span>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={<PiggyBank size={24} />}
          title="هنوز هدف پس‌اندازی ندارید"
          description="برای ازدواج، دانشگاه، خودرو، سفر یا روز مبادا هدف تعیین کنید و پیشرفت آن را دنبال کنید."
          action={
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} />
              ساخت اولین هدف پس‌انداز
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((goal, i) => {
            const saved = goalSaved(goal, savingsContributions);
            const target = effectiveGoalTarget(goal, goal.currency === family.currency ? avgMonthly : 0);
            const pct = target > 0 ? (saved / target) * 100 : 0;
            const contribs = savingsContributions
              .filter((c) => c.goalId === goal.id)
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 3);
            const linkedPlan = goal.financialPlanId ? financialPlans.find((p) => p.id === goal.financialPlanId) : undefined;
            return (
              <div key={goal.id} className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-pine-300" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-ink">{goal.title}</h3>
                    <p className="mt-0.5 text-[10px] font-bold text-mute">
                      {memberName(goal.memberId)}
                      {linkedPlan && ` · متصل به «${linkedPlan.title}»`}
                      {goal.targetDate && ` · هدف ${formatJalali(goal.targetDate)}`}
                      {goal.targetMode === "months" && ` · ${faNum(goal.months ?? 0)} ماه هزینه`}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${goal.status === "completed" ? "bg-success-soft text-success" : goal.status === "paused" ? "bg-saffron-100 text-saffron-700" : "bg-pine-50 text-pine-700"}`}>
                    {goal.status === "completed" ? "تکمیل‌شده" : goal.status === "paused" ? "متوقف" : "فعال"}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <p className="font-display text-2xl text-ink">{faNum(Math.round(pct))}٪</p>
                  <p className="text-[11px] font-bold text-mute">
                    {formatMoney(saved, goal.currency)} از {formatMoney(target, goal.currency)}
                  </p>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper">
                  <div className={`animate-grow-bar h-full rounded-full ${pct >= 100 ? "bg-success" : "bg-pine-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <p className="mt-2 text-[11px] font-bold text-success">
                  باقی‌مانده: {formatMoney(Math.max(target - saved, 0), goal.currency)}
                </p>

                {contribs.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                    {contribs.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-[10px] font-bold text-mute">
                        <span className="truncate">{formatJalali(c.date)}{c.note ? ` — ${c.note}` : ""}{c.transactionId ? " (انتقال واقعی)" : ""}</span>
                        <span className="flex shrink-0 items-center gap-1.5 text-ink-soft">
                          {formatMoney(c.amount, c.currency)}
                          <button onClick={() => { deleteSavingsContribution(c.id); pushToast("مشارکت حذف شد", "danger"); }} className="rounded p-1 transition hover:bg-danger-soft hover:text-danger" aria-label="حذف مشارکت">
                            <Trash2 size={11} />
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
                  <select
                    value={goal.status}
                    onChange={(e) => updateSavingsGoal(goal.id, { status: e.target.value as SavingsGoal["status"] })}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-[10px] font-bold text-ink-soft"
                    aria-label="تغییر وضعیت هدف"
                  >
                    <option value="active">فعال</option>
                    <option value="paused">متوقف</option>
                    <option value="completed">تکمیل‌شده</option>
                    <option value="cancelled">لغوشده</option>
                  </select>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setContributing(goal)} className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-3 py-2 text-[11px] font-extrabold text-white transition hover:bg-pine-700 active:scale-[0.97]">
                      <Plus size={12} strokeWidth={3} />
                      افزودن پس‌انداز
                    </button>
                    <button onClick={() => { setEditing(goal); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش هدف">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleting(goal)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف هدف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SavingsGoalFormModal open={formOpen} goal={editing} onClose={() => { setFormOpen(false); setEditing(null); }} />
      <ContributionModal open={contributing !== null} goal={contributing} onClose={() => setContributing(null)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="حذف هدف پس‌انداز"
        message={deleting ? `آیا از حذف «${deleting.title}» و همه مشارکت‌های آن مطمئن هستید؟` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deleting) {
            deleteSavingsGoal(deleting.id);
            pushToast("هدف پس‌انداز حذف شد", "danger");
          }
        }}
      />

      <p className="text-[10px] font-bold text-mute">
        ماه جاری: {JALALI_MONTHS[now.jm - 1]} {faNum(now.jy)} · میانگین هزینه از {faNum(3)} ماه اخیر محاسبه می‌شود.
      </p>
    </div>
  );
}
