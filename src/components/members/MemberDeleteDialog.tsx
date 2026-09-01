import { useMemo, useState } from "react";
import { Archive, ShieldAlert, Trash2, UserMinus, Users } from "lucide-react";
import Modal from "../ui/Modal";
import { useFamily } from "../../hooks/useFamily";
import { useFinance } from "../../hooks/useFinance";
import { usePlanning } from "../../hooks/usePlanning";
import { faNum } from "../../utils/format";
import type { FamilyMember } from "../../types";

type DeleteOption = "archive" | "transfer" | "household" | "delete";

interface MemberDeleteDialogProps {
  member: FamilyMember | null;
  onClose: () => void;
}

/**
 * حذف امن عضو — هرگز داده یتیم به جا نمی‌گذارد.
 * اگر سابقه مالی مرتبط وجود داشته باشد، چهار راه ارائه می‌شود:
 * بایگانی (پیش‌فرض) / انتقال به عضو دیگر / تبدیل به خانوار / حذف کامل (مخرب، تأیید دوم).
 */
export default function MemberDeleteDialog({ member, onClose }: MemberDeleteDialogProps) {
  const { family, archiveMember, removeMember, pushToast } = useFamily();
  const { transactions, reassignMember: reassignTx, deleteTransaction } = useFinance();
  const planning = usePlanning();

  const [option, setOption] = useState<DeleteOption>("archive");
  const [transferTarget, setTransferTarget] = useState("");
  const [confirmSecond, setConfirmSecond] = useState(false);

  const related = useMemo(() => {
    if (!member) return { tx: 0, plans: 0, total: 0 };
    const tx = transactions.filter((t) => t.memberId === member.id).length;
    const plans =
      planning.budgets.filter((b) => b.memberId === member.id).length +
      planning.debts.filter((d) => d.memberId === member.id).length +
      planning.receivables.filter((r) => r.memberId === member.id).length +
      planning.installmentPlans.filter((p) => p.memberId === member.id).length +
      planning.recurringPayments.filter((r) => r.memberId === member.id).length +
      planning.financialPlans.filter((p) => p.memberId === member.id).length +
      planning.savingsGoals.filter((g) => g.memberId === member.id).length;
    return { tx, plans, total: tx + plans };
  }, [member, transactions, planning]);

  if (!member || !family) return null;

  const candidates = family.members.filter((m) => m.id !== member.id && !m.isArchived);
  const hasRelated = related.total > 0;

  const doDeleteRelated = () => {
    transactions.filter((t) => t.memberId === member.id).forEach((t) => deleteTransaction(t.id));
    planning.budgets.filter((b) => b.memberId === member.id).forEach((b) => planning.deleteBudget(b.id));
    planning.debts.filter((d) => d.memberId === member.id).forEach((d) => planning.deleteDebt(d.id));
    planning.receivables.filter((r) => r.memberId === member.id).forEach((r) => planning.deleteReceivable(r.id));
    planning.installmentPlans.filter((p) => p.memberId === member.id).forEach((p) => planning.deleteInstallmentPlan(p.id));
    planning.recurringPayments.filter((r) => r.memberId === member.id).forEach((r) => planning.deleteRecurring(r.id));
    planning.financialPlans.filter((p) => p.memberId === member.id).forEach((p) => planning.deleteFinancialPlan(p.id));
    planning.savingsGoals.filter((g) => g.memberId === member.id).forEach((g) => planning.deleteSavingsGoal(g.id));
  };

  const execute = () => {
    if (option === "archive") {
      archiveMember(member.id);
      pushToast(`«${member.name}» بایگانی شد — سوابق مالی حفظ شد`, "info");
    } else if (option === "transfer") {
      if (!transferTarget) return;
      reassignTx(member.id, transferTarget);
      planning.reassignMember(member.id, transferTarget);
      removeMember(member.id);
      pushToast(`سوابق «${member.name}» به عضو انتخابی منتقل و عضو حذف شد`);
    } else if (option === "household") {
      reassignTx(member.id, null);
      planning.reassignMember(member.id, null);
      removeMember(member.id);
      pushToast(`سوابق «${member.name}» به «کل خانواده» تبدیل و عضو حذف شد`);
    } else {
      doDeleteRelated();
      removeMember(member.id);
      pushToast(`«${member.name}» و همه سوابق مرتبط حذف شد`, "danger");
    }
    onClose();
  };

  const onConfirm = () => {
    if (option === "delete" && !confirmSecond) {
      setConfirmSecond(true);
      return;
    }
    execute();
  };

  const options: { id: DeleteOption; icon: React.ReactNode; title: string; desc: string; destructive?: boolean }[] = [
    {
      id: "archive",
      icon: <Archive size={16} />,
      title: "بایگانی عضو (پیشنهادی)",
      desc: "عضو از فهرست‌های فعال پنهان می‌شود اما همه سوابق مالی با نامش حفظ می‌شوند.",
    },
    {
      id: "transfer",
      icon: <Users size={16} />,
      title: "انتقال سوابق به عضو دیگر",
      desc: "همه تراکنش‌ها و برنامه‌های این عضو به عضو انتخابی منتقل، سپس عضو حذف می‌شود.",
    },
    {
      id: "household",
      icon: <UserMinus size={16} />,
      title: "تبدیل سوابق به کل خانواده",
      desc: "سوابق این عضو به «کل خانواده» منتقل، سپس عضو حذف می‌شود.",
    },
    {
      id: "delete",
      icon: <Trash2 size={16} />,
      title: "حذف عضو و همه سوابق مرتبط",
      desc: `${faNum(related.tx)} تراکنش و ${faNum(related.plans)} برنامه مرتبط برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست.`,
      destructive: true,
    },
  ];

  return (
    <Modal
      open
      onClose={onClose}
      title={`حذف «${member.name}»`}
      subtitle={
        hasRelated
          ? `${faNum(related.total)} رکورد مالی به این عضو متصل است — برای جلوگیری از داده یتیم یکی از راه‌های زیر را انتخاب کنید.`
          : "هیچ رکورد مالی به این عضو متصل نیست."
      }
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            disabled={option === "transfer" && !transferTarget}
            className={`rounded-lg px-5 py-2.5 text-sm font-bold text-white shadow-card transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
              option === "delete"
                ? confirmSecond
                  ? "bg-danger hover:brightness-95"
                  : "bg-saffron-500 hover:bg-saffron-600"
                : "bg-pine-600 hover:bg-pine-700"
            }`}
          >
            {option === "delete" && !confirmSecond ? "ادامه — تأیید حذف" : option === "archive" ? "بایگانی عضو" : option === "delete" ? "بله، حذف قطعی" : "اجرا"}
          </button>
        </div>
      }
    >
      <div className="space-y-2">
        {options.map((o) => {
          const active = option === o.id;
          const disabled = o.id === "transfer" && candidates.length === 0;
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                disabled ? "cursor-not-allowed opacity-40" : ""
              } ${active ? (o.destructive ? "border-danger/50 bg-danger-soft/60" : "border-pine-500 bg-pine-50") : "border-line bg-surface hover:border-pine-300"}`}
            >
              <input
                type="radio"
                name="member-delete-option"
                value={o.id}
                checked={active}
                disabled={disabled}
                onChange={() => {
                  setOption(o.id);
                  setConfirmSecond(false);
                }}
                className="mt-1 accent-pine-600"
              />
              <div className="min-w-0 flex-1">
                <span className={`flex items-center gap-2 text-[13px] font-extrabold ${o.destructive ? "text-danger" : "text-ink"}`}>
                  <span className={o.destructive ? "text-danger" : "text-pine-600"}>{o.icon}</span>
                  {o.title}
                </span>
                <span className="mt-0.5 block text-[12px] font-semibold leading-5 text-ink-soft">{o.desc}</span>
                {o.id === "transfer" && active && (
                  <select
                    value={transferTarget}
                    onChange={(e) => setTransferTarget(e.target.value)}
                    className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-bold text-ink"
                    aria-label="عضو مقصد"
                  >
                    <option value="">انتخاب عضو مقصد…</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          );
        })}
        {option === "delete" && confirmSecond && (
          <p className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-3 text-[12px] font-bold leading-5 text-danger">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            این عمل همه سوابق مالی این عضو را برای همیشه حذف می‌کند و قابل بازگشت نیست. برای تأیید نهایی دوباره روی دکمه بزنید.
          </p>
        )}
      </div>
    </Modal>
  );
}
