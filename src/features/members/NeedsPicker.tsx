import { useState } from "react";
import { Car, Check, Flag, GraduationCap, HeartPulse, Plus, Shirt, Sparkles, Tag, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NeedItem } from "../../types";
import { CUSTOM_CATEGORY_ID, CUSTOM_CATEGORY_TITLE, NEED_CATEGORIES } from "../../data/needs";
import { uid } from "../../utils/id";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  education: GraduationCap,
  lifestyle: Shirt,
  transport: Car,
  health: HeartPulse,
  events: Flag,
  [CUSTOM_CATEGORY_ID]: Tag,
};

function NeedChip({ label, selected, onToggle, removable }: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  removable?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
        selected
          ? "border-pine-600 bg-pine-600 text-white shadow-card"
          : "border-line bg-surface text-ink-soft hover:border-pine-400 hover:text-pine-700"
      }`}
    >
      {selected && <Check size={12} strokeWidth={3} />}
      {label}
      {removable && <X size={11} className="ms-0.5" />}
    </button>
  );
}

interface NeedsPickerProps {
  needs: NeedItem[];
  onChange: (needs: NeedItem[]) => void;
}

/** انتخاب چندتایی نیازها + افزودن نیاز دلخواه */
export default function NeedsPicker({ needs, onChange }: NeedsPickerProps) {
  const [customLabel, setCustomLabel] = useState("");
  const selectedLabels = new Set(needs.map((n) => n.label));
  const customNeeds = needs.filter((n) => n.category === CUSTOM_CATEGORY_ID);

  const toggle = (label: string, category: string) => {
    if (selectedLabels.has(label)) onChange(needs.filter((n) => n.label !== label));
    else onChange([...needs, { id: uid(), label, category }]);
  };

  const addCustom = () => {
    const label = customLabel.trim();
    if (!label || selectedLabels.has(label)) {
      setCustomLabel("");
      return;
    }
    onChange([...needs, { id: uid(), label, category: CUSTOM_CATEGORY_ID, custom: true }]);
    setCustomLabel("");
  };

  return (
    <div className="space-y-5">
      {NEED_CATEGORIES.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id] ?? Sparkles;
        const count = needs.filter((n) => n.category === cat.id).length;
        return (
          <section key={cat.id}>
            <header className="mb-2.5 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pine-50 text-pine-600">
                <Icon size={14} />
              </span>
              <h4 className="text-sm font-extrabold text-ink">{cat.title}</h4>
              {count > 0 && (
                <span className="rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-extrabold text-saffron-700">
                  {count.toLocaleString("fa-IR")}
                </span>
              )}
            </header>
            <div className="flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <NeedChip key={item} label={item} selected={selectedLabels.has(item)} onToggle={() => toggle(item, cat.id)} />
              ))}
            </div>
          </section>
        );
      })}

      {customNeeds.length > 0 && (
        <section>
          <header className="mb-2.5 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-50 text-saffron-600">
              <Tag size={14} />
            </span>
            <h4 className="text-sm font-extrabold text-ink">{CUSTOM_CATEGORY_TITLE}</h4>
          </header>
          <div className="flex flex-wrap gap-2">
            {customNeeds.map((n) => (
              <NeedChip key={n.id} label={n.label} selected removable onToggle={() => onChange(needs.filter((x) => x.id !== n.id))} />
            ))}
          </div>
        </section>
      )}

      <div className="rounded-xl border border-dashed border-line-strong bg-surface p-3">
        <p className="mb-2 text-xs font-bold text-ink-soft">نیاز دیگری مد نظر دارید؟</p>
        <div className="flex gap-2">
          <input
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="مثلاً کلاس موسیقی"
            className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm placeholder:text-mute/60 transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!customLabel.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-pine-700 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} strokeWidth={3} />
            نیاز جدید
          </button>
        </div>
      </div>
    </div>
  );
}
