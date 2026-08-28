interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-paper p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all duration-150 ${
              active ? "bg-surface text-pine-700 shadow-card" : "text-mute hover:text-ink-soft"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface p-1">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
          value ? "bg-pine-600 text-white shadow-card" : "text-mute hover:text-ink-soft"
        }`}
      >
        بله
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all duration-150 ${
          !value ? "bg-paper text-ink shadow-card" : "text-mute hover:text-ink-soft"
        }`}
      >
        خیر
      </button>
    </div>
  );
}
