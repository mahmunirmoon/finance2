/** دسته‌های نیاز مالی — Data-Driven؛ ماژول‌های آینده بر اساس انتخاب کاربر فعال می‌شوند */

export interface NeedCategory {
  id: string;
  title: string;
  items: string[];
}

export const CUSTOM_CATEGORY_ID = "custom";
export const CUSTOM_CATEGORY_TITLE = "نیازهای شخصی";

export const NEED_CATEGORIES: NeedCategory[] = [
  {
    id: "education",
    title: "آموزش",
    items: ["مدرسه", "کنکور", "دانشگاه", "کلاس زبان", "دوره آموزشی", "کتاب و تجهیزات", "لپ‌تاپ و تجهیزات دیجیتال"],
  },
  { id: "lifestyle", title: "زندگی شخصی", items: ["پوشاک", "موبایل", "اینترنت", "تفریح", "ورزش", "سفر"] },
  { id: "transport", title: "حمل‌ونقل", items: ["خودرو", "بنزین", "تاکسی", "تعمیر خودرو", "حمل‌ونقل عمومی"] },
  { id: "health", title: "سلامت", items: ["پزشک", "دارو", "دندانپزشکی", "آزمایش", "بیمه"] },
  {
    id: "events",
    title: "رویدادهای مهم",
    items: ["در آستانه دانشگاه", "در آستانه ازدواج", "خرید خودرو", "خرید خانه", "مهاجرت", "سفر بزرگ", "درمان", "شروع کسب‌وکار", "بازنشستگی"],
  },
];

export function getCategoryTitle(categoryId: string): string {
  if (categoryId === CUSTOM_CATEGORY_ID) return CUSTOM_CATEGORY_TITLE;
  return NEED_CATEGORIES.find((c) => c.id === categoryId)?.title ?? categoryId;
}
