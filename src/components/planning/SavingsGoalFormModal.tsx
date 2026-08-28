import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { CURRENCIES } from "../../data/currencies";
import { GOAL_STATUS_LABELS } from "../../data/planTemplates";
import { parseAmount } from "../../utils/format";
import type { CurrencyCode, SavingsGoal, SavingsGoalStatus } from "../../types";

interface SavingsGoalFormModalProps {
  open: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

export default function SavingsGoalFormModal({ open, goal, onClose }: SavingsGoalFormModalProps) {
  const { family, pushToast } = useFamily();
  const { financialPlans, addSavingsGoal, updateSavingsGoal } = usePlanning();

  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [planId, setPlanId] = useState("");
  const [targetMode, setTargetMode] = useState<"fixed" | "months">("fixed");
  const [amountRaw, setAmountRaw] = useState("");
  const [months, setMonths] = useState(6);
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState<SavingsGoalStatus>("active");
  const [isEmergency, setIsEmergency] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (goal) {
      setTitle(goal.title);
      setMemberId(goal.memberId ?? "");
      setPlanId(goal.financialPlanId ?? "");
      setTargetMode(goal.targetMode);
      setAmountRaw(String(goal.targetAmount));
      setMonths(goal.months ?? 6);
      setCurrency(goal.currency);
      setTargetDate(goal.targetDate ?? "");
      setStatus(goal.status);
      setIsEmergency(!!goal.isEmergency);
    } else {
      setTitle("");
      setMemberId("");
      setPlanId("");
      setTargetMode("fixed");
      setAmountRaw("");
      setMonths(6);
      setCurrency(family?.currency ?? "toman");
      setTargetDate("");
      setStatus("active");
      setIsEmergency(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, goal]);

  if (!family) return null;

  const save = () => {
    if (!title.trim()) return setError("عنوان هدف را بنویسید.");
    const amount = parseAmount(amountRaw);
    if (!amount || amount <= 0) return setError("مبلغ هدف را درست وارد کنید.");
    if (targetMode === "months" && (months < 1 || months > 24)) return setError("تعداد ماه باید بین ۱ تا ۲۴ باشد.");

    const data = {
      title: title.trim(),
      memberId: memberId || undefined,
      financialPlanId: planId || undefined,
      targetMode,
      targetAmount: amount,
      months: targetMode === "months" ? months : undefined,
      currency,
      targetDate: targetDate || undefined,
      status,
      isEmergency: isEmergency || undefined,
    };
    if (goal) {
      updateSavingsGoal(goal.id, data);
      pushToast("هدف پس‌انداز به‌روزرسانی شد");
    } else {
      addSavingsGoal(data);
      pushToast(`هدف «${title.trim()}» ساخته شد`);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={goal ? "ویرایش هدف پس‌انداز" : "هدف پس‌انداز جدید"} subtitle="پس‌انداز هزینه جعلی نیست؛ فقط با مشارکت واقعی پیشرفت می‌کند">
      <div className="space-y-4">
        <div>
          <label htmlFor="sg-title" className={labelCls}>عنوان</label>
          <input id="sg-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً پس‌انداز خودرو" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sg-member" className={labelCls}>عضو (اختیاری)</label>
            <select id="sg-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sg-plan" className={labelCls}>اتصال به برنامه (اختیاری)</label>
            <select id="sg-plan" value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputCls}>
              <option value="">—</option>
              {financialPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>
          <div>
            <span className={labelCls}>روش تعیین هدف</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setTargetMode("fixed")} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-extrabold transition ${targetMode === "fixed" ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-surface text-mute"}`}>
                مبلغ ثابت
              </button>
              <button type="button" onClick={() => setTargetMode("months")} className={`flex-1 rounded-lg border px-3 py-2 text-xs font-extrabold transition ${targetMode === "months" ? "border-pine-600 bg-pine-50 text-pine-700" : "border-line bg-surface text-mute"}`}>
                چند ماه هزینه
              </button>
            </div>
          </div>
          {targetMode === "fixed" ? (
            <div>
              <label htmlFor="sg-amount" className={labelCls}>مبلغ هدف</label>
              <input id="sg-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
            </div>
          ) : (
            <div>
              <label htmlFor="sg-months" className={labelCls}>پوشش چند ماه هزینه؟</label>
              <input id="sg-months" type="number" min={1} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value))} className={inputCls} />
            </div>
          )}
          <div>
            <label htmlFor="sg-currency" className={labelCls}>ارز</label>
            <select id="sg-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} className={inputCls}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sg-status" className={labelCls}>وضعیت</label>
            <select id="sg-status" value={status} onChange={(e) => setStatus(e.target.value as SavingsGoalStatus)} className={inputCls}>
              {Object.entries(GOAL_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sg-date" className={labelCls}>تاریخ هدف (اختیاری)</label>
            <input id="sg-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-paper/70 px-3.5 py-3">
          <input type="checkbox" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)} className="h-4 w-4 accent-pine-600" />
          <span className="text-xs font-bold text-ink-soft">این هدف، صندوق اضطراری خانواده است</span>
        </label>
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
          <button onClick={save} className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">ذخیره</button>
        </div>
      </div>
    </Modal>
  );
}
