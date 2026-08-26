import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpLeft, Check } from "lucide-react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { useFinance } from "../../hooks/useFinance";
import type { CurrencyCode, Transaction, TransactionType } from "../../types";
import {
  CUSTOM_CATEGORY_VALUE, EXPENSE_CATEGORIES, INCOME_CATEGORIES, getExpenseCategory,
} from "../../data/categories";
import { getCurrency } from "../../data/currencies";
import { faNum, parseAmount, todayISO } from "../../utils/format";
import { TYPE_META } from "./TransactionTypeBadge";

interface TransactionFormModalProps {
  open: boolean;
  editing: Transaction | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

const TYPES: { id: TransactionType; label: string; icon: typeof ArrowDownLeft; active: string }[] = [
  { id: "income", label: "درآمد", icon: ArrowDownLeft, active: "bg-success text-white" },
  { id: "expense", label: "هزینه", icon: ArrowUpLeft, active: "bg-danger text-white" },
  { id: "transfer", label: "انتقال", icon: ArrowLeftRight, active: "bg-pine-600 text-white" },
];

/** فرم ثبت / ویرایش تراکنش — فرم بر اساس نوع تغییر می‌کند */
export default function TransactionFormModal({ open, editing, onClose }: TransactionFormModalProps) {
  const { family, pushToast } = useFamily();
  const { accounts, accountById, addTransaction, updateTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>("expense");
  const [title, setTitle] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [date, setDate] = useState(todayISO());
  const [memberId, setMemberId] = useState("household");
  const [accountId, setAccountId] = useState("");
  const [destAccountId, setDestAccountId] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = useMemo(() => {
    const list = accounts.filter((a) => a.isActive);
    if (editing) {
      for (const id of [editing.accountId, editing.destinationAccountId]) {
        if (id && !list.some((a) => a.id === id) && accountById(id)) {
          const acc = accountById(id);
          if (acc) list.push(acc);
        }
      }
    }
    return list;
  }, [accounts, editing, accountById]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setType(editing.type);
      setTitle(editing.title);
      setAmountRaw(String(editing.amount));
      setDate(editing.date);
      setMemberId(editing.memberId ?? "household");
      setAccountId(editing.accountId);
      setDestAccountId(editing.destinationAccountId ?? "");
      const knownIncome = INCOME_CATEGORIES.includes(editing.category ?? "");
      const knownExpense = EXPENSE_CATEGORIES.some((c) => c.label === editing.category);
      if (editing.category && !knownIncome && !knownExpense) {
        setCategory(CUSTOM_CATEGORY_VALUE);
        setCustomCategory(editing.category);
      } else {
        setCategory(editing.category ?? "");
        setCustomCategory("");
      }
      setSubcategory(editing.subcategory ?? "");
      setDescription(editing.description ?? "");
    } else {
      setType("expense");
      setTitle("");
      setAmountRaw("");
      setDate(todayISO());
      setMemberId("household");
      setAccountId(activeAccounts[0]?.id ?? "");
      setDestAccountId(activeAccounts[1]?.id ?? "");
      setCategory(EXPENSE_CATEGORIES[1].label);
      setCustomCategory("");
      setSubcategory("");
      setDescription("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const amount = parseAmount(amountRaw);
  const account = accountId ? accountById(accountId) : undefined;
  const destAccount = destAccountId ? accountById(destAccountId) : undefined;

  const subs = type === "expense" ? (getExpenseCategory(category)?.subcategories ?? []) : [];
  const categoryOptions = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES.map((c) => c.label);
  const currencyMismatch =
    type === "transfer" && !!account && !!destAccount && account.currency !== destAccount.currency;

  if (!family) return null;

  const save = () => {
    if (!amount || amount <= 0) return setError("مبلغ باید عددی بزرگ‌تر از صفر باشد.");
    if (!date) return setError("تاریخ الزامی است.");

    if (type === "transfer") {
      if (!account) return setError("حساب مبدا را انتخاب کنید.");
      if (!destAccount) return setError("حساب مقصد را انتخاب کنید.");
      if (account.id === destAccount.id) return setError("حساب مبدا و مقصد نمی‌توانند یکی باشند.");
      if (currencyMismatch) return setError("انتقال بین ارزهای متفاوت در نسخه فعلی پشتیبانی نمی‌شود.");
    } else if (!account) {
      return setError("حساب را انتخاب کنید.");
    }

    const finalCategory = category === CUSTOM_CATEGORY_VALUE ? customCategory.trim() : category;
    if (type !== "transfer" && !finalCategory) return setError("دسته‌بندی را مشخص کنید.");
    if (category === CUSTOM_CATEGORY_VALUE && !customCategory.trim()) return setError("نام دسته دلخواه را بنویسید.");
    if (!title.trim()) return setError("عنوان تراکنش را بنویسید.");

    const base = {
      title: title.trim(),
      amount,
      currency: (account?.currency ?? "toman") as CurrencyCode,
      date,
      memberId: type === "transfer" ? undefined : memberId === "household" ? undefined : memberId,
      accountId: account?.id ?? "",
      status: "done" as const,
    };

    if (editing) {
      if (type === "transfer") {
        updateTransaction(editing.id, {
          ...base, type, destinationAccountId: destAccount?.id, category: undefined,
          subcategory: undefined, description: description.trim() || undefined,
        });
      } else {
        updateTransaction(editing.id, {
          ...base, type, destinationAccountId: undefined,
          category: finalCategory || undefined,
          subcategory: subcategory || undefined,
          description: description.trim() || undefined,
        });
      }
      pushToast("تراکنش به‌روزرسانی شد و موجودی‌ها اصلاح شد");
    } else {
      if (type === "transfer") {
        addTransaction({ ...base, type, destinationAccountId: destAccount?.id, description: description.trim() || undefined });
      } else {
        addTransaction({
          ...base, type,
          category: finalCategory || undefined,
          subcategory: subcategory || undefined,
          description: description.trim() || undefined,
        });
      }
      pushToast(type === "income" ? "درآمد ثبت شد" : type === "expense" ? "هزینه ثبت شد" : "انتقال انجام شد");
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "ویرایش تراکنش" : "ثبت تراکنش"}
      subtitle={account ? `حساب: ${account.name} · ارز: ${getCurrency(account.currency).short}` : undefined}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="نوع تراکنش">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const on = t.id === type;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={on}
                onClick={() => { setType(t.id); setError(null); }}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold transition-all duration-150 ${
                  type === t.id ? `${t.active} border-transparent shadow-card` : "border-line bg-surface text-mute hover:text-ink"
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="tx-title" className={labelCls}>عنوان</label>
            <input id="tx-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً خرید سوپرمارکت" className={inputCls} />
          </div>
          <div>
            <label htmlFor="tx-amount" className={labelCls}>مبلغ</label>
            <input id="tx-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
            {amount !== null && (
              <p className="mt-1 text-[10px] font-bold text-pine-700">{faNum(amount)} خوانده می‌شود</p>
            )}
          </div>
          <div>
            <label htmlFor="tx-date" className={labelCls}>تاریخ</label>
            <input id="tx-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </div>
        </div>

        {type !== "transfer" && (
          <div>
            <label htmlFor="tx-member" className={labelCls}>متعلق به چه کسی؟</label>
            <select id="tx-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="household">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        )}

        {type === "transfer" ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="tx-from" className={labelCls}>از حساب</label>
              <select id="tx-from" value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(null); }} className={inputCls}>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({getCurrency(a.currency).short})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="tx-to" className={labelCls}>به حساب</label>
              <select id="tx-to" value={destAccountId} onChange={(e) => { setDestAccountId(e.target.value); setError(null); }} className={inputCls}>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({getCurrency(a.currency).short})</option>
                ))}
              </select>
            </div>
            {currencyMismatch && (
              <p className="col-span-2 rounded-lg bg-saffron-50 px-3 py-2 text-xs font-bold text-saffron-700">
                انتقال بین ارزهای متفاوت در نسخه فعلی پشتیبانی نمی‌شود.
              </p>
            )}
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="tx-account" className={labelCls}>
                {type === "income" ? "حساب مقصد (دریافت‌کننده)" : "حساب پرداخت‌کننده"}
              </label>
              <select id="tx-account" value={accountId} onChange={(e) => { setAccountId(e.target.value); setError(null); }} className={inputCls}>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({getCurrency(a.currency).short})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tx-category" className={labelCls}>دسته‌بندی</label>
                <select id="tx-category" value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); setError(null); }} className={inputCls}>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value={CUSTOM_CATEGORY_VALUE}>دسته دلخواه…</option>
                </select>
              </div>
              {category === CUSTOM_CATEGORY_VALUE ? (
                <div>
                  <label htmlFor="tx-custom-cat" className={labelCls}>نام دسته دلخواه</label>
                  <input id="tx-custom-cat" value={customCategory} onChange={(e) => { setCustomCategory(e.target.value); setError(null); }} className={inputCls} />
                </div>
              ) : (
                type === "expense" && (
                  <div>
                    <label htmlFor="tx-sub" className={labelCls}>زیردسته</label>
                    <select id="tx-sub" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} disabled={subs.length === 0} className={`${inputCls} disabled:bg-paper disabled:text-mute`}>
                      <option value="">—</option>
                      {subs.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )
              )}
            </div>
          </>
        )}

        <div>
          <label htmlFor="tx-desc" className={labelCls}>توضیح (اختیاری)</label>
          <textarea id="tx-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
        </div>

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
          <button onClick={save} className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-card transition active:scale-[0.98] ${type === "income" ? "bg-success hover:brightness-95" : type === "expense" ? "bg-danger hover:brightness-95" : "bg-pine-600 hover:bg-pine-700"}`}>
            <Check size={15} strokeWidth={3} />
            {editing ? "ذخیره تغییرات" : `ثبت ${TYPE_META[type].label}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
