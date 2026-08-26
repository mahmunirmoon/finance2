import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import type { CurrencyCode } from "../../types";
import { CHART_PALETTE } from "../../data/categories";
import { faNum } from "../../utils/format";
import { getCurrency } from "../../data/currencies";

/* ─────────────────────────────────────────────────────────────
   نمودارها (Mission 5) — Recharts
   نمودارها داخل dir="ltr" رندر می‌شوند تا محورهای زمانی صحیح باشند؛
   برچسب‌ها و Tooltipها فارسی و با ارقام فارسی‌اند.
   ───────────────────────────────────────────────────────────── */

const COLORS = { income: "#2f8f5f", expense: "#bf4638", net: "#146855" };

function MoneyTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: { name: string; value: number; color?: string }[];
  label?: string;
  currency: CurrencyCode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div dir="rtl" className="rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-pop">
      {label && <p className="mb-1 text-[11px] font-extrabold text-ink">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-[11px] font-bold text-ink-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {faNum(Math.round(p.value))} {getCurrency(currency).short}
        </p>
      ))}
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-line-strong bg-paper/40 text-center">
      <p className="text-xs font-bold text-mute">{message}</p>
      <p className="mt-1 text-[10px] text-mute">برای این بازه داده‌ای وجود ندارد.</p>
    </div>
  );
}

const tick = { fontSize: 10, fill: "#74867c", fontFamily: "Vazirmatn" };
const faTick = (v: number) => {
  if (Math.abs(v) >= 1_000_000_000) return `${(v / 1_000_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} میلیارد`;
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} میلیون`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toLocaleString("fa-IR", { maximumFractionDigits: 0 })} هزار`;
  return faNum(v);
};

export interface SeriesPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

/** درآمد در برابر هزینه — ماه به ماه */
export function IncomeExpenseChart({ data, currency }: { data: SeriesPoint[]; currency: CurrencyCode }) {
  if (!data.some((d) => d.income > 0 || d.expense > 0)) return <EmptyChart message="درآمد یا هزینه‌ای در این بازه ثبت نشده" />;
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e1" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickMargin={8} axisLine={false} tickLine={false} />
          <YAxis tick={tick} tickFormatter={faTick} axisLine={false} tickLine={false} width={54} />
          <Tooltip content={<MoneyTooltip currency={currency} />} cursor={{ fill: "rgb(20 104 85 / 0.06)" }} />
          <Legend wrapperStyle={{ fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700 }} />
          <Bar dataKey="income" name="درآمد" fill={COLORS.income} radius={[5, 5, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expense" name="هزینه" fill={COLORS.expense} radius={[5, 5, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** روند خالص جریان نقدی */
export function CashFlowChart({ data, currency }: { data: SeriesPoint[]; currency: CurrencyCode }) {
  if (!data.some((d) => d.net !== 0)) return <EmptyChart message="جریان نقدی در این بازه صفر است" />;
  return (
    <div dir="ltr" className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e1" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickMargin={8} axisLine={false} tickLine={false} />
          <YAxis tick={tick} tickFormatter={faTick} axisLine={false} tickLine={false} width={54} />
          <Tooltip content={<MoneyTooltip currency={currency} />} />
          <Line type="monotone" dataKey="net" name="خالص جریان" stroke={COLORS.net} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.net }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DonutSlice {
  name: string;
  value: number;
}

/** دونات دسته‌بندی هزینه‌ها */
export function CategoryDonut({ data, currency }: { data: DonutSlice[]; currency: CurrencyCode }) {
  if (!data.length || !data.some((d) => d.value > 0)) return <EmptyChart message="هزینه‌ای در این بازه ثبت نشده" />;
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="52%" outerRadius="82%" paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<MoneyTooltip currency={currency} />} />
          <Legend wrapperStyle={{ fontFamily: "Vazirmatn", fontSize: 10, fontWeight: 700 }} layout="vertical" align="right" verticalAlign="middle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/** مقایسه هزینه اعضا */
export function MemberBarChart({ data, currency }: { data: DonutSlice[]; currency: CurrencyCode }) {
  if (!data.length) return <EmptyChart message="هزینه‌ای برای اعضا ثبت نشده" />;
  return (
    <div dir="ltr" className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ right: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e1" horizontal={false} />
          <XAxis type="number" tick={tick} tickFormatter={faTick} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ ...tick, fontSize: 11 }} width={70} axisLine={false} tickLine={false} />
          <Tooltip content={<MoneyTooltip currency={currency} />} cursor={{ fill: "rgb(20 104 85 / 0.06)" }} />
          <Bar dataKey="value" name="هزینه" fill={COLORS.net} radius={[0, 5, 5, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** بودجه در برابر مصرف */
export function BudgetCompareChart({ data, currency }: {
  data: { label: string; budget: number; spent: number }[];
  currency: CurrencyCode;
}) {
  if (!data.length) return <EmptyChart message="بودجه‌ای تعریف نشده است" />;
  return (
    <div dir="ltr" className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8e1" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickMargin={8} axisLine={false} tickLine={false} />
          <YAxis tick={tick} tickFormatter={faTick} axisLine={false} tickLine={false} width={54} />
          <Tooltip content={<MoneyTooltip currency={currency} />} cursor={{ fill: "rgb(20 104 85 / 0.06)" }} />
          <Legend wrapperStyle={{ fontFamily: "Vazirmatn", fontSize: 11, fontWeight: 700 }} />
          <Bar dataKey="budget" name="بودجه" fill="#b9d6cb" radius={[5, 5, 0, 0]} maxBarSize={24} />
          <Bar dataKey="spent" name="مصرف" fill="#e3a93f" radius={[5, 5, 0, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
