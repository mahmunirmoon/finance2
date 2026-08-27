import { useMemo, useState } from "react";
import { CalendarClock, Filter, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { usePlanning } from "../hooks/usePlanning";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import InstallmentPlanFormModal from "../components/planning/InstallmentPlanFormModal";
import PaymentModal from "../components/planning/PaymentModal";
import { installmentItemDisplayStatus } from "../utils/planning";
import { formatMoney, formatJalali, faNum } from "../utils/format";
import type { CurrencyCode, InstallmentItem, InstallmentPlan } from "../types";

const ITEM_STATUS_CLS: Record<InstallmentItem["status"], string> = {
  upcoming: "bg-paper text-ink-soft",
  due: "bg-saffron-100 text-saffron-700",
  paid: "bg-success-soft text-success",
  overdue: "bg-danger-soft text-danger",
};
const ITEM_STATUS_LABEL: Record<InstallmentItem["status"], string> = {
  upcoming: "در راه",
  due: "سررسید امروز",
  paid: "پرداخت‌شده",
  overdue: "عقب‌افتاده",
};

export default function InstallmentsPage() {
  const { family, pushToast } = useFamily();
  const { installmentPlans, installmentItems, deleteInstallmentPlan, payInstallment } = usePlanning();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InstallmentPlan | null>(null);
  const [deleting, setDeleting] = useState<InstallmentPlan | null>(null);
  const [payingItem, setPayingItem] = useState<InstallmentItem | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");

  const plans = useMemo(
    () => installmentPlans.filter((p) => memberFilter === "all" || p.memberId === memberFilter),
    [installmentPlans, memberFilter]
  );

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name : "کل خانواده");
  const itemsOf = (planId: string) =>
    installmentItems.filter((i) => i.planId === planId).sort((a, b) => a.installmentNumber - b.installmentNumber);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">اقساط</h1>
          <p className="mt-1 text-xs text-mute">
            پرداخت هر قسط یک تراکنش می‌سازد و هر قسط فقط یک‌بار پرداخت می‌شود؛ حذف تراکنش، قسط را به حالت پرداخت‌نشده برمی‌گرداند.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          طرح قسط جدید
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
      </div>

      {plans.length === 0 ? (
        <EmptyState
          icon={<Layers size={24} />}
          title="طرح قسطی ثبت نشده است"
          description="خرید قسطی مثل لپ‌تاپ، لوازم خانگی یا خودرو را اینجا برنامه‌ریزی کنید."
          action={
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} /> ساخت اولین طرح قسط
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const items = itemsOf(plan.id);
            const paidItems = items.filter((i) => i.status === "paid");
            const paidAmount = paidItems.reduce((s, i) => s + i.amount, 0);
            const pct = plan.installmentCount > 0 ? (paidItems.length / plan.installmentCount) * 100 : 0;
            const nextDue = items.find((i) => i.status !== "paid");
            const isOpen = expanded === plan.id;

            return (
              <div key={plan.id} className="animate-fade-up rounded-2xl border border-line bg-surface shadow-card transition hover:border-pine-300">
                <button onClick={() => setExpanded(isOpen ? null : plan.id)} className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-start">
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-ink">{plan.title}</h3>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-mute">
                      {memberName(plan.memberId)} · {faNum(plan.installmentCount)} قسط
                      {nextDue && (
                        <span className="inline-flex items-center gap-1 text-saffron-600">
                          <CalendarClock size={11} />
                          قسط بعدی {formatJalali(nextDue.dueDate)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="font-display text-xl text-ink">
                      {faNum(paidItems.length)} / {faNum(plan.installmentCount)}
                    </p>
                    <p className="text-[10px] font-bold text-mute">قسط پرداخت‌شده</p>
                  </div>
                </button>

                <div className="px-5 pb-2">
                  <div className="h-2 overflow-hidden rounded-full bg-paper">
                    <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                    <span className="text-success">پرداخت‌شده: {formatMoney(paidAmount, plan.currency)}</span>
                    <span className="text-mute">باقی‌مانده: {formatMoney(plan.totalAmount - paidAmount, plan.currency)}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-1 px-4 pb-3">
                  <button onClick={() => { setEditing(plan); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش طرح">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => setDeleting(plan)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف طرح">
                    <Trash2 size={14} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-line bg-paper/40 p-4">
                    <div className="space-y-2">
                      {items.map((item) => {
                        const st = installmentItemDisplayStatus(item);
                        return (
                          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3.5 py-2.5 shadow-card">
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine-50 font-display text-sm text-pine-700">
                                {faNum(item.installmentNumber)}
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-ink">{formatJalali(item.dueDate)}</p>
                                <p className="text-[10px] font-bold text-mute">{formatMoney(item.amount, plan.currency)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${ITEM_STATUS_CLS[st]}`}>
                                {ITEM_STATUS_LABEL[st]}
                              </span>
                              {item.status !== "paid" && (
                                <button
                                  onClick={() => setPayingItem(item)}
                                  className="rounded-lg bg-pine-600 px-3 py-1.5 text-[11px] font-extrabold text-white transition hover:bg-pine-700 active:scale-[0.97]"
                                >
                                  پرداخت قسط
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <InstallmentPlanFormModal open={formOpen} plan={editing} onClose={() => setFormOpen(false)} />

      <PaymentModal
        open={payingItem !== null}
        title="پرداخت قسط"
        subtitle="موجودی حساب کم می‌شود ولی این مبلغ هزینه عملیاتی خانواده حساب نمی‌شود"
        actionLabel="ثبت پرداخت قسط"
        defaultAmount={payingItem?.amount}
        onClose={() => setPayingItem(null)}
        onSubmit={({ accountId, amount, date }) => {
          if (!payingItem) return;
          payInstallment(payingItem.id, { accountId, amount, date });
          pushToast("قسط پرداخت شد");
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="حذف طرح قسط"
        message={deleting ? `آیا از حذف طرح «${deleting.title}» و همه اقساط آن مطمئن هستید؟ تراکنش‌های پرداخت‌شده حذف نمی‌شوند.` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deleting) {
            deleteInstallmentPlan(deleting.id);
            pushToast("طرح قسط حذف شد", "danger");
          }
        }}
      />
    </div>
  );
}
