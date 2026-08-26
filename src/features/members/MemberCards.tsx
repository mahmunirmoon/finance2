import { ChevronLeft, FileText, Pencil, PiggyBank, Trash2, Wallet } from "lucide-react";
import type { FamilyMember } from "../../types";
import { EMPLOYMENT_OPTIONS, getOptionLabel, getRoleLabel } from "../../data/options";
import { formatAge } from "../../utils/format";
import Avatar from "../../components/ui/Avatar";

/** کارت عضو در داشبورد — با کلیک، پروفایل باز می‌شود */
export function MemberCard({ member, index, onOpen }: {
  member: FamilyMember;
  index: number;
  onOpen: () => void;
}) {
  const visibleNeeds = member.needs.slice(0, 3);
  const extraCount = member.needs.length - visibleNeeds.length;
  const flags = [
    { on: member.hasIncome, icon: <Wallet size={13} />, title: "درآمد مستقل" },
    { on: member.hasPersonalBudget, icon: <PiggyBank size={13} />, title: "بودجه شخصی" },
    { on: member.trackSeparately, icon: <FileText size={13} />, title: "گزارش جداگانه" },
  ];

  return (
    <button
      onClick={onOpen}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-fade-up group w-full rounded-xl border border-line bg-surface p-4 text-start shadow-card transition-all duration-200 hover:-translate-y-1 hover:border-pine-300 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-pine-500"
    >
      <div className="flex items-center gap-3">
        <Avatar name={member.name} seed={member.id} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-extrabold text-ink transition group-hover:text-pine-700">{member.name}</h3>
          <p className="mt-0.5 text-xs text-mute">
            {getRoleLabel(member.role, member.customRole)} · {formatAge(member.age)}
          </p>
        </div>
        <span className="rounded-full bg-paper px-2.5 py-1 text-[10px] font-bold text-ink-soft">
          {getOptionLabel(EMPLOYMENT_OPTIONS, member.employmentStatus)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {flags.map((f, i) => (
          <span key={i} title={f.title} className={`flex h-6 w-6 items-center justify-center rounded-md transition ${f.on ? "bg-pine-50 text-pine-600" : "bg-paper text-line-strong"}`}>
            {f.icon}
          </span>
        ))}
        <span className="ms-auto text-[10px] font-bold text-mute">{member.needs.length.toLocaleString("fa-IR")} نیاز</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
        {visibleNeeds.length === 0 ? (
          <span className="text-[11px] text-mute">نیازی ثبت نشده است</span>
        ) : (
          <>
            {visibleNeeds.map((n) => (
              <span key={n.id} className="rounded-full bg-pine-50 px-2.5 py-1 text-[10px] font-bold text-pine-700">{n.label}</span>
            ))}
            {extraCount > 0 && (
              <span className="rounded-full bg-saffron-100 px-2.5 py-1 text-[10px] font-extrabold text-saffron-700">
                +{extraCount.toLocaleString("fa-IR")}
              </span>
            )}
          </>
        )}
      </div>

      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-mute transition group-hover:text-pine-600">
        مشاهده پروفایل
        <ChevronLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
      </span>
    </button>
  );
}

/** ردیف عضو در فهرست‌های مدیریتی */
export function MemberRow({ member, onOpen, onEdit, onDelete }: {
  member: FamilyMember;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onOpen}
      className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface p-3 shadow-card transition-all duration-150 hover:border-pine-300"
    >
      <Avatar name={member.name} seed={member.id} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-extrabold text-ink group-hover:text-pine-700">{member.name}</p>
        <p className="mt-0.5 truncate text-xs text-mute">
          {getRoleLabel(member.role, member.customRole)} · {formatAge(member.age)} ·{" "}
          {member.needs.length.toLocaleString("fa-IR")} نیاز
        </p>
      </div>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button onClick={onEdit} className="rounded-lg p-2 text-mute transition hover:bg-pine-50 hover:text-pine-700" aria-label={`ویرایش ${member.name}`} title="ویرایش">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="rounded-lg p-2 text-mute transition hover:bg-danger-soft hover:text-danger" aria-label={`حذف ${member.name}`} title="حذف">
          <Trash2 size={15} />
        </button>
        <ChevronLeft size={15} className="me-1 text-line-strong transition group-hover:text-pine-500" />
      </div>
    </div>
  );
}
