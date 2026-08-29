import { ArrowLeft, Sparkles } from "lucide-react";
import type { FinancialInsight } from "../../utils/insights";
import InsightItem from "./InsightItem";

interface SmartAssistantCardProps {
  insights: FinancialInsight[];
  hasData: boolean;
  onOpen: () => void;
}

/** کارت هوش کمکی در داشبورد — کاملاً محلی، بدون هیچ API */
export default function SmartAssistantCard({ insights, hasData, onOpen }: SmartAssistantCardProps) {
  const active = hasData && insights.length > 0;
  const top = insights[0];

  return (
    <button
      onClick={onOpen}
      className="animate-fade-up group relative w-full overflow-hidden rounded-2xl bg-pine-800 p-5 text-start text-pine-50 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron-400"
    >
      {/* لایه‌های پس‌زمینه */}
      <span className="pointer-events-none absolute -end-10 -top-12 h-36 w-36 rounded-full bg-pine-700/70 blur-sm" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-14 -start-8 h-32 w-32 rounded-full bg-pine-900/60 blur-sm" aria-hidden="true" />
      <Sparkles size={110} className="pointer-events-none absolute -bottom-5 end-2 rotate-12 text-pine-700/40 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-saffron-400/15 text-saffron-300 ring-1 ring-saffron-400/40">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 className="font-display text-xl leading-6 text-white">هوش کمکی</h2>
              <p className="mt-0.5 text-[10px] font-bold text-pine-200">پیشنهاد‌های هوشمند بودجه و پس‌انداز</p>
            </div>
          </div>
          {active ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-black text-[#8fe3b8] ring-1 ring-success/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8fe3b8] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#8fe3b8]" />
              </span>
              فعال
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full bg-pine-700 px-2.5 py-1 text-[10px] font-black text-pine-200 ring-1 ring-pine-600">
              نیاز به داده بیشتر
            </span>
          )}
        </div>

        {active && top ? (
          <div className="mt-4 rounded-xl border border-pine-600/70 bg-pine-900/60 p-3.5">
            <p className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wide text-saffron-300">
              مهم‌ترین پیشنهاد امروز
            </p>
            <div className="mt-2">
              <InsightItem insight={top} />
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-pine-600/70 bg-pine-900/60 p-3.5 text-[11px] font-semibold leading-6 text-pine-200">
            هنوز داده کافی برای تحلیل وجود ندارد. چند تراکنش، بودجه یا هدف مالی ثبت کنید تا
            پیشنهاد‌های هوشمند نمایش داده شوند.
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold text-pine-300">
            {active ? `${insights.length.toLocaleString("fa-IR")} تحلیل و پیشنهاد آماده است` : "کاملاً آفلاین و مبتنی بر داده‌های شما"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-400 px-3.5 py-2 text-[11px] font-black text-pine-900 transition-all duration-200 group-hover:gap-2.5 group-hover:bg-saffron-300">
            مشاهده پیشنهاد‌ها
            <ArrowLeft size={13} strokeWidth={3} />
          </span>
        </div>
      </div>
    </button>
  );
}
