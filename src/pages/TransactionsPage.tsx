import { useMemo, useState } from "react";
import { ArrowLeftRight, Pencil, Plus, Receipt, Search, Trash2, X } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import TransactionTypeBadge, { TransactionStatusBadge, ReferenceBadge, TYPE_META } from "../components/finance/TransactionTypeBadge";
import { DATE_RANGES, EMPTY_FILTER, filterTransactions, type TxFilter } from "../utils/finance";
import { allCategoryLabels } from "../data/categories";
import { faNum, formatJalali, formatSignedMoney } from "../utils/format";
import type { Transaction } from "../types";

interface TransactionsPageProps {
  onNewTransaction: () => void;
  onEditTransaction: (t: Transaction) => void;
}

/** تراکنش‌ها — جدول در دسکتاپ، کارت در موبایل */
export default function TransactionsPage({ onNewTransaction, onEditTransaction }: TransactionsPageProps) {
  const { family, pushToast } = useFamily();
  const { accounts, transactions, accountById, deleteTransaction } = useFinance();
  const [filter, setFilter] = useState<TxFilter>(EMPTY_FILTER);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const lookups = useMemo(
    () => ({
      memberName: (id?: string) => (id ? family?.members.find((m) => m.id === id)?.name ?? "" : "کل خانواده"),
      accountName: (id: string) => accountById(id)?.name ?? "—",
    }),
    [family, accountById]
  );

  const filtered = useMemo(
    () => filterTransactions(transactions, filter, lookups),
    [transactions, filter, lookups]
  );

  if (!family) return null;

  const hasActiveFilter =
    filter.query !== "" || filter.type !== "all" || filter.memberId !== "all" ||
    filter.accountId !== "all" || filter.category !== "all" || filter.range !== "all";

  const selCls = "rounded-lg border border-line bg-surface px-3 py-2 text-xs font-bold text-ink-soft transition focus:border-pine-500 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">تراکنش‌ها</h1>
          <p className="mt-1 text-xs text-mute">
            {faNum(filtered.length)} تراکنش · انتقال‌ها در جمع درآمد و هزینه حساب نمی‌شوند
          </p>
        </div>
        <button onClick={onNewTransaction} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
          <Plus size={16} />
          ثبت تراکنش
        </button>
      </div>

      {/* جستجو و فیلترها */}
      <div className="space-y-2.5 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <div className="relative">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-mute" />
          <input
            value={filter.query}
            onChange={(e) => setFilter((f) => ({ ...f, query: e.target.value }))}
            placeholder="جستجو در عنوان، توضیح، دسته، عضو یا حساب…"
            className="w-full rounded-xl border border-line bg-paper/50 py-2.5 pe-3 ps-9 text-sm transition focus:border-pine-500 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-pine-500/25"
            aria-label="جستجوی تراکنش‌ها"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={filter.type} onChange={(e) => setFilter((f) => ({ ...f, type: e.target.value as TxFilter["type"] }))} className={selCls} aria-label="فیلتر نوع">
            <option value="all">همه انواع</option>
            <option value="income">درآمد</option>
            <option value="expense">هزینه</option>
            <option value="transfer">انتقال</option>
          </select>
          <select value={filter.memberId} onChange={(e) => setFilter((f) => ({ ...f, memberId: e.target.value }))} className={selCls} aria-label="فیلتر عضو">
            <option value="all">همه اعضا</option>
            <option value="household">کل خانواده</option>
            {family.members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select value={filter.accountId} onChange={(e) => setFilter((f) => ({ ...f, accountId: e.target.value }))} className={selCls} aria-label="فیلتر حساب">
            <option value="all">همه حساب‌ها</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select value={filter.category} onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))} className={selCls} aria-label="فیلتر دسته">
            <option value="all">همه دسته‌ها</option>
            {allCategoryLabels().map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={filter.range} onChange={(e) => setFilter((f) => ({ ...f, range: e.target.value as TxFilter["range"] }))} className={selCls} aria-label="فیلتر بازه زمانی">
            {DATE_RANGES.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          {hasActiveFilter && (
            <button onClick={() => setFilter(EMPTY_FILTER)} className="inline-flex items-center gap-1 rounded-lg bg-paper px-3 py-2 text-[11px] font-extrabold text-danger transition hover:bg-danger-soft">
              <X size={12} />
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} />}
          title={hasActiveFilter ? "نتیجه‌ای یافت نشد" : "هنوز تراکنشی ثبت نشده است"}
          description={hasActiveFilter ? "فیلترها را تغییر دهید یا پاک کنید." : "اولین درآمد، هزینه یا انتقال را ثبت کنید تا موجودی حساب‌ها زنده شود."}
          action={!hasActiveFilter ? (
            <button onClick={onNewTransaction} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} />
              ثبت اولین تراکنش
            </button>
          ) : undefined}
        />
      ) : (
        <>
          {/* جدول دسکتاپ */}
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-surface shadow-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-paper/60 text-[10px] font-extrabold text-mute">
                  <th className="px-4 py-3 text-start">تاریخ</th>
                  <th className="px-4 py-3 text-start">عنوان</th>
                  <th className="px-4 py-3 text-start">نوع</th>
                  <th className="px-4 py-3 text-start">عضو</th>
                  <th className="px-4 py-3 text-start">دسته</th>
                  <th className="px-4 py-3 text-start">حساب</th>
                  <th className="px-4 py-3 text-end">مبلغ</th>
                  <th className="px-4 py-3 text-start">وضعیت</th>
                  <th className="px-4 py-3 text-end">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 60).map((t) => {
                  const meta = TYPE_META[t.type];
                  return (
                    <tr key={t.id} className="border-b border-line/60 transition hover:bg-pine-50/40">
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-mute" dir="ltr">{formatJalali(t.date)}</td>
                      <td className="max-w-[220px] px-4 py-3">
                        <p className="truncate text-xs font-extrabold text-ink">{t.title}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <ReferenceBadge type={t.financialReferenceType} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><TransactionTypeBadge type={t.type} /></td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-ink-soft">{lookups.memberName(t.memberId)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs font-bold text-mute">{t.category ?? "—"}</td>
                      <td className="max-w-[160px] px-4 py-3">
                        <p className="truncate text-xs font-bold text-ink-soft">{lookups.accountName(t.accountId)}</p>
                        {t.type === "transfer" && t.destinationAccountId && (
                          <p className="flex items-center gap-1 truncate text-[10px] font-bold text-mute">
                            <ArrowLeftRight size={9} />
                            {lookups.accountName(t.destinationAccountId)}
                          </p>
                        )}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-end text-xs font-black ${meta.amount}`} dir="ltr">
                        {formatSignedMoney(t.amount, t.currency, meta.sign)}
                      </td>
                      <td className="px-4 py-3"><TransactionStatusBadge status={t.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => onEditTransaction(t)} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label={`ویرایش ${t.title}`}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => setDeleting(t)} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label={`حذف ${t.title}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length > 60 && (
              <p className="border-t border-line bg-paper/40 px-4 py-2.5 text-center text-[10px] font-bold text-mute">
                {faNum(filtered.length - 60)} تراکنش دیگر — فیلترها را دقیق‌تر کنید
              </p>
            )}
          </div>

          {/* کارت موبایل */}
          <div className="space-y-2.5 md:hidden">
            {filtered.slice(0, 40).map((t) => {
              const meta = TYPE_META[t.type];
              return (
                <div key={t.id} className="rounded-xl border border-line bg-surface p-3.5 shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-extrabold text-ink">{t.title}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-mute">
                        {lookups.memberName(t.memberId)} · {lookups.accountName(t.accountId)}
                      </p>
                    </div>
                    <p className={`whitespace-nowrap text-xs font-black ${meta.amount}`} dir="ltr">
                      {formatSignedMoney(t.amount, t.currency, meta.sign)}
                    </p>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <TransactionTypeBadge type={t.type} />
                      <ReferenceBadge type={t.financialReferenceType} />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-mute" dir="ltr">{formatJalali(t.date)}</span>
                      <button onClick={() => onEditTransaction(t)} className="rounded-lg p-1.5 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label="ویرایش">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleting(t)} className="rounded-lg p-1.5 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label="حذف">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="حذف تراکنش"
        message={deleting ? `آیا از حذف «${deleting.title}» مطمئن هستید؟ موجودی حساب‌ها، بودجه‌ها و برنامه‌های متصل فوراً اصلاح می‌شوند.` : ""}
        confirmLabel="حذف شود"
        onConfirm={() => {
          if (deleting) {
            deleteTransaction(deleting.id);
            pushToast("تراکنش حذف و موجودی‌ها اصلاح شد", "danger");
          }
        }}
      />
    </div>
  );
}
