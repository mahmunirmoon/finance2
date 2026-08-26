import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { usePlanning } from "../../hooks/usePlanning";
import { PLAN_ITEM_STATUS_LABELS } from "../../data/planTemplates";
import { parseAmount } from "../../utils/format";
import type { FinancialPlanItem, PlanItemStatus } from "../../types";

interface PlanItemFormModalProps {
  open: boolean;
  planId: string;
  item: FinancialPlanItem | null;
  onClose: () => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

export default function PlanItemFormModal({ open, planId, item, onClose }: PlanItemFormModalProps) {
  const { pushToast } = useFamily();
  const { addPlanItem, updatePlanItem } = usePlanning();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<PlanItemStatus>("planned");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (item) {
      setTitle(item.title);
      setCategory(item.category ?? "");
      setAmountRaw(String(item.estimatedAmount));
      setDueDate(item.dueDate ?? "");
      setStatus(item.status);
      setNotes(item.notes ?? "");
    } else {
      setTitle("");
      setCategory("");
      setAmountRaw("");
      setDueDate("");
      setStatus("planned");
      setNotes("");
    }
  }, [open, item]);

  const save = () => {
    if (!title.trim()) return setError("عنوان آیتم را بنویسید.");
    const amount = parseAmount(amountRaw);
    if (amount === null || amount < 0) return setError("مبلغ تخمینی را درست وارد کنید.");

    const data = {
      title: title.trim(),
      category: category.trim() || undefined,
      estimatedAmount: amount,
      dueDate: dueDate || undefined,
      status,
      notes: notes.trim() || undefined,
    };
    if (item) {
      updatePlanItem(item.id, data);
      pushToast("آیتم به‌روزرسانی شد");
    } else {
      addPlanItem({ ...data, planId, transactionIds: [] });
      pushToast("آیتم به برنامه اضافه شد");
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? "ویرایش آیتم" : "آیتم جدید"} subtitle="مبلغ تخمینی فقط برنامه‌ریزی است؛ هزینه واقعی با ثبت تراکنش ثبت می‌شود">
      <div className="space-y-4">
        <div>
          <label htmlFor="pi-title" className={labelCls}>عنوان</label>
          <input id="pi-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="مثلاً شهریه ترم" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pi-cat" className={labelCls}>دسته (اختیاری)</label>
            <input id="pi-cat" value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pi-amount" className={labelCls}>مبلغ تخمینی</label>
            <input id="pi-amount" inputMode="decimal" value={amountRaw} onChange={(e) => { setAmountRaw(e.target.value); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pi-due" className={labelCls}>سررسید (اختیاری)</label>
            <input id="pi-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pi-status" className={labelCls}>وضعیت</label>
            <select id="pi-status" value={status} onChange={(e) => setStatus(e.target.value as PlanItemStatus)} className={inputCls}>
              {Object.entries(PLAN_ITEM_STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="pi-notes" className={labelCls}>یادداشت (اختیاری)</label>
          <textarea id="pi-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputCls} />
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
