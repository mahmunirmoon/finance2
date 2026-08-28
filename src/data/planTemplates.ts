import type { FinancialPlanType } from "../types";

export interface PlanTypeMeta {
  type: FinancialPlanType;
  label: string;
  emoji: string;
  tint: string;
}

/** انواع برنامه‌های زندگی — Templateها فقط آیتم پیشنهاد می‌دهند، قانون مالی نیستند */
export const PLAN_TYPES: PlanTypeMeta[] = [
  { type: "education", label: "تحصیل و دانشگاه", emoji: "🎓", tint: "bg-[#e3e9f5] text-[#34507e]" },
  { type: "wedding", label: "ازدواج", emoji: "💍", tint: "bg-[#f4e3e8] text-[#8e3b56]" },
  { type: "home", label: "خرید خانه", emoji: "🏠", tint: "bg-pine-50 text-pine-700" },
  { type: "vehicle", label: "خرید خودرو", emoji: "🚗", tint: "bg-[#e7ecdc] text-[#57662e]" },
  { type: "travel", label: "سفر", emoji: "✈️", tint: "bg-[#e0edf0] text-[#2c6572]" },
  { type: "migration", label: "مهاجرت", emoji: "🌍", tint: "bg-[#e3e9f5] text-[#34507e]" },
  { type: "medical", label: "درمان", emoji: "🏥", tint: "bg-danger-soft text-danger" },
  { type: "business", label: "شروع کسب‌وکار", emoji: "💼", tint: "bg-saffron-50 text-saffron-700" },
  { type: "baby", label: "تولد فرزند", emoji: "👶", tint: "bg-[#f4e3e8] text-[#8e3b56]" },
  { type: "renovation", label: "بازسازی خانه", emoji: "🔨", tint: "bg-saffron-50 text-saffron-700" },
  { type: "retirement", label: "بازنشستگی", emoji: "🏖️", tint: "bg-pine-50 text-pine-700" },
  { type: "event", label: "مراسم خانوادگی", emoji: "🎉", tint: "bg-saffron-50 text-saffron-700" },
  { type: "custom", label: "برنامه سفارشی", emoji: "⚙️", tint: "bg-paper text-ink-soft" },
];

export function getPlanTypeMeta(type: FinancialPlanType): PlanTypeMeta {
  return PLAN_TYPES.find((t) => t.type === type) ?? PLAN_TYPES[PLAN_TYPES.length - 1];
}

export const PLAN_ITEM_SUGGESTIONS: Partial<Record<FinancialPlanType, string[]>> = {
  education: [
    "ثبت‌نام", "شهریه", "شهریه ترم", "آزمون", "کتاب", "جزوه", "لوازم‌التحریر",
    "لپ‌تاپ", "تبلت", "نرم‌افزار", "کلاس زبان", "دوره تخصصی", "رفت‌وآمد",
    "خوابگاه", "اجاره محل اقامت", "غذا", "بیمه", "هزینه اداری", "سفر تحصیلی", "سایر",
  ],
  wedding: [
    "حلقه", "طلا", "لباس", "کت‌وشلوار", "سالن", "محضر", "آرایشگاه", "آتلیه",
    "فیلمبرداری", "پذیرایی", "کارت دعوت", "گل", "دکور", "موسیقی", "هدیه",
    "جهیزیه", "مبلمان", "لوازم آشپزخانه", "لوازم برقی", "پرده", "فرش",
    "سفر", "ماه عسل", "هزینه جابه‌جایی", "خانه", "رهن", "اجاره", "سایر",
  ],
  vehicle: ["پیش‌پرداخت", "بیمه", "هزینه انتقال سند", "مالیات", "لوازم جانبی", "تعمیر اولیه", "سایر"],
  home: ["پیش‌پرداخت", "رهن", "کمیسیون مشاور املاک", "انتقال سند", "بازسازی اولیه", "لوازم خانه", "سایر"],
  travel: ["بلیت", "هتل", "خوردوخوراک سفر", "گشت و تفریح", "خرید سفر", "بیمه سفر", "سایر"],
  migration: ["هزینه ویزا", "ترجمه مدارک", "آزمون زبان", "بلیت", "اجاره اولیه", "تمکن مالی", "سایر"],
  medical: ["عمل", "بستری", "دارو", "تجهیزات", "فیزیوتراپی", "پرستاری", "سایر"],
  business: ["ثبت شرکت", "تجهیزات", "اجاره محل", "موجودی اولیه", "بازاریابی", "مجوزها", "سایر"],
  baby: ["سیسمونی", "بیمارستان", "لباس نوزاد", "تجهیزات اتاق", "مراسم", "سایر"],
  renovation: ["مصالح", "کابینت", "نقاشی", "برق‌کشی", "لوله‌کشی", "لوازم", "دستمزد", "سایر"],
  retirement: ["سرمایه‌گذاری", "بیمه تکمیلی", "مسکن", "درمان", "سفر", "سایر"],
  event: ["سالن", "پذیرایی", "دکور", "عکاسی", "هدایا", "سایر"],
};

export const PLAN_STATUS_LABELS: Record<string, string> = {
  planning: "در حال برنامه‌ریزی",
  active: "فعال",
  paused: "متوقف",
  completed: "تکمیل‌شده",
  cancelled: "لغوشده",
};

export const PLAN_ITEM_STATUS_LABELS: Record<string, string> = {
  planned: "برنامه‌ریزی‌شده",
  pending: "در انتظار پرداخت",
  paid: "پرداخت‌شده",
  cancelled: "لغوشده",
};

export const GOAL_STATUS_LABELS: Record<string, string> = {
  active: "فعال",
  completed: "تکمیل‌شده",
  paused: "متوقف",
  cancelled: "لغوشده",
};
