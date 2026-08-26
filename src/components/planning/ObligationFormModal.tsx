import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { CURRENCIES } from "../../data/currencies";
import { parseAmount, todayISO } from "../../utils/format";
import type { CurrencyCode, Debt, Receivable } from "../../types";

interface ObligationFormModalProps {
  open: boolean;
  kind: "debt" | "receivable";
  debt: Debt | null;
  receivable: Receivable | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

/** فرم مشترک بدهی / طلب */
export default function ObligationFormModal({ open, kind, debt, receivable, onClose }: ObligationFormModalProps) {
  const { family, pushToast } = useFamily();
  const { addDebt, updateDebt, addReceivable, updateReceivable } = usePlanning();

  const editing = kind === "debt" ? debt : receivable;
  const [title, setTitle] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [memberId, setMemberId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setTitle(editing.title);
      setCounterparty(editing.counterparty);
      setAmountRaw(String(editing.originalAmount));
      setCurrency(editing.currency);
      setMemberId(editing.memberId ?? "");
      setStartDate(editing.startDate);
      setDueDate(editing.dueDate ?? "");
      setDescription(editing.description ?? "");
    } else {
      setTitle("");
      setCounterparty("");
      setAmountRaw("");
      setCurrency(family?.currency ?? "toman");
      setMemberId("");
      setStartDate(todayISO());
      setDueDate("");
      setDescription("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  if (!family) return null;

  const save = () => {
    if (!title.trim()) return setError("عنوان را بنویسید.");
    if (!counterparty.trim()) return setError(kind === "debt" ? "نام طلبکار را بنویسید." : "نام بدهکار را بنویسید.");
    const amount = parseAmount(amountRaw);
    if (!amount || amount <= 0) return setError("مبلغ را درست وارد کنید.");
    if (!startDate) return setError("تاریخ شروع را مشخص کنید.");

    const base = {
      title: title.trim(),
      counterparty: counterparty.trim(),
      originalAmount: amount,
      currency,
      memberId: memberId || undefined,
      startDate,
      dueDate: dueDate || undefined,
      description: description.trim() || undefined,
    };

    if (kind === "debt") {
      if (debt) {
        updateDebt(debt.id, { ...base, remainingAmount: amount - debt.paidAmount });
        pushToast("بدهی به‌روزرسانی شد");
      } else {
        addDebt({ ...base, paidAmount: 0, remainingAmount: amount, status: "unpaid", transactionIds: [] });
        pushToast("بدهی ثبت شد");
      }
    } else {
      if (receivable) {
        updateReceivable(receivable.id, { ...base, remainingAmount: amount - receivable.receivedAmount });
        pushToast("طلب به‌روزرسانی شد");
      } else {
        addReceivable({ ...base, receivedAmount: 0, remainingAmount: amount, status: "unpaid", transactionIds: [] });
        pushToast("طلب ثبت شد");
      }
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? (kind === "debt" ? "ویرایش بدهی" : "ویرایش طلب") : kind === "debt" ? "ثبت بدهی" : "ثبت طلب"}
      subtitle={kind === "debt" ? "بازپرداخت‌ها هزینه عملیاتی محسوب نمی‌شوند" : "دریافت‌ها درآمد عملیاتی محسوب نمی‌شوند"}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="ob-title" className={labelCls}>عنوان</label>
          <input id="ob-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder={kind === "debt" ? "مثلاً وام بانک" : "مثلاً طلب از مشتری"} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ob-party" className={labelCls}>{kind === "debt" ? "طلبکار" : "بدهکار"}</label>
            <input id="ob-party" value={counterparty} onChange={(e) => { setCounterparty(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ob-amount" className={labelCls}>مبلغ</label>
            <input id="ob-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ob-currency" className={labelCls}>ارز</label>
            <select id="ob-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ob-member" className={labelCls}>عضو مرتبط (اختیاری)</label>
            <select id="ob-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ob-start" className={labelCls}>تاریخ شروع</label>
            <input id="ob-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ob-due" className={labelCls}>سررسید (اختیاری)</label>
            <input id="ob-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label htmlFor="ob-desc" className={labelCls}>توضیح (اختیاری)</label>
          <textarea id="ob-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
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
