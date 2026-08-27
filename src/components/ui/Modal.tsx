import { useEffect } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** نوار اکشن ثابت در پایین Modal — همراه محتوا اسکرول نمی‌شود */
  footer?: ReactNode;
  size?: "md" | "lg";
}

/**
 * Modal سه‌بخشی:
 * Header ثابت ← محتوای اسکرول‌شونده ← Footer ثابت (اختیاری)
 * ارتفاع هرگز از viewport بیرون نمی‌زند و صفحه پشت Modal اسکرول نمی‌شود.
 */
export default function Modal({ open, onClose, title, subtitle, children, footer, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="animate-fade-in absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal-shell animate-scale-in rounded-t-2xl shadow-pop sm:rounded-xl ${
          size === "lg" ? "max-w-2xl" : "max-w-md"
        }`}
      >
        {title && (
          <div className="modal-head flex items-start justify-between gap-3 border-b border-line px-5 py-4">
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
        <div className="modal-body p-5">{children}</div>
        {footer && <div className="modal-foot border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>
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
