import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { EXPENSE_CATEGORIES } from "../../data/categories";
import { CURRENCIES } from "../../data/currencies";
import { currentJalali, JALALI_MONTHS } from "../../utils/planning";
import { parseAmount } from "../../utils/format";
import type { Budget, BudgetScope, CurrencyCode } from "../../types";

interface BudgetFormModalProps {
  open: boolean;
  budget: Budget | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

const SCOPES: { id: BudgetScope; label: string; desc: string }[] = [
  { id: "family", label: "کل خانواده", desc: "سقف مجموع هزینه‌های خانواده" },
  { id: "member", label: "یک عضو", desc: "سقف هزینه‌های شخصی یک عضو" },
  { id: "category", label: "یک دسته", desc: "مثلاً سقف هزینه خوراک" },
  { id: "member-category", label: "عضو + دسته", desc: "مثلاً آموزشِ دختر خانواده" },
];

export default function BudgetFormModal({ open, budget, onClose }: BudgetFormModalProps) {
  const { family, pushToast } = useFamily();
  const { addBudget, updateBudget } = usePlanning();

  const now = currentJalali();
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState<BudgetScope>("family");
  const [memberId, setMemberId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
  const [year, setYear] = useState(now.jy);
  const [month, setMonth] = useState(now.jm);
  const [threshold, setThreshold] = useState(80);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (budget) {
      setTitle(budget.title);
      setScope(budget.scope);
      setMemberId(budget.memberId ?? "");
      setCategoryId(budget.categoryId ?? "");
      setAmountRaw(String(budget.amount));
      setCurrency(budget.currency);
      setPeriod(budget.period);
      setYear(budget.year);
      setMonth(budget.month ?? now.jm);
      setThreshold(budget.alertThreshold);
    } else {
      setTitle("");
      setScope("family");
      setMemberId(family?.members[0]?.id ?? "");
      setCategoryId(EXPENSE_CATEGORIES[1].label);
      setAmountRaw("");
      setCurrency(family?.currency ?? "toman");
      setPeriod("monthly");
      setYear(now.jy);
      setMonth(now.jm);
      setThreshold(80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, budget]);

  if (!family) return null;

  const needsMember = scope === "member" || scope === "member-category";
  const needsCategory = scope === "category" || scope === "member-category";

  const save = () => {
    if (!title.trim()) return setError("عنوان بودجه را بنویسید.");
    const amount = parseAmount(amountRaw);
    if (!amount || amount <= 0) return setError("مبلغ بودجه را درست وارد کنید.");
    if (needsMember && !memberId) return setError("عضو را انتخاب کنید.");
    if (needsCategory && !categoryId) return setError("دسته را انتخاب کنید.");
    if (threshold < 1 || threshold > 100) return setError("آستانه هشدار باید بین ۱ تا ۱۰۰ باشد.");

    const data = {
      title: title.trim(), scope, amount, currency, period, year,
      month: period === "monthly" ? month : undefined,
      memberId: needsMember ? memberId : undefined,
      categoryId: needsCategory ? categoryId : undefined,
      alertThreshold: threshold, isActive: true,
    };
    if (budget) {
      updateBudget(budget.id, data);
      pushToast("بودجه به‌روزرسانی شد");
    } else {
      addBudget(data);
      pushToast(`بودجه «${title.trim()}» ساخته شد`);
    }
    onClose();
  };

  const years = [now.jy - 1, now.jy, now.jy + 1];

  return (
    <Modal open={open} onClose={onClose} title={budget ? "ویرایش بودجه" : "بودجه جدید"} subtitle="بودجه فقط با هزینه‌های عملیاتی همان دوره سنجیده می‌شود" size="lg">
      <div className="space-y-4">
        <div>
          <span className={labelCls}>نوع بودجه</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setScope(s.id); setError(null); }}
                className={`rounded-xl border p-3 text-start transition-all duration-150 ${
                  scope === s.id ? "border-pine-600 bg-pine-50 shadow-card" : "border-line bg-surface hover:border-pine-300"
                }`}
              >
                <span className="block text-xs font-extrabold text-ink">{s.label}</span>
                <span className="mt-0.5 block text-[10px] leading-4 text-mute">{s.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="bd-title" className={labelCls}>عنوان</label>
            <input id="bd-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً خوراک خانواده" className={inputCls} />
          </div>
          {needsMember && (
            <div>
              <label htmlFor="bd-member" className={labelCls}>عضو</label>
              <select id="bd-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
                {family.members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
          {needsCategory && (
            <div>
              <label htmlFor="bd-cat" className={labelCls}>دسته هزینه</label>
              <select id="bd-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="bd-amount" className={labelCls}>مبلغ</label>
            <input id="bd-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="bd-currency" className={labelCls}>ارز</label>
            <select id="bd-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bd-period" className={labelCls}>دوره</label>
            <select id="bd-period" value={period} onChange={(e) => setPeriod(e.target.value as "monthly" | "yearly")} className={inputCls}>
              <option value="monthly">ماهانه</option>
              <option value="yearly">سالانه</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="bd-year" className={labelCls}>سال</label>
              <select id="bd-year" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputCls}>
                {years.map((y) => (
                  <option key={y} value={y}>{y.toLocaleString("fa-IR")}</option>
                ))}
              </select>
            </div>
            {period === "monthly" && (
              <div>
                <label htmlFor="bd-month" className={labelCls}>ماه</label>
                <select id="bd-month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputCls}>
                  {JALALI_MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="bd-threshold" className={labelCls}>آستانه هشدار: {threshold.toLocaleString("fa-IR")}٪</label>
            <input id="bd-threshold" type="range" min={10} max={100} step={5} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="w-full accent-pine-600" />
          </div>
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
