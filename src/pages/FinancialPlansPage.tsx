import { useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarClock, Coins, Filter, Flag, Pencil, Plus, Trash2,
} from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import PlanFormModal from "../components/planning/PlanFormModal";
import PlanItemFormModal from "../components/planning/PlanItemFormModal";
import PaymentModal from "../components/planning/PaymentModal";
import { getPlanTypeMeta, PLAN_STATUS_LABELS, PLAN_ITEM_STATUS_LABELS } from "../data/planTemplates";
import { calculateFinancialPlanProgress, planItemActual } from "../utils/planning";
import { faNum, formatJalali, formatMoney } from "../utils/format";
import type { CurrencyCode, FinancialPlan, FinancialPlanItem } from "../types";

const PLAN_STATUS_CLS: Record<string, string> = {
  planning: "bg-paper text-ink-soft",
  active: "bg-success-soft text-success",
  paused: "bg-saffron-100 text-saffron-700",
  completed: "bg-pine-50 text-pine-700",
  cancelled: "bg-line/60 text-mute",
};

export default function FinancialPlansPage() {
  const { family, pushToast } = useFamily();
  const { transactions } = useFinance();
  const {
    financialPlans, financialPlanItems, deleteFinancialPlan,
    deletePlanItem, recordPlanExpense,
  } = usePlanning();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [planFormOpen, setPlanFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FinancialPlan | null>(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinancialPlanItem | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<FinancialPlan | null>(null);
  const [deletingItem, setDeletingItem] = useState<FinancialPlanItem | null>(null);
  const [payingPlan, setPayingPlan] = useState<{ plan: FinancialPlan; item: FinancialPlanItem | null } | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const plans = useMemo(
    () =>
      financialPlans
        .filter((p) => (typeFilter === "all" ? true : p.type === typeFilter))
        .filter((p) => (statusFilter === "all" ? true : p.status === statusFilter)),
    [financialPlans, typeFilter, statusFilter]
  );

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name : "کل خانواده");
  const detailPlan = detailId ? financialPlans.find((p) => p.id === detailId) : null;
  const detailItems = detailPlan
    ? financialPlanItems.filter((i) => i.planId === detailPlan.id)
    : [];

  /* ── نمای جزئیات ── */
  if (detailPlan) {
    const meta = getPlanTypeMeta(detailPlan.type);
    const progress = calculateFinancialPlanProgress(detailPlan, detailItems, transactions);
    const items = [...detailItems].sort((a, b) => {
      if (a.status === "paid" && b.status !== "paid") return 1;
      if (b.status === "paid" && a.status !== "paid") return -1;
      return (a.dueDate ?? "9999") < (b.dueDate ?? "9999") ? -1 : 1;
    });

    return (
      <div className="space-y-5">
        <button onClick={() => setDetailId(null)} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-extrabold text-ink-soft shadow-card transition hover:border-pine-300 hover:text-pine-700">
          <ArrowRight size={14} />
          بازگشت به برنامه‌ها
        </button>

        <div className="animate-fade-up overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <div className="border-b border-line bg-paper/50 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${meta.tint}`}>{meta.emoji}</span>
                <div>
                  <h1 className="font-display text-2xl text-ink">{detailPlan.title}</h1>
                  <p className="mt-0.5 text-xs font-bold text-mute">
                    {meta.label} · {memberName(detailPlan.memberId)}
                    {detailPlan.targetDate && ` · هدف ${formatJalali(detailPlan.targetDate)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold ${PLAN_STATUS_CLS[detailPlan.status]}`}>
                  {PLAN_STATUS_LABELS[detailPlan.status]}
                </span>
                <button onClick={() => { setEditingPlan(detailPlan); setPlanFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش برنامه">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeletingPlan(detailPlan)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف برنامه">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {detailPlan.description && <p className="mt-3 text-xs leading-6 text-ink-soft">{detailPlan.description}</p>}

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-surface px-3.5 py-3 shadow-card">
                <p className="text-[10px] font-bold text-mute">بودجه تخمینی</p>
                <p className="mt-1 font-display text-lg leading-6 text-ink">{formatMoney(detailPlan.estimatedBudget, detailPlan.currency)}</p>
              </div>
              <div className="rounded-xl bg-surface px-3.5 py-3 shadow-card">
                <p className="text-[10px] font-bold text-mute">خرج‌شده واقعی</p>
                <p className="mt-1 font-display text-lg leading-6 text-danger">{formatMoney(progress.actual, detailPlan.currency)}</p>
              </div>
              <div className="rounded-xl bg-surface px-3.5 py-3 shadow-card">
                <p className="text-[10px] font-bold text-mute">باقی‌مانده</p>
                <p className="mt-1 font-display text-lg leading-6 text-success">{formatMoney(progress.remaining, detailPlan.currency)}</p>
              </div>
              <div className="rounded-xl bg-surface px-3.5 py-3 shadow-card">
                <p className="text-[10px] font-bold text-mute">پیشرفت مالی</p>
                <p className="mt-1 font-display text-lg leading-6 text-pine-700">{faNum(Math.round(progress.percentage))}٪</p>
              </div>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-paper">
              <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${Math.min(progress.percentage, 100)}%` }} />
            </div>
            <p className="mt-2 text-[10px] font-bold text-mute">
              {faNum(progress.paidItemCount)} از {faNum(progress.itemCount)} آیتم پرداخت شده · اعداد «تخمینی» تا ثبت تراکنش واقعی، موجودی حساب را تغییر نمی‌دهند.
            </p>
          </div>

          <div className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold text-ink">ریز هزینه‌ها</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPayingPlan({ plan: detailPlan, item: null })}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-saffron-600 active:scale-[0.97]"
                >
                  <Coins size={13} />
                  ثبت هزینه واقعی
                </button>
                <button
                  onClick={() => { setEditingItem(null); setItemFormOpen(true); }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-pine-700 active:scale-[0.97]"
                >
                  <Plus size={13} />
                  آیتم جدید
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line-strong bg-paper/40 px-4 py-8 text-center text-xs text-mute">
                هنوز آیتمی اضافه نشده — اولین ریز هزینه را بسازید.
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const actual = planItemActual(item, transactions);
                  return (
                    <div key={item.id} className={`flex flex-wrap items-center gap-3 rounded-xl border px-3.5 py-3 transition ${item.status === "paid" ? "border-success/30 bg-success-soft/40" : "border-line bg-surface hover:border-pine-300"}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-ink">{item.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] font-bold text-mute">
                          {item.category && <span>{item.category}</span>}
                          {item.dueDate && (
                            <span className="inline-flex items-center gap-1"><CalendarClock size={10} /> {formatJalali(item.dueDate)}</span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                            item.status === "paid" ? "bg-success-soft text-success" : item.status === "pending" ? "bg-saffron-100 text-saffron-700" : "bg-paper text-ink-soft"
                          }`}>
                            {PLAN_ITEM_STATUS_LABELS[item.status]}
                          </span>
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-[11px] font-extrabold text-ink">تخمینی: {formatMoney(item.estimatedAmount, detailPlan.currency)}</p>
                        <p className={`text-[10px] font-bold ${actual > 0 ? "text-danger" : "text-mute"}`}>
                          واقعی: {actual > 0 ? formatMoney(actual, detailPlan.currency) : "—"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setPayingPlan({ plan: detailPlan, item })} className="rounded-lg p-2 text-mute transition hover:bg-saffron-50 hover:text-saffron-600" title="ثبت هزینه واقعی" aria-label="ثبت هزینه واقعی">
                          <Coins size={14} />
                        </button>
                        <button onClick={() => { setEditingItem(item); setItemFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش آیتم">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeletingItem(item)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف آیتم">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <PlanFormModal open={planFormOpen} plan={editingPlan} onClose={() => { setPlanFormOpen(false); setEditingPlan(null); }} />
        <PlanItemFormModal open={itemFormOpen} planId={detailPlan.id} item={editingItem} onClose={() => { setItemFormOpen(false); setEditingItem(null); }} />
        <PaymentModal
          open={payingPlan !== null}
          title={payingPlan?.item ? `ثبت هزینه «${payingPlan.item.title}»` : "ثبت هزینه واقعی برنامه"}
          subtitle="تراکنش واقعی ساخته و به برنامه متصل می‌شود — مبلغ واقعی از تراکنش‌ها محاسبه می‌شود"
          actionLabel="ثبت هزینه"
          defaultAmount={payingPlan?.item?.estimatedAmount}
          currency={payingPlan?.plan.currency as CurrencyCode | undefined}
          onClose={() => setPayingPlan(null)}
          onSubmit={({ accountId, amount, date }) => {
            if (!payingPlan) return;
            recordPlanExpense(payingPlan.plan.id, payingPlan.item?.id ?? null, {
              accountId, amount, date, category: payingPlan.item?.category,
            });
            pushToast("هزینه واقعی ثبت و به برنامه متصل شد");
          }}
        />
        <ConfirmDialog
          open={deletingItem !== null}
          onClose={() => setDeletingItem(null)}
          title="حذف آیتم"
          message={deletingItem ? `آیا از حذف «${deletingItem.title}» مطمئن هستید؟ تراکنش‌های متصل حذف نمی‌شوند.` : ""}
          confirmLabel="حذف شود"
          onConfirm={() => {
            if (deletingItem) {
              deletePlanItem(deletingItem.id);
              pushToast("آیتم حذف شد", "danger");
            }
          }}
        />
        <ConfirmDialog
          open={deletingPlan !== null}
          onClose={() => setDeletingPlan(null)}
          title="حذف برنامه مالی"
          message={deletingPlan ? `آیا از حذف برنامه «${deletingPlan.title}» و همه آیتم‌های آن مطمئن هستید؟` : ""}
          confirmLabel="حذف شود"
          onConfirm={() => {
            if (deletingPlan) {
              deleteFinancialPlan(deletingPlan.id);
              setDetailId(null);
              pushToast("برنامه حذف شد", "danger");
            }
          }}
        />
      </div>
    );
  }

  /* ── نمای فهرست ── */
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">برنامه‌های مالی</h1>
          <p className="mt-1 text-xs text-mute">
            برای اتفاق‌های مهم زندگی برنامه بسازید — مبلغ تخمینی تا ثبت تراکنش واقعی، موجودی را تغییر نمی‌دهد.
          </p>
        </div>
        <button
          onClick={() => { setEditingPlan(null); setPlanFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          برنامه مالی جدید
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-mute" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه انواع</option>
          {["education", "wedding", "home", "vehicle", "travel", "migration", "medical", "business", "baby", "renovation", "retirement", "event", "custom"].map((t) => (
            <option key={t} value={t}>{getPlanTypeMeta(t as FinancialPlan["type"]).label}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(PLAN_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<Flag size={24} />}
          title="هنوز برنامه مالی آینده‌ای تعریف نشده است"
          description="ازدواج، دانشگاه، خرید خودرو، مهاجرت یا هر هدف دیگری — برای هرکدام بودجه و ریز هزینه تعریف کنید."
          action={
            <button onClick={() => { setEditingPlan(null); setPlanFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} />
              ساخت اولین برنامه مالی
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan, i) => {
            const meta = getPlanTypeMeta(plan.type);
            const items = financialPlanItems.filter((x) => x.planId === plan.id);
            const progress = calculateFinancialPlanProgress(plan, items, transactions);
            return (
              <button
                key={plan.id}
                onClick={() => setDetailId(plan.id)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="animate-fade-up group rounded-2xl border border-line bg-surface p-5 text-start shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-pine-300 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl transition-transform duration-200 group-hover:scale-110 ${meta.tint}`}>{meta.emoji}</span>
                    <div>
                      <h3 className="text-sm font-extrabold text-ink group-hover:text-pine-700">{plan.title}</h3>
                      <p className="mt-0.5 text-[10px] font-bold text-mute">
                        {meta.label} · {memberName(plan.memberId)}
                        {plan.targetDate && ` · ${formatJalali(plan.targetDate)}`}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${PLAN_STATUS_CLS[plan.status]}`}>
                    {PLAN_STATUS_LABELS[plan.status]}
                  </span>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  <p className="font-display text-xl text-ink">{faNum(Math.round(progress.percentage))}٪</p>
                  <p className="text-[11px] font-bold text-mute">
                    {formatMoney(progress.actual, plan.currency)} از {formatMoney(plan.estimatedBudget, plan.currency)}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper">
                  <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${Math.min(progress.percentage, 100)}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-[10px] font-bold text-mute">
                  <span>{faNum(progress.paidItemCount)} از {faNum(progress.itemCount)} آیتم پرداخت شده</span>
                  <span className="inline-flex items-center gap-1 text-pine-600 transition group-hover:gap-2">
                    جزئیات
                    <ArrowLeft size={12} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <PlanFormModal
        open={planFormOpen}
        plan={editingPlan}
        onClose={() => { setPlanFormOpen(false); setEditingPlan(null); }}
        onCreated={(id) => setDetailId(id)}
      />

      <ConfirmDialog
        open={deletingPlan !== null}
        onClose={() => setDeletingPlan(null)}
        title="حذف برنامه مالی"
        message={deletingPlan ? `آیا از حذف برنامه «${deletingPlan.title}» و همه آیتم‌های آن مطمئن هستید؟` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deletingPlan) {
            deleteFinancialPlan(deletingPlan.id);
            pushToast("برنامه حذف شد", "danger");
          }
        }}
      />
    </div>
  );
}
