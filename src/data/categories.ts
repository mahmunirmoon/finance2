/** دسته‌بندی‌های درآمد و هزینه — کاملاً Data-Driven */

export interface ExpenseCategory {
  id: string;
  label: string;
  subcategories: string[];
}

export const INCOME_CATEGORIES: string[] = [
  "حقوق", "درآمد کسب‌وکار", "پروژه", "فروش", "سرمایه‌گذاری",
  "اجاره", "سود", "هدیه", "بازپرداخت", "سایر درآمدها",
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "home", label: "خانه", subcategories: ["اجاره", "شارژ", "تعمیرات", "لوازم خانه"] },
  { id: "food", label: "خوراک", subcategories: ["سوپرمارکت", "میوه", "گوشت", "رستوران", "کافه"] },
  { id: "bills", label: "قبوض", subcategories: ["برق", "آب", "گاز", "تلفن", "اینترنت"] },
  { id: "transport", label: "حمل‌ونقل", subcategories: ["بنزین", "تاکسی", "اسنپ", "تعمیر خودرو", "پارکینگ"] },
  { id: "education", label: "آموزش", subcategories: ["شهریه", "کتاب", "کلاس", "لپ‌تاپ", "تجهیزات"] },
  { id: "health", label: "سلامت", subcategories: ["پزشک", "دارو", "آزمایش", "دندانپزشکی", "بیمه"] },
  { id: "clothing", label: "پوشاک", subcategories: ["لباس", "کفش"] },
  { id: "fun", label: "تفریح", subcategories: ["سینما", "بازی", "مهمانی"] },
  { id: "travel", label: "سفر", subcategories: ["بلیت", "هتل", "تور"] },
  { id: "tech", label: "فناوری", subcategories: ["موبایل", "لوازم جانبی", "نرم‌افزار"] },
  { id: "car", label: "خودرو", subcategories: ["بیمه", "عوارض", "کارواش", "قطعات"] },
  { id: "gift", label: "هدیه", subcategories: ["تولد", "مناسبتی"] },
  { id: "wedding", label: "ازدواج", subcategories: ["تالار", "جهیزیه", "عکس و فیلم"] },
  { id: "personal", label: "هزینه شخصی", subcategories: ["آرایشگاه", "باشگاه", "اشتراک"] },
  { id: "other", label: "سایر", subcategories: [] },
];

export const CUSTOM_CATEGORY_VALUE = "custom";

export function getExpenseCategory(label: string): ExpenseCategory | undefined {
  return EXPENSE_CATEGORIES.find((c) => c.label === label);
}

export function allCategoryLabels(): string[] {
  const set = new Set<string>(EXPENSE_CATEGORIES.map((c) => c.label));
  INCOME_CATEGORIES.forEach((c) => set.add(c));
  return Array.from(set);
}

/** رنگ دسته برای نمودارها — پایدار بر اساس ایندکس */
export const CHART_PALETTE = [
  "#146855", "#e3a93f", "#57998a", "#b26e14", "#2f8f5f",
  "#bf4638", "#0f5545", "#8bbbad", "#d18a1f", "#3f534a",
  "#2e7d6b", "#e9c06a", "#74867c", "#0c362c", "#f2d79e",
];
