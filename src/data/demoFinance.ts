import type { Account, Family, FamilyMember, Transaction } from "../types";
import { uid } from "../utils/id";

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysAhead(n: number): string {
  return daysAgo(-n);
}

/** حساب‌های نمونه — export شده تا Demo Planning به همین حساب‌ها متصل شود */
export function createDemoAccounts(familyId: string): Account[] {
  const now = new Date().toISOString();
  const base = { familyId, createdAt: now, updatedAt: now, isActive: true };
  return [
    { ...base, id: uid(), name: "بانک ملت پدر", type: "bank", currency: "toman", initialBalance: 45_000_000 },
    { ...base, id: uid(), name: "بانک سامان مادر", type: "bank", currency: "toman", initialBalance: 30_000_000 },
    { ...base, id: uid(), name: "کارت خرید خانواده", type: "card", currency: "toman", initialBalance: 8_000_000 },
    { ...base, id: uid(), name: "نقدی", type: "cash", currency: "toman", initialBalance: 2_500_000 },
    { ...base, id: uid(), name: "USD Wallet", type: "wallet", currency: "usd", initialBalance: 500 },
  ];
}

export interface DemoMemberRefs {
  father?: string;
  mother?: string;
  olderDaughter?: string;
  son?: string;
  youngerDaughter?: string;
}

export function pickMembers(members: FamilyMember[]): DemoMemberRefs {
  const daughters = members.filter((m) => m.role === "daughter");
  const sorted = [...daughters].sort((a, b) => (b.age ?? 0) - (a.age ?? 0));
  return {
    father: members.find((m) => m.role === "father")?.id,
    mother: members.find((m) => m.role === "mother")?.id,
    son: members.find((m) => m.role === "son")?.id,
    olderDaughter: sorted[0]?.id,
    youngerDaughter: sorted[1]?.id ?? sorted[0]?.id,
  };
}

export type DemoTxInput = Omit<Transaction, "id" | "createdAt" | "updatedAt" | "status"> & {
  status?: Transaction["status"];
};

