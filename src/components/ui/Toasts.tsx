import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useFamily } from "../../hooks/useFamily";
import type { ToastItem } from "../../hooks/useFamily";

const TONE_STYLES: Record<ToastItem["tone"], string> = {
  success: "text-[#7fd6a8]",
  danger: "text-[#f2a79b]",
  info: "text-saffron-300",
};

function ToastIcon({ tone }: { tone: ToastItem["tone"] }) {
  const cls = TONE_STYLES[tone];
  if (tone === "success") return <CheckCircle2 size={17} className={cls} />;
  if (tone === "danger") return <AlertTriangle size={17} className={cls} />;
  return <Info size={17} className={cls} />;
}

export default function Toasts() {
  const { toasts, dismissToast } = useFamily();
  if (toasts.length === 0) return null;

  return (
    <div className="print-hidden pointer-events-none fixed bottom-4 start-4 z-[70] flex w-[calc(100%-2rem)] max-w-xs flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="animate-fade-up pointer-events-auto flex items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-paper shadow-pop">
          <ToastIcon tone={t.tone} />
          <span className="flex-1 leading-5">{t.message}</span>
          <button
            onClick={() => dismissToast(t.id)}
            className="rounded-md p-1 text-paper/60 transition hover:bg-paper/10 hover:text-paper"
            aria-label="بستن اعلان"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
