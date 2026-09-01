import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { useFamily } from "../hooks/useFamily";
import { MemberRow } from "../features/members/MemberCards";
import MemberFormModal from "../features/members/MemberFormModal";
import MemberProfileModal from "../features/members/MemberProfileModal";
import MemberDeleteDialog from "../components/members/MemberDeleteDialog";
import EmptyState from "../components/ui/EmptyState";
import { faNum } from "../utils/format";
import type { FamilyMember } from "../types";

export default function MembersPage() {
  const { family } = useFamily();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<FamilyMember | null>(null);

  if (!family) return null;

  const profile = family.members.find((m) => m.id === profileId) ?? null;

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (m: FamilyMember) => {
    setEditing(m);
    setFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">اعضای خانواده</h1>
          <p className="mt-1 text-xs text-mute">
            {faNum(family.members.length)} عضو · برای مشاهده پروفایل و گزارش مالی روی هر ردیف بزنید
          </p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
          <UserPlus size={16} />
          افزودن عضو
        </button>
      </div>

      {family.members.length === 0 ? (
        <EmptyState
          icon={<Users size={24} />}
          title="عضوی وجود ندارد"
          description="با افزودن اولین عضو، پروفایل مالی و نیازهای او را ثبت کنید."
          action={
            <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-xl bg-pine-600 px-5 py-3 text-sm font-extrabold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.97]">
              <UserPlus size={16} />
              افزودن عضو
            </button>
          }
        />
      ) : (
        <div className="space-y-2.5">
          {family.members.map((m, i) => (
            <div key={m.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <MemberRow
                member={m}
                onOpen={() => setProfileId(m.id)}
                onEdit={() => openEdit(m)}
                onDelete={() => setDeleting(m)}
              />
            </div>
          ))}
        </div>
      )}

      <MemberProfileModal
        member={profile}
        onClose={() => setProfileId(null)}
        onEdit={(m) => {
          setProfileId(null);
          openEdit(m);
        }}
      />
      <MemberFormModal open={formOpen} member={editing} onClose={() => setFormOpen(false)} />
      <MemberDeleteDialog member={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
