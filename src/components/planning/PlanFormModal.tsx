import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { CURRENCIES } from "../../data/currencies";
import { PLAN_TYPES, PLAN_ITEM_SUGGESTIONS, PLAN_STATUS_LABELS } from "../../data/planTemplates";
import { parseAmount, todayISO } from "../../utils/format";
import { addMonthsISO } from "../../utils/planning";
import type { CurrencyCode, FinancialPlan, FinancialPlanStatus, FinancialPlanType } from "../../types";

interface PlanFormModalProps {
  open: boolean;
  plan: FinancialPlan | null;
  onClose: () => void;
  /** بعد از ساخت، برای باز کردن صفحه جزئیات */
  onCreated?: (id: string) => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

export default function PlanFormModal({ open, plan, onClose, onCreated }: PlanFormModalProps) {
  const { family, pushToast } = useFamily();
  const { addFinancialPlan, updateFinancialPlan, addPlanItem } = usePlanning();

  const [type, setType] = useState<FinancialPlanType>("custom");
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [description, setDescription] = useState("");
  const [budgetRaw, setBudgetRaw] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [startDate, setStartDate] = useState(todayISO());
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<FinancialPlanStatus>("planning");
  const [useSuggestions, setUseSuggestions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (plan) {
      setType(plan.type);
      setTitle(plan.title);
      setMemberId(plan.memberId ?? "");
      setDescription(plan.description ?? "");
      setBudgetRaw(String(plan.estimatedBudget));
      setCurrency(plan.currency);
      setStartDate(plan.startDate ?? todayISO());
      setTargetDate(plan.targetDate ?? "");
      setStatus(plan.status);
    } else {
      setType("custom");
      setTitle("");
      setMemberId("");
      setDescription("");
      setBudgetRaw("");
      setCurrency(family?.currency ?? "toman");
      setStartDate(todayISO());
      setTargetDate(addMonthsISO(todayISO(), 6));
      setStatus("planning");
      setUseSuggestions(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan]);

  if (!family) return null;

  const suggestions = PLAN_ITEM_SUGGESTIONS[type] ?? [];

  const save = () => {
    if (!title.trim()) return setError("عنوان برنامه را بنویسید.");
    const budget = parseAmount(budgetRaw);
    if (!budget || budget <= 0) return setError("بودجه تخمینی را درست وارد کنید.");

    const data = {
      type,
      title: title.trim(),
      memberId: memberId || undefined,
      description: description.trim() || undefined,
      estimatedBudget: budget,
      currency,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
      status,
    };

    if (plan) {
      updateFinancialPlan(plan.id, data);
      pushToast("برنامه مالی به‌روزرسانی شد");
      onClose();
    } else {
      const id = addFinancialPlan(data);
      // آیتم‌های پیشنهادی Template — فقط پیش‌پر کردن، نه قانون مالی
      if (useSuggestions && suggestions.length > 0) {
        suggestions.slice(0, 6).forEach((s, i) => {
          addPlanItem({
            planId: id,
            title: s,
            estimatedAmount: Math.round(budget / Math.min(suggestions.length, 6) / 10000) * 10000 || 0,
            status: "planned",
            dueDate: startDate ? addMonthsISO(startDate, i) : undefined,
            transactionIds: [],
          });
        });
      }
      pushToast(`برنامه «${title.trim()}» ساخته شد`);
      onClose();
      onCreated?.(id);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? "ویرایش برنامه مالی" : "برنامه مالی جدید"} subtitle="برنامه‌های زندگی روی موتور مشترک ساخته می‌شوند — هزینه تخمینی تا ثبت تراکنش واقعی، موجودی را تغییر نمی‌دهد" size="lg">
      <div className="space-y-4">
        {!plan && (
          <div>
            <span className={labelCls}>نوع برنامه</span>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {PLAN_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition-all duration-150 ${
                    type === t.type ? "border-pine-600 bg-pine-50 shadow-card" : "border-line bg-surface hover:border-pine-300"
                  }`}
                >
                  <span className="block text-lg leading-6">{t.emoji}</span>
                  <span className="mt-0.5 block text-[10px] font-extrabold text-ink">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="fp-title" className={labelCls}>عنوان</label>
            <input id="fp-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً دانشگاه دختر خانواده" className={inputCls} />
          </div>
          <div>
            <label htmlFor="fp-member" className={labelCls}>عضو مرتبط (اختیاری)</label>
            <select id="fp-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fp-status" className={labelCls}>وضعیت</label>
            <select id="fp-status" value={status} onChange={(e) => setStatus(e.target.value as FinancialPlanStatus)} className={inputCls}>
              {Object.entries(PLAN_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fp-budget" className={labelCls}>بودجه تخمینی</label>
            <input id="fp-budget" inputMode="decimal" value={budgetRaw} onChange={(e) => { setBudgetRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="fp-currency" className={labelCls}>ارز</label>
            <select id="fp-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fp-start" className={labelCls}>تاریخ شروع</label>
            <input id="fp-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="fp-target" className={labelCls}>تاریخ هدف</label>
            <input id="fp-target" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputCls} />
          </div>
          <div className="col-span-2">
            <label htmlFor="fp-desc" className={labelCls}>توضیح (اختیاری)</label>
            <textarea id="fp-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>

        {!plan && suggestions.length > 0 && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-paper/70 px-3.5 py-3">
            <input type="checkbox" checked={useSuggestions} onChange={(e) => setUseSuggestions(e.target.checked)} className="h-4 w-4 accent-pine-600" />
            <span className="text-xs font-bold text-ink-soft">
              آیتم‌های پیشنهادی «{PLAN_TYPES.find((t) => t.type === type)?.label}» اضافه شود ({suggestions.length.toLocaleString("fa-IR")} پیشنهاد — فقط چند مورد اول)
            </span>
          </label>
        )}

        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
          <button onClick={save} className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
            {plan ? "ذخیره تغییرات" : "ساخت برنامه"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
