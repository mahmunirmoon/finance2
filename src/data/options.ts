import type { EducationStatus, EmploymentStatus, Gender, MaritalStatus } from "../types";

export interface Option<T extends string> {
  value: T;
  label: string;
}

export const CUSTOM_ROLE_VALUE = "custom";

export const ROLE_OPTIONS: Option<string>[] = [
  { value: "father", label: "پدر" },
  { value: "mother", label: "مادر" },
  { value: "spouse", label: "همسر" },
  { value: "son", label: "پسر" },
  { value: "daughter", label: "دختر" },
  { value: "child", label: "فرزند" },
  { value: "grandfather", label: "پدربزرگ" },
  { value: "grandmother", label: "مادربزرگ" },
  { value: "other", label: "سایر" },
  { value: CUSTOM_ROLE_VALUE, label: "نقش دیگر…" },
];

export const GENDER_OPTIONS: Option<Gender>[] = [
  { value: "unspecified", label: "بدون انتخاب" },
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
];

export const EMPLOYMENT_OPTIONS: Option<EmploymentStatus>[] = [
  { value: "employed", label: "شاغل" },
  { value: "business", label: "کسب‌وکار مستقل" },
  { value: "homemaker", label: "خانه‌دار" },
  { value: "student", label: "در حال تحصیل" },
  { value: "retired", label: "بازنشسته" },
  { value: "seeking", label: "جویای کار" },
];

export const EDUCATION_OPTIONS: Option<EducationStatus>[] = [
  { value: "school", label: "دانش‌آموز" },
  { value: "university", label: "دانشجو" },
  { value: "graduate", label: "فارغ‌التحصیل" },
  { value: "inactive", label: "بدون تحصیل فعال" },
];

export const MARITAL_OPTIONS: Option<MaritalStatus>[] = [
  { value: "single", label: "مجرد" },
  { value: "married", label: "متأهل" },
];

export function getOptionLabel<T extends string>(options: Option<T>[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? "—";
}

export function getRoleLabel(role: string, customRole?: string): string {
  if (!role) return "—";
  if (role === CUSTOM_ROLE_VALUE) return customRole?.trim() || "نقش دلخواه";
  return getOptionLabel(ROLE_OPTIONS, role);
}
