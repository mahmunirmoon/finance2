/** مدل‌های داده — Mission 1 تا 5 */

export type Gender = "male" | "female" | "unspecified";
export type EmploymentStatus = "employed" | "business" | "homemaker" | "student" | "retired" | "seeking";
export type EducationStatus = "school" | "university" | "graduate" | "inactive";
export type MaritalStatus = "single" | "married";

export interface NeedItem {
  id: string;
  label: string;
  category: string;
  custom?: boolean;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  age: number | null;
  role: string;
  customRole?: string;
  gender: Gender;
  employmentStatus: EmploymentStatus;
  educationStatus: EducationStatus;
  maritalStatus: MaritalStatus;
  hasIncome: boolean;
  hasPersonalBudget: boolean;
  trackSeparately: boolean;
  needs: NeedItem[];
  createdAt: string;
  updatedAt: string;
}

export type MemberDraft = Omit<FamilyMember, "id" | "familyId" | "createdAt" | "updatedAt">;

export type CurrencyCode = "toman" | "rial" | "usd" | "aed" | "eur" | "gbp" | "try" | "cad";

export interface Family {
  id: string;
  name: string;
  createdAt: string;
  setupCompleted: boolean;
  members: FamilyMember[];
  currency: CurrencyCode;
}

export type PageId =
  | "dashboard" | "transactions" | "accounts"
  | "budgets" | "plans" | "savings" | "debts" | "installments" | "recurring"
  | "reports"
  | "members" | "settings" | "about";

/* ── Mission 2 ── */

export interface Account {
  id: string;
  familyId: string;
  name: string;
  type: string;
  customType?: string;
  currency: CurrencyCode;
  initialBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = "income" | "expense" | "transfer";
export type TransactionStatus = "done" | "pending";
export type FinancialReferenceType =
  | "debt-payment" | "receivable-collection" | "installment-payment"
  | "recurring-payment" | "savings-contribution";

export interface Transaction {
  id: string;
  familyId: string;
  memberId?: string;
  accountId: string;
  destinationAccountId?: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: CurrencyCode;
  /** ISO (YYYY-MM-DD) */
  date: string;
  category?: string;
  subcategory?: string;
  description?: string;
  paymentMethod?: string;
  status: TransactionStatus;
  financialReferenceType?: FinancialReferenceType;
  financialReferenceId?: string;
  financialPlanId?: string;
  financialPlanItemId?: string;
  excludeFromOperatingExpense?: boolean;
  excludeFromOperatingIncome?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ── Mission 3 ── */

export type BudgetScope = "family" | "member" | "category" | "member-category";
export type BudgetPeriod = "monthly" | "yearly";

export interface Budget {
  id: string;
  familyId: string;
  title: string;
  scope: BudgetScope;
  memberId?: string;
  categoryId?: string;
  amount: number;
  currency: CurrencyCode;
  period: BudgetPeriod;
  year: number;
  month?: number;
  alertThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DebtStatus = "unpaid" | "partial" | "paid" | "overdue";

export interface Debt {
  id: string;
  familyId: string;
  memberId?: string;
  title: string;
  counterparty: string;
  originalAmount: number;
  currency: CurrencyCode;
  paidAmount: number;
  remainingAmount: number;
  startDate: string;
  dueDate?: string;
  status: DebtStatus;
  description?: string;
  transactionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ReceivableStatus = "unpaid" | "partial" | "received" | "overdue";

export interface Receivable {
  id: string;
  familyId: string;
  memberId?: string;
  title: string;
  counterparty: string;
  originalAmount: number;
  currency: CurrencyCode;
  receivedAmount: number;
  remainingAmount: number;
  startDate: string;
  dueDate?: string;
  status: ReceivableStatus;
  description?: string;
  transactionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type InstallmentFrequency = "monthly" | "quarterly" | "custom";
export type InstallmentItemStatus = "upcoming" | "due" | "paid" | "overdue";

export interface InstallmentPlan {
  id: string;
  familyId: string;
  memberId?: string;
  title: string;
  totalAmount: number;
  currency: CurrencyCode;
  installmentCount: number;
  installmentAmount: number;
  startDate: string;
  frequency: InstallmentFrequency;
  accountId?: string;
  categoryId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentItem {
  id: string;
  planId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  status: InstallmentItemStatus;
  paidDate?: string;
  transactionId?: string;
}

export type RecurringFrequency = "weekly" | "monthly" | "quarterly" | "yearly";

export interface RecurringPayment {
  id: string;
  familyId: string;
  memberId?: string;
  title: string;
  amount: number;
  currency: CurrencyCode;
  categoryId?: string;
  accountId?: string;
  frequency: RecurringFrequency;
  startDate: string;
  nextDueDate: string;
  endDate?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/* ── Mission 4 ── */

export type FinancialPlanType =
  | "education" | "wedding" | "home" | "vehicle" | "travel" | "migration"
  | "medical" | "business" | "baby" | "renovation" | "retirement" | "event" | "custom";

export type FinancialPlanStatus = "planning" | "active" | "paused" | "completed" | "cancelled";

export interface FinancialPlan {
  id: string;
  familyId: string;
  memberId?: string;
  title: string;
  type: FinancialPlanType;
  description?: string;
  currency: CurrencyCode;
  estimatedBudget: number;
  targetDate?: string;
  startDate?: string;
  status: FinancialPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type PlanItemStatus = "planned" | "pending" | "paid" | "cancelled";

export interface FinancialPlanItem {
  id: string;
  planId: string;
  title: string;
  category?: string;
  estimatedAmount: number;
  dueDate?: string;
  status: PlanItemStatus;
  transactionIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type SavingsGoalStatus = "active" | "completed" | "paused" | "cancelled";

export interface SavingsGoal {
  id: string;
  familyId: string;
  memberId?: string;
  financialPlanId?: string;
  title: string;
  targetAmount: number;
  currency: CurrencyCode;
  targetMode: "fixed" | "months";
  months?: number;
  isEmergency?: boolean;
  targetDate?: string;
  status: SavingsGoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsContribution {
  id: string;
  goalId: string;
  amount: number;
  currency: CurrencyCode;
  date: string;
  accountId?: string;
  transactionId?: string;
  note?: string;
  createdAt: string;
}
