import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { useFinance } from "../../hooks/useFinance";
import { usePlanning } from "../../hooks/usePlanning";
import { faNum, parseAmount, todayISO } from "../../utils/format";
import type { SavingsGoal } from "../../types";

interface ContributionModalProps {
  open: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

/**
 * افزودن پس‌انداز:
 * - انتقال واقعی: موجودی حساب مبدأ کم و حساب مقصد زیاد می‌شود (Transfer — نه هزینه)
 * - ردیابی مجازی: هیچ حسابی تغییر نمی‌کند
 */
export default function ContributionModal({ open, goal, onClose }: ContributionModalProps) {
  const { pushToast } = useFamily();
  const { accounts, accountById } = useFinance();
  const { addSavingsContribution } = usePlanning();

  const [amountRaw, setAmountRaw] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"virtual" | "transfer">("virtual");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const sameCurrencyAccounts = activeAccounts.filter((a) => a.currency === goal?.currency);

  useEffect(() => {
    if (!open) return;
    setAmountRaw("");
    setDate(todayISO());
    setNote("");
    setMode("virtual");
    setFromId(sameCurrencyAccounts[0]?.id ?? "");
    setToId(sameCurrencyAccounts[1]?.id ?? "");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal?.id]);

  if (!goal) return null;

  const amount = parseAmount(amountRaw);

  const save = () => {
    if (!amount || amount <= 0) return setError("مبلغ را درست وارد کنید.");
    if (mode === "transfer") {
      if (!fromId || !toId) return setError("حساب مبدأ و مقصد را انتخاب کنید.");
      if (fromId === toId) return setError("حساب مبدأ و مقصد نمی‌توانند یکی باشند.");
      const src = accountById(fromId);
      const dst = accountById(toId);
      if (src?.currency !== dst?.currency) return setError("انتقال بین ارزهای متفاوت پشتیبانی نمی‌شود.");
    }
    addSavingsContribution(goal.id, {
      amount,
      date,
      note: note.trim() || undefined,
      accountId: mode === "transfer" ? fromId : undefined,
      savingsAccountId: mode === "transfer" ? toId : undefined,
      asTransfer: mode === "transfer",
    });
    pushToast(mode === "transfer" ? "انتقال پس‌انداز ثبت شد" : "پس‌انداز ثبت شد (بدون تغییر حساب)");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`افزودن پس‌انداز — ${goal.title}`} subtitle="پس‌انداز هرگز به‌عنوان هزینه ثبت نمی‌شود">
      <div className="space-y-4">
        <div>
          <span className={labelCls}>نوع ثبت</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("virtual")} className={`flex-1 rounded-xl border p-3 text-start transition ${mode === "virtual" ? "border-pine-600 bg-pine-50 shadow-card" : "border-line bg-surface hover:border-pine-300"}`}>
              <span className="block text-xs font-extrabold text-ink">ردیابی مجازی</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-mute">فقط پیشرفت هدف ثبت می‌شود؛ موجودی حساب‌ها تغییر نمی‌کند.</span>
            </button>
            <button type="button" onClick={() => setMode("transfer")} className={`flex-1 rounded-xl border p-3 text-start transition ${mode === "transfer" ? "border-pine-600 bg-pine-50 shadow-card" : "border-line bg-surface hover:border-pine-300"}`}>
              <span className="block text-xs font-extrabold text-ink">انتقال واقعی</span>
              <span className="mt-0.5 block text-[10px] leading-4 text-mute">پول از یک حساب به حساب پس‌انداز منتقل می‌شود (نه هزینه، نه درآمد).</span>
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="ct-amount" className={labelCls}>مبلغ</label>
          <input id="ct-amount" inputMode="decimal" autoFocus value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
          {amount !== null && (
            <p className="mt-1 text-[11px] font-bold text-pine-700">{faNum(amount)} خوانده می‌شود</p>
          )}
        </div>

        {mode === "transfer" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="ct-from" className={labelCls}>از حساب</label>
              <select id="ct-from" value={fromId} onChange={(e) => { setFromId(e.target.value); setError(null); }} className={inputCls}>
                {sameCurrencyAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ct-to" className={labelCls}>به حساب (پس‌انداز)</label>
              <select id="ct-to" value={toId} onChange={(e) => { setToId(e.target.value); setError(null); }} className={inputCls}>
                {sameCurrencyAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {sameCurrencyAccounts.length < 2 && (
              <p className="col-span-2 rounded-lg bg-saffron-50 px-3 py-2 text-[11px] font-bold text-saffron-700">
                برای انتقال واقعی، حداقل دو حساب هم‌ارز لازم است.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="ct-date" className={labelCls}>تاریخ</label>
            <input id="ct-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ct-note" className={labelCls}>توضیح (اختیاری)</label>
            <input id="ct-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          </div>
        </div>

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
        <button onClick={save} className="w-full rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
          ثبت پس‌انداز
        </button>
      </div>
    </Modal>
  );
}