/** داده‌های مالی نمونه — فقط با درخواست صریح کاربر بارگذاری می‌شود */
export function createDemoFinance(family: Family): { accounts: Account[]; transactions: Transaction[] } {
  const accounts = createDemoAccounts(family.id);
  const [mellat, saman, card, cash, usd] = accounts;
  const refs = pickMembers(family.members);
  const now = new Date().toISOString();

  const make = (input: DemoTxInput): Transaction => ({
    status: "done",
    ...input,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  });

  const T = "toman" as const;
  const transactions: Transaction[] = [
    // درآمدها
    make({ familyId: family.id, type: "income", title: "حقوق ماهانه", amount: 38_000_000, currency: T, accountId: mellat.id, memberId: refs.father, category: "حقوق", date: daysAgo(68) }),
    make({ familyId: family.id, type: "income", title: "حقوق ماهانه", amount: 38_000_000, currency: T, accountId: mellat.id, memberId: refs.father, category: "حقوق", date: daysAgo(38) }),
    make({ familyId: family.id, type: "income", title: "حقوق ماهانه", amount: 38_000_000, currency: T, accountId: mellat.id, memberId: refs.father, category: "حقوق", date: daysAgo(8) }),
    make({ familyId: family.id, type: "income", title: "پروژه طراحی", amount: 12_000_000, currency: T, accountId: saman.id, memberId: refs.mother, category: "پروژه", date: daysAgo(55) }),
    make({ familyId: family.id, type: "income", title: "سود صندوق درآمد ثابت", amount: 4_500_000, currency: T, accountId: saman.id, memberId: refs.mother, category: "سود", date: daysAgo(20) }),
    make({ familyId: family.id, type: "income", title: "هدیه دلاری", amount: 100, currency: "usd", accountId: usd.id, memberId: refs.olderDaughter, category: "هدیه", date: daysAgo(33) }),
    // خانه و قبوض
    make({ familyId: family.id, type: "expense", title: "اجاره خانه", amount: 15_000_000, currency: T, accountId: mellat.id, category: "خانه", subcategory: "اجاره", date: daysAgo(65) }),
    make({ familyId: family.id, type: "expense", title: "اجاره خانه", amount: 15_000_000, currency: T, accountId: mellat.id, category: "خانه", subcategory: "اجاره", date: daysAgo(35) }),
    make({ familyId: family.id, type: "expense", title: "اجاره خانه", amount: 15_000_000, currency: T, accountId: mellat.id, category: "خانه", subcategory: "اجاره", date: daysAgo(5) }),
    make({ familyId: family.id, type: "expense", title: "قبض برق", amount: 380_000, currency: T, accountId: saman.id, category: "قبوض", subcategory: "برق", date: daysAgo(12) }),
    make({ familyId: family.id, type: "expense", title: "قبض آب", amount: 95_000, currency: T, accountId: saman.id, category: "قبوض", subcategory: "آب", date: daysAgo(12) }),
    make({ familyId: family.id, type: "expense", title: "قبض گاز", amount: 210_000, currency: T, accountId: saman.id, category: "قبوض", subcategory: "گاز", date: daysAgo(42) }),
    make({ familyId: family.id, type: "expense", title: "اینترنت خانه", amount: 350_000, currency: T, accountId: saman.id, category: "قبوض", subcategory: "اینترنت", date: daysAgo(18) }),
    make({ familyId: family.id, type: "expense", title: "اینترنت خانه", amount: 350_000, currency: T, accountId: saman.id, category: "قبوض", subcategory: "اینترنت", date: daysAgo(48) }),
    // خوراک
    make({ familyId: family.id, type: "expense", title: "خرید سوپرمارکت", amount: 2_850_000, currency: T, accountId: card.id, category: "خوراک", subcategory: "سوپرمارکت", date: daysAgo(3) }),
    make({ familyId: family.id, type: "expense", title: "خرید سوپرمارکت", amount: 1_950_000, currency: T, accountId: card.id, category: "خوراک", subcategory: "سوپرمارکت", date: daysAgo(14) }),
    make({ familyId: family.id, type: "expense", title: "خرید میوه", amount: 650_000, currency: T, accountId: cash.id, category: "خوراک", subcategory: "میوه", date: daysAgo(9) }),
    make({ familyId: family.id, type: "expense", title: "رستوران خانوادگی", amount: 1_450_000, currency: T, accountId: card.id, category: "خوراک", subcategory: "رستوران", date: daysAgo(7) }),
    make({ familyId: family.id, type: "expense", title: "کافه", amount: 280_000, currency: T, accountId: cash.id, memberId: refs.olderDaughter, category: "خوراک", subcategory: "کافه", date: daysAgo(2) }),
    // حمل‌ونقل
    make({ familyId: family.id, type: "expense", title: "بنزین", amount: 400_000, currency: T, accountId: cash.id, memberId: refs.father, category: "حمل‌ونقل", subcategory: "بنزین", date: daysAgo(6) }),
    make({ familyId: family.id, type: "expense", title: "بنزین", amount: 400_000, currency: T, accountId: cash.id, memberId: refs.father, category: "حمل‌ونقل", subcategory: "بنزین", date: daysAgo(26) }),
    make({ familyId: family.id, type: "expense", title: "اسنپ", amount: 180_000, currency: T, accountId: cash.id, memberId: refs.olderDaughter, category: "حمل‌ونقل", subcategory: "اسنپ", date: daysAgo(4) }),
    make({ familyId: family.id, type: "expense", title: "کارواش", amount: 150_000, currency: T, accountId: cash.id, memberId: refs.father, category: "خودرو", subcategory: "کارواش", date: daysAgo(13) }),
    // آموزش (علی)
    make({ familyId: family.id, type: "expense", title: "شهریه دانشگاه", amount: 9_500_000, currency: T, accountId: saman.id, memberId: refs.son, category: "آموزش", subcategory: "شهریه", date: daysAgo(45) }),
    make({ familyId: family.id, type: "expense", title: "شهریه دانشگاه", amount: 9_500_000, currency: T, accountId: saman.id, memberId: refs.son, category: "آموزش", subcategory: "شهریه", status: "pending", date: daysAgo(15) }),
    make({ familyId: family.id, type: "expense", title: "کتاب درسی", amount: 850_000, currency: T, accountId: card.id, memberId: refs.son, category: "آموزش", subcategory: "کتاب", date: daysAgo(40) }),
    make({ familyId: family.id, type: "expense", title: "خرید لپ‌تاپ", amount: 32_500_000, currency: T, accountId: mellat.id, memberId: refs.son, category: "آموزش", subcategory: "لپ‌تاپ", description: "لپ‌تاپ برای پروژه‌های دانشگاه", date: daysAgo(50) }),
    // سلامت
    make({ familyId: family.id, type: "expense", title: "ویزیت پزشک", amount: 450_000, currency: T, accountId: cash.id, memberId: refs.youngerDaughter, category: "سلامت", subcategory: "پزشک", date: daysAgo(22) }),
    make({ familyId: family.id, type: "expense", title: "خرید دارو", amount: 320_000, currency: T, accountId: cash.id, category: "سلامت", subcategory: "دارو", date: daysAgo(21) }),
    // پوشاک، هدیه، ازدواج
    make({ familyId: family.id, type: "expense", title: "لباس جدید", amount: 1_800_000, currency: T, accountId: card.id, memberId: refs.olderDaughter, category: "پوشاک", subcategory: "لباس", date: daysAgo(16) }),
    make({ familyId: family.id, type: "expense", title: "هدیه تولد", amount: 600_000, currency: T, accountId: cash.id, category: "هدیه", subcategory: "تولد", date: daysAgo(11) }),
    make({ familyId: family.id, type: "expense", title: "پیش‌پرداخت تالار", amount: 25_000_000, currency: T, accountId: mellat.id, memberId: refs.olderDaughter, category: "ازدواج", subcategory: "تالار", description: "قسط اول رزرو تالار", date: daysAgo(30) }),
    // فناوری (USD)
    make({ familyId: family.id, type: "expense", title: "خرید گجت", amount: 40, currency: "usd", accountId: usd.id, memberId: refs.son, category: "فناوری", subcategory: "لوازم جانبی", date: daysAgo(19) }),
    // انتقال‌ها — نه درآمد، نه هزینه
    make({ familyId: family.id, type: "transfer", title: "انتقال به نقدی", amount: 5_000_000, currency: T, accountId: mellat.id, destinationAccountId: cash.id, date: daysAgo(10) }),
    make({ familyId: family.id, type: "transfer", title: "شارژ کارت خرید", amount: 4_000_000, currency: T, accountId: mellat.id, destinationAccountId: card.id, date: daysAgo(28) }),
  ];

  return { accounts, transactions };
}
