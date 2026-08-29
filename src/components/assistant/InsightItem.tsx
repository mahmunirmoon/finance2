import {
  AlertTriangle, CalendarClock, Lightbulb, PiggyBank, ShieldCheck, TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FinancialInsight, InsightPriority, InsightType } from "../../utils/insights";

const PRIORITY_STYLE: Record<
  InsightPriority,
  { chip: string; tag: string; bar: string; label: string }
> = {
  critical: { chip: "bg-danger-soft text-danger", tag: "bg-danger-soft text-danger", bar: "bg-danger", label: "بحرانی" },
  warning: { chip: "bg-saffron-100 text-saffron-600", tag: "bg-saffron-100 text-saffron-700", bar: "bg-saffron-400", label: "هشدار" },
  opportunity: { chip: "bg-success-soft text-success", tag: "bg-success-soft text-success", bar: "bg-success", label: "فرصت" },
  info: { chip: "bg-pine-50 text-pine-600", tag: "bg-paper text-ink-soft", bar: "bg-pine-300", label: "اطلاع" },
};

const TYPE_ICON: Record<InsightType, LucideIcon> = {
  "spending-trend": TrendingUp,
  "budget-warning": AlertTriangle,
  "upcoming-payments": CalendarClock,
  "debt-alert": AlertTriangle,
  "installment-alert": CalendarClock,
  "savings-goal": PiggyBank,
  "emergency-fund": ShieldCheck,
  "top-expense": TrendingUp,
  "member-spending": TrendingUp,
  "plan-progress": Lightbulb,
};

/** نمایش یک Insight — آیکن بر اساس نوع، رنگ بر اساس اولویت */
export default function InsightItem({ insight }: { insight: FinancialInsight }) {
  const Icon = TYPE_ICON[insight.type];
  const s = PRIORITY_STYLE[insight.priority];

  return (
    <div className="relative flex items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface p-3.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-pine-300 hover:shadow-pop">
      <span className={`absolute inset-y-0 start-0 w-1 ${s.bar}`} aria-hidden="true" />
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${s.chip}`}>
        <Icon size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-[13px] font-extrabold text-ink">{insight.title}</h4>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${s.tag}`}>{s.label}</span>
        </div>
        <p className="mt-1 text-xs font-semibold leading-6 text-ink-soft">{insight.message}</p>
      </div>
    </div>
  );
}
