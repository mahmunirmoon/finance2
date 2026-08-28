import {
  Banknote, Boxes, CreditCard, Landmark, Layers, Pencil, PiggyBank, Trash2, Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Account } from "../../types";
import { getCurrency } from "../../data/currencies";
import { faNum, formatMoney } from "../../utils/format";

export const ACCOUNT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "bank", label: "حساب بانکی" },
  { value: "card", label: "کارت بانکی" },
  { value: "cash", label: "نقدی" },
  { value: "fund", label: "صندوق خانواده" },
  { value: "wallet", label: "کیف پول" },
  { value: "forex", label: "ارز خارجی" },
  { value: "other", label: "سایر" },
  { value: "custom", label: "نوع دیگر…" },
];

export function getAccountTypeLabel(account: Account): string {
  if (account.type === "custom") return account.customType?.trim() || "نوع دلخواه";
  return ACCOUNT_TYPE_OPTIONS.find((t) => t.value === account.type)?.label ?? account.type;
}

const TYPE_ICONS: Record<string, LucideIcon> = {
  bank: Landmark, card: CreditCard, cash: Banknote, fund: PiggyBank,
  wallet: Wallet, forex: Boxes, other: Layers, custom: Layers,
};

interface AccountCardProps {
  account: Account;
  balance: number;
  txCount: number;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

/** کارت حساب — موجودی همیشه از موتور مرکزی می‌آید */
export default function AccountCard({ account, balance, txCount, index, onEdit, onDelete }: AccountCardProps) {
  const Icon = TYPE_ICONS[account.type] ?? Layers;
  const currency = getCurrency(account.currency);
  const inactive = !account.isActive;

  return (
    <div
      style={{ animationDelay: `${index * 60}ms` }}
      className={`animate-fade-up group relative overflow-hidden rounded-2xl border p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-pop ${
        inactive
          ? "border-line bg-paper/70 opacity-75"
          : balance >= 0
            ? "border-line bg-surface hover:border-pine-300"
            : "border-danger/30 bg-surface hover:border-danger/50"
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${inactive ? "bg-line-strong" : balance >= 0 ? "bg-pine-500" : "bg-danger"}`}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${inactive ? "bg-line/50 text-mute" : "bg-pine-50 text-pine-600"}`}>
            <Icon size={20} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-ink">{account.name}</h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-bold text-mute">
              {getAccountTypeLabel(account)}
              <span className="rounded-full bg-paper px-2 py-0.5 text-[9px] font-extrabold text-ink-soft ring-1 ring-line">
                {currency.short}
              </span>
            </p>
          </div>
        </div>
        {inactive && (
          <span className="rounded-full bg-line/70 px-2 py-1 text-[9px] font-extrabold text-mute">غیرفعال</span>
        )}
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-bold text-mute">موجودی فعلی</p>
        <p className={`font-display mt-1 text-2xl leading-8 sm:text-[1.7rem] ${balance >= 0 ? "text-ink" : "text-danger"}`}>
          {formatMoney(balance, account.currency)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-[10px] font-bold text-mute">
          {faNum(txCount)} تراکنش · موجودی اولیه {faNum(account.initialBalance)}
        </span>
        <div className="flex items-center gap-1 opacity-70 transition group-hover:opacity-100">
          <button onClick={onEdit} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label={`ویرایش ${account.name}`} title="ویرایش">
            <Pencil size={14} />
          </button>
          <button onClick={onDelete} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label={`حذف ${account.name}`} title="حذف">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
