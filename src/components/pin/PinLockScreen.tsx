import { useEffect, useRef, useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { verifyPin, loadPinRecord } from "../../utils/pin";
import Logo from "../../layout/Logo";

interface PinLockScreenProps {
  onUnlock: () => void;
}

/** صفحه قفل — قبل از نمایش هر داده مالی، اگر PIN فعال باشد */
export default function PinLockScreen({ onUnlock }: PinLockScreenProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = async () => {
    const rec = loadPinRecord();
    if (!rec || !rec.pinEnabled) {
      onUnlock();
      return;
    }
    const ok = await verifyPin(pin, rec);
    if (ok) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setPin("");
      setTimeout(() => setShake(false), 400);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="bg-girih absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-pine-200/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -end-24 h-96 w-96 rounded-full bg-saffron-200/40 blur-3xl" aria-hidden="true" />

      <div
        className={`animate-scale-in relative w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-pop ${
          shake ? "animate-[shake_0.4s_ease]" : ""
        }`}
        style={shake ? { animation: "pin-shake 0.4s ease" } : undefined}
      >
        <style>{`@keyframes pin-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }`}</style>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-pine-50 text-pine-600">
          <Lock size={28} />
        </div>
        <Logo size={36} />
        <h1 className="font-display mt-3 text-2xl text-ink">برنامه قفل است</h1>
        <p className="mt-1 text-xs leading-6 text-mute">برای دسترسی به اطلاعات مالی خانواده، رمز عبور محلی را وارد کنید.</p>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={8}
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, ""));
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          aria-label="رمز عبور محلی"
          className={`mt-5 w-full rounded-xl border bg-surface px-4 py-3 text-center text-2xl font-black tracking-[0.4em] text-ink transition focus:outline-none focus:ring-2 ${
            error ? "border-danger focus:ring-danger/25" : "border-line focus:border-pine-500 focus:ring-pine-500/25"
          }`}
          placeholder="••••"
        />
        {error && (
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-danger">
            <ShieldAlert size={14} />
            رمز اشتباه است؛ دوباره تلاش کنید.
          </p>
        )}

        <button
          onClick={submit}
          disabled={pin.length < 4}
          className="mt-5 w-full rounded-xl bg-pine-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          بازکردن برنامه
        </button>
        <p className="mt-4 text-[10px] leading-5 text-mute">
          این قفل فقط از دسترسی عادی در همین مرورگر جلوگیری می‌کند و جایگزین حساب کاربری یا رمزنگاری کامل نیست.
        </p>
      </div>
    </div>
  );
}
