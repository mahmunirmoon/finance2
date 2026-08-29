import {
  ArrowLeftRight, BarChart3, Flag, Info, LayoutDashboard, Layers,
  PiggyBank, Repeat, Scale, Settings, Target, Users, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PageId } from "../types";

export interface NavGroup {
  label: string;
  items: { id: PageId; label: string; icon: LucideIcon }[];
}

/** ناوبری نهایی — گروه‌بندی‌شده (Mission 5) */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "اصلی",
    items: [
      { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
      { id: "transactions", label: "تراکنش‌ها", icon: ArrowLeftRight },
      { id: "accounts", label: "حساب‌ها", icon: Wallet },
      { id: "about", label: "درباره سازنده", icon: Info },
    ],
  },
  {
    label: "برنامه‌ریزی",
    items: [
      { id: "budgets", label: "بودجه‌بندی", icon: Target },
      { id: "plans", label: "برنامه‌های مالی", icon: Flag },
      { id: "savings", label: "پس‌انداز و اهداف", icon: PiggyBank },
      { id: "debts", label: "بدهی و طلب", icon: Scale },
      { id: "installments", label: "اقساط", icon: Layers },
      { id: "recurring", label: "پرداخت‌های تکرارشونده", icon: Repeat },
    ],
  },
  {
    label: "تحلیل",
    items: [{ id: "reports", label: "گزارش‌ها", icon: BarChart3 }],
  },
  {
    label: "خانواده",
    items: [
      { id: "members", label: "اعضای خانواده", icon: Users },
      { id: "settings", label: "تنظیمات خانواده", icon: Settings },
    ],
  },
];

export function getPageTitle(page: PageId): string {
  for (const g of NAV_GROUPS) {
    const found = g.items.find((i) => i.id === page);
    if (found) return found.label;
  }
  return "";
}
