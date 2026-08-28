import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { ACCOUNT_TYPE_OPTIONS } from "./AccountCard";
import { useFinance } from "../../hooks/useFinance";
import { useFamily } from "../../hooks/useFamily";
import { CURRENCIES } from "../../data/currencies";
import { parseAmount } from "../../utils/format";
import type { Account, CurrencyCode } from "../../types";

interface AccountFormModalProps {
  open: boolean;
  account: Account | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

export default function AccountFormModal({ open, account, onClose }: AccountFormModalProps) {
  const { addAccount, updateAccount } = useFinance();
  const { family, pushToast } = useFamily();

  const [name, setName] = useState("");
  const [type, setType] = useState("bank");
  const [customType, setCustomType] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [initialRaw, setInitialRaw] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (account) {
      setName(account.name);
      setType(account.type);
      setCustomType(account.customType ?? "");
      setCurrency(account.currency);
      setInitialRaw(String(account.initialBalance));
    } else {
      setName("");
      setType("bank");
      setCustomType("");
      setCurrency(family?.currency ?? "toman");
      setInitialRaw("0");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, account]);

  const save = () => {
    if (!name.trim()) return setError("نام حساب الزامی است.");
    if (type === "custom" && !customType.trim()) return setError("نوع حساب را بنویسید.");
    const initial = parseAmount(initialRaw);
    if (initial === null) return setError("موجودی اولیه را درست وارد کنید.");
    if (account) {
      updateAccount(account.id, { name: name.trim(), type, customType: customType.trim() || undefined, currency, initialBalance: initial });
      pushToast("حساب به‌روزرسانی شد");
    } else {
      addAccount({ name: name.trim(), type, customType: customType.trim() || undefined, currency, initialBalance: initial, isActive: true });
      pushToast(`حساب «${name.trim()}» ساخته شد`);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={account ? "ویرایش حساب" : "حساب جدید"} subtitle="موجودی فعلی همیشه از تراکنش‌ها محاسبه می‌شود">
      <div className="space-y-4">
        <div>
          <label htmlFor="acc-name" className={labelCls}>نام حساب</label>
          <input id="acc-name" value={name} onChange={(e) => { setName(e.target.value); setError(null); }} placeholder="مثلاً بانک ملت پدر" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="acc-type" className={labelCls}>نوع حساب</label>
            <select id="acc-type" value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {ACCOUNT_TYPE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="acc-currency" className={labelCls}>ارز</label>
            <select id="acc-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} disabled={!!account} className={`${inputCls} disabled:bg-paper disabled:text-mute`}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        {type === "custom" && (
          <div>
            <label htmlFor="acc-custom-type" className={labelCls}>نوع دلخواه</label>
            <input id="acc-custom-type" value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="مثلاً طلای آب‌شده" className={inputCls} />
          </div>
        )}
        <div>
          <label htmlFor="acc-initial" className={labelCls}>موجودی اولیه</label>
          <input id="acc-initial" inputMode="decimal" value={initialRaw} onChange={(e) => { setInitialRaw(e.target.value); setError(null); }} className={inputCls} />
          {account && (
            <p className="mt-1 text-[10px] text-mute">تغییر موجودی اولیه، موجودی فعلی (محاسبه‌شده از تراکنش‌ها) را تغییر می‌دهد.</p>
          )}
        </div>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
          <button onClick={save} className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
            ذخیره
          </button>
        </div>
      </div>
    </Modal>
  );
}
