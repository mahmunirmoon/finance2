import type { Family, FamilyMember, NeedItem } from "../types";
import { uid } from "../utils/id";

function need(label: string, category: string): NeedItem {
  return { id: uid(), label, category };
}

/** خانواده نمونه — فقط Demo Data برای تست؛ هیچ وابستگی به تعداد/سن ندارد */
export function createDemoFamily(): Family {
  const familyId = uid();
  const now = new Date().toISOString();

  const base = {
    familyId,
    createdAt: now,
    updatedAt: now,
    gender: "unspecified" as const,
    employmentStatus: "employed" as const,
    educationStatus: "inactive" as const,
    maritalStatus: "married" as const,
    hasIncome: false,
    hasPersonalBudget: false,
    trackSeparately: false,
    needs: [] as NeedItem[],
  };

  const members: FamilyMember[] = [
    {
      ...base, id: uid(), name: "احمد", age: 52, role: "father", gender: "male",
      educationStatus: "graduate", hasIncome: true,
      needs: [need("خودرو", "transport"), need("بیمه", "health")],
    },
    {
      ...base, id: uid(), name: "مریم", age: 47, role: "custom", customRole: "مدیر مالی خانواده",
      gender: "female", employmentStatus: "homemaker", educationStatus: "graduate",
      hasPersonalBudget: true, trackSeparately: true,
      needs: [need("سفر", "lifestyle")],
    },
    {
      ...base, id: uid(), name: "زهرا", age: 25, role: "daughter", gender: "female",
      educationStatus: "graduate", maritalStatus: "single", hasIncome: true,
      hasPersonalBudget: true, trackSeparately: true,
      needs: [need("در آستانه ازدواج", "events")],
    },
    {
      ...base, id: uid(), name: "علی", age: 22, role: "son", gender: "male",
      employmentStatus: "student", educationStatus: "university", maritalStatus: "single",
      needs: [need("دانشگاه", "education"), need("لپ‌تاپ و تجهیزات دیجیتال", "education")],
    },
    {
      ...base, id: uid(), name: "ریحانه", age: 18, role: "daughter", gender: "female",
      employmentStatus: "student", educationStatus: "school", maritalStatus: "single",
      needs: [need("در آستانه دانشگاه", "events"), need("کنکور", "education")],
    },
  ];

  return {
    id: familyId,
    name: "خانواده احمدی",
    createdAt: now,
    setupCompleted: true,
    members,
    currency: "toman",
  };
}
