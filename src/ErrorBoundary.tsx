import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * مرز خطای سراسری — اگر خطای runtime غیرمنتظره‌ای رخ دهد،
 * به‌جای صفحه سفیدِ خالی، پیام فارسی نمایش داده می‌شود و خطا در console ثبت می‌گردد.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : "خطای ناشناخته",
    };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    // خطا پنهان نمی‌شود — برای دیباگ در console ثبت می‌گردد
    console.error("[ErrorBoundary] خطای runtime:", error);
    console.error("[ErrorBoundary] componentStack:", info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="relative flex min-h-screen items-center justify-center overflow-hidden px-5"
        >
          <div className="bg-girih absolute inset-0" aria-hidden="true" />
          <div
            className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-pine-200/40 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-40 -end-24 h-96 w-96 rounded-full bg-saffron-200/40 blur-3xl"
            aria-hidden="true"
          />

          <div className="animate-fade-up relative w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-pop">
            <svg width="56" height="56" viewBox="0 0 40 40" className="mx-auto" role="img" aria-label="نشان برنامه">
              <rect width="40" height="40" rx="11" fill="#146855" />
              <circle cx="16" cy="16.5" r="6.2" fill="#E9C06A" />
              <circle cx="25" cy="18.5" r="6.2" fill="#FFFFFF" fillOpacity="0.92" />
              <circle cx="19" cy="25.5" r="6.2" fill="#B9D6CB" />
            </svg>

            <h1 className="font-display mt-5 text-2xl leading-snug text-ink">
              خطایی در اجرای برنامه رخ داده است.
            </h1>
            <p className="mt-3 text-sm leading-7 text-ink-soft">
              مشکلی هنگام بارگذاری مدیریت مالی خانواده پیش آمد. داده‌های شما در مرورگر
              محفوظ است؛ با بارگذاری دوباره، برنامه به حالت عادی برمی‌گردد.
            </p>

            {this.state.message && (
              <p
                dir="ltr"
                className="mt-4 break-words rounded-lg bg-paper px-3 py-2 text-left font-mono text-[11px] leading-5 text-mute"
              >
                {this.state.message}
              </p>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-pine-600 px-6 py-3 text-sm font-extrabold text-white shadow-card transition-all duration-200 hover:bg-pine-700 hover:shadow-pop active:scale-[0.97]"
            >
              بارگذاری دوباره برنامه
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
