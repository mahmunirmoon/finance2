import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../hooks/useFinance";
import { getCurrency } from "../../data/currencies";
import { faNum, parseAmount, todayISO } from "../../utils/format";
import type { Account } from "../../types";

interface PaymentModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  actionLabel: string;
  defaultAmount?: number;
  /** فقط حساب‌های این ارز نمایش داده شوند؛ undefined یعنی همه */
  currency?: string;
  onClose: () => void;
  onSubmit: (opts: { accountId: string; amount: number; date: string }) => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

/** مودال مشترک: بازپرداخت بدهی، دریافت طلب، پرداخت قسط، پرداخت برنامه */
export default function PaymentModal({
  open, title, subtitle, actionLabel, defaultAmount, currency, onClose, onSubmit,
}: PaymentModalProps) {
  const { accounts, balances } = useFinance();
  const [accountId, setAccountId] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [date, setDate] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  const eligible = accounts.filter((a) => a.isActive && (!currency || a.currency === currency));

  useEffect(() => {
    if (!open) return;
    setAccountId(eligible[0]?.id ?? "");
    setAmountRaw(defaultAmount ? String(defaultAmount) : "");
    setDate(todayISO());
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amount = parseAmount(amountRaw);
  const account = eligible.find((a) => a.id === accountId);

  const save = () => {
    if (!account) return setError("حساب را انتخاب کنید.");
    if (!amount || amount <= 0) return setError("مبلغ را درست وارد کنید.");
    if (!date) return setError("تاریخ را مشخص کنید.");
    onSubmit({ accountId: account.id, amount, date });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={subtitle}>
      <div className="space-y-4">
        <div>
          <label htmlFor="pay-account" className={labelCls}>حساب</label>
          <select id="pay-account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(null); }} className={inputCls}>
            {eligible.length === 0 && <option value="">حساب هم‌ارز موجود نیست</option>}
            {eligible.map((a: Account) => (
              <option key={a.id} value={a.id}>
                {a.name} — موجودی {faNum(Math.round(balances[a.id] ?? 0))} {getCurrency(a.currency).short}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pay-amount" className={labelCls}>مبلغ</label>
            <input id="pay-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pay-date" className={labelCls}>تاریخ</label>
            <input id="pay-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
        <button onClick={save} className="w-full rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
          {actionLabel}
        </button>
      </div>
    </Modal>
  );
}
