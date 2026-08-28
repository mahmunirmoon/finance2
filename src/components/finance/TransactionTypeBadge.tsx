import { ArrowDownLeft, ArrowLeftRight, ArrowUpLeft } from "lucide-react";
import type { TransactionType } from "../../types";

export const TYPE_META: Record<
  TransactionType,
  { label: string; badge: string; amount: string; sign: "+" | "−" | ""; icon: typeof ArrowDownLeft }
> = {
  income: { label: "درآمد", badge: "bg-success-soft text-success", amount: "text-success", sign: "+", icon: ArrowDownLeft },
  expense: { label: "هزینه", badge: "bg-danger-soft text-danger", amount: "text-danger", sign: "−", icon: ArrowUpLeft },
  transfer: { label: "انتقال", badge: "bg-pine-50 text-pine-700", amount: "text-pine-700", sign: "", icon: ArrowLeftRight },
};

export default function TransactionTypeBadge({ type }: { type: TransactionType }) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${meta.badge}`}>
      <Icon size={11} strokeWidth={3} />
      {meta.label}
    </span>
  );
}

export function TransactionStatusBadge({ status }: { status: "done" | "pending" }) {
  return status === "done" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2.5 py-1 text-[10px] font-extrabold text-ink-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-success" />
      تکمیل‌شده
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-saffron-100 px-2.5 py-1 text-[10px] font-extrabold text-saffron-700">
      <span className="h-1.5 w-1.5 rounded-full bg-saffron-500" />
      در انتظار
    </span>
  );
}

/** نشان مرجع مالی — تراکنش‌های متصل به بدهی/قسط/برنامه */
export function ReferenceBadge({ type }: { type?: string }) {
  if (!type) return null;
  const labels: Record<string, string> = {
    "debt-payment": "بازپرداخت بدهی",
    "receivable-collection": "دریافت طلب",
    "installment-payment": "قسط",
    "recurring-payment": "تکرارشونده",
    "savings-contribution": "پس‌انداز",
  };
  return (
    <span className="inline-flex items-center rounded-full bg-line/50 px-2 py-0.5 text-[9px] font-extrabold text-mute">
      {labels[type] ?? type}
    </span>
  );
}
