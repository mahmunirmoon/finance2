import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Filter, Pencil, Plus, Target, Trash2, XCircle } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import BudgetFormModal from "../components/planning/BudgetFormModal";
import { calculateBudgetUsage, budgetPeriodLabel, type BudgetStatusId } from "../utils/planning";
import { faNum, formatMoney } from "../utils/format";
import type { Budget } from "../types";

const STATUS_META: Record<BudgetStatusId, { label: string; cls: string; bar: string; icon: typeof CheckCircle2 }> = {
  safe: { label: "سالم", cls: "bg-success-soft text-success", bar: "bg-pine-500", icon: CheckCircle2 },
  warning: { label: "نزدیک سقف", cls: "bg-saffron-100 text-saffron-700", bar: "bg-saffron-400", icon: AlertTriangle },
  exceeded: { label: "تجاوز از سقف", cls: "bg-danger-soft text-danger", bar: "bg-danger", icon: XCircle },
};

const SCOPE_LABELS: Record<string, string> = {
  family: "کل خانواده",
  member: "عضو",
  category: "دسته",
  "member-category": "عضو + دسته",
};

export default function BudgetsPage() {
  const { family, pushToast } = useFamily();
  const { transactions } = useFinance();
  const { budgets, deleteBudget } = usePlanning();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState<Budget | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | BudgetStatusId>("all");

  const rows = useMemo(
    () =>
      budgets
        .map((b) => ({ budget: b, usage: calculateBudgetUsage(b, transactions) }))
        .filter(({ budget }) => memberFilter === "all" || budget.memberId === memberFilter)
        .filter(({ usage }) => statusFilter === "all" || usage.status === statusFilter)
        .sort((a, b) => b.usage.percentage - a.usage.percentage),
    [budgets, transactions, memberFilter, statusFilter]
  );

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name : undefined);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">بودجه‌بندی</h1>
          <p className="mt-1 text-xs text-mute">
            بودجه فقط با هزینه‌های عملیاتی همان دوره سنجیده می‌شود — انتقال‌ها و بازپرداخت‌ها اثر ندارند.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          بودجه جدید
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter size={15} className="text-mute" />
        <select value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه اعضا</option>
          {family.members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | BudgetStatusId)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه وضعیت‌ها</option>
          <option value="safe">سالم</option>
          <option value="warning">نزدیک سقف</option>
          <option value="exceeded">تجاوز از سقف</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Target size={24} />}
          title="بودجه‌ای تعریف نشده است"
          description="برای خانواده، یک عضو یا یک دسته هزینه، سقف ماهانه یا سالانه تعیین کنید."
          action={
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} />
              ساخت اولین بودجه
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ budget, usage }, i) => {
            const meta = STATUS_META[usage.status];
            const Icon = meta.icon;
            return (
              <div key={budget.id} className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-pine-300" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-ink">{budget.title}</h3>
                    <p className="mt-0.5 text-[10px] font-bold text-mute">
                      {SCOPE_LABELS[budget.scope]}
                      {budget.memberId && ` · ${memberName(budget.memberId)}`}
                      {budget.categoryId && ` · ${budget.categoryId}`}
                      {" · "}{budgetPeriodLabel(budget)}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${meta.cls}`}>
                    <Icon size={11} />
                    {meta.label}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-end justify-between">
                    <p className="font-display text-2xl text-ink">{faNum(Math.round(usage.percentage))}٪</p>
                    <p className="text-[11px] font-bold text-mute">
                      مصرف {formatMoney(usage.spent, budget.currency)} از {formatMoney(usage.amount, budget.currency)}
                    </p>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-paper">
                    <div className={`animate-grow-bar h-full rounded-full ${meta.bar}`} style={{ width: `${Math.min(usage.percentage, 100)}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                    {usage.remaining >= 0 ? (
                      <span className="text-success">باقی‌مانده: {formatMoney(usage.remaining, budget.currency)}</span>
                    ) : (
                      <span className="text-danger">{formatMoney(Math.abs(usage.remaining), budget.currency)} بیش از سقف</span>
                    )}
                    <span className="text-mute">آستانه هشدار: {faNum(budget.alertThreshold)}٪</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-1 border-t border-line pt-3">
                  <button onClick={() => { setEditing(budget); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label={`ویرایش ${budget.title}`}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleting(budget)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label={`حذف ${budget.title}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BudgetFormModal open={formOpen} budget={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="حذف بودجه"
        message={deleting ? `آیا از حذف بودجه «${deleting.title}» مطمئن هستید؟` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deleting) {
            deleteBudget(deleting.id);
            pushToast("بودجه حذف شد", "danger");
          }
        }}
      />
    </div>
  );
}
