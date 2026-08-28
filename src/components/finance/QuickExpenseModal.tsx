import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { useFinance } from "../../hooks/useFinance";
import { EXPENSE_CATEGORIES, getExpenseCategory } from "../../data/categories";
import { faNum, parseAmount, todayISO } from "../../utils/format";

interface QuickExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

/** ثبت سریع هزینه — حداقل کلیک برای استفاده روزمره */
export default function QuickExpenseModal({ open, onClose }: QuickExpenseModalProps) {
  const { family, pushToast } = useFamily();
  const { accounts, accountById, addTransaction } = useFinance();

  const [amountRaw, setAmountRaw] = useState("");
  const [memberId, setMemberId] = useState("household");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[1].label);
  const [subcategory, setSubcategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const subs = getExpenseCategory(category)?.subcategories ?? [];

  useEffect(() => {
    if (open) {
      setAmountRaw("");
      setMemberId("household");
      setCategory(EXPENSE_CATEGORIES[1].label);
      setSubcategory("");
      setAccountId(activeAccounts[0]?.id ?? "");
      setDate(todayISO());
      setNote("");
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!family) return null;

  const account = accountId ? accountById(accountId) : undefined;
  const amount = parseAmount(amountRaw);

  const save = () => {
    if (!amount || amount <= 0) return setError("مبلغ را درست وارد کنید.");
    if (!account) return setError("حساب پرداخت‌کننده را انتخاب کنید.");
    if (!date) return setError("تاریخ را مشخص کنید.");
    addTransaction({
      type: "expense",
      title: note.trim() || subcategory || category,
      amount,
      currency: account.currency,
      date,
      accountId: account.id,
      memberId: memberId === "household" ? undefined : memberId,
      category,
      subcategory: subcategory || undefined,
      description: note.trim() || undefined,
      status: "done",
    });
    pushToast(`هزینه «${category}» ثبت شد`);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="ثبت سریع هزینه" subtitle="موجودی حساب فوراً کم می‌شود">
      <div className="space-y-4">
        <div>
          <label htmlFor="qe-amount" className={labelCls}>مبلغ</label>
          <input
            id="qe-amount" inputMode="decimal" autoFocus value={amountRaw}
            onChange={(e) => { setAmountRaw(e.target.value); setError(null); }}
            placeholder="مثلاً 850000"
            className={`${inputCls} text-base font-extrabold`}
          />
          {amount !== null && (
            <p className="mt-1 text-[11px] font-bold text-pine-700">{faNum(amount)} خوانده می‌شود</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qe-member" className={labelCls}>متعلق به</label>
            <select id="qe-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="household">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qe-account" className={labelCls}>حساب</label>
            <select id="qe-account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(null); }} className={inputCls}>
              {activeAccounts.length === 0 && <option value="">حسابی نیست</option>}
              {activeAccounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qe-cat" className={labelCls}>دسته</label>
            <select id="qe-cat" value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }} className={inputCls}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.label}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="qe-sub" className={labelCls}>زیردسته</label>
            <select id="qe-sub" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={subs.length === 0} className={`${inputCls} disabled:bg-paper disabled:text-mute`}>
              <option value="">—</option>
              {subs.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="qe-date" className={labelCls}>تاریخ</label>
            <input id="qe-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="qe-note" className={labelCls}>توضیح کوتاه</label>
            <input id="qe-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="اختیاری — عنوان می‌شود" className={inputCls} />
          </div>
        </div>

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}

        <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-saffron-500 px-5 py-3.5 text-sm font-extrabold text-white shadow-card transition hover:bg-saffron-600 active:scale-[0.98]">
          <Zap size={16} />
          ثبت هزینه
        </button>
      </div>
    </Modal>
  );
}
