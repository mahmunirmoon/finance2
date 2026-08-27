import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Users } from "lucide-react";
import type { Family, MemberDraft } from "../../types";
import { useFamily } from "../../hooks/useFamily";
import { emptyMemberDraft, toMemberDraft } from "../../utils/draft";
import { faNum } from "../../utils/format";
import MemberForm from "../members/MemberForm";
import Logo from "../../layout/Logo";

interface SetupWizardProps {
  /** خانواده موجود برای ویرایش در مراحل بعد؛ null یعنی خانواده جدید */
  initial: Family | null;
  onExit: () => void;
}

const STEPS = ["مشخصات خانواده", "اعضای خانواده", "بازبینی و ذخیره"];

/** ویزارد راه‌اندازی — Mission 1 (تعداد اعضا پویا، بدون محدودیت سخت) */
export default function SetupWizard({ initial, onExit }: SetupWizardProps) {
  const { createFamily, pushToast } = useFamily();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [memberCount, setMemberCount] = useState(initial?.members.length ?? 3);
  const [drafts, setDrafts] = useState<MemberDraft[]>(
    initial ? initial.members.map(toMemberDraft) : [emptyMemberDraft(), emptyMemberDraft(), emptyMemberDraft()]
  );
  const [error, setError] = useState<string | null>(null);

  const syncCount = (count: number) => {
    const c = Math.min(Math.max(count, 1), 99);
    setMemberCount(c);
    setDrafts((prev) => {
      if (c > prev.length) {
        return [...prev, ...Array.from({ length: c - prev.length }, () => emptyMemberDraft())];
      }
      return prev.slice(0, c);
    });
  };

  const next = () => {
    setError(null);
    if (step === 0) {
      if (!name.trim()) return setError("نام خانواده را بنویسید.");
    }
    if (step === 1) {
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        if (!d.name.trim()) return setError(`نام عضو ${faNum(i + 1)} خالی است.`);
        if (d.age === null || d.age < 0 || d.age > 130) return setError(`سن عضو «${d.name.trim() || faNum(i + 1)}» را درست وارد کنید.`);
        if (!d.role) return setError(`نقش عضو «${d.name.trim()}» را انتخاب کنید.`);
        if (d.role === "custom" && !d.customRole?.trim()) return setError(`نقش دلخواه «${d.name.trim()}» را بنویسید.`);
      }
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const finish = () => {
    createFamily(name, drafts);
    pushToast(`«${name.trim()}» آماده شد — خوش آمدید!`);
  };

  return (
    <div className="relative min-h-screen">
      <div className="bg-girih absolute inset-0" aria-hidden="true" />
      <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-pine-200/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 -end-24 h-96 w-96 rounded-full bg-saffron-200/40 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <p className="text-sm font-extrabold text-ink">راه‌اندازی خانواده</p>
              <p className="text-[11px] text-mute">مرحله {faNum(step + 1)} از {faNum(3)}</p>
            </div>
          </div>
          <button onClick={onExit} className="rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink-soft shadow-card transition hover:bg-paper">
            بازگشت
          </button>
        </div>

        {/* نوار پیشرفت */}
        <div className="mt-6 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm transition-all duration-300 ${
                i < step ? "bg-pine-600 text-white" : i === step ? "bg-saffron-400 text-deep-900 shadow-card" : "bg-line/60 text-mute"
              }`}>
                {i < step ? <Check size={14} strokeWidth={3} /> : faNum(i + 1)}
              </span>
              <span className={`hidden text-[11px] font-bold sm:block ${i === step ? "text-ink" : "text-mute"}`}>{s}</span>
              {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded-full transition-colors duration-500 ${i < step ? "bg-pine-500" : "bg-line"}`} />}
            </div>
          ))}
        </div>

        <div className="animate-fade-up mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-7" key={step}>
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl text-ink">مشخصات خانواده</h2>
                <p className="mt-1 text-xs text-mute">نام خانواده و تعداد اعضا را مشخص کنید.</p>
              </div>
              <div>
                <label htmlFor="wz-name" className="mb-1.5 block text-xs font-extrabold text-ink">نام خانواده</label>
                <input
                  id="wz-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="مثلاً خانواده احمدی"
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25"
                />
              </div>
              <div>
                <label htmlFor="wz-count" className="mb-1.5 block text-xs font-extrabold text-ink">
                  تعداد اعضای خانواده: <span className="text-pine-700">{faNum(memberCount)} نفر</span>
                </label>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => syncCount(memberCount - 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-lg font-black text-ink-soft shadow-card transition hover:border-pine-300 active:scale-95" aria-label="کم کردن">
                    −
                  </button>
                  <input
                    id="wz-count"
                    type="range"
                    min={1}
                    max={12}
                    value={Math.min(memberCount, 12)}
                    onChange={(e) => syncCount(Number(e.target.value))}
                    className="flex-1 accent-pine-600"
                  />
                  <button type="button" onClick={() => syncCount(memberCount + 1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface text-lg font-black text-ink-soft shadow-card transition hover:border-pine-300 active:scale-95" aria-label="زیاد کردن">
                    +
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                    <button key={n} type="button" onClick={() => syncCount(n)} className={`rounded-full px-3 py-1.5 text-[11px] font-extrabold transition ${memberCount === n ? "bg-pine-600 text-white" : "bg-paper text-ink-soft hover:bg-pine-50"}`}>
                      {faNum(n)} نفر
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl text-ink">اعضای خانواده</h2>
                <p className="mt-1 text-xs text-mute">
                  فرم هر عضو بر اساس تعداد انتخابی ساخته می‌شود — نیازها را هم مشخص کنید.
                </p>
              </div>
              <div className="space-y-4">
                {drafts.map((d, i) => (
                  <details key={i} open={i === 0} className="group rounded-xl border border-line bg-paper/40 transition hover:border-pine-300">
                    <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-sm font-extrabold text-ink [&::-webkit-details-marker]:hidden">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pine-50 font-display text-sm text-pine-700">
                        {faNum(i + 1)}
                      </span>
                      {d.name.trim() || `عضو ${faNum(i + 1)}`}
                      {d.needs.length > 0 && (
                        <span className="ms-auto rounded-full bg-saffron-100 px-2 py-0.5 text-[10px] font-extrabold text-saffron-700">
                          {faNum(d.needs.length)} نیاز
                        </span>
                      )}
                    </summary>
                    <div className="border-t border-line px-4 py-4">
                      <MemberForm value={d} onChange={(patch) => setDrafts((prev) => prev.map((x, xi) => (xi === i ? { ...x, ...patch } : x)))} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl text-ink">بازبینی و ذخیره</h2>
                <p className="mt-1 text-xs text-mute">همه‌چیز درست است؟ اطلاعات در مرورگر شما ذخیره می‌شود.</p>
              </div>
              <div className="rounded-xl bg-pine-50 px-4 py-3.5">
                <p className="text-sm font-extrabold text-pine-800">{name.trim()}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-pine-700">
                  <Users size={13} />
                  {faNum(drafts.length)} عضو
                </p>
              </div>
              <ul className="space-y-2">
                {drafts.map((d, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3.5 py-2.5">
                    <span className="text-sm font-extrabold text-ink">{d.name.trim()}</span>
                    <span className="text-[11px] font-bold text-mute">
                      {d.age !== null ? `${faNum(d.age)} سال · ` : ""}
                      {d.needs.length > 0 ? `${faNum(d.needs.length)} نیاز` : "بدون نیاز ثبت‌شده"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <button
              onClick={() => (step === 0 ? onExit() : setStep(step - 1))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper"
            >
              <ArrowRight size={15} />
              {step === 0 ? "انصراف" : "قبلی"}
            </button>
            {step < 2 ? (
              <button onClick={next} className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
                مرحله بعد
                <ArrowLeft size={15} />
              </button>
            ) : (
              <button onClick={finish} className="inline-flex items-center gap-1.5 rounded-lg bg-saffron-500 px-5 py-2.5 text-sm font-extrabold text-white shadow-card transition hover:bg-saffron-600 active:scale-[0.98]">
                <Check size={15} strokeWidth={3} />
                ذخیره و شروع
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
