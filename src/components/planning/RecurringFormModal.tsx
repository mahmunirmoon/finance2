import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { EXPENSE_CATEGORIES } from "../../data/categories";
import { CURRENCIES } from "../../data/currencies";
import { useFinance } from "../../hooks/useFinance";
import { parseAmount, todayISO } from "../../utils/format";
import type { CurrencyCode, RecurringFrequency, RecurringPayment } from "../../types";

interface RecurringFormModalProps {
  open: boolean;
  payment: RecurringPayment | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

const FREQS: { id: RecurringFrequency; label: string }[] = [
  { id: "weekly", label: "هفتگی" },
  { id: "monthly", label: "ماهانه" },
  { id: "quarterly", label: "سه‌ماهه" },
  { id: "yearly", label: "سالانه" },
];

export default function RecurringFormModal({ open, payment, onClose }: RecurringFormModalProps) {
  const { family, pushToast } = useFamily();
  const { accounts } = useFinance();
  const { addRecurring, updateRecurring } = usePlanning();

  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [categoryId, setCategoryId] = useState(EXPENSE_CATEGORIES[2].label);
  const [accountId, setAccountId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayISO());
  const [nextDueDate, setNextDueDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (payment) {
      setTitle(payment.title);
      setMemberId(payment.memberId ?? "");
      setAmountRaw(String(payment.amount));
      setCurrency(payment.currency);
      setCategoryId(payment.categoryId ?? "");
      setAccountId(payment.accountId ?? "");
      setFrequency(payment.frequency);
      setStartDate(payment.startDate);
      setNextDueDate(payment.nextDueDate);
      setEndDate(payment.endDate ?? "");
    } else {
      setTitle("");
      setMemberId("");
      setAmountRaw("");
      setCurrency(family?.currency ?? "toman");
      setCategoryId(EXPENSE_CATEGORIES[2].label);
      setAccountId(activeAccounts[0]?.id ?? "");
      setFrequency("monthly");
      setStartDate(todayISO());
      setNextDueDate(todayISO());
      setEndDate("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment]);

  if (!family) return null;

  const save = () => {
    if (!title.trim()) return setError("عنوان را بنویسید.");
    const amount = parseAmount(amountRaw);
    if (!amount || amount <= 0) return setError("مبلغ را درست وارد کنید.");
    if (!nextDueDate) return setError("تاریخ سررسید بعدی را مشخص کنید.");

    const data = {
      title: title.trim(),
      memberId: memberId || undefined,
      amount,
      currency,
      categoryId: categoryId || undefined,
      accountId: accountId || undefined,
      frequency,
      startDate,
      nextDueDate,
      endDate: endDate || undefined,
      isActive: payment ? payment.isActive : true,
    };
    if (payment) {
      updateRecurring(payment.id, data);
      pushToast("پرداخت تکرارشونده به‌روزرسانی شد");
    } else {
      addRecurring(data);
      pushToast(`«${title.trim()}» به پرداخت‌های تکرارشونده اضافه شد`);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={payment ? "ویرایش پرداخت تکرارشونده" : "پرداخت تکرارشونده جدید"} subtitle="هیچ پرداختی خودکار ثبت نمی‌شود — فقط یادآوری سررسید" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="rp-title" className={labelCls}>عنوان</label>
            <input id="rp-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً اینترنت خانه" className={inputCls} />
          </div>
          <div>
            <label htmlFor="rp-amount" className={labelCls}>مبلغ</label>
            <input id="rp-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="rp-currency" className={labelCls}>ارز</label>
            <select id="rp-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-member" className={labelCls}>عضو (اختیاری)</label>
            <select id="rp-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-cat" className={labelCls}>دسته</label>
            <select id="rp-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
              <option value="">بدون دسته</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-account" className={labelCls}>حساب پرداخت (اختیاری)</label>
            <select id="rp-account" value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-freq" className={labelCls}>تکرار</label>
            <select id="rp-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} className={inputCls}>
              {FREQS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-start" className={labelCls}>تاریخ شروع</label>
            <input id="rp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="rp-next" className={labelCls}>سررسید بعدی</label>
            <input id="rp-next" type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="rp-end" className={labelCls}>پایان (اختیاری)</label>
            <input id="rp-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
          <button onClick={save} className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">ذخیره</button>
        </div>
      </div>
    </Modal>
  );
}
