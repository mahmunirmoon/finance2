import { useMemo, useState } from "react";
import { Coins, Filter, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { usePlanning } from "../hooks/usePlanning";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import ObligationFormModal from "../components/planning/ObligationFormModal";
import PaymentModal from "../components/planning/PaymentModal";
import { calculateDebtState, calculateReceivableState } from "../utils/planning";
import { formatJalali, formatMoney, faNum } from "../utils/format";
import type { CurrencyCode, Debt, Receivable } from "../types";

const DEBT_STATUS: Record<Debt["status"], { label: string; cls: string }> = {
  unpaid: { label: "پرداخت‌نشده", cls: "bg-paper text-ink-soft" },
  partial: { label: "پرداخت جزئی", cls: "bg-saffron-100 text-saffron-700" },
  paid: { label: "تسویه‌شده", cls: "bg-success-soft text-success" },
  overdue: { label: "سررسید گذشته", cls: "bg-danger-soft text-danger" },
};

const REC_STATUS: Record<Receivable["status"], { label: string; cls: string }> = {
  unpaid: { label: "دریافت‌نشده", cls: "bg-paper text-ink-soft" },
  partial: { label: "دریافت جزئی", cls: "bg-saffron-100 text-saffron-700" },
  received: { label: "دریافت‌شده", cls: "bg-success-soft text-success" },
  overdue: { label: "سررسید گذشته", cls: "bg-danger-soft text-danger" },
};

type Tab = "debts" | "receivables";

export default function DebtsReceivablesPage() {
  const { family, pushToast } = useFamily();
  const { transactions } = useFinance();
  const {
    debts, receivables, deleteDebt, deleteReceivable,
    recordDebtPayment, recordReceivableCollection,
  } = usePlanning();

  const [tab, setTab] = useState<Tab>("debts");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [editingRec, setEditingRec] = useState<Receivable | null>(null);
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null);
  const [deletingRec, setDeletingRec] = useState<Receivable | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [collectingRec, setCollectingRec] = useState<Receivable | null>(null);
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currencyFilter, setCurrencyFilter] = useState("all");

  const debtRows = useMemo(
    () =>
      debts
        .map((d) => ({ debt: d, state: calculateDebtState(d, transactions) }))
        .filter(({ debt }) => (memberFilter === "all" ? true : debt.memberId === memberFilter))
        .filter(({ debt }) => (statusFilter === "all" ? true : debt.status === statusFilter))
        .filter(({ debt }) => (currencyFilter === "all" ? true : debt.currency === currencyFilter)),
    [debts, transactions, memberFilter, statusFilter, currencyFilter]
  );

  const recRows = useMemo(
    () =>
      receivables
        .map((r) => ({ rec: r, state: calculateReceivableState(r, transactions) }))
        .filter(({ rec }) => (memberFilter === "all" ? true : rec.memberId === memberFilter))
        .filter(({ rec }) => (statusFilter === "all" ? true : rec.status === statusFilter))
        .filter(({ rec }) => (currencyFilter === "all" ? true : rec.currency === currencyFilter)),
    [receivables, transactions, memberFilter, statusFilter, currencyFilter]
  );

  if (!family) return null;

  const memberName = (id?: string) => (id ? family.members.find((m) => m.id === id)?.name ?? "—" : "کل خانواده");
  const currencies = Array.from(new Set([...debts.map((d) => d.currency), ...receivables.map((r) => r.currency)]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">بدهی و طلب</h1>
          <p className="mt-1 text-xs text-mute">
            بازپرداخت بدهی، هزینه عملیاتی و دریافت طلب، درآمد عملیاتی محسوب نمی‌شود — بدون شمارش دوباره.
          </p>
        </div>
        <button
          onClick={() => { setEditingDebt(null); setEditingRec(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          {tab === "debts" ? "ثبت بدهی" : "ثبت طلب"}
        </button>
      </div>

      {/* تب‌ها */}
      <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-card">
        <button
          onClick={() => setTab("debts")}
          className={`rounded-lg px-5 py-2.5 text-xs font-extrabold transition-all ${tab === "debts" ? "bg-pine-600 text-white shadow-card" : "text-mute hover:text-ink"}`}
        >
          بدهی‌های ما ({faNum(debts.length)})
        </button>
        <button
          onClick={() => setTab("receivables")}
          className={`rounded-lg px-5 py-2.5 text-xs font-extrabold transition-all ${tab === "receivables" ? "bg-pine-600 text-white shadow-card" : "text-mute hover:text-ink"}`}
        >
          طلب‌های ما ({faNum(receivables.length)})
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه وضعیت‌ها</option>
          {tab === "debts"
            ? Object.entries(DEBT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)
            : Object.entries(REC_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={currencyFilter} onChange={(e) => setCurrencyFilter(e.target.value)} className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft">
          <option value="all">همه ارزها</option>
          {currencies.map((c) => (
            <option key={c} value={c}>{c.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {tab === "debts" &&
        (debtRows.length === 0 ? (
          <EmptyState icon={<Scale size={24} />} title="بدهی‌ای ثبت نشده است" description="وام، قرض و تعهدات پرداخت را اینجا ثبت کنید تا سررسیدها را دنبال کنید." action={
            <button onClick={() => { setEditingDebt(null); setEditingRec(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} /> ثبت اولین بدهی
            </button>
          } />
        ) : (
          <div className="space-y-3">
            {debtRows.map(({ debt, state }) => {
              const meta = DEBT_STATUS[state.status];
              const pct = debt.originalAmount > 0 ? (state.paid / debt.originalAmount) * 100 : 0;
              return (
                <div key={debt.id} className="animate-fade-up rounded-xl border border-line bg-surface p-4 shadow-card transition hover:border-pine-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-ink">{debt.title}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-mute">
                        طلبکار: {debt.counterparty} · {memberName(debt.memberId)}
                        {debt.dueDate && ` · سررسید ${formatJalali(debt.dueDate)}`}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-display text-lg text-danger">{formatMoney(state.remaining, debt.currency)}</p>
                      <p className="text-[10px] font-bold text-mute">باقی‌مانده از {formatMoney(debt.originalAmount, debt.currency)}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div className="animate-grow-bar h-full rounded-full bg-pine-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-mute">{faNum(Math.round(pct))}٪ پرداخت شده</span>
                    <div className="flex items-center gap-1">
                      {state.remaining > 0 && (
                        <button onClick={() => setPayingDebt(debt)} className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-pine-700 active:scale-[0.97]">
                          <Coins size={14} /> ثبت بازپرداخت
                        </button>
                      )}
                      <button onClick={() => { setEditingDebt(debt); setEditingRec(null); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش بدهی">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingDebt(debt)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف بدهی">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {tab === "receivables" &&
        (recRows.length === 0 ? (
          <EmptyState icon={<Scale size={24} />} title="طلبی ثبت نشده است" description="پول‌هایی که باید بگیرید را اینجا ثبت کنید تا فراموش نشوند." action={
            <button onClick={() => { setEditingDebt(null); setEditingRec(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} /> ثبت اولین طلب
            </button>
          } />
        ) : (
          <div className="space-y-3">
            {recRows.map(({ rec, state }) => {
              const meta = REC_STATUS[state.status];
              const pct = rec.originalAmount > 0 ? (state.received / rec.originalAmount) * 100 : 0;
              return (
                <div key={rec.id} className="animate-fade-up rounded-xl border border-line bg-surface p-4 shadow-card transition hover:border-pine-300">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-ink">{rec.title}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${meta.cls}`}>{meta.label}</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-mute">
                        بدهکار: {rec.counterparty} · {memberName(rec.memberId)}
                        {rec.dueDate && ` · سررسید ${formatJalali(rec.dueDate)}`}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-display text-lg text-success">{formatMoney(state.remaining, rec.currency)}</p>
                      <p className="text-[10px] font-bold text-mute">باقی‌مانده از {formatMoney(rec.originalAmount, rec.currency)}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-paper">
                    <div className="animate-grow-bar h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-mute">{faNum(Math.round(pct))}٪ دریافت شده</span>
                    <div className="flex items-center gap-1">
                      {state.remaining > 0 && (
                        <button onClick={() => setCollectingRec(rec)} className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-xs font-extrabold text-white transition hover:brightness-95 active:scale-[0.97]">
                          <Coins size={14} /> ثبت دریافت
                        </button>
                      )}
                      <button onClick={() => { setEditingRec(rec); setEditingDebt(null); setFormOpen(true); }} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش طلب">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeletingRec(rec)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف طلب">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      <ObligationFormModal open={formOpen} kind={tab === "debts" ? "debt" : "receivable"} debt={editingDebt} receivable={editingRec} onClose={() => setFormOpen(false)} />

      <PaymentModal
        open={payingDebt !== null}
        title={`بازپرداخت «${payingDebt?.title ?? ""}»`}
        subtitle="این مبلغ از موجودی حساب کم می‌شود ولی هزینه عملیاتی خانواده حساب نمی‌شود"
        actionLabel="ثبت بازپرداخت"
        defaultAmount={payingDebt ? calculateDebtState(payingDebt, transactions).remaining : undefined}
        currency={payingDebt?.currency as CurrencyCode | undefined}
        onClose={() => setPayingDebt(null)}
        onSubmit={({ accountId, amount, date }) => {
          if (!payingDebt) return;
          recordDebtPayment(payingDebt.id, { accountId, amount, date });
          pushToast("بازپرداخت ثبت شد — بدهی کاهش یافت");
        }}
      />

      <PaymentModal
        open={collectingRec !== null}
        title={`دریافت «${collectingRec?.title ?? ""}»`}
        subtitle="این مبلغ به موجودی حساب اضافه می‌شود ولی درآمد عملیاتی خانواده حساب نمی‌شود"
        actionLabel="ثبت دریافت"
        defaultAmount={collectingRec ? calculateReceivableState(collectingRec, transactions).remaining : undefined}
        currency={collectingRec?.currency as CurrencyCode | undefined}
        onClose={() => setCollectingRec(null)}
        onSubmit={({ accountId, amount, date }) => {
          if (!collectingRec) return;
          recordReceivableCollection(collectingRec.id, { accountId, amount, date });
          pushToast("دریافت ثبت شد — طلب کاهش یافت");
        }}
      />

      <ConfirmDialog
        open={deletingDebt !== null}
        onClose={() => setDeletingDebt(null)}
        title="حذف بدهی"
        message={deletingDebt ? `آیا از حذف «${deletingDebt.title}» مطمئن هستید؟ تراکنش‌های بازپرداخت حذف نمی‌شوند.` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deletingDebt) {
            deleteDebt(deletingDebt.id);
            pushToast("بدهی حذف شد", "danger");
          }
        }}
      />

      <ConfirmDialog
        open={deletingRec !== null}
        onClose={() => setDeletingRec(null)}
        title="حذف طلب"
        message={deletingRec ? `آیا از حذف «${deletingRec.title}» مطمئن هستید؟ تراکنش‌های دریافت حذف نمی‌شوند.` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deletingRec) {
            deleteReceivable(deletingRec.id);
            pushToast("طلب حذف شد", "danger");
          }
        }}
      />
    </div>
  );
}
