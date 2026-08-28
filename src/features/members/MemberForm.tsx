import type { MemberDraft } from "../../types";
import {
  CUSTOM_ROLE_VALUE, EDUCATION_OPTIONS, EMPLOYMENT_OPTIONS, GENDER_OPTIONS, MARITAL_OPTIONS, ROLE_OPTIONS,
} from "../../data/options";
import { Segmented, YesNoToggle } from "../../components/ui/Segmented";
import NeedsPicker from "./NeedsPicker";

interface MemberFormProps {
  value: MemberDraft;
  onChange: (patch: Partial<MemberDraft>) => void;
}

const inputCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm transition focus:border-pine-500 focus:outline-none focus:ring-2 focus:ring-pine-500/25";
const labelCls = "mb-1.5 block text-xs font-extrabold text-ink";

/** فرم اطلاعات عضو + پروفایل مالی + نیازها */
export default function MemberForm({ value, onChange }: MemberFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="mf-name" className={labelCls}>نام</label>
          <input id="mf-name" value={value.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="مثلاً علی" className={inputCls} />
        </div>
        <div>
          <label htmlFor="mf-age" className={labelCls}>سن</label>
          <input
            id="mf-age" type="number" min={0} max={130}
            value={value.age ?? ""}
            onChange={(e) => onChange({ age: e.target.value === "" ? null : Number(e.target.value) })}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="mf-role" className={labelCls}>نقش</label>
          <select id="mf-role" value={value.role} onChange={(e) => onChange({ role: e.target.value })} className={inputCls}>
            <option value="">انتخاب کنید…</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {value.role === CUSTOM_ROLE_VALUE ? (
          <div>
            <label htmlFor="mf-custom-role" className={labelCls}>نقش دلخواه</label>
            <input id="mf-custom-role" value={value.customRole ?? ""} onChange={(e) => onChange({ customRole: e.target.value })} placeholder="مثلاً مدیر مالی خانواده" className={inputCls} />
          </div>
        ) : (
          <div>
            <label htmlFor="mf-gender" className={labelCls}>جنسیت (اختیاری)</label>
            <select id="mf-gender" value={value.gender} onChange={(e) => onChange({ gender: e.target.value as MemberDraft["gender"] })} className={inputCls}>
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="mf-emp" className={labelCls}>وضعیت شغلی</label>
          <select id="mf-emp" value={value.employmentStatus} onChange={(e) => onChange({ employmentStatus: e.target.value as MemberDraft["employmentStatus"] })} className={inputCls}>
            {EMPLOYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mf-edu" className={labelCls}>وضعیت تحصیلی</label>
          <select id="mf-edu" value={value.educationStatus} onChange={(e) => onChange({ educationStatus: e.target.value as MemberDraft["educationStatus"] })} className={inputCls}>
            {EDUCATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={labelCls}>وضعیت تأهل</span>
        <Segmented
          options={MARITAL_OPTIONS}
          value={value.maritalStatus}
          onChange={(v) => onChange({ maritalStatus: v })}
        />
      </div>

      <div className="rounded-xl bg-paper/60 p-4">
        <p className="mb-3 text-xs font-extrabold text-pine-700">پروفایل مالی</p>
        <div className="space-y-3">
          {[
            { label: "آیا درآمد مستقل دارد؟", key: "hasIncome" as const, value: value.hasIncome },
            { label: "آیا بودجه شخصی دارد؟", key: "hasPersonalBudget" as const, value: value.hasPersonalBudget },
            { label: "هزینه‌هایش جداگانه گزارش شود؟", key: "trackSeparately" as const, value: value.trackSeparately },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-ink-soft">{row.label}</span>
              <YesNoToggle value={row.value} onChange={(v) => onChange({ [row.key]: v })} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-paper/60 p-4">
        <p className="mb-3 text-xs font-extrabold text-pine-700">نیازها و برنامه‌های مالی</p>
        <NeedsPicker needs={value.needs} onChange={(needs) => onChange({ needs })} />
      </div>
    </div>
  );
}
