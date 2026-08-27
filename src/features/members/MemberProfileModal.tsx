import type { ReactNode } from "react";
import { ArrowLeftRight, FileText, Pencil, PiggyBank, Wallet } from "lucide-react";
import Modal from "../../components/ui/Modal";
import Avatar from "../../components/ui/Avatar";
import { useFinance } from "../../hooks/useFinance";
import { usePlanning } from "../../hooks/usePlanning";
import { TYPE_META } from "../../components/finance/TransactionTypeBadge";
import {
  memberLatest, flowTotals,
} from "../../utils/finance";
import {
  calculateBudgetUsage, calculateDebtState, calculateFinancialPlanProgress,
  calculateReceivableState, goalSaved, effectiveGoalTarget, averageMonthlyOperatingExpense,
  getUpcomingFinancialCommitments,
} from "../../utils/planning";
import { formatAge, formatDate, formatJalali, formatMoney, formatSignedMoney } from "../../utils/format";
import { getPlanTypeMeta, PLAN_STATUS_LABELS } from "../../data/planTemplates";
import { getCategoryTitle } from "../../data/needs";
import type { CurrencyCode, FamilyMember, NeedItem } from "../../types";
import {
  EDUCATION_OPTIONS, EMPLOYMENT_OPTIONS, GENDER_OPTIONS, MARITAL_OPTIONS, getOptionLabel, getRoleLabel,
} from "../../data/options";

