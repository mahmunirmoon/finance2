import type { CurrencyCode } from "../../types";
import { IncomeExpenseChart, CategoryDonut, type SeriesPoint } from "./index";

export interface DashboardChartsProps {
  series: SeriesPoint[];
  categories: { name: string; value: number }[];
  currency: CurrencyCode;
}

/** نمودارهای داشبورد — lazy-load می‌شود تا Recharts در bundle اولیه نباشد */
export default function DashboardCharts({ series, categories, currency }: DashboardChartsProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h3 className="mb-3 text-sm font-extrabold text-ink">درآمد و هزینه — ۶ ماه اخیر</h3>
        <IncomeExpenseChart data={series} currency={currency} />
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <h3 className="mb-3 text-sm font-extrabold text-ink">هزینه‌ها بر اساس دسته</h3>
        <CategoryDonut data={categories} currency={currency} />
      </div>
    </div>
  );
}
