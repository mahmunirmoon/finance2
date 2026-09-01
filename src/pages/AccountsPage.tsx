import { useMemo, useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { useFinance } from "../hooks/useFinance";
import { ConfirmDialog } from "../components/ui/Modal";
import EmptyState from "../components/ui/EmptyState";
import AccountCard, { getAccountTypeLabel } from "../components/finance/AccountCard";
import AccountFormModal from "../components/finance/AccountFormModal";
import { getCurrency } from "../data/currencies";
import { sumByCurrency } from "../utils/planning";
import { faNum, formatMoney } from "../utils/format";
import type { Account } from "../types";

export default function AccountsPage() {
  const { family, pushToast } = useFamily();
  const { accounts, transactions, balances, deleteAccount, updateAccount } = useFinance();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);

  const txCountByAccount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      map[t.accountId] = (map[t.accountId] ?? 0) + 1;
      if (t.destinationAccountId) map[t.destinationAccountId] = (map[t.destinationAccountId] ?? 0) + 1;
    }
    return map;
  }, [transactions]);

  const totalsByCurrency = useMemo(
    () => sumByCurrency(accounts.map((a) => ({ amount: balances[a.id] ?? 0, currency: a.currency }))),
    [accounts, balances]
  );

  if (!family) return null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">حساب‌ها</h1>
          <p className="mt-1 text-xs text-mute">
            موجودی هر حساب از تراکنش‌ها محاسبه می‌شود — هیچ عددی ذخیره نمی‌شود.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]"
        >
          <Plus size={16} />
          حساب جدید
        </button>
      </div>

      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-2.5">
          {Object.entries(totalsByCurrency).map(([currency, total]) => (
            <div key={currency} className="rounded-xl border border-line bg-surface px-4 py-3 shadow-card">
              <p className="text-[10px] font-bold text-mute">جمع موجودی {getCurrency(currency as Account["currency"]).label}</p>
              <p className={`font-display mt-0.5 text-lg ${total >= 0 ? "text-ink" : "text-danger"}`}>{formatMoney(total, currency as Account["currency"])}</p>
            </div>
          ))}
        </div>
      )}

      {accounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={24} />}
          title="هنوز حسابی ثبت نشده است"
          description="حساب بانکی، کارت، نقدی یا صندوق خانواده را اضافه کنید تا تراکنش‌ها را رویش ثبت کنید."
          action={
            <button onClick={() => { setEditing(null); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <Plus size={16} />
              ساخت اولین حساب
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account, i) => (
            <div key={account.id} className="flex flex-col gap-2">
              <AccountCard
                account={account}
                balance={balances[account.id] ?? 0}
                txCount={txCountByAccount[account.id] ?? 0}
                index={i}
                onEdit={() => { setEditing(account); setFormOpen(true); }}
                onDelete={() => setDeleting(account)}
              />
              <button
                onClick={() => {
                  updateAccount(account.id, { isActive: !account.isActive });
                  pushToast(account.isActive ? "حساب غیرفعال شد" : "حساب فعال شد", "info");
                }}
                className="rounded-lg border border-line bg-surface/60 px-3 py-1.5 text-[10px] font-extrabold text-mute transition hover:border-pine-300 hover:text-pine-700"
              >
                {account.isActive ? "غیرفعال کردن" : "فعال کردن"}
              </button>
            </div>
          ))}
        </div>
      )}

      <AccountFormModal open={formOpen} account={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={deleting && (txCountByAccount[deleting.id] ?? 0) > 0 ? "بایگانی حساب" : "حذف حساب"}
        message={
          deleting
            ? (txCountByAccount[deleting.id] ?? 0) > 0
              ? `حساب «${deleting.name}» دارای ${faNum(txCountByAccount[deleting.id] ?? 0)} تراکنش است. برای حفظ سوابق مالی، به‌جای حذف، بایگانی (غیرفعال) می‌شود و نام آن در گزارش‌های گذشته باقی می‌ماند.`
              : `حساب «${deleting.name}» هیچ تراکنشی ندارد. آیا از حذف دائمی آن مطمئن هستید؟`
            : ""
        }
        confirmLabel={deleting && (txCountByAccount[deleting.id] ?? 0) > 0 ? "بایگانی حساب" : "حذف حساب"}
        onConfirm={() => {
          if (!deleting) return;
          const affected = txCountByAccount[deleting.id] ?? 0;
          if (affected > 0) {
            updateAccount(deleting.id, { isActive: false });
            pushToast(`حساب «${deleting.name}» بایگانی شد — سوابق مالی حفظ شد`, "info");
          } else {
            deleteAccount(deleting.id);
            pushToast("حساب حذف شد", "danger");
          }
        }}
      />
    </div>
  );
}
