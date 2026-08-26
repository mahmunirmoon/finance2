import type {
  Account, Budget, Debt, Family, FinancialPlan, FinancialPlanItem, InstallmentItem,
  InstallmentPlan, Receivable, RecurringPayment, SavingsContribution, SavingsGoal, Transaction,
} from "../types";
import { uid } from "../utils/id";
import { daysAgo, daysAhead, pickMembers, type DemoMemberRefs } from "./demoFinance";
import { generateInstallmentItems } from "../utils/planning";

export interface DemoPlanningBundle {
  budgets: Budget[];
  debts: Debt[];
  receivables: Receivable[];
  installmentPlans: InstallmentPlan[];
  installmentItems: InstallmentItem[];
  recurringPayments: RecurringPayment[];
  financialPlans: FinancialPlan[];
  financialPlanItems: FinancialPlanItem[];
  savingsGoals: SavingsGoal[];
  savingsContributions: SavingsContribution[];
  /** تراکنش‌های متصل (بازپرداخت، دریافت، قسط، انتقال پس‌انداز) */
  extraTransactions: Transaction[];
}

/** داده برنامه‌ریزی نمونه — فقط همراه Demo و با درخواست کاربر */
export function createDemoPlanning(family: Family, accounts: Account[]): DemoPlanningBundle {
  const now = new Date().toISOString();
  const refs: DemoMemberRefs = pickMembers(family.members);
  const [mellat, saman, card, cash] = accounts;
  const T = "toman" as const;

  const tx = (input: Omit<Transaction, "id" | "familyId" | "createdAt" | "updatedAt" | "status">): Transaction => ({
    ...input,
    status: "done",
    familyId: family.id,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  });

  /* ── بودجه‌ها: ۶ مورد ── */
  const budgets: Budget[] = [
    { id: uid(), familyId: family.id, title: "بودجه کل خانواده", scope: "family", amount: 60_000_000, currency: T, period: "monthly", year: yearOf(daysAgo(0)), month: monthOf(daysAgo(0)), alertThreshold: 80, isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: "خوراک", scope: "category", categoryId: "خوراک", amount: 12_000_000, currency: T, period: "monthly", year: yearOf(daysAgo(0)), month: monthOf(daysAgo(0)), alertThreshold: 80, isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: "حمل‌ونقل", scope: "category", categoryId: "حمل‌ونقل", amount: 3_000_000, currency: T, period: "monthly", year: yearOf(daysAgo(0)), month: monthOf(daysAgo(0)), alertThreshold: 75, isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: `آموزش ${nameOf(family, refs.son)}`, scope: "member-category", memberId: refs.son, categoryId: "آموزش", amount: 15_000_000, currency: T, period: "monthly", year: yearOf(daysAgo(0)), month: monthOf(daysAgo(0)), alertThreshold: 80, isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: "تفریح", scope: "category", categoryId: "تفریح", amount: 2_500_000, currency: T, period: "monthly", year: yearOf(daysAgo(0)), month: monthOf(daysAgo(0)), alertThreshold: 70, isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: `ازدواج ${nameOf(family, refs.olderDaughter)}`, scope: "member-category", memberId: refs.olderDaughter, categoryId: "ازدواج", amount: 300_000_000, currency: T, period: "yearly", year: yearOf(daysAgo(0)), alertThreshold: 85, isActive: true, createdAt: now, updatedAt: now },
  ];

  /* ── بدهی‌ها: ۳ مورد (اولی با بازپرداخت متصل) ── */
  const debt1Pay = tx({
    type: "expense", title: "بازپرداخت وام بانک ملت", amount: 30_000_000, currency: T,
    accountId: mellat.id, memberId: refs.father, category: "بازپرداخت بدهی", date: daysAgo(20),
    financialReferenceType: "debt-payment", excludeFromOperatingExpense: true,
  });
  const debts: Debt[] = [
    {
      id: uid(), familyId: family.id, memberId: refs.father, title: "وام بانک ملت", counterparty: "بانک ملت",
      originalAmount: 100_000_000, currency: T, paidAmount: 30_000_000, remainingAmount: 70_000_000,
      startDate: daysAgo(90), dueDate: daysAhead(60), status: "partial",
      description: "وام خرید تجهیزات", transactionIds: [debt1Pay.id], createdAt: now, updatedAt: now,
    },
    {
      id: uid(), familyId: family.id, title: "قرض از برادر", counterparty: "عمو رضا",
      originalAmount: 20_000_000, currency: T, paidAmount: 0, remainingAmount: 20_000_000,
      startDate: daysAgo(40), dueDate: daysAhead(20), status: "unpaid", transactionIds: [], createdAt: now, updatedAt: now,
    },
    {
      id: uid(), familyId: family.id, memberId: refs.olderDaughter, title: "باقی‌مانده کارت اعتباری", counterparty: "بانک سامان",
      originalAmount: 8_000_000, currency: T, paidAmount: 0, remainingAmount: 8_000_000,
      startDate: daysAgo(25), dueDate: daysAgo(3), status: "overdue", transactionIds: [], createdAt: now, updatedAt: now,
    },
  ];

  /* ── طلب‌ها: ۲ مورد (اولی با دریافت متصل) ── */
  const rec1Col = tx({
    type: "income", title: "دریافت طلب از شرکت آریا", amount: 20_000_000, currency: T,
    accountId: saman.id, memberId: refs.mother, category: "دریافت طلب", date: daysAgo(10),
    financialReferenceType: "receivable-collection", excludeFromOperatingIncome: true,
  });
  const receivables: Receivable[] = [
    {
      id: uid(), familyId: family.id, memberId: refs.mother, title: "طلب از شرکت آریا", counterparty: "شرکت آریا",
      originalAmount: 50_000_000, currency: T, receivedAmount: 20_000_000, remainingAmount: 30_000_000,
      startDate: daysAgo(60), dueDate: daysAhead(15), status: "partial", transactionIds: [rec1Col.id], createdAt: now, updatedAt: now,
    },
    {
      id: uid(), familyId: family.id, memberId: refs.father, title: "مساعده از محل کار", counterparty: "شرکت پدر",
      originalAmount: 10_000_000, currency: T, receivedAmount: 0, remainingAmount: 10_000_000,
      startDate: daysAgo(12), dueDate: daysAhead(8), status: "unpaid", transactionIds: [], createdAt: now, updatedAt: now,
    },
  ];

  /* ── اقساط: ۳ طرح (لپ‌تاپ ۲ قسط پرداخت‌شده، لوازم خانه، خودرو) ── */
  const laptopPlan: InstallmentPlan = {
    id: uid(), familyId: family.id, memberId: refs.son, title: "لپ‌تاپ علی", totalAmount: 36_000_000,
    currency: T, installmentCount: 6, installmentAmount: 6_000_000, startDate: daysAgo(60),
    frequency: "monthly", accountId: mellat.id, categoryId: "آموزش", isActive: true, createdAt: now, updatedAt: now,
  };
  const appliancePlan: InstallmentPlan = {
    id: uid(), familyId: family.id, title: "لوازم خانگی (یخچال)", totalAmount: 24_000_000,
    currency: T, installmentCount: 4, installmentAmount: 6_000_000, startDate: daysAgo(30),
    frequency: "monthly", accountId: card.id, categoryId: "خانه", isActive: true, createdAt: now, updatedAt: now,
  };
  const carPlan: InstallmentPlan = {
    id: uid(), familyId: family.id, memberId: refs.father, title: "خودرو خانواده", totalAmount: 120_000_000,
    currency: T, installmentCount: 12, installmentAmount: 10_000_000, startDate: daysAhead(10),
    frequency: "monthly", accountId: mellat.id, categoryId: "خودرو", isActive: true, createdAt: now, updatedAt: now,
  };

  const laptopItems = generateInstallmentItems(laptopPlan, uid);
  const applianceItems = generateInstallmentItems(appliancePlan, uid);
  const carItems = generateInstallmentItems(carPlan, uid);

  // دو قسط لپ‌تاپ پرداخت‌شده با تراکنش متصل
  const instPay1 = tx({
    type: "expense", title: "لپ‌تاپ علی — قسط ۱", amount: 6_000_000, currency: T,
    accountId: mellat.id, memberId: refs.son, category: "آموزش", date: laptopItems[0].dueDate,
    financialReferenceType: "installment-payment", financialReferenceId: laptopItems[0].id, excludeFromOperatingExpense: true,
  });
  const instPay2 = tx({
    type: "expense", title: "لپ‌تاپ علی — قسط ۲", amount: 6_000_000, currency: T,
    accountId: mellat.id, memberId: refs.son, category: "آموزش", date: laptopItems[1].dueDate,
    financialReferenceType: "installment-payment", financialReferenceId: laptopItems[1].id, excludeFromOperatingExpense: true,
  });
  laptopItems[0] = { ...laptopItems[0], status: "paid", paidDate: laptopItems[0].dueDate, transactionId: instPay1.id };
  laptopItems[1] = { ...laptopItems[1], status: "paid", paidDate: laptopItems[1].dueDate, transactionId: instPay2.id };

  const installmentPlans = [laptopPlan, appliancePlan, carPlan];
  const installmentItems = [...laptopItems, ...applianceItems, ...carItems];

  /* ── پرداخت‌های تکرارشونده: ۶ مورد ── */
  const cy = yearOf(daysAgo(0));
  const cm = monthOf(daysAgo(0));
  const recurringPayments: RecurringPayment[] = [
    { id: uid(), familyId: family.id, title: "اجاره خانه", amount: 15_000_000, currency: T, categoryId: "خانه", accountId: mellat.id, frequency: "monthly", startDate: daysAgo(90), nextDueDate: daysAhead(2), isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: "اینترنت خانه", amount: 350_000, currency: T, categoryId: "قبوض", accountId: saman.id, frequency: "monthly", startDate: daysAgo(90), nextDueDate: daysAgo(2), isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, memberId: refs.father, title: "بیمه خودرو", amount: 2_400_000, currency: T, categoryId: "خودرو", accountId: card.id, frequency: "quarterly", startDate: daysAgo(80), nextDueDate: daysAhead(5), isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: "قبض برق و آب", amount: 500_000, currency: T, categoryId: "قبوض", accountId: saman.id, frequency: "monthly", startDate: daysAgo(90), nextDueDate: daysAhead(9), isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, memberId: refs.son, title: "شهریه دانشگاه", amount: 9_500_000, currency: T, categoryId: "آموزش", accountId: saman.id, frequency: "quarterly", startDate: daysAgo(120), nextDueDate: daysAhead(18), isActive: true, createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, memberId: refs.olderDaughter, title: "اشتراک نرم‌افزار طراحی", amount: 180_000, currency: T, categoryId: "فناوری", accountId: card.id, frequency: "monthly", startDate: daysAgo(60), nextDueDate: daysAhead(12), isActive: true, createdAt: now, updatedAt: now },
  ];

  /* ── برنامه‌های مالی: ۶ برنامه ── */
  const weddingPlan: FinancialPlan = {
    id: uid(), familyId: family.id, memberId: refs.olderDaughter, title: `ازدواج ${nameOf(family, refs.olderDaughter)}`,
    type: "wedding", currency: T, estimatedBudget: 500_000_000, startDate: daysAgo(60), targetDate: daysAhead(180),
    status: "active", description: "برنامه مالی کامل مراسم و شروع زندگی مشترک", createdAt: now, updatedAt: now,
  };
  const eduDaughterPlan: FinancialPlan = {
    id: uid(), familyId: family.id, memberId: refs.youngerDaughter, title: `دانشگاه ${nameOf(family, refs.youngerDaughter)}`,
    type: "education", currency: T, estimatedBudget: 450_000_000, startDate: daysAgo(30), targetDate: daysAhead(365),
    status: "active", description: "تحصیل در رشته مهندسی — شهر تهران", createdAt: now, updatedAt: now,
  };
  const eduSonPlan: FinancialPlan = {
    id: uid(), familyId: family.id, memberId: refs.son, title: `آموزش ${nameOf(family, refs.son)}`,
    type: "education", currency: T, estimatedBudget: 90_000_000, startDate: daysAgo(90), targetDate: daysAhead(240),
    status: "active", description: "ترم‌های باقی‌مانده کارشناسی + کلاس زبان", createdAt: now, updatedAt: now,
  };
  const vehiclePlan: FinancialPlan = {
    id: uid(), familyId: family.id, title: "خرید خودرو خانواده", type: "vehicle", currency: T,
    estimatedBudget: 800_000_000, startDate: daysAgo(20), targetDate: daysAhead(300), status: "planning", createdAt: now, updatedAt: now,
  };
  const travelPlan: FinancialPlan = {
    id: uid(), familyId: family.id, title: "سفر خانوادگی مشهد", type: "travel", currency: T,
    estimatedBudget: 25_000_000, startDate: daysAgo(10), targetDate: daysAhead(45), status: "active", createdAt: now, updatedAt: now,
  };
  const renovationPlan: FinancialPlan = {
    id: uid(), familyId: family.id, title: "بازسازی آشپزخانه", type: "renovation", currency: T,
    estimatedBudget: 120_000_000, startDate: daysAgo(15), targetDate: daysAhead(120), status: "planning", createdAt: now, updatedAt: now,
  };

  const weddingExtra: Transaction[] = [];

  const item = (planId: string, title: string, estimated: number, status: FinancialPlanItem["status"], dueIn?: number, txIds: string[] = []): FinancialPlanItem => ({
    id: uid(), planId, title, estimatedAmount: estimated, status,
    dueDate: dueIn !== undefined ? daysAhead(dueIn) : undefined,
    transactionIds: txIds, createdAt: now, updatedAt: now,
  });

  const financialPlanItems: FinancialPlanItem[] = [
    // ازدواج — ۸ آیتم (تالار پرداخت‌شده با تراکنش متصل)
    item(weddingPlan.id, "سالن و پذیرایی", 250_000_000, "pending", 120),
    { ...item(weddingPlan.id, "رهن خانه", 25_000_000, "paid", undefined), transactionIds: (() => {
      const t = tx({ type: "expense", title: "ازدواج زهرا — پیش‌پرداخت تالار", amount: 25_000_000, currency: T, accountId: mellat.id, memberId: refs.olderDaughter, category: "ازدواج", date: daysAgo(30), financialPlanId: weddingPlan.id });
      weddingExtra.push(t);
      return [t.id];
    })() },
    item(weddingPlan.id, "حلقه و طلا", 80_000_000, "planned", 90),
    item(weddingPlan.id, "لباس و آرایشگاه", 30_000_000, "planned", 75),
    item(weddingPlan.id, "آتلیه و فیلمبرداری", 25_000_000, "planned", 60),
    item(weddingPlan.id, "کارت دعوت و گل", 10_000_000, "planned", 50),
    item(weddingPlan.id, "ماه عسل", 40_000_000, "planned", 130),
    item(weddingPlan.id, "جهیزیه", 60_000_000, "planned", 100),
    // دانشگاه دختر — ۶ آیتم
    item(eduDaughterPlan.id, "ثبت‌نام و شهریه ترم اول", 60_000_000, "pending", 40),
    item(eduDaughterPlan.id, "لپ‌تاپ", 45_000_000, "planned", 55),
    item(eduDaughterPlan.id, "خوابگاه و اجاره", 90_000_000, "planned", 45),
    item(eduDaughterPlan.id, "کتاب و جزوه", 8_000_000, "planned", 50),
    item(eduDaughterPlan.id, "کلاس زبان", 20_000_000, "planned", 70),
    item(eduDaughterPlan.id, "رفت‌وآمد", 15_000_000, "planned", 60),
    // آموزش پسر — ۵ آیتم
    item(eduSonPlan.id, "شهریه ترم", 19_000_000, "planned", 25),
    item(eduSonPlan.id, "کتاب", 4_000_000, "planned", 20),
    item(eduSonPlan.id, "کلاس زبان آیلتس", 25_000_000, "planned", 35),
    item(eduSonPlan.id, "نرم‌افزار تخصصی", 6_000_000, "planned", 30),
    item(eduSonPlan.id, "پروژه پایانی", 10_000_000, "planned", 80),
    // خودرو — ۵ آیتم (پیش‌پرداخت نزدیک سررسید — در تعهدات آینده دیده می‌شود)
    item(vehiclePlan.id, "پیش‌پرداخت", 300_000_000, "pending", 5),
    item(vehiclePlan.id, "بیمه بدنه", 30_000_000, "planned", 60),
    item(vehiclePlan.id, "انتقال سند و مالیات", 40_000_000, "planned", 65),
    item(vehiclePlan.id, "لوازم جانبی", 15_000_000, "planned", 70),
    item(vehiclePlan.id, "تعمیر اولیه", 20_000_000, "planned", 75),
    // سفر — ۴ آیتم
    item(travelPlan.id, "بلیت قطار", 6_000_000, "pending", 12),
    item(travelPlan.id, "هتل", 10_000_000, "planned", 15),
    item(travelPlan.id, "خوردوخوراک سفر", 6_000_000, "planned", 14),
    item(travelPlan.id, "زیارت و تفریح", 3_000_000, "planned", 16),
    // بازسازی — ۴ آیتم
    item(renovationPlan.id, "کابینت", 60_000_000, "planned", 50),
    item(renovationPlan.id, "مصالح و نقاشی", 30_000_000, "planned", 60),
    item(renovationPlan.id, "لوله‌کشی و برق", 20_000_000, "planned", 55),
    item(renovationPlan.id, "دستمزد", 10_000_000, "planned", 70),
  ];

  /* ── اهداف پس‌انداز: ۵ هدف ── */
  const savingsGoals: SavingsGoal[] = [
    { id: uid(), familyId: family.id, memberId: refs.olderDaughter, financialPlanId: weddingPlan.id, title: "پس‌انداز ازدواج", targetAmount: 200_000_000, currency: T, targetMode: "fixed", targetDate: daysAhead(180), status: "active", createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, memberId: refs.youngerDaughter, financialPlanId: eduDaughterPlan.id, title: "پس‌انداز دانشگاه", targetAmount: 150_000_000, currency: T, targetMode: "fixed", targetDate: daysAhead(300), status: "active", createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, financialPlanId: vehiclePlan.id, title: "پس‌انداز خودرو", targetAmount: 300_000_000, currency: T, targetMode: "fixed", targetDate: daysAhead(300), status: "active", createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, financialPlanId: travelPlan.id, title: "پس‌انداز سفر", targetAmount: 20_000_000, currency: T, targetMode: "fixed", targetDate: daysAhead(40), status: "active", createdAt: now, updatedAt: now },
    { id: uid(), familyId: family.id, title: "صندوق اضطراری", targetAmount: 195_000_000, currency: T, targetMode: "months", months: 3, isEmergency: true, status: "active", createdAt: now, updatedAt: now },
  ];

  const [weddingGoal, eduGoal, carGoal, travelGoal, emergencyGoal] = savingsGoals;
  const contrib = (goalId: string, amount: number, date: string, note?: string): SavingsContribution => ({
    id: uid(), goalId, amount, currency: T, date, note, createdAt: now,
  });
  const savingsContributions: SavingsContribution[] = [
    contrib(weddingGoal.id, 60_000_000, daysAgo(40), "پس‌انداز مشترک"),
    contrib(weddingGoal.id, 40_000_000, daysAgo(12), "هدیه مادربزرگ"),
    contrib(eduGoal.id, 30_000_000, daysAgo(25)),
    contrib(carGoal.id, 80_000_000, daysAgo(30)),
    contrib(travelGoal.id, 12_000_000, daysAgo(8)),
    contrib(emergencyGoal.id, 150_000_000, daysAgo(50), "سپرده کوتاه‌مدت"),
  ];

  return {
    budgets,
    debts,
    receivables,
    installmentPlans,
    installmentItems,
    recurringPayments,
    financialPlans: [weddingPlan, eduDaughterPlan, eduSonPlan, vehiclePlan, travelPlan, renovationPlan],
    financialPlanItems,
    savingsGoals,
    savingsContributions,
    extraTransactions: [debt1Pay, rec1Col, instPay1, instPay2, ...weddingExtra],
  };
}

/* ابزارک‌های محلی */
function yearOf(iso: string): number {
  const p = jalaliOf(iso);
  return p ? p.jy : new Date().getFullYear();
}
function monthOf(iso: string): number {
  const p = jalaliOf(iso);
  return p ? p.jm : 1;
}
function jalaliOf(iso: string): { jy: number; jm: number } | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric" })
      .formatToParts(new Date(`${iso}T12:00:00`));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
    return { jy: get("year"), jm: get("month") };
  } catch {
    return null;
  }
}
function nameOf(family: Family, id?: string): string {
  return family.members.find((m) => m.id === id)?.name ?? "";
}
