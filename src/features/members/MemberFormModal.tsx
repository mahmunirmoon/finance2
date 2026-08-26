import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import Modal from "../../components/ui/Modal";
import MemberForm from "./MemberForm";
import { useFamily } from "../../hooks/useFamily";
import type { FamilyMember, MemberDraft } from "../../types";
import { draftError, emptyMemberDraft, toMemberDraft } from "../../utils/draft";

interface MemberFormModalProps {
  open: boolean;
  member: FamilyMember | null;
  onClose: () => void;
}

/** مودال افزودن / ویرایش عضو */
export default function MemberFormModal({ open, member, onClose }: MemberFormModalProps) {
  const { addMember, updateMember, pushToast } = useFamily();
  const [draft, setDraft] = useState<MemberDraft>(emptyMemberDraft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(member ? toMemberDraft(member) : emptyMemberDraft());
      setError(null);
    }
  }, [open, member]);

  const handleSave = () => {
    const err = draftError(draft);
    if (err) return setError(err);
    if (member) {
      updateMember(member.id, draft);
      pushToast("تغییرات عضو ذخیره شد");
    } else {
      addMember(draft);
      pushToast(`«${draft.name.trim()}» به خانواده اضافه شد`);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={member ? "ویرایش عضو" : "افزودن عضو جدید"}
      subtitle={member ? member.name : "اطلاعات و پروفایل مالی عضو را وارد کنید"}
      size="lg"
    >
      <MemberForm
        value={draft}
        onChange={(patch) => {
          setDraft((d) => ({ ...d, ...patch }));
          setError(null);
        }}
      />
      {error && <p className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs font-bold text-danger">{error}</p>}
      <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
        <button onClick={onClose} className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink-soft transition hover:bg-paper">انصراف</button>
        <button onClick={handleSave} className="inline-flex items-center gap-2 rounded-lg bg-pine-600 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-pine-700 active:scale-[0.98]">
          <Check size={15} strokeWidth={3} />
          ذخیره
        </button>
      </div>
    </Modal>
  );
}
