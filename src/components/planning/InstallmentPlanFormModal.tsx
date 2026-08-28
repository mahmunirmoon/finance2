import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { CURRENCIES } from "../../data/currencies";
import { faNum, parseAmount, todayISO } from "../../utils/format";
import type { CurrencyCode, InstallmentFrequency, InstallmentPlan } from "../../types";

interface InstallmentPlanFormModalProps {
  open: boolean;
  plan: InstallmentPlan | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

export default function InstallmentPlanFormModal({ open, plan, onClose }: InstallmentPlanFormModalProps) {
  const { family, pushToast } = useFamily();
  const { addInstallmentPlan, updateInstallmentPlan } = usePlanning();

  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState("");
  const [totalRaw, setTotalRaw] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("toman");
  const [count, setCount] = useState(6);
  const [perRaw, setPerRaw] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [frequency, setFrequency] = useState<InstallmentFrequency>("monthly");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (plan) {
      setTitle(plan.title);
      setMemberId(plan.memberId ?? "");
      setTotalRaw(String(plan.totalAmount));
      setCurrency(plan.currency);
      setCount(plan.installmentCount);
      setPerRaw(String(plan.installmentAmount));
      setStartDate(plan.startDate);
      setFrequency(plan.frequency);
    } else {
      setTitle("");
      setMemberId("");
      setTotalRaw("");
      setCurrency(family?.currency ?? "toman");
      setCount(6);
      setPerRaw("");
      setStartDate(todayISO());
      setFrequency("monthly");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan]);

  if (!family) return null;

  const total = parseAmount(totalRaw);
  const per = parseAmount(perRaw) ?? (total && count > 0 ? Math.round(total / count) : null);

  const save = () => {
    if (!title.trim()) return setError("عنوان طرح را بنویسید.");
    if (!total || total <= 0) return setError("مبلغ کل را درست وارد کنید.");
    if (!per || per <= 0) return setError("مبلغ هر قسط را درست وارد کنید.");
    if (count < 1 || count > 120) return setError("تعداد اقساط باید بین ۱ تا ۱۲۰ باشد.");
    if (!startDate) return setError("تاریخ اولین قسط را مشخص کنید.");

    const data = {
      title: title.trim(),
      memberId: memberId || undefined,
      totalAmount: total,
      currency,
      installmentCount: count,
      installmentAmount: per,
      startDate,
      frequency,
      isActive: true,
    };
    if (plan) {
      updateInstallmentPlan(plan.id, data);
      pushToast("طرح قسط به‌روزرسانی شد (برنامه اقساط حفظ شد)");
    } else {
      addInstallmentPlan(data);
      pushToast(`طرح «${title.trim()}» با ${faNum(count)} قسط ساخته شد`);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={plan ? "ویرایش طرح قسط" : "طرح قسط جدید"} subtitle="بعد از ذخیره، برنامه اقساط به‌صورت خودکار تولید می‌شود" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="ip-title" className={labelCls}>عنوان</label>
            <input id="ip-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً لپ‌تاپ علی" className={inputCls} />
          </div>
          <div>
            <label htmlFor="ip-member" className={labelCls}>عضو (اختیاری)</label>
            <select id="ip-member" value={memberId} onChange={(e) => setMemberId(e.target.value)} className={inputCls}>
              <option value="">کل خانواده</option>
              {family.members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ip-currency" className={labelCls}>ارز</label>
            <select id="ip-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)} disabled={!!plan} className={`${inputCls} disabled:bg-paper disabled:text-mute`}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ip-total" className={labelCls}>مبلغ کل</label>
            <input id="ip-total" inputMode="decimal" value={totalRaw} onChange={(e) => { setTotalRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ip-count" className={labelCls}>تعداد اقساط</label>
            <input id="ip-count" type="number" min={1} max={120} value={count} onChange={(e) => setCount(Number(e.target.value))} disabled={!!plan} className={`${inputCls} disabled:bg-paper disabled:text-mute`} />
          </div>
          <div>
            <label htmlFor="ip-per" className={labelCls}>مبلغ هر قسط</label>
            <input id="ip-per" inputMode="decimal" value={perRaw} onChange={(e) => { setPerRaw(e.target.value); setError(null); }} placeholder={per ? String(per) : ""} className={inputCls} />
          </div>
          <div>
            <label htmlFor="ip-start" className={labelCls}>تاریخ اولین قسط</label>
            <input id="ip-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={!!plan} className={`${inputCls} disabled:bg-paper disabled:text-mute`} />
          </div>
          <div>
            <label htmlFor="ip-freq" className={labelCls}>فاصله اقساط</label>
            <select id="ip-freq" value={frequency} onChange={(e) => setFrequency(e.target.value as InstallmentFrequency)} disabled={!!plan} className={`${inputCls} disabled:bg-paper disabled:text-mute`}>
              <option value="monthly">ماهانه</option>
              <option value="quarterly">سه‌ماهه</option>
            </select>
          </div>
        </div>
        {plan && (
          <p className="rounded-lg bg-paper px-3 py-2 text-[11px] font-bold text-mute">
            برای حفظ یکپارچگی اقساط پرداخت‌شده، در ویرایش فقط عنوان، مبلغ‌ها و عضو قابل تغییرند.
          </p>
        )}
        {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
          <button onClick={save} className="rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
            {plan ? "ذخیره تغییرات" : "ساخت طرح و تولید اقساط"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
