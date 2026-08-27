import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** نوار اکشن پایین Modal — همراه کل محتوا اسکرول می‌شود */
  footer?: ReactNode;
  size?: "md" | "lg";
}

/**
 * Modal با React Portal مستقیم به document.body.
 *
 * چرا Portal؟ چون رندر داخل درختِ معمولی React (زیر AppShell و لایه‌های
 * animate/transform/overflow) می‌تواند رفتارِ position:fixed و اسکرول را
 * خراب کند. با Portal، Modal از همهٔ آن زمینه‌ها خارج می‌شود و تنها ظرفِ
 * اسکرول عمودی، خودِ .modal-overlay است. بدنهٔ Modal ارتفاعِ طبیعیِ کامل
 * خود را دارد؛ اگر بلندتر از viewport باشد، Overlay اسکرول می‌شود.
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    /* قفل اسکرولِ صفحهٔ پشت — بدون حذف اسکرولِ خودِ Overlay (ظرف جدا) */
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  /* کلیک روی فضای خالی (Overlay/Positioner) → بستن؛ کلیک داخل پوسته نه */
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!(e.target as HTMLElement).closest(".modal-shell")) onClose();
  };

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-positioner">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={`modal-shell animate-scale-in shadow-pop ${
            size === "lg" ? "modal-shell--lg" : "modal-shell--md"
          }`}
        >
          {title && (
            <div className="modal-head">
              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-ink">{title}</h3>
                {subtitle && <p className="mt-0.5 text-xs leading-5 text-mute">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="shrink-0 rounded-lg p-2 text-mute transition hover:bg-paper hover:text-ink"
                aria-label="بستن"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmLabel = "تأیید", cancelLabel = "انصراف", onConfirm, onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper active:scale-[0.98]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="rounded-lg bg-danger px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:brightness-95 active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
          <AlertTriangle size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-ink">{title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-ink-soft">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