function FlagRow({ icon, label, value }: { icon: ReactNode; label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-paper/70 px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
        <span className="text-pine-600">{icon}</span>
        {label}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${value ? "bg-success-soft text-success" : "bg-line/60 text-mute"}`}>
        {value ? "بله" : "خیر"}
      </span>
    </div>
  );
}

interface MemberProfileModalProps {
  member: FamilyMember | null;
  onClose: () => void;
  onEdit: (member: FamilyMember) => void;
}

/** پروفایل کامل عضو — خلاصه مالی و برنامه‌ریزی از داده‌های واقعی */
export default function MemberProfileModal({ member, onClose, onEdit }: MemberProfileModalProps) {
  const { transactions, accountById } = useFinance();
  const planning = usePlanning();

  if (!member) return null;

  const groups = member.needs.reduce<Record<string, NeedItem[]>>((acc, n) => {
    (acc[n.category] ??= []).push(n);
    return acc;
  }, {});

  /* خلاصه مالی — Mission 2 */
  const memberTxs = transactions.filter((t) => t.memberId === member.id);
  const flows = flowTotals(memberTxs);
  const byCurrency = memberTxs
    .filter((t) => t.type !== "transfer")
    .reduce<Record<string, { income: number; expense: number }>>((acc, t) => {
      const entry = (acc[t.currency] ??= { income: 0, expense: 0 });
      if (t.type === "income") entry.income += t.amount;
      else entry.expense += t.amount;
      return acc;
    }, {});
  const latestTxs = memberLatest(transactions, member.id, 3);

  /* برنامه‌ریزی — Mission 3 + 4 */
  const memberBudgets = planning.budgets
    .filter((b) => b.memberId === member.id && b.isActive)
    .map((b) => ({ budget: b, usage: calculateBudgetUsage(b, transactions) }));
  const memberDebts = planning.debts.filter((d) => d.memberId === member.id)
    .map((d) => ({ debt: d, state: calculateDebtState(d, transactions) }));
  const memberRecs = planning.receivables.filter((r) => r.memberId === member.id)
    .map((r) => ({ rec: r, state: calculateReceivableState(r, transactions) }));
  const memberPlans = planning.financialPlans.filter((p) => p.memberId === member.id && p.status !== "cancelled")
    .map((p) => ({ plan: p, progress: calculateFinancialPlanProgress(p, planning.financialPlanItems.filter((i) => i.planId === p.id), transactions) }));
  const avgMonthly = averageMonthlyOperatingExpense(transactions, "toman");
  const memberGoals = planning.savingsGoals.filter((g) => g.memberId === member.id && g.status !== "cancelled")
    .map((g) => ({ goal: g, saved: goalSaved(g, planning.savingsContributions), target: effectiveGoalTarget(g, g.currency === "toman" ? avgMonthly : 0) }));
  const upcoming = getUpcomingFinancialCommitments({
    debts: memberDebts.map((d) => d.debt),
    installmentPlans: planning.installmentPlans,
    installmentItems: planning.installmentItems,
    recurringPayments: planning.recurringPayments.filter((r) => r.memberId === member.id),
    financialPlans: memberPlans.map((p) => p.plan),
    planItems: planning.financialPlanItems,
    transactions,
  }).filter((c) => c.memberId === member.id).slice(0, 3);

  return (
    <Modal open onClose={onClose} title="پروفایل عضو" size="lg">
      <div className="flex items-center gap-4">
        <Avatar name={member.name} seed={member.id} size="lg" />
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold text-ink">{member.name}</h3>
          <p className="mt-0.5 text-sm text-mute">
            {getRoleLabel(member.role, member.customRole)} · {formatAge(member.age)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-pine-50 px-2.5 py-1 text-[10px] font-bold text-pine-700">
              {getOptionLabel(EMPLOYMENT_OPTIONS, member.employmentStatus)}
            </span>
            <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-ink-soft">
              {getOptionLabel(EDUCATION_OPTIONS, member.educationStatus)}
            </span>
            <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-ink-soft">
              {getOptionLabel(MARITAL_OPTIONS, member.maritalStatus)}
            </span>
            {member.gender !== "unspecified" && (
              <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-ink-soft">
                {getOptionLabel(GENDER_OPTIONS, member.gender)}
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="mt-5">
        <h4 className="mb-2 text-xs font-extrabold text-pine-700">پروفایل مالی</h4>
        <div className="space-y-2">
          <FlagRow icon={<Wallet size={14} />} label="درآمد مستقل" value={member.hasIncome} />
          <FlagRow icon={<PiggyBank size={14} />} label="بودجه شخصی" value={member.hasPersonalBudget} />
          <FlagRow icon={<FileText size={14} />} label="گزارش جداگانه هزینه‌ها" value={member.trackSeparately} />
        </div>
      </section>

      <section className="mt-5">
        <h4 className="mb-2 text-xs font-extrabold text-pine-700">خلاصه مالی</h4>
        {memberTxs.length === 0 ? (
          <p className="rounded-lg bg-paper/70 px-3 py-3 text-xs text-mute">هنوز تراکنشی برای این عضو ثبت نشده است.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-success-soft px-3 py-2.5">
                <p className="text-[9px] font-extrabold text-success/80">دریافتی</p>
                <p className="mt-1 text-[11px] font-black leading-4 text-success">
                  {Object.keys(byCurrency).length === 0 ? "—" : Object.entries(byCurrency).map(([c, v]) => formatMoney(v.income, c as CurrencyCode)).join(" + ")}
                </p>
              </div>
              <div className="rounded-xl bg-danger-soft px-3 py-2.5">
                <p className="text-[9px] font-extrabold text-danger/80">هزینه ثبت‌شده</p>
                <p className="mt-1 text-[11px] font-black leading-4 text-danger">
                  {Object.keys(byCurrency).length === 0 ? "—" : Object.entries(byCurrency).map(([c, v]) => formatMoney(v.expense, c as CurrencyCode)).join(" + ")}
                </p>
              </div>
              <div className="rounded-xl bg-pine-50 px-3 py-2.5">
                <p className="text-[9px] font-extrabold text-pine-700/80">تراکنش</p>
                <p className="mt-1 text-[11px] font-black leading-4 text-pine-700">{memberTxs.length.toLocaleString("fa-IR")} مورد</p>
              </div>
            </div>
            <div className="divide-y divide-line rounded-xl border border-line">
              {latestTxs.map((t) => {
                const meta = TYPE_META[t.type];
                const Icon = meta.icon;
                return (
                  <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.badge}`}>
                      <Icon size={12} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-extrabold text-ink">{t.title}</p>
                      <p className="flex items-center gap-1 text-[9px] font-bold text-mute">
                        {accountById(t.accountId)?.name ?? "—"}
                        {t.type === "transfer" && t.destinationAccountId && (
                          <span className="inline-flex items-center gap-1">
                            <ArrowLeftRight size={9} />
                            {accountById(t.destinationAccountId)?.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className={`text-[11px] font-black ${meta.amount}`} dir="ltr">{formatSignedMoney(t.amount, t.currency, meta.sign)}</p>
                      <p className="text-[9px] font-bold text-mute" dir="ltr">{formatJalali(t.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {(memberBudgets.length > 0 || memberDebts.length > 0 || memberRecs.length > 0 || memberGoals.length > 0) && (
        <section className="mt-5">
          <h4 className="mb-2 text-xs font-extrabold text-pine-700">بودجه، بدهی، طلب و پس‌انداز</h4>
          <div className="space-y-2">
            {memberBudgets.map(({ budget, usage }) => (
              <div key={budget.id} className="rounded-lg bg-paper/70 px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-ink">بودجه: {budget.title}</span>
                  <span className={usage.status === "exceeded" ? "text-danger" : usage.status === "warning" ? "text-saffron-600" : "text-success"}>
                    {Math.round(usage.percentage).toLocaleString("fa-IR")}٪ مصرف
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/60">
                  <div className={`h-full rounded-full transition-all duration-700 ${usage.status === "exceeded" ? "bg-danger" : usage.status === "warning" ? "bg-saffron-400" : "bg-pine-500"}`} style={{ width: `${Math.min(usage.percentage, 100)}%` }} />
                </div>
              </div>
            ))}
            {memberDebts.map(({ debt, state }) => (
              <div key={debt.id} className="flex items-center justify-between rounded-lg bg-paper/70 px-3 py-2.5 text-[11px] font-bold">
                <span className="text-ink">بدهی: {debt.title}</span>
                <span className="text-danger">باقی‌مانده {formatMoney(state.remaining, debt.currency)}</span>
              </div>
            ))}
            {memberRecs.map(({ rec, state }) => (
              <div key={rec.id} className="flex items-center justify-between rounded-lg bg-paper/70 px-3 py-2.5 text-[11px] font-bold">
                <span className="text-ink">طلب: {rec.title}</span>
                <span className="text-success">باقی‌مانده {formatMoney(state.remaining, rec.currency)}</span>
              </div>
            ))}
            {memberGoals.map(({ goal, saved, target }) => (
              <div key={goal.id} className="rounded-lg bg-paper/70 px-3 py-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-ink">پس‌انداز: {goal.title}</span>
                  <span className="text-pine-700">{formatMoney(saved, goal.currency)} از {formatMoney(target, goal.currency)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line/60">
                  <div className="h-full rounded-full bg-pine-500 transition-all duration-700" style={{ width: `${Math.min(target > 0 ? (saved / target) * 100 : 0, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {memberPlans.length > 0 && (
        <section className="mt-5">
          <h4 className="mb-2 text-xs font-extrabold text-pine-700">برنامه‌های مالی</h4>
          <div className="space-y-2">
            {memberPlans.map(({ plan, progress }) => {
              const meta = getPlanTypeMeta(plan.type);
              return (
                <div key={plan.id} className="flex items-center gap-3 rounded-lg bg-paper/70 px-3 py-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${meta.tint}`}>{meta.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-extrabold text-ink">{plan.title}</p>
                    <p className="text-[9px] font-bold text-mute">
                      {PLAN_STATUS_LABELS[plan.status]} · خرج‌شده {formatMoney(progress.actual, plan.currency)} از {formatMoney(plan.estimatedBudget, plan.currency)}
                      {plan.targetDate && ` · هدف ${formatJalali(plan.targetDate)}`}
                    </p>
                  </div>
                  <span className="font-display text-sm text-pine-700">{Math.round(progress.percentage).toLocaleString("fa-IR")}٪</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="mt-5">
          <h4 className="mb-2 text-xs font-extrabold text-pine-700">تعهدات پیش رو</h4>
          <ul className="space-y-1.5">
            {upcoming.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-lg bg-saffron-50 px-3 py-2 text-[11px] font-bold">
                <span className="truncate text-ink-soft">{c.title}</span>
                <span className="shrink-0 text-saffron-700">{formatMoney(c.amount, c.currency)} · {formatJalali(c.date)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5">
        <h4 className="mb-2 text-xs font-extrabold text-pine-700">نیازها و برنامه‌های مالی</h4>
        {member.needs.length === 0 ? (
          <p className="rounded-lg bg-paper/70 px-3 py-3 text-xs text-mute">نیازی انتخاب نشده است.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groups).map(([categoryId, items]) => (
              <div key={categoryId}>
                <p className="mb-1.5 text-[11px] font-bold text-mute">{getCategoryTitle(categoryId)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((n) => (
                    <span key={n.id} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${n.custom ? "bg-saffron-100 text-saffron-700" : "bg-pine-50 text-pine-700"}`}>
                      {n.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-5 text-[10px] text-mute">آخرین به‌روزرسانی: {formatDate(member.updatedAt)} · جمع‌ها: {flows.count.toLocaleString("fa-IR")} تراکنش عملیاتی</p>

      <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
        <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">بستن</button>
        <button onClick={() => onEdit(member)} className="inline-flex items-center gap-2 rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
          <Pencil size={14} />
          ویرایش عضو
        </button>
      </div>
    </Modal>
  );
}
