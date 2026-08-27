import { useMemo, useState } from "react";
import { Check, Filter, Pencil, Plus, Repeat, Trash2 } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { usePlanning } from "../hooks/usePlanning";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import RecurringFormModal from "../components/planning/RecurringFormModal";
import PaymentModal from "../components/planning/PaymentModal";
import { formatMoney, formatJalali, todayISO } from "../utils/format";
import type { RecurringFrequency, RecurringPayment } from "../types";

const FREQ_LABEL: Record<RecurringFrequency, string> = {
  weekly: "هفتگی",
  monthly: "ماهانه",
  quarterly: "سه‌ماهه",
  yearly: "سالانه",
};

export default function RecurringPaymentsPage() {
  const { family, pushToast } = useFamily();
  const { recurringPayments, deleteRecurring, payRecurringPayment, updateRecurring } = usePlanning();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringPayment | null>(null);
  const [deleting, setDeleting] = useState<RecurringPayment | null>(null);
  const [paying, setPaying] = useState<RecurringPayment | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");

  const today = todayISO();

  const rows = useMemo(
    () =>
      recurringPayments
        .filter((r) => memberFilter === "all" || r.memberId === memberFilter)
        .filter((r) => (activeFilter === "all" ? true : activeFilter === "active" ? r.isActive : !r.isActive))
        .sort((a, b) => (a.nextDueDate < b.nextDueDate ? -1 : 1)),
    [recurringPayments, memberFilter, activeFilter]
  );

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name : "کل خانواده");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">پرداخت‌های تکرارشونده</h1>
          <p className="mt-1 text-xs text-mute">
            هیچ پرداختی خودکار ثبت نمی‌شود؛ هنگام سررسید خودتان تأیید کنید تا تراکنش ساخته شود.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          پرداخت تکرارشونده جدید
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
        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "inactive")} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Repeat size={24} />}
          title="پرداخت تکرارشونده‌ای ثبت نشده است"
          description="اجاره، اینترنت، بیمه و شهریه را اینجا تعریف کنید تا سررسیدها را دنبال کنید."
          action={
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} /> ثبت اولین پرداخت تکرارشونده
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isDue = r.isActive && r.nextDueDate <= today;
            return (
              <div
                key={r.id}
                className={`animate-fade-up flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-surface p-4 shadow-card transition hover:border-pine-300 ${
                  isDue ? "border-saffron-400" : "border-line"
                } ${!r.isActive ? "opacity-60" : ""}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-extrabold text-ink">{r.title}</h3>
                    <span className="rounded-full bg-pine-50 px-2.5 py-0.5 text-[10px] font-extrabold text-pine-700">
                      {FREQ_LABEL[r.frequency]}
                    </span>
                    {isDue && (
                      <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-[10px] font-extrabold text-saffron-700">
                        سررسید {r.nextDueDate === today ? "امروز" : "گذشته"}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-mute">
                    {memberName(r.memberId)} · سررسید بعدی {formatJalali(r.nextDueDate)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-display text-lg text-ink">{formatMoney(r.amount, r.currency)}</p>
                  <div className="flex items-center gap-1">
                    {isDue && (
                      <button
                        onClick={() => setPaying(r)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-saffron-600 active:scale-[0.97]"
                      >
                        <Check size={14} strokeWidth={3} />
                        ثبت پرداخت
                      </button>
                    )}
                    <button
                      onClick={() => updateRecurring(r.id, { isActive: !r.isActive })}
                      className={`rounded-lg px-2.5 py-2 text-[11px] font-extrabold transition ${
                        r.isActive ? "text-mute hover:bg-paper" : "text-success hover:bg-success-soft"
                      }`}
                    >
                      {r.isActive ? "غیرفعال" : "فعال"}
                    </button>
                    <button onClick={() => { setEditing(r); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleting(r)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RecurringFormModal open={formOpen} payment={editing} onClose={() => setFormOpen(false)} />

      <PaymentModal
        open={paying !== null}
        title={`ثبت پرداخت «${paying?.title ?? ""}»`}
        subtitle="بعد از ثبت، سررسید بعدی طبق تکرار جلو می‌رود"
        actionLabel="ثبت پرداخت"
        defaultAmount={paying?.amount}
        onClose={() => setPaying(null)}
        onSubmit={({ accountId, amount, date }) => {
          if (!paying) return;
          payRecurringPayment(paying.id, { accountId, amount, date });
          pushToast("پرداخت ثبت و سررسید بعدی جلو رفت");
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="حذف پرداخت تکرارشونده"
        message={deleting ? `آیا از حذف «${deleting.title}» مطمئن هستید؟` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deleting) {
            deleteRecurring(deleting.id);
            pushToast("پرداخت تکرارشونده حذف شد", "danger");
          }
        }}
      />
    </div>
  );
}
