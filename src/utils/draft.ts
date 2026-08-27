import type { FamilyMember, MemberDraft } from "../types";

export function emptyMemberDraft(): MemberDraft {
  return {
    name: "",
    age: null,
    role: "",
    customRole: undefined,
    gender: "unspecified",
    employmentStatus: "employed",
    educationStatus: "inactive",
    maritalStatus: "single",
    hasIncome: false,
    hasPersonalBudget: false,
    trackSeparately: false,
    needs: [],
  };
}

export function toMemberDraft(member: FamilyMember): MemberDraft {
  return {
    name: member.name,
    age: member.age,
    role: member.role,
    customRole: member.customRole,
    gender: member.gender,
    employmentStatus: member.employmentStatus,
    educationStatus: member.educationStatus,
    maritalStatus: member.maritalStatus,
    hasIncome: member.hasIncome,
    hasPersonalBudget: member.hasPersonalBudget,
    trackSeparately: member.trackSeparately,
    needs: member.needs.map((n) => ({ ...n })),
  };
}

export function draftError(draft: MemberDraft): string | null {
  if (!draft.name.trim()) return "نام عضو الزامی است.";
  if (draft.age === null || draft.age < 0 || draft.age > 130) return "سن باید عددی بین ۰ تا ۱۳۰ باشد.";
  if (!draft.role) return "نقش عضو را انتخاب کنید.";
  if (draft.role === "custom" && !draft.customRole?.trim()) return "نقش دلخواه را بنویسید.";
  return null;
}
