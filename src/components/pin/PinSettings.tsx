import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { disablePin, isPinEnabled, isValidPin, loadPinRecord, setPin, verifyPin } from "../../utils/pin";
import { useFamily } from "../../hooks/useFamily";

/** تنظیم قفل محلی با PIN — بدون بک‌اند، فقط salt+hash در مرورگر */
export default function PinSettings() {
  const { pushToast } = useFamily();
  const [enabled, setEnabled] = useState(isPinEnabled());
  const [mode, setMode] = useState<"idle" | "set" | "change">(enabled ? "idle" : "set");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const inputCls =
    "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-center text-base font-black tracking-[0.3em] text-ink transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";

  const reset = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
  };

  const doEnableOrChange = async () => {
    setError(null);
    if (mode === "change") {
      const rec = loadPinRecord();
      if (rec && rec.pinEnabled) {
        const okCur = await verifyPin(currentPin, rec);
        if (!okCur) return setError("رمز فعلی اشتباه است.");
      }
    }
    if (!isValidPin(newPin)) return setError("رمز باید بین ۴ تا ۸ رقم باشد.");
    if (newPin !== confirmPin) return setError("رمز جدید و تکرار آن یکسان نیستند.");
    await setPin(newPin);
    setEnabled(true);
    setMode("idle");
    reset();
    pushToast(mode === "change" ? "رمز عبور محلی تغییر کرد" : "قفل برنامه فعال شد");
  };

  const doDisable = () => {
    disablePin();
    setEnabled(false);
    setMode("set");
    reset();
    pushToast("قفل برنامه غیرفعال شد", "info");
  };

  return (
    <section className="animate-fade-up rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-saffron-50 text-saffron-600">
          <KeyRound size={16} />
        </span>
        <div>
          <h2 className="text-base font-extrabold text-ink">قفل برنامه با رمز عبور محلی</h2>
          <p className="text-[11px] text-mute">
            {enabled ? "فعال است — هنگام باز شدن برنامه رمز خواسته می‌شود." : "غیرفعال است."}
          </p>
        </div>
      </div>

      {enabled && mode === "idle" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setMode("change"); setError(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
          >
            تغییر رمز
          </button>
          <button
            onClick={doDisable}
            className="inline-flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-2.5 text-xs font-extrabold text-danger transition hover:bg-danger hover:text-white active:scale-[0.97]"
          >
            غیرفعال‌سازی قفل
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {mode === "change" && (
            <div>
              <label htmlFor="pin-current" className="mb-1.5 block text-xs font-extrabold text-ink">رمز فعلی</label>
              <input id="pin-current" type="password" inputMode="numeric" maxLength={8} value={currentPin}
                onChange={(e) => { setCurrentPin(e.target.value.replace(/\D/g, "")); setError(null); }} className={inputCls} />
            </div>
          )}
          <div>
            <label htmlFor="pin-new" className="mb-1.5 block text-xs font-extrabold text-ink">رمز جدید (۴ تا ۸ رقم)</label>
            <input id="pin-new" type="password" inputMode="numeric" maxLength={8} value={newPin}
              onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setError(null); }} className={inputCls} />
          </div>
          <div>
            <label htmlFor="pin-confirm" className="mb-1.5 block text-xs font-extrabold text-ink">تکرار رمز جدید</label>
            <input id="pin-confirm" type="password" inputMode="numeric" maxLength={8} value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setError(null); }} className={inputCls} />
          </div>
          {error && <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={doEnableOrChange} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              {mode === "change" ? "ذخیره رمز جدید" : "فعال‌سازی قفل"}
            </button>
            {enabled && (
              <button onClick={() => { setMode("idle"); reset(); }} className="rounded-xl border border-line bg-surface px-4 py-2.5 text-xs font-bold text-ink-soft transition hover:bg-paper">
                انصراف
              </button>
            )}
          </div>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-paper/70 px-3.5 py-3 text-[10px] leading-5 text-mute">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-success" />
        این قفل فقط از دسترسی عادی به برنامه در همین مرورگر جلوگیری می‌کند و جایگزین حساب کاربری یا رمزنگاری کامل اطلاعات نیست. رمز به‌صورت هش‌شده (SHA-256 با salt) ذخیره می‌شود.
      </p>
    </section>
  );
}
